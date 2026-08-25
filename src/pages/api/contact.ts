/**
 * Contact Form API Endpoint
 * Handles form submissions with enrichment and multi-channel distribution
 */

import type { APIRoute } from 'astro';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { processLead, type LeadData } from '../../lib/server/leadCapture';

export const prerender = false; // This endpoint requires SSR

const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/;
const MAX_INTERESTS = 10;

/**
 * Bot defences.
 *
 * The governing constraint: this endpoint backs the waitlist, which is the only
 * way a breeder can reach us. Losing one real applicant costs more than letting
 * several spam submissions through, so every layer here is tuned to fail OPEN.
 * A check only rejects when it is confident, and anything ambiguous is allowed.
 *
 * 1. Honeypot. A field no human can see, tab to, or have autofilled. This is the
 *    only layer that rejects on its own, because a filled hidden field has no
 *    innocent explanation.
 * 2. Elapsed time. Corroborating evidence only. Autofill, paste, and a returning
 *    applicant completing one remaining field are all legitimately fast, so a
 *    fast submission is never rejected by itself.
 * 3. Rate limit. Deliberately loose, and it BLOCKS rather than silently
 *    discarding, so a person behind a shared corporate or mobile IP is told to
 *    try again instead of believing they applied when they did not.
 */

/** Below this, a submission is suspiciously fast — but see COMBINED_* below. */
const MIN_FILL_MS = 3_000;
/** A stamp older than this is a tab left open, not a bot. Ignore it. */
const MAX_FILL_MS = 12 * 60 * 60 * 1_000;

/**
 * The rate limit is a flood brake, not a spam filter. It sits high enough that
 * an entire office applying on the same day stays under it, because the cost of
 * blocking a real applicant is far higher than the cost of 30 junk rows.
 */
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;
/** Hard cap on tracked IPs. Enforced by eviction, not just by sweeping. */
const RATE_LIMIT_MAX_KEYS = 10_000;

const submissions = new Map<string, number[]>();

/**
 * Per-IP rate limit. In-memory, so it resets on deploy and is per-instance
 * rather than global: a flood brake on one source, never a security boundary.
 *
 * The IP is derived from client-controllable headers, so it cannot be trusted
 * for anything that matters. That is precisely why this layer only ever slows
 * a caller down, and why a limited caller is told so rather than silently
 * dropped: a spoofed header must not be able to make another visitor's
 * application disappear.
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;

  if (submissions.size >= RATE_LIMIT_MAX_KEYS) {
    // Drop expired entries first.
    for (const [key, times] of submissions) {
      const live = times.filter((t) => t > cutoff);
      if (live.length === 0) submissions.delete(key);
      else submissions.set(key, live);
    }
    // If a live flood keeps it at the cap, evict oldest-first so the map is
    // bounded by RATE_LIMIT_MAX_KEYS rather than by how many unique IPs an
    // attacker can forge. Sweeping alone would leave it growing unbounded.
    if (submissions.size >= RATE_LIMIT_MAX_KEYS) {
      const byAge = [...submissions.entries()].sort(
        (a, b) => Math.max(...a[1]) - Math.max(...b[1])
      );
      const evict = Math.ceil(RATE_LIMIT_MAX_KEYS * 0.1);
      for (let i = 0; i < evict && i < byAge.length; i++) {
        submissions.delete(byAge[i][0]);
      }
    }
  }

  const recent = (submissions.get(ip) ?? []).filter((t) => t > cutoff);
  if (recent.length >= RATE_LIMIT_MAX) {
    submissions.set(ip, recent);
    return true;
  }

  recent.push(now);
  submissions.set(ip, recent);
  return false;
}

function tooManyRequests() {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Too many submissions from this connection. Please try again shortly.',
    }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}

function badRequest(error: string) {
  return new Response(JSON.stringify({ success: false, error }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * What a rejected bot sees: exactly what a successful human sees. Telling a
 * script which check caught it is how it learns to pass the next one.
 */
function silentOk() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Thank you! We'll be in touch soon.",
      leadId: new Date().toISOString(),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

