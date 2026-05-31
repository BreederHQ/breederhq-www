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

function badRequest(error: string) {
  return new Response(JSON.stringify({ success: false, error }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
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
      utm_source: clampString(body.utm_source, 100),
      utm_medium: clampString(body.utm_medium, 100),
      utm_campaign: clampString(body.utm_campaign, 100),
      utm_term: clampString(body.utm_term, 100),
      utm_content: clampString(body.utm_content, 100),
    };

    // Capture metadata from request
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
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
