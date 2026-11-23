/**
 * Fills in the Founders intro-call booking screen (IntroCallBooking.astro) for
 * one application, and runs it: the walkthrough video, the Reclaim booking
 * frame, the booked state, the calendar links and the optional "one thing"
 * answer.
 *
 * Used by /pricing right after an application is sent, and by the page an
 * applicant returns to from her confirmation email.
 *
 * The booking frame and both booking links are built from the EXACT submission
 * key given here: Reclaim copies every `data-` query parameter on a booking URL
 * into its webhook's custom data, and `data-submission` is what ties a booking
 * to its application.
 */
import { tourFocusProblem, normalizeTourFocusAnswer } from '../../lib/tourFocus';
import {
  createIntroCallVideoFrame,
  formatHoldDate,
  formatIntroCallStart,
  isHoldDate,
} from '../../lib/foundersIntroCall';

export interface IntroCallBookingOptions {
  /** The `[data-intro-call-booking]` element IntroCallBooking.astro renders. */
  root: HTMLElement;
  /**
   * The submission key the application was sent with. Empty means no known
   * application: the calendar is offered without a key and the optional
   * "one thing" answer cannot be saved.
   */
  submissionKey: string;
  /**
   * The last day of the hold, YYYY-MM-DD (the platform's `tourDeadlineOn`).
   * Absent or not a real date, the hold lines leave the date out.
   */
  holdDate?: string | null;
  /** True when the applicant said another breeder told her about BreederHQ. */
  referredByBreeder?: boolean;
}

const RECLAIM_ORIGIN = 'https://app.reclaim.ai';

const INTRO_CALL_TITLE = 'BreederHQ Founders Intro Call';
const INTRO_CALL_DETAILS = 'Join with the Zoom link in your calendar invite from admin@breederhq.com.';
/** Used when Reclaim's message carries no usable end time. */
const INTRO_CALL_MINUTES = 60;

const NOT_SAVED = "We couldn't save that just now. Your intro call is still booked.";

/** The booking links for a submission key; an empty key adds no parameter. */
export function bookingUrlsFor(
  bookingBase: string,
  embedId: string,
  key: string,
): { link: string; embed: string } {
  const query = key ? `?data-submission=${encodeURIComponent(key)}` : '';
  return {
    link: bookingBase ? `${bookingBase}${query}` : '',
    embed: embedId ? `${RECLAIM_ORIGIN}/e/${encodeURIComponent(embedId)}${query}` : '',
  };
}

function field(obj: unknown, key: string): unknown {
  return obj !== null && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined;
}

/** Epoch ms of a Date or zoned ISO string from the message, else NaN. */
function parseMessageTime(raw: unknown): number {
  let ms = NaN;
  if (Object.prototype.toString.call(raw) === '[object Date]') {
    ms = (raw as Date).getTime();
  } else if (
    typeof raw === 'string' &&
    raw.length <= 40 &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})$/.test(raw)
  ) {
    ms = Date.parse(raw);
  }
  return ms;
}

/**
 * The booked start time from Reclaim's MEETING_BOOKED message, or null.
 * Reclaim's embed posts `{ type, data: { meeting, redirectUrl } }`, where
 * `meeting.event.startTime` is the start. It arrives through structured clone,
 * so it may be a Date or an ISO string; anything else, an ISO string without a
 * zone (which would be read as local time and could be hours off), or a time
 * not plausibly a call booked just now yields null and the time is left out
 * rather than shown wrong.
 */
function bookedStartTime(message: unknown): Date | null {
  const raw = field(field(field(field(message, 'data'), 'meeting'), 'event'), 'startTime');
  const ms = parseMessageTime(raw);
  if (!Number.isFinite(ms)) return null;
  const now = Date.now();
  const DAY = 86_400_000;
  if (ms < now - DAY || ms > now + 400 * DAY) return null;
  return new Date(ms);
}

/**
 * The booked end time when the message carries a usable one (after the start,
 * no more than 4 hours long); otherwise the start plus the call's 60 minutes.
 */
function bookedEndTime(message: unknown, start: Date): Date {
  const raw = field(field(field(field(message, 'data'), 'meeting'), 'event'), 'endTime');
  const ms = parseMessageTime(raw);
  const span = ms - start.getTime();
  if (Number.isFinite(ms) && span > 0 && span <= 4 * 3_600_000) return new Date(ms);
  return new Date(start.getTime() + INTRO_CALL_MINUTES * 60_000);
}

