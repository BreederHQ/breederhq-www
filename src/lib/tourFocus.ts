/**
 * The Founders tour "one thing" answer: how it is cleaned and how long it may be.
 *
 * The platform stores the answer after the same cleaning and counts its length
 * in code points, so the page and the relay run exactly this before sending.
 * Counting UTF-16 units (`.length`) would hold an answer written in emoji to
 * half the length the platform accepts, and would disagree with it at the edge.
 *
 * Pure and free of any environment access, so the browser script and the
 * server relay can both import it.
 */

/** The longest answer the platform keeps, in code points. */
export const TOUR_FOCUS_MAX_CHARS = 500;

/**
 * The longest submission key the platform accepts, after trimming, in UTF-16
 * units (`.length`): the platform checks it with zod's string max, which counts
 * that way.
 */
export const TOUR_FOCUS_MAX_KEY_CHARS = 128;

/**
 * Line endings become "\n", every other control character is removed, and the
 * result is trimmed. Line breaks and tabs stay.
 */
export function normalizeTourFocusAnswer(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, '')
    .trim();
}

/** Length of the cleaned answer in code points. */
export function tourFocusLength(raw: string): number {
  return [...normalizeTourFocusAnswer(raw)].length;
}

/** Why an answer cannot be sent, or null when it can. */
export function tourFocusProblem(raw: string): 'empty' | 'too_long' | null {
  const length = tourFocusLength(raw);
  if (length === 0) return 'empty';
  if (length > TOUR_FOCUS_MAX_CHARS) return 'too_long';
  return null;
}