function clampString(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function clampStringArray(value: unknown, maxItems: number, maxLen: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim().slice(0, maxLen);
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= maxItems) break;
  }
  return result.length > 0 ? result : undefined;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse form data
    const body = await request.json();

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // ── Bot defences ──────────────────────────────────────────────────────

    // 1. Honeypot. The only check that rejects on its own: a filled field that
    // cannot be seen, tabbed to, or autofilled has no innocent explanation.
    // Silent, because telling a script which check caught it is free tuning
    // feedback.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      console.warn(`🍯 Honeypot triggered from ${clientIp}, source=${body.source}`);
      return silentOk();
    }

    // 2. Elapsed time. NOT decisive on its own. Autofill, pasting, restored form
    // state and a returning applicant finishing one last field are all
    // legitimately faster than a person typing from scratch, and dropping those
    // would lose real applications while reporting success. It is recorded and
    // logged so a pattern is visible, and it only rejects in combination with
    // the honeypot, which has already returned above if it fired.
    //
    // A missing, unparseable, future, or >12h-old stamp is always allowed:
    // cached pages, clock skew and tabs left open overnight must keep working.
    const renderedAt = Number(body.rendered_at);
    let suspiciouslyFast = false;
    if (Number.isFinite(renderedAt) && renderedAt > 0) {
      const elapsed = Date.now() - renderedAt;
      const usable = elapsed >= 0 && elapsed < MAX_FILL_MS;
      if (usable && elapsed < MIN_FILL_MS) {
        suspiciouslyFast = true;
        console.warn(
          `⏱️ Fast submission (${elapsed}ms) from ${clientIp}, source=${body.source} — allowed`
        );
      }
    }

    // Server-side validation (mirrors client + acts as the source of truth)
    const email = clampString(body.email, 254)?.toLowerCase();
    if (!email) return badRequest('Email is required.');
    if (!EMAIL_RE.test(email)) return badRequest('Please enter a valid email address.');

    const name = clampString(body.name, 100);
    if (!name || name.length < 2 || !/\p{L}/u.test(name)) {
      return badRequest('Please enter your name.');
    }

    // Phone is optional but if provided must be a real, valid number per libphonenumber
    const phoneRaw = clampString(body.phone, 25);
    let phoneE164: string | undefined;
    if (phoneRaw) {
      const parsed = parsePhoneNumberFromString(
        phoneRaw,
        phoneRaw.startsWith('+') ? undefined : 'US'
      );
      if (!parsed || !parsed.isValid()) {
        return badRequest('Please enter a valid phone number.');
      }
      phoneE164 = parsed.number;
    }

    // Interests: prefer the array form; fall back to scalar `interest` for back-compat
    const interests =
      clampStringArray(body.interests, MAX_INTERESTS, 50) ||
      (clampString(body.interest, 50) ? [clampString(body.interest, 50)!] : undefined);

    // 3. Rate limit. Runs AFTER validation so malformed attempts cannot burn
    // the quota that a real applicant behind the same NAT needs, and returns
    // 429 rather than a fake success: the IP comes from a client-controllable
    // header, so a spoofed one must never be able to make someone else's
    // application vanish while telling them it worked. A person who genuinely
    // hits this is asked to retry.
    if (clientIp !== 'unknown' && isRateLimited(clientIp)) {
      console.warn(
        `🚧 Rate limit hit by ${clientIp}, source=${body.source}` +
          (suspiciouslyFast ? ' (also fast)' : '')
      );
      return tooManyRequests();
    }

    // Extract lead data
    const leadData: LeadData = {
      email,
      name,
      phone: phoneRaw,
      phone_e164: phoneE164,
      company: clampString(body.company, 120),
      message: clampString(body.message, 2000),
      interest: interests?.[0],
      interests,
      source: clampString(body.source, 50) || 'website_form',
      // Minted by the browser so it survives a client retry of the same attempt.
      // Absent for an older cached page; the platform then mints its own and the
      // submission degrades to per-request behaviour rather than being rejected.
      submission_key: clampString(body.submission_key, 128),
      // The applicant's own site. Distinct from `website`, which is the honeypot
      // checked above — do not merge these two names.
      website_url: clampString(body.website_url, 300),
      // Self-reported attribution. Distinct from utm_source, which only sees
      // people who arrived through a link we tagged.
      referral_source: clampString(body.referral_source, 40),
      referral_detail: clampString(body.referral_detail, 120),
      // Structured qualification answers. Also composed into `message` for the
      // Slack notification, but sent separately so the platform can sort on them.
      breeding_volume: clampString(body.breeding_volume, 30),
      placement_modes: clampStringArray(body.placement_modes, 10, 30),
      record_sources: clampStringArray(body.record_sources, 10, 30),
      website_ownership: clampString(body.website_ownership, 20),
      utm_source: clampString(body.utm_source, 100),
      utm_medium: clampString(body.utm_medium, 100),
      utm_campaign: clampString(body.utm_campaign, 100),
      utm_term: clampString(body.utm_term, 100),
      utm_content: clampString(body.utm_content, 100),
    };

    // Capture metadata from request.
    //
    // `clientIp` is already the FIRST address split off x-forwarded-for. The raw
    // header accumulates one address per proxy hop ("client, proxy1, proxy2"),
    // and the platform stores this as PostgreSQL `inet`, which rejects a
    // multi-address string — forwarding the raw header would fail the durable
    // write on exactly the deployments that sit behind more than one proxy. Its
    // 'unknown' sentinel is likewise not an address, so it is dropped rather
    // than sent.
    const ip = clientIp !== 'unknown' ? clientIp : undefined;
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer');

    // Process lead (enrich + distribute)
    const enrichedLead = await processLead(leadData, {
      ip: ip || undefined,
      userAgent: userAgent || undefined,
      referrer: referrer || undefined,
    });

    console.log('✅ Lead processed successfully:', enrichedLead.email);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you! We\'ll be in touch soon.',
        leadId: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

// Optional: Add OPTIONS for CORS if needed
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