/** UTC basic format, 20261120T180000Z, as Google and iCalendar expect. */
function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function googleCalendarUrl(start: Date, end: Date): string {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: INTRO_CALL_TITLE,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    details: INTRO_CALL_DETAILS,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function outlookCalendarUrl(start: Date, end: Date): string {
  const q = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: INTRO_CALL_TITLE,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: INTRO_CALL_DETAILS,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${q.toString()}`;
}

/** A valid single-event iCalendar file: UTC times, CRLF line endings. */
function introCallIcs(start: Date, end: Date): string {
  const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}@breederhq.com`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BreederHQ//Founders Intro Call//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${INTRO_CALL_TITLE}`,
    `DESCRIPTION:${INTRO_CALL_DETAILS.replace(/,/g, '\\,')}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

/**
 * Height of anything pinned to the top of the viewport (a sticky or fixed
 * header), so a card is not scrolled underneath it.
 */
function pinnedTopOffset(): number {
  let offset = 0;
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('header, [data-sticky-header]'))) {
    const pos = getComputedStyle(el).position;
    if (pos !== 'sticky' && pos !== 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.top <= 0 && r.bottom > 0) offset = Math.max(offset, r.bottom);
  }
  return offset;
}

/**
 * Bring an element into view after the layout above it changed: measured after
 * the layout settles, skipped when it already fits on screen, and without
 * smooth scrolling for a visitor who asked for reduced motion.
 */
function scrollIntoViewIfNeeded(el: HTMLElement) {
  const top = pinnedTopOffset() + 16;
  const rect = el.getBoundingClientRect();
  if (rect.top >= top && rect.bottom <= window.innerHeight) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - top), behavior: reduce ? 'auto' : 'smooth' });
}

/**
 * Fill in and start the booking screen. Call once per page; a second call on
 * the same root is ignored, so the booking listener is never doubled.
 */
export function initIntroCallBooking(options: IntroCallBookingOptions): void {
  const { root, submissionKey } = options;
  if (root.dataset.icbReady === 'true') return;
  root.dataset.icbReady = 'true';

  const part = <T extends HTMLElement = HTMLElement>(name: string) =>
    root.querySelector<T>(`[data-icb="${name}"]`);

  const heading = part('heading');
  const subhead = part('subhead');
  const beforeBooking = part('before-booking');
  const videoSlot = part('video');
  const referralCard = part('referral');
  const embedCard = part('embed-card');
  const bookButton = part<HTMLAnchorElement>('book-button');
  const linkFallback = part('link-fallback');
  const fallbackLink = part<HTMLAnchorElement>('fallback-link');
  const laterBody = part('later-body');
  const bookedCard = part('booked');

  // ── The hold ───────────────────────────────────────────────────────────
  const holdLabel = isHoldDate(options.holdDate) ? formatHoldDate(options.holdDate) : null;
  if (holdLabel) {
    if (subhead) {
      subhead.textContent = `Your application is in and held until ${holdLabel}. Pick a time for your live Zoom intro call with Aaron and Carie.`;
    }
    if (laterBody) {
      // The same sentence as the markup's, plus the date (see the note there).
      laterBody.textContent = `Your application is saved. We've emailed you a link back to this page, so you can watch the walkthrough, try the demo and book when you're ready. Your application is held until ${holdLabel}.`;
    }
  }

  if (referralCard) referralCard.hidden = options.referredByBreeder !== true;

  // ── The walkthrough ────────────────────────────────────────────────────
  if (videoSlot) videoSlot.replaceChildren(createIntroCallVideoFrame(document));

  // ── The calendar ───────────────────────────────────────────────────────
  const urls = bookingUrlsFor(root.dataset.bookingUrl || '', root.dataset.embedId || '', submissionKey);
  let embedFrame: HTMLIFrameElement | null = null;

  if (urls.embed && embedCard) {
    const frame = document.createElement('iframe');
    frame.src = urls.embed;
    frame.title = "Book your Founders' Program intro call";
    // Reclaim's embed posts no size messages (only MEETING_BOOKED), so the page
    // sizes the frame. Both layouts pin their Next / Back buttons to the
    // frame's bottom edge and scroll the time list inside the frame (a day
    // offers up to 35 start times, far more than any sensible frame shows at
    // once). So the frame is capped at the visible viewport: scrolled to, the
    // whole widget is on screen, buttons included. Narrow frames (paged layout)
    // take Reclaim's own 700px at most; from 675px wide (side-by-side layout)
    // up to 820px, which shows the calendar and 16 times. The height attribute
    // is the fallback for a browser without `svh`, which drops the class's
    // height rule (a frame's default is 150px).
    frame.height = '700';
    frame.className =
      'block w-full border-0 h-[clamp(560px,calc(100svh-2rem),700px)] @min-[675px]:h-[clamp(640px,calc(100svh-2rem),820px)]';
    embedCard.replaceChildren(frame);
    embedCard.hidden = false;
    embedFrame = frame;
    if (urls.link && fallbackLink && linkFallback) {
      fallbackLink.href = urls.link;
      linkFallback.hidden = false;
    }
  } else if (urls.link && bookButton) {
    bookButton.href = urls.link;
    bookButton.hidden = false;
  }

  // ── Calendar links once booked ─────────────────────────────────────────
  let icsText = '';
  part('cal-apple')?.addEventListener('click', () => {
    if (!icsText) return;
    const url = URL.createObjectURL(new Blob([icsText], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breederhq-founders-intro-call.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // ── The optional "one thing" answer ────────────────────────────────────
  // Every outcome other than a save is a quiet line: the booking is already
  // made and is never touched here.
  const focusForm = part<HTMLFormElement>('focus-form');
  const focusAnswer = part<HTMLTextAreaElement>('focus-answer');
  const focusSend = part<HTMLButtonElement>('focus-send');
  const focusStatus = part('focus-status');
  focusAnswer?.addEventListener('input', () => focusAnswer.removeAttribute('aria-invalid'));
  focusForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!focusAnswer || !focusSend || !focusStatus || focusSend.disabled) return;
    const problem = tourFocusProblem(focusAnswer.value);
    if (problem) {
      // Nothing is sent: the line names the rule and the box is marked.
      focusStatus.textContent =
        problem === 'empty' ? 'Add a few words first.' : 'Please keep it to 500 characters or fewer.';
      focusAnswer.setAttribute('aria-invalid', 'true');
      focusAnswer.focus();
      return;
    }
    focusAnswer.removeAttribute('aria-invalid');
    if (!submissionKey) {
      focusStatus.textContent = NOT_SAVED;
      return;
    }
    focusSend.disabled = true;
    focusStatus.textContent = '';
    try {
      const res = await fetch('/api/tour-focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionKey,
          answer: normalizeTourFocusAnswer(focusAnswer.value),
        }),
      });
      if (!res.ok) throw new Error('not saved');
      focusStatus.textContent = "Thanks, we'll be ready.";
      focusAnswer.disabled = true;
      // The button stays disabled: the answer is saved.
    } catch {
      focusStatus.textContent = NOT_SAVED;
      focusSend.disabled = false;
    }
  });

  // ── The booked state ───────────────────────────────────────────────────
  // Reclaim's embed posts MEETING_BOOKED to its parent when a time is
  // confirmed. Only a message from Reclaim's origin AND from the frame this
  // screen created is believed. It ends the booking step: the frame (whose own
  // confirmation offers "Book another meeting") and the cards before it are
  // removed, and the booked card takes their place.
  window.addEventListener('message', (e) => {
    if (e.origin !== RECLAIM_ORIGIN) return;
    if (!embedFrame || e.source !== embedFrame.contentWindow) return;
    const type = (e.data as { type?: unknown } | null)?.type;
    if (type !== 'MEETING_BOOKED') return;

    const start = bookedStartTime(e.data);

    // Dropping the frame reference also makes any repeat message a no-op.
    embedFrame = null;
    embedCard?.replaceChildren();
    // The walkthrough frame goes too, so a video still playing stops.
    videoSlot?.replaceChildren();
    if (beforeBooking) beforeBooking.hidden = true;

    if (heading) heading.textContent = 'Your Intro Call Is Booked';
    if (subhead) {
      subhead.textContent = start
        ? `${formatIntroCallStart(start)}, with Aaron and Carie.`
        : 'Your intro call with Aaron and Carie is on the calendar.';
    }

    const calActions = part('calendar-actions');
    const googleLink = part<HTMLAnchorElement>('cal-google');
    const outlookLink = part<HTMLAnchorElement>('cal-outlook');
    if (calActions && googleLink && outlookLink) {
      if (start) {
        const end = bookedEndTime(e.data, start);
        googleLink.href = googleCalendarUrl(start, end);
        outlookLink.href = outlookCalendarUrl(start, end);
        icsText = introCallIcs(start, end);
        calActions.hidden = false;
      } else {
        icsText = '';
        calActions.hidden = true;
      }
    }
    if (bookedCard) bookedCard.hidden = false;
    // Focus first, then scroll: a focus change can itself move the page, so
    // the explicit scroll has to be the last word. Focus on the heading is
    // what announces the booked state to a screen reader.
    heading?.focus({ preventScroll: true });
    if (heading) requestAnimationFrame(() => scrollIntoViewIfNeeded(heading));
  });
}
