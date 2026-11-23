/**
 * The Founders intro-call booking screen's setup: the hold lines, the referral
 * card, and the booking frame's key.
 *
 * Run: node --import tsx --test src/components/founders/__tests__/introCallBooking.test.ts
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { bookingUrlsFor, initIntroCallBooking } from '../introCallBooking';

const BOOKING = 'https://app.reclaim.ai/m/breederhq/founders-program-tour';

// The parts of IntroCallBooking.astro the setup reads.
const SCREEN = `
  <div data-intro-call-booking data-booking-url="${BOOKING}" data-embed-id="abc-123">
    <h1 data-icb="heading">One Last Step</h1>
    <p data-icb="subhead">Your application is in. Pick a time for your live Zoom intro call with Aaron and Carie.</p>
    <div data-icb="before-booking">
      <div data-icb="video"></div>
      <section data-icb="referral" hidden></section>
      <div data-icb="embed-card" hidden></div>
      <a data-icb="book-button" hidden></a>
      <p data-icb="link-fallback" hidden><a data-icb="fallback-link"></a></p>
      <p data-icb="later-body">Your application is saved.</p>
    </div>
    <section data-icb="booked" hidden></section>
  </div>
`;

let dom: JSDOM;
const saved: Record<string, unknown> = {};
before(() => {
  dom = new JSDOM(`<!doctype html><body>${SCREEN}</body>`);
  for (const key of ['window', 'document']) {
    saved[key] = (globalThis as Record<string, unknown>)[key];
    (globalThis as Record<string, unknown>)[key] = (dom.window as unknown as Record<string, unknown>)[key];
  }
});
after(() => {
  for (const key of Object.keys(saved)) (globalThis as Record<string, unknown>)[key] = saved[key];
});

function freshRoot(): HTMLElement {
  dom.window.document.body.innerHTML = SCREEN;
  return dom.window.document.querySelector('[data-intro-call-booking]') as unknown as HTMLElement;
}
const part = (root: HTMLElement, name: string) => root.querySelector(`[data-icb="${name}"]`) as HTMLElement;

describe('bookingUrlsFor', () => {
  it('carries the submission key on both links', () => {
    assert.deepEqual(bookingUrlsFor(BOOKING, 'abc-123', 'key 1'), {
      link: `${BOOKING}?data-submission=key%201`,
      embed: 'https://app.reclaim.ai/e/abc-123?data-submission=key%201',
    });
  });

  it('adds no empty parameter when there is no key', () => {
    assert.deepEqual(bookingUrlsFor(BOOKING, 'abc-123', ''), {
      link: BOOKING,
      embed: 'https://app.reclaim.ai/e/abc-123',
    });
  });

  it('offers no embed without an embed id', () => {
    assert.equal(bookingUrlsFor(BOOKING, '', 'k').embed, '');
  });
});

describe('initIntroCallBooking', () => {
  it('states the hold date and frames the calendar with the key that was sent', () => {
    const root = freshRoot();
    initIntroCallBooking({ root, submissionKey: 'sub-1', holdDate: '2026-12-06', referredByBreeder: false });
    assert.equal(
      part(root, 'subhead').textContent,
      'Your application is in and held until Sunday, December 6. Pick a time for your live Zoom intro call with Aaron and Carie.',
    );
    assert.match(part(root, 'later-body').textContent ?? '', /Your application is held until Sunday, December 6\.$/);
    const frame = part(root, 'embed-card').querySelector('iframe') as HTMLIFrameElement;
    assert.equal(frame.src, 'https://app.reclaim.ai/e/abc-123?data-submission=sub-1');
    assert.equal(part(root, 'embed-card').hidden, false);
    assert.ok(part(root, 'video').querySelector('iframe'), 'the walkthrough frame is added');
  });

  it('shows the referral card only for an applicant another breeder sent', () => {
    const shown = freshRoot();
    initIntroCallBooking({ root: shown, submissionKey: 'k', referredByBreeder: true });
    assert.equal(part(shown, 'referral').hidden, false);

    const notShown = freshRoot();
    initIntroCallBooking({ root: notShown, submissionKey: 'k' });
    assert.equal(part(notShown, 'referral').hidden, true);
  });

  it('leaves the date out when the hold date is missing or malformed', () => {
    for (const holdDate of [undefined, null, '', '2026-02-30', 'soon']) {
      const root = freshRoot();
      initIntroCallBooking({ root, submissionKey: 'k', holdDate });
      assert.equal(
        part(root, 'subhead').textContent,
        'Your application is in. Pick a time for your live Zoom intro call with Aaron and Carie.',
        String(holdDate),
      );
    }
  });

  it('runs once per root', () => {
    const root = freshRoot();
    initIntroCallBooking({ root, submissionKey: 'first', holdDate: '2026-12-06' });
    initIntroCallBooking({ root, submissionKey: 'second', holdDate: '2027-01-08' });
    const frame = part(root, 'embed-card').querySelector('iframe') as HTMLIFrameElement;
    assert.match(frame.src, /data-submission=first$/);
    assert.match(part(root, 'subhead').textContent ?? '', /Sunday, December 6/);
  });
});
