/**
 * Runs the answer page an applicant reaches from her day-before email
 * (/founders/intro-call/answer): one button, "Confirm I'll Be There" or
 * "Pick A New Time", that records her answer only when she presses it.
 *
 * Opening the page records nothing, because mail scanners open every link in a
 * message and would otherwise mark everyone confirmed. The press posts to this
 * site's relay (/api/intro-call-answer), which forwards it to the platform.
 */
import {
  usableRescheduleUrl,
  type IntroCallAnswer,
} from '../../lib/foundersIntroCall';

export interface IntroCallAnswerOptions {
  /** The `[data-intro-call-answer]` element the answer page renders. */
  root: HTMLElement;
  /** The link's parameters, or null when the link was incomplete. */
  params: { submissionKey: string; bookingId: number; answer: IntroCallAnswer } | null;
  /** Where to send the browser for a new time. Injected by tests. */
  navigate?: (url: string) => void;
}

const SUPPORT = 'support@breederhq.com';

const COPY = {
  incomplete: `This link is not complete. Use the button in your most recent email, or write to ${SUPPORT}.`,
  yesLead: "Press the button to tell Aaron and Carie you'll be there.",
  newLead: "Press the button to ask for a new time. We'll take you to your reschedule link.",
  yesButton: "Confirm I'll Be There",
  newButton: 'Pick A New Time',
  confirmed: "You're confirmed. See you then.",
  going: 'Taking you to your reschedule link.',
  noLink: 'Thanks. Use the reschedule link in your calendar invite to pick a new time.',
  notFound: `We could not find that intro call. Use the button in your most recent email, or write to ${SUPPORT}.`,
  tooLate: `This answer can no longer be recorded. Your intro call may have started, or your application may be closed. Write to ${SUPPORT} if you need help.`,
  rateLimited: 'Too many tries. Please wait a few minutes and press the button again.',
  retry: `We could not save that just now. Please press the button again in a moment, or write to ${SUPPORT}.`,
} as const;

/**
 * Fill in and start the answer page. A second call on the same root is
 * ignored, so the button never carries two listeners.
 */
export function initIntroCallAnswer(options: IntroCallAnswerOptions): void {
  const { root, params } = options;
  if (root.dataset.icaReady === 'true') return;
  root.dataset.icaReady = 'true';

  const part = <T extends HTMLElement = HTMLElement>(name: string) =>
    root.querySelector<T>(`[data-ica="${name}"]`);
  const lead = part('lead');
  const button = part<HTMLButtonElement>('button');
  const status = part('status');
  if (!lead || !button || !status) return;

  if (!params) {
    lead.textContent = COPY.incomplete;
    button.hidden = true;
    return;
  }

  const { submissionKey, bookingId, answer } = params;
  const navigate = options.navigate ?? ((url: string) => window.location.assign(url));
  lead.textContent = answer === 'yes' ? COPY.yesLead : COPY.newLead;
  button.textContent = answer === 'yes' ? COPY.yesButton : COPY.newButton;
  button.hidden = false;

  // `pending` is the guard a second click meets before the disabled attribute
  // does; `finished` keeps a settled answer from being sent again.
  let pending = false;
  let finished = false;

  /** A settled answer: say so and take the button away. */
  const settle = (message: string) => {
    finished = true;
    status.textContent = message;
    button.hidden = true;
  };
  /** An answer that did not land and may be tried again. */
  const failSoft = (message: string) => {
    status.textContent = message;
    button.disabled = false;
  };

  button.addEventListener('click', async () => {
    if (pending || finished) return;
    pending = true;
    button.disabled = true;
    status.textContent = '';
    try {
      const res = await fetch('/api/intro-call-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionKey, bookingId, answer }),
      });
      if (res.ok) {
        if (answer === 'yes') {
          settle(COPY.confirmed);
          return;
        }
        let url: string | null = null;
        try {
          const body: unknown = await res.json();
          const raw =
            body !== null && typeof body === 'object'
              ? (body as Record<string, unknown>).rescheduleUrl
              : undefined;
          url = usableRescheduleUrl(raw);
        } catch {
          // An unreadable body is still a recorded answer, just with no link.
        }
        if (url) {
          settle(COPY.going);
          navigate(url);
        } else {
          settle(COPY.noLink);
        }
        return;
      }
      if (res.status === 404) settle(COPY.notFound);
      else if (res.status === 409) settle(COPY.tooLate);
      else if (res.status === 400) settle(COPY.incomplete);
      else if (res.status === 429) failSoft(COPY.rateLimited);
      else failSoft(COPY.retry);
    } catch {
      failSoft(COPY.retry);
    } finally {
      pending = false;
    }
  });
}
