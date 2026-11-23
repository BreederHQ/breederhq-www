/**
 * Founders intro-call check-in relay: the work behind POST /api/intro-call-answer.
 *
 * The answer page (/founders/intro-call/answer) posts the applicant's
 * "I'll Be There" or "I Need A New Time" to that route, and this forwards it to
 * the platform with the shared lead secret. The browser cannot call the
 * platform directly: the secret never leaves the server, and the platform's CORS
 * does not admit it.
 *
 * Same checks as the tour-focus relay (same origin, JSON only, a bounded body,
 * a per-address flood brake and an all-callers cap), which it shares code with.
 * Its flood brakes are its own, so answers never spend the tour-focus allowance.
 *
 * The route passes its environment in, so this module reads no environment of
 * its own and a test can drive every branch.
 */

import type { PlatformConfig } from './leadCapture';
import {
  TOUR_FOCUS_GLOBAL_RATE_MAX,
  TOUR_FOCUS_RATE_MAX,
  TOUR_FOCUS_RATE_WINDOW_MS,
  createTourFocusRateLimiter,
  isJson,
  isSameOrigin,
  json,
  readBoundedBody,
  type TourFocusRateLimiter,
} from './tourFocusRelay';
import {
  INTRO_CALL_MAX_BOOKING_ID,
  cleanSubmissionKey,
  usableRescheduleUrl,
} from '../foundersIntroCall';

/**
 * What the platform said to an applicant's check-in answer. `too_late` is a
 * 409 (the call has started, the application is closed, or no check-in was
 * sent for the current time), `rate_limited` a 429, and every other result, a
 * timeout and a network error included, is `failed`. A reschedule link comes
 * back only with a `new` answer, and only if the platform sent one.
 */
export type IntroCallAnswerOutcome =
  | { status: 'ok'; rescheduleUrl?: string }
  | { status: 'invalid' | 'not_found' | 'too_late' | 'rate_limited' | 'failed' };

/** The answer call waits at most this long, so a stalled API cannot hold the visitor. */
const INTRO_CALL_ANSWER_TIMEOUT_MS = 5000;

/**
 * Relay an applicant's check-in answer ("I'll be there" / "I need a new time")
 * to the platform, which decides whether it still counts.
 *
 * Never throws. An API that predates the route answers 404, which reads the
 * same as a booking the platform does not know: the page shows the same line.
 */
export async function postIntroCallAnswer(
  entry: { submissionKey: string; bookingId: number; answer: 'yes' | 'new' },
  config: PlatformConfig
): Promise<IntroCallAnswerOutcome> {
  try {
    const response = await fetch(`${config.apiUrl}/marketing-leads/intro-call-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bhq-lead-secret': config.secret,
      },
      signal: AbortSignal.timeout(config.timeoutMs ?? INTRO_CALL_ANSWER_TIMEOUT_MS),
      body: JSON.stringify({
        submissionKey: entry.submissionKey,
        bookingId: entry.bookingId,
        answer: entry.answer,
      }),
    });

    if (response.ok) {
      let rescheduleUrl: string | undefined;
      if (entry.answer === 'new') {
        try {
          const body: unknown = await response.json();
          const raw = body !== null && typeof body === 'object' ? (body as Record<string, unknown>).rescheduleUrl : undefined;
          rescheduleUrl = usableRescheduleUrl(raw) ?? undefined;
        } catch {
          // An unreadable body is still a recorded answer, just with no link.
        }
      }
      return rescheduleUrl ? { status: 'ok', rescheduleUrl } : { status: 'ok' };
    }
    if (response.status === 400) return { status: 'invalid' };
    if (response.status === 404) return { status: 'not_found' };
    if (response.status === 409) return { status: 'too_late' };
    if (response.status === 429) return { status: 'rate_limited' };
    console.error(`Platform intro call answer failed: ${response.status}`);
    return { status: 'failed' };
  } catch {
    console.error('Platform intro call answer request failed');
    return { status: 'failed' };
  }
}

const GLOBAL_KEY = 'all';

const sharedLimiter = createTourFocusRateLimiter(TOUR_FOCUS_RATE_MAX, TOUR_FOCUS_RATE_WINDOW_MS);
const sharedGlobalLimiter = createTourFocusRateLimiter(
  TOUR_FOCUS_GLOBAL_RATE_MAX,
  TOUR_FOCUS_RATE_WINDOW_MS,
  1
);

export interface IntroCallAnswerRelayConfig {
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
 * Check the request the way the platform will, then relay it. Never throws.
 *
 * 200 `{ok:true}` is a recorded answer (with `rescheduleUrl` for a `new` answer
 * when the platform sent a usable one), 400 `invalid` a body the platform would
 * refuse, 403 a request from another origin, 404 `not_found` a booking the
 * platform does not know for that key (or an API without the route yet), 409
 * `too_late` an answer that no longer counts, 415 a body that is not JSON, 429 a
 * caller over a flood brake (ours or the platform's), and 502 `failed`
 * everything else.
 */
export async function relayIntroCallAnswer(
  request: Request,
  config: IntroCallAnswerRelayConfig
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

    const submissionKey = cleanSubmissionKey(fields.submissionKey);
    const bookingId = fields.bookingId;
    const answer = fields.answer;
    if (
      !submissionKey ||
      typeof bookingId !== 'number' ||
      !Number.isInteger(bookingId) ||
      bookingId < 1 ||
      bookingId > INTRO_CALL_MAX_BOOKING_ID ||
      (answer !== 'yes' && answer !== 'new')
    ) {
      return json(400, { ok: false, error: 'invalid' });
    }

    const { apiUrl, secret, timeoutMs } = config;
    if (!apiUrl || !secret) return json(502, { ok: false, error: 'failed' });

    // After validation, so a malformed request never spends a send; before the
    // platform call, so a flood never reaches it. The per-address brake goes
    // first, so one caller's flood spends its own allowance, not everyone's.
    const limited = (config.rateLimiter ?? sharedLimiter)(config.clientIp || 'unknown');
    if (limited) return json(429, { ok: false, error: 'rate_limited' });
    const saturated = (config.globalRateLimiter ?? sharedGlobalLimiter)(GLOBAL_KEY);
    if (saturated) return json(429, { ok: false, error: 'rate_limited' });

    const outcome = await postIntroCallAnswer(
      { submissionKey, bookingId, answer },
      { apiUrl, secret, timeoutMs }
    );
    switch (outcome.status) {
      case 'ok':
        return json(200, outcome.rescheduleUrl ? { ok: true, rescheduleUrl: outcome.rescheduleUrl } : { ok: true });
      case 'invalid':
        return json(400, { ok: false, error: 'invalid' });
      case 'not_found':
        return json(404, { ok: false, error: 'not_found' });
      case 'too_late':
        return json(409, { ok: false, error: 'too_late' });
      case 'rate_limited':
        return json(429, { ok: false, error: 'rate_limited' });
      default:
        return json(502, { ok: false, error: 'failed' });
    }
  } catch {
    return json(502, { ok: false, error: 'failed' });
  }
}
