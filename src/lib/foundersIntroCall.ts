/**
 * Dates for the Founders intro-call booking screen.
 *
 * The platform holds an application for 14 days from the day it was made,
 * counted in America/Chicago: the hold runs to the end of that Chicago calendar
 * day plus 14 (the API's `tourDeadlineOn`). The page shows the same date, so it
 * computes it in Chicago too. Computing it from the browser's own zone, or from
 * UTC, gives the wrong day for an applicant who applies late in the evening.
 *
 * Pure and free of any environment access, so the browser script and the tests
 * can both import it.
 */

/**
 * The founders' walkthrough of what an intro call covers, served from this
 * site's own static files (public/videos) and played in the page by a native
 * video element, on every screen size. The file name carries a version so a
 * re-export ships under a new URL: /videos/* is cached as immutable
 * (vercel.json), so a changed file must never reuse a published name.
 */
export const INTRO_CALL_VIDEO_SRC = '/videos/why-book-an-intro-call-v1.mp4';
export const INTRO_CALL_VIDEO_TITLE = 'Why Book an Intro Call';
/**
 * Where an email's "watch the video" link sends a reader: the pricing page's
 * video section, where the video plays in the page.
 */
export const INTRO_CALL_VIDEO_PAGE_URL = 'https://breederhq.com/pricing#intro-call-video';

/** The zone the program's dates and call times are kept in. */
export const FOUNDERS_TIME_ZONE = 'America/Chicago';

/** Calendar days an application is held for. */
export const HOLD_DAYS = 14;

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The Chicago calendar date of an instant, as YYYY-MM-DD. */
export function chicagoDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: FOUNDERS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Parse YYYY-MM-DD into a UTC-midnight Date, or null when it is not a real date. */
function parseYmd(ymd: string): Date | null {
  const m = YMD_RE.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d));
  // Rejects 2026-02-30 and the like, which Date.UTC would roll over.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

/** True when the value is a real calendar date written as YYYY-MM-DD. */
export function isHoldDate(value: unknown): value is string {
  return typeof value === 'string' && parseYmd(value) !== null;
}

/**
 * The last day of the hold for an application made at `now`: the Chicago date
 * of `now` plus 14 calendar days, as YYYY-MM-DD.
 */
export function holdUntilDate(now: Date): string {
  const start = parseYmd(chicagoDate(now));
  if (!start) throw new Error('Could not read the Chicago date');
  start.setUTCDate(start.getUTCDate() + HOLD_DAYS);
  return start.toISOString().slice(0, 10);
}

/** "Sunday, December 6" for 2026-12-06, or null when the value is not a date. */
export function formatHoldDate(ymd: string): string | null {
  const date = parseYmd(ymd);
  if (!date) return null;
  // The date is a calendar date, so it is formatted in UTC, where it was built:
  // any other zone could move it a day.
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/** "December 6" for 2026-12-06, or null when the value is not a date. */
export function formatHoldMonthDay(ymd: string): string | null {
  const date = parseYmd(ymd);
  if (!date) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * A booked call's start as the program's messages write it:
 * "Tuesday, December 1 at 2:00 PM CT". Formatted in Chicago, and the zone is
 * named, so the line means the same time wherever the applicant is.
 */
export function formatIntroCallStart(start: Date): string {
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: FOUNDERS_TIME_ZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(start);
  const clock = new Intl.DateTimeFormat('en-US', {
    timeZone: FOUNDERS_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(start);
  return `${day} at ${clock} CT`;
}

// ── The pages an applicant opens from her emails ──────────────────────────────

/** The longest submission key the platform accepts (its answer route's bound). */
export const INTRO_CALL_MAX_KEY_CHARS = 200;

/** The largest booking id the platform stores (a 32-bit integer column). */
export const INTRO_CALL_MAX_BOOKING_ID = 2147483647;

/**
 * A submission key worth sending on: non-empty after trimming, within the
 * platform's bound, with no control characters. Anything else is treated as no
 * key, so a mangled link still opens the page.
 */
export function cleanSubmissionKey(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const key = raw.trim();
  if (!key || key.length > INTRO_CALL_MAX_KEY_CHARS) return '';
  if (/[\u0000-\u001f\u007f-\u009f]/.test(key)) return '';
  return key;
}

/**
 * What the intro-call page reads from its link: `k` (the submission key), `by`
 * (the last day of the hold) and `ref=breeder`. All three are display-only
 * inputs, so a malformed one is dropped rather than refused.
 */
export function parseIntroCallPageParams(search: string): {
  submissionKey: string;
  holdDate: string | null;
  referredByBreeder: boolean;
} {
  const params = new URLSearchParams(search);
  const by = params.get('by');
  return {
    submissionKey: cleanSubmissionKey(params.get('k')),
    holdDate: isHoldDate(by) ? by : null,
    referredByBreeder: params.get('ref') === 'breeder',
  };
}

export type IntroCallAnswer = 'yes' | 'new';

/**
 * What the answer page reads from its link: the submission key, the booking id
 * and which button to show. Null unless all three are usable, in which case the
 * page offers no button.
 */
export function parseIntroCallAnswerParams(
  search: string,
): { submissionKey: string; bookingId: number; answer: IntroCallAnswer } | null {
  const params = new URLSearchParams(search);
  const submissionKey = cleanSubmissionKey(params.get('k'));
  const rawId = params.get('b') ?? '';
  const bookingId = /^[0-9]{1,10}$/.test(rawId) ? Number(rawId) : 0;
  const answer = params.get('a');
  if (!submissionKey) return null;
  if (!Number.isInteger(bookingId) || bookingId < 1 || bookingId > INTRO_CALL_MAX_BOOKING_ID) {
    return null;
  }
  if (answer !== 'yes' && answer !== 'new') return null;
  return { submissionKey, bookingId, answer };
}

/**
 * A reschedule link the browser may be sent to: https, on reclaim.ai or one of
 * its subdomains, and carrying no credentials. Anything else is null.
 */
export function usableRescheduleUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2000) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (host !== 'reclaim.ai' && !host.endsWith('.reclaim.ai')) return null;
  return url.toString();
}
