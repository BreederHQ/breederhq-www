/**
 * The answer page's one button: nothing is sent until it is pressed, a press is
 * sent once, and every reply reads plainly.
 *
 * Run: node --import tsx --test src/components/founders/__tests__/introCallAnswer.test.ts
 */
import { after, afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initIntroCallAnswer } from '../introCallAnswer';

// The parts of answer.astro the setup reads.
const SCREEN = `
  <div data-intro-call-answer>
    <h1>Your Intro Call</h1>
    <p data-ica="lead">&nbsp;</p>
    <button data-ica="button" type="button" hidden></button>
    <p data-ica="status" role="status"></p>
  </div>
`;

const RESCHEDULE = 'https://app.reclaim.ai/reschedule/abc123';
const PARAMS = { submissionKey: 'sub-1', bookingId: 42 };

let dom: JSDOM;
const saved: Record<string, unknown> = {};
const realFetch = globalThis.fetch;
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
afterEach(() => {
  globalThis.fetch = realFetch;
});

function freshRoot(): HTMLElement {
  dom.window.document.body.innerHTML = SCREEN;
  return dom.window.document.querySelector('[data-intro-call-answer]') as unknown as HTMLElement;
}
const part = (root: HTMLElement, name: string) => root.querySelector(`[data-ica="${name}"]`) as HTMLElement;
const button = (root: HTMLElement) => part(root, 'button') as HTMLButtonElement;

interface Call {
  url: string;
  init: RequestInit;
}

