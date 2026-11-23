/**
 * Founders tour "one thing" relay: the work behind POST /api/tour-focus.
 *
 * The booked-tour card on /pricing posts the applicant's answer to that route,
 * and this forwards it to the platform with the shared lead secret. The browser
 * cannot call the platform directly: the secret never leaves the server, and
 * the platform's CORS does not admit it.
 *
 * The route passes its environment in, so this module reads no environment of
 * its own and a test can drive every branch.
 *
 * The answer is the applicant's own words and is never logged.
 */

import { postTourFocus } from './leadCapture';
import {
  TOUR_FOCUS_MAX_KEY_CHARS,
  normalizeTourFocusAnswer,
  tourFocusProblem,
} from '../tourFocus';

/**
 * The largest request body read. An answer is at most 500 characters, and an
 * escaped emoji is 12 bytes of JSON, so this leaves room for any valid answer
 * and nothing more. The platform's route holds its body to the same 16 KB.
 */
export const TOUR_FOCUS_MAX_BODY_BYTES = 16 * 1024;

/**
 * The flood brake. An applicant sends one answer, perhaps a retry or a
 * correction, so this sits far above any real use and only stops a caller
 * hammering the secret-bearing platform route.
 */
export const TOUR_FOCUS_RATE_MAX = 20;
export const TOUR_FOCUS_RATE_WINDOW_MS = 10 * 60 * 1_000;
/** Hard cap on tracked addresses, enforced by eviction. */
const TOUR_FOCUS_RATE_MAX_KEYS = 10_000;

/**
 * The cap on relayed sends from every caller together, in the same window.
 * Founders applicants answer once each and book a handful of tours a day, so
 * this is far above real traffic. It is what holds when the per-address brake
 * cannot: a caller that reaches the function with a different address each
 * time (a botnet, or a header the edge failed to overwrite) still cannot push
 * more than this through to the platform per instance. Once it is spent, a real
 * applicant sees the page's quiet failure line and keeps the booking.
 */
export const TOUR_FOCUS_GLOBAL_RATE_MAX = 200;
const TOUR_FOCUS_GLOBAL_KEY = 'all';

/** True when this caller has used up its sends in the window; counts the send otherwise. */
export type TourFocusRateLimiter = (clientIp: string, now?: number) => boolean;

/**
 * A per-address limiter held in memory, the same shape as /api/contact's: it
 * resets on deploy and is per-instance, so it is a flood brake on one source,
 * never a security boundary. The address is the adapter's clientAddress (see
 * the route); the global cap above backs it up for any address it cannot pin.
 */
export function createTourFocusRateLimiter(
  max = TOUR_FOCUS_RATE_MAX,
  windowMs = TOUR_FOCUS_RATE_WINDOW_MS,
  maxKeys = TOUR_FOCUS_RATE_MAX_KEYS
): TourFocusRateLimiter {
  const sends = new Map<string, number[]>();
  return (clientIp, now = Date.now()) => {
    const cutoff = now - windowMs;
    if (!sends.has(clientIp) && sends.size >= maxKeys) {
      for (const [key, times] of sends) {
        const live = times.filter((t) => t > cutoff);
        if (live.length === 0) sends.delete(key);
        else sends.set(key, live);
      }
      // A live flood of distinct addresses: drop the oldest tenth so the map
      // stays bounded by maxKeys, not by how many addresses can be forged.
      if (sends.size >= maxKeys) {
        const byAge = [...sends.entries()].sort(
          (a, b) => Math.max(...a[1]) - Math.max(...b[1])
        );
        const evict = Math.ceil(maxKeys * 0.1);
        for (let i = 0; i < evict && i < byAge.length; i++) sends.delete(byAge[i][0]);
      }
    }
    const recent = (sends.get(clientIp) ?? []).filter((t) => t > cutoff);
    if (recent.length >= max) {
      sends.set(clientIp, recent);
      return true;
    }
    recent.push(now);
    sends.set(clientIp, recent);
    return false;
  };
}

const sharedLimiter = createTourFocusRateLimiter();
const sharedGlobalLimiter = createTourFocusRateLimiter(
  TOUR_FOCUS_GLOBAL_RATE_MAX,
  TOUR_FOCUS_RATE_WINDOW_MS,
  1
);

export interface TourFocusRelayConfig {
  apiUrl: string | undefined;
  secret: string | undefined;
  timeoutMs?: number;
  /** The caller's address, for the flood brake. */
  clientIp?: string;
  /** Injected by tests; the route uses the module's shared per-address limiter. */
  rateLimiter?: TourFocusRateLimiter;
  /** Injected by tests; the route uses the module's shared all-callers limiter. */
  globalRateLimiter?: TourFocusRateLimiter;
}

