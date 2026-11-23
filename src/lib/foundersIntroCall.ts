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
 * The founders' walkthrough of what an intro call covers, an Arcade video. The
 * embed form plays in a frame; the plain link (no query) opens it on Arcade.
 */
export const INTRO_CALL_VIDEO_EMBED_URL =
  'https://demo.arcade.software/video/4NtPVET9zozUSsSRv83F?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true';
export const INTRO_CALL_VIDEO_URL = 'https://demo.arcade.software/video/4NtPVET9zozUSsSRv83F';
export const INTRO_CALL_VIDEO_TITLE = 'Why Book an Intro Call';

/**
 * The frame for the walkthrough video, sized by its 16:9 wrapper. Built in
 * script rather than markup so a page that never shows it never loads Arcade:
 * a frame inside a hidden section is still fetched.
 */
export function createIntroCallVideoFrame(doc: Document): HTMLIFrameElement {
  const frame = doc.createElement('iframe');
  frame.src = INTRO_CALL_VIDEO_EMBED_URL;
  frame.title = INTRO_CALL_VIDEO_TITLE;
  frame.allowFullscreen = true;
  frame.setAttribute('allow', 'clipboard-write; fullscreen');
  frame.className = 'absolute inset-0 h-full w-full border-0';
  frame.style.colorScheme = 'light';
  return frame;
}

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