/** Replace fetch with a handler; returns the recorded calls. */
function stubFetch(handler: () => Promise<Response>): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    return handler();
  }) as typeof fetch;
  return calls;
}
const reply = (status: number, body: unknown = {}) => async () =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Press the button and let the request settle. */
async function press(root: HTMLElement): Promise<void> {
  button(root).click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('the answer page before a press', () => {
  it('shows the matching button and sends nothing', () => {
    const calls = stubFetch(reply(200));
    const yes = freshRoot();
    initIntroCallAnswer({ root: yes, params: { ...PARAMS, answer: 'yes' } });
    assert.equal(button(yes).textContent, "Confirm I'll Be There");
    assert.equal(button(yes).hidden, false);

    const again = freshRoot();
    initIntroCallAnswer({ root: again, params: { ...PARAMS, answer: 'new' } });
    assert.equal(button(again).textContent, 'Pick A New Time');
    assert.equal(calls.length, 0, 'opening the page records nothing');
  });

  it('offers no button for an incomplete link', () => {
    const calls = stubFetch(reply(200));
    const root = freshRoot();
    initIntroCallAnswer({ root, params: null });
    assert.equal(button(root).hidden, true);
    assert.match(part(root, 'lead').textContent ?? '', /not complete/);
    assert.equal(calls.length, 0);
  });

  it('runs once per root', async () => {
    const calls = stubFetch(reply(200));
    const root = freshRoot();
    initIntroCallAnswer({ root, params: { ...PARAMS, answer: 'yes' } });
    initIntroCallAnswer({ root, params: { ...PARAMS, answer: 'yes' } });
    await press(root);
    assert.equal(calls.length, 1, 'one listener, one request');
  });
});

describe('pressing the button', () => {
  it('posts the key, the booking and the answer, then confirms a yes', async () => {
    const calls = stubFetch(reply(200, { ok: true }));
    const root = freshRoot();
    initIntroCallAnswer({ root, params: { ...PARAMS, answer: 'yes' } });
    await press(root);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/intro-call-answer');
    assert.equal(calls[0].init.method, 'POST');
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
      submissionKey: 'sub-1',
      bookingId: 42,
      answer: 'yes',
    });
    assert.equal(part(root, 'status').textContent, "You're confirmed. See you then.");
    assert.equal(button(root).hidden, true);
  });

  it('ignores a second press while the first is pending, and disables the button meanwhile', async () => {
    let release: (res: Response) => void = () => {};
    const calls = stubFetch(() => new Promise<Response>((resolve) => (release = resolve)));
    const root = freshRoot();
    initIntroCallAnswer({ root, params: { ...PARAMS, answer: 'yes' } });
    button(root).click();
    button(root).click();
    button(root).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(calls.length, 1);
    assert.equal(button(root).disabled, true);
    release(new Response('{}', { status: 200 }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(part(root, 'status').textContent, "You're confirmed. See you then.");
    // A settled answer is not sent again.
    button(root).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(calls.length, 1);
  });

  it('sends a new-time answer to the reschedule link when it is https on reclaim.ai', async () => {
    stubFetch(reply(200, { ok: true, rescheduleUrl: RESCHEDULE }));
    const root = freshRoot();
    const went: string[] = [];
    initIntroCallAnswer({ root, params: { ...PARAMS, answer: 'new' }, navigate: (url) => went.push(url) });
    await press(root);
    assert.deepEqual(went, [RESCHEDULE]);
  });

  it('never navigates to a link that is not https on reclaim.ai, and points to the invite instead', async () => {
    const unsafe = [
      'http://app.reclaim.ai/reschedule/abc',
      'https://evil.example/reschedule',
      'https://reclaim.ai.evil.example/x',
      'javascript:alert(1)',
      undefined,
    ];
    for (const rescheduleUrl of unsafe) {
      stubFetch(reply(200, { ok: true, rescheduleUrl }));
      const root = freshRoot();
      const went: string[] = [];
      initIntroCallAnswer({ root, params: { ...PARAMS, answer: 'new' }, navigate: (url) => went.push(url) });
      await press(root);
      assert.deepEqual(went, [], String(rescheduleUrl));
      assert.match(part(root, 'status').textContent ?? '', /reschedule link in your calendar invite/, String(rescheduleUrl));
    }
  });

  it('never navigates for a yes, even if the reply carries a link', async () => {
    stubFetch(reply(200, { ok: true, rescheduleUrl: RESCHEDULE }));
    const root = freshRoot();
    const went: string[] = [];
    initIntroCallAnswer({ root, params: { ...PARAMS, answer: 'yes' }, navigate: (url) => went.push(url) });
    await press(root);
    assert.deepEqual(went, []);
  });
});

describe('every reply reads as a plain line', () => {
  const settled: [number, RegExp][] = [
    [404, /could not find that intro call/],
    [409, /can no longer be recorded/],
    [400, /not complete/],
  ];
  for (const [status, line] of settled) {
    it(`${status} settles the page: the line shows and the button is gone`, async () => {
      const calls = stubFetch(reply(status, { ok: false }));
      const root = freshRoot();
      initIntroCallAnswer({ root, params: { ...PARAMS, answer: 'yes' } });
      await press(root);
      assert.match(part(root, 'status').textContent ?? '', line);
      assert.equal(button(root).hidden, true);
      button(root).click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(calls.length, 1, 'a settled page sends nothing more');
    });
  }

  const retryable: [number | 'network', RegExp][] = [
    [429, /Too many tries/],
    [500, /could not save that just now/],
    [502, /could not save that just now/],
    [503, /could not save that just now/],
    ['network', /could not save that just now/],
  ];
  for (const [status, line] of retryable) {
    it(`${status} says so and lets her press again`, async () => {
      const calls = stubFetch(
        status === 'network'
          ? async () => {
              throw new TypeError('fetch failed');
            }
          : reply(status, { ok: false })
      );
      const root = freshRoot();
      initIntroCallAnswer({ root, params: { ...PARAMS, answer: 'yes' } });
      await press(root);
      assert.match(part(root, 'status').textContent ?? '', line);
      assert.equal(button(root).hidden, false);
      assert.equal(button(root).disabled, false);
      await press(root);
      assert.equal(calls.length, 2, 'a second press sends again');
    });
  }
});