/**
 * Only this site's own pages may use a relay (this one and the intro-call
 * answer relay, which shares these checks). A browser that is not
 * on this origin is refused by what it tells us about itself: Sec-Fetch-Site
 * when it sends one, otherwise the Origin header against the host it asked.
 * A request with neither is not from a browser page and falls to the content
 * type check and the flood brake.
 */
export function isSameOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';
  const origin = request.headers.get('origin');
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const hosts = new Set<string>();
  try {
    hosts.add(new URL(request.url).host);
  } catch {
    // An unparseable request URL leaves only the headers below.
  }
  for (const name of ['x-forwarded-host', 'host']) {
    const value = request.headers.get(name)?.split(',')[0]?.trim();
    if (value) hosts.add(value);
  }
  return hosts.has(originHost);
}

/**
 * The page always sends JSON. Requiring it means a cross-site page cannot
 * reach this route with a "simple" text/plain request: a JSON body forces a
 * CORS preflight, which this route never answers.
 */
export function isJson(request: Request): boolean {
  const type = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  return type === 'application/json';
}

export function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** The body as text, or null when it is larger than TOUR_FOCUS_MAX_BODY_BYTES. */
export async function readBoundedBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > TOUR_FOCUS_MAX_BODY_BYTES) return null;

  const stream = request.body;
  if (!stream) return '';
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > TOUR_FOCUS_MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

/**
 * Check the request the way the platform will, then relay it. Never throws.
 *
 * 200 `{ok:true}` is a save, 400 `invalid` a body the platform would refuse,
 * 403 a request from another origin, 415 a body that is not JSON, 429 a caller
 * over the flood brake, 404 `not_found` a key the platform does not know (or an
 * API without the route yet), and 502 `failed` everything else. The page treats
 * every answer but 200 the same way: a quiet line saying the tour is booked.
 */
export async function relayTourFocus(
  request: Request,
  config: TourFocusRelayConfig
): Promise<Response> {
  try {
    if (!isSameOrigin(request)) return json(403, { ok: false, error: 'forbidden' });
    if (!isJson(request)) return json(415, { ok: false, error: 'invalid' });

    const raw = await readBoundedBody(request);
    if (raw === null) return json(400, { ok: false, error: 'invalid' });

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(400, { ok: false, error: 'invalid' });
    }
    const fields = (body !== null && typeof body === 'object' ? body : {}) as Record<
      string,
      unknown
    >;

    // The platform trims the key and caps it at 128 UTF-16 units (zod's
    // string max), so this counts the same way.
    const submissionKey =
      typeof fields.submissionKey === 'string' ? fields.submissionKey.trim() : '';
    if (!submissionKey || submissionKey.length > TOUR_FOCUS_MAX_KEY_CHARS) {
      return json(400, { ok: false, error: 'invalid' });
    }
    if (typeof fields.answer !== 'string' || tourFocusProblem(fields.answer) !== null) {
      return json(400, { ok: false, error: 'invalid' });
    }
    const answer = normalizeTourFocusAnswer(fields.answer);

    const { apiUrl, secret, timeoutMs } = config;
    if (!apiUrl || !secret) return json(502, { ok: false, error: 'failed' });

    // After validation, so a malformed request never spends a send; before the
    // platform call, so a flood never reaches it. Callers with no address share
    // one bucket rather than going unbraked. The per-address brake goes first,
    // so one caller's flood spends its own allowance, not everyone's.
    const limited = (config.rateLimiter ?? sharedLimiter)(config.clientIp || 'unknown');
    if (limited) return json(429, { ok: false, error: 'rate_limited' });
    const saturated = (config.globalRateLimiter ?? sharedGlobalLimiter)(TOUR_FOCUS_GLOBAL_KEY);
    if (saturated) return json(429, { ok: false, error: 'rate_limited' });

    const outcome = await postTourFocus({ submissionKey, answer }, { apiUrl, secret, timeoutMs });
    switch (outcome) {
      case 'ok':
        return json(200, { ok: true });
      case 'invalid':
        return json(400, { ok: false, error: 'invalid' });
      case 'not_found':
        return json(404, { ok: false, error: 'not_found' });
      default:
        return json(502, { ok: false, error: 'failed' });
    }
  } catch {
    return json(502, { ok: false, error: 'failed' });
  }
}
