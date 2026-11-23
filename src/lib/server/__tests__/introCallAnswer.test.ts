/**
 * The Founders intro-call check-in answer: the platform call and the relay
 * route's checks.
 *
 * Run: node --import tsx --test src/lib/server/__tests__/introCallAnswer.test.ts
 */
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { postIntroCallAnswer, relayIntroCallAnswer } from '../introCallAnswerRelay';
import {
  TOUR_FOCUS_GLOBAL_RATE_MAX,
  TOUR_FOCUS_MAX_BODY_BYTES,
  TOUR_FOCUS_RATE_MAX,
  createTourFocusRateLimiter,
} from '../tourFocusRelay';
import { INTRO_CALL_MAX_BOOKING_ID } from '../../foundersIntroCall';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const config = { apiUrl: 'https://api.example.test/api/v1', secret: 'shh' };
const RESCHEDULE = 'https://app.reclaim.ai/reschedule/abc123';

type Upstream = { status: number; body?: unknown; rawBody?: string } | Error;

/** Replace fetch with a platform stub; returns the recorded calls. */
function stubFetch(upstream: Upstream): { url: string; init: RequestInit }[] {
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    if (upstream instanceof Error) throw upstream;
    const text = upstream.rawBody ?? JSON.stringify(upstream.body ?? {});
    return new Response(text, { status: upstream.status });
  }) as typeof fetch;
  return calls;
}

describe('postIntroCallAnswer', () => {
  const entry = { submissionKey: 'k1', bookingId: 42, answer: 'new' as const };

  it('sends the secret, the key, the booking and the answer to the platform route', async () => {
    const calls = stubFetch({ status: 200, body: { ok: true, rescheduleUrl: RESCHEDULE } });
    assert.deepEqual(await postIntroCallAnswer(entry, config), { status: 'ok', rescheduleUrl: RESCHEDULE });
    assert.equal(calls[0].url, 'https://api.example.test/api/v1/marketing-leads/intro-call-answer');
    assert.equal((calls[0].init.headers as Record<string, string>)['x-bhq-lead-secret'], 'shh');
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
      submissionKey: 'k1',
      bookingId: 42,
      answer: 'new',
    });
  });

  it('maps each platform status: 400, 404, 409 and 429 are named, everything else is failed', async () => {
    const named: [number, string][] = [
      [400, 'invalid'],
      [404, 'not_found'],
      [409, 'too_late'],
      [429, 'rate_limited'],
    ];
    for (const [status, outcome] of named) {
      stubFetch({ status });
      assert.deepEqual(await postIntroCallAnswer(entry, config), { status: outcome }, String(status));
    }
    for (const status of [401, 403, 500, 502, 503]) {
      stubFetch({ status });
      assert.deepEqual(await postIntroCallAnswer(entry, config), { status: 'failed' }, String(status));
    }
    stubFetch(new Error('network down'));
    assert.deepEqual(await postIntroCallAnswer(entry, config), { status: 'failed' });
  });

  it('hands on a reschedule link only for a new-time answer, and only a usable one', async () => {
    stubFetch({ status: 200, body: { ok: true, rescheduleUrl: RESCHEDULE } });
    assert.deepEqual(await postIntroCallAnswer({ ...entry, answer: 'yes' }, config), { status: 'ok' });

    const unusable = [
      'http://app.reclaim.ai/reschedule/abc',
      'https://evil.example/?u=reclaim.ai',
      'https://reclaim.ai.evil.example/x',
      'javascript:alert(1)',
      'https://user:pw@app.reclaim.ai/x',
      42,
      null,
    ];
    for (const rescheduleUrl of unusable) {
      stubFetch({ status: 200, body: { ok: true, rescheduleUrl } });
      assert.deepEqual(await postIntroCallAnswer(entry, config), { status: 'ok' }, String(rescheduleUrl));
    }
    // A recorded answer with an unreadable body is still recorded.
    stubFetch({ status: 200, rawBody: 'not json' });
    assert.deepEqual(await postIntroCallAnswer(entry, config), { status: 'ok' });
  });
});

describe('relayIntroCallAnswer', () => {
  function post(body: string, headers: Record<string, string> = {}): Request {
    return new Request('https://www.example.test/api/intro-call-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    });
  }
  const valid = JSON.stringify({ submissionKey: ' k1 ', bookingId: 42, answer: 'yes' });
  const validNew = JSON.stringify({ submissionKey: 'k1', bookingId: 42, answer: 'new' });

  /** A fresh flood brake per call, so one test's sends never limit another's. */
  function relayConfig(extra: Record<string, unknown> = {}) {
    return {
      ...config,
      clientIp: '203.0.113.7',
      rateLimiter: createTourFocusRateLimiter(),
      globalRateLimiter: createTourFocusRateLimiter(TOUR_FOCUS_GLOBAL_RATE_MAX),
      ...extra,
    };
  }

  async function result(res: Response): Promise<{ status: number; body: unknown }> {
    return { status: res.status, body: await res.json() };
  }

  it('relays the trimmed key, the booking and the answer, and answers 200 on a recorded answer', async () => {
    const calls = stubFetch({ status: 200, body: { ok: true } });
    const res = await relayIntroCallAnswer(post(valid), relayConfig());
    assert.deepEqual(await result(res), { status: 200, body: { ok: true } });
    assert.equal(calls.length, 1);
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
      submissionKey: 'k1',
      bookingId: 42,
      answer: 'yes',
    });
  });

  it('answers 200 with the reschedule link for a new-time answer', async () => {
    stubFetch({ status: 200, body: { ok: true, rescheduleUrl: RESCHEDULE } });
    const res = await relayIntroCallAnswer(post(validNew), relayConfig());
    assert.deepEqual(await result(res), { status: 200, body: { ok: true, rescheduleUrl: RESCHEDULE } });
  });

  it('maps every platform code to the page, an API without the route (404) included', async () => {
    const cases: [number | Error, number, string][] = [
      [400, 400, 'invalid'],
      [404, 404, 'not_found'],
      [409, 409, 'too_late'],
      [429, 429, 'rate_limited'],
      [401, 502, 'failed'],
      [500, 502, 'failed'],
      [503, 502, 'failed'],
      [new Error('network down'), 502, 'failed'],
    ];
    for (const [platform, status, error] of cases) {
      stubFetch(platform instanceof Error ? platform : { status: platform });
      const res = await relayIntroCallAnswer(post(valid), relayConfig());
      assert.deepEqual(await result(res), { status, body: { ok: false, error } }, String(platform));
    }
  });

  it('refuses what the platform would refuse, without calling it', async () => {
    const calls = stubFetch({ status: 200 });
    const bodies = [
      'not json',
      'null',
      '[]',
      JSON.stringify({ bookingId: 1, answer: 'yes' }),
      JSON.stringify({ submissionKey: '   ', bookingId: 1, answer: 'yes' }),
      JSON.stringify({ submissionKey: 'k'.repeat(201), bookingId: 1, answer: 'yes' }),
      JSON.stringify({ submissionKey: 'k\u0000k', bookingId: 1, answer: 'yes' }),
      JSON.stringify({ submissionKey: 5, bookingId: 1, answer: 'yes' }),
      JSON.stringify({ submissionKey: 'k', answer: 'yes' }),
      JSON.stringify({ submissionKey: 'k', bookingId: 0, answer: 'yes' }),
      JSON.stringify({ submissionKey: 'k', bookingId: -3, answer: 'yes' }),
      JSON.stringify({ submissionKey: 'k', bookingId: 1.5, answer: 'yes' }),
      JSON.stringify({ submissionKey: 'k', bookingId: '7', answer: 'yes' }),
      JSON.stringify({ submissionKey: 'k', bookingId: INTRO_CALL_MAX_BOOKING_ID + 1, answer: 'yes' }),
      JSON.stringify({ submissionKey: 'k', bookingId: 1 }),
      JSON.stringify({ submissionKey: 'k', bookingId: 1, answer: 'maybe' }),
      JSON.stringify({ submissionKey: 'k', bookingId: 1, answer: 'YES' }),
    ];
    for (const body of bodies) {
      const res = await relayIntroCallAnswer(post(body), relayConfig());
      assert.deepEqual(await result(res), { status: 400, body: { ok: false, error: 'invalid' } }, body);
    }
    assert.equal(calls.length, 0);
  });

  it('accepts the longest key and the largest booking id the platform accepts', async () => {
    const calls = stubFetch({ status: 200 });
    const body = JSON.stringify({
      submissionKey: 'k'.repeat(200),
      bookingId: INTRO_CALL_MAX_BOOKING_ID,
      answer: 'new',
    });
    const res = await relayIntroCallAnswer(post(body), relayConfig());
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
  });

  it('reads no more than 16 KB of body', async () => {
    const calls = stubFetch({ status: 200 });
    const padded = JSON.stringify({
      submissionKey: 'k',
      bookingId: 1,
      answer: 'yes',
      pad: 'x'.repeat(TOUR_FOCUS_MAX_BODY_BYTES),
    });
    const res = await relayIntroCallAnswer(post(padded), relayConfig());
    assert.deepEqual(await result(res), { status: 400, body: { ok: false, error: 'invalid' } });
    const declared = await relayIntroCallAnswer(
      post(valid, { 'content-length': String(TOUR_FOCUS_MAX_BODY_BYTES + 1) }),
      relayConfig()
    );
    assert.equal(declared.status, 400);
    assert.equal(calls.length, 0);
  });

  it('refuses a page on another origin, and admits this one', async () => {
    const calls = stubFetch({ status: 200 });
    const refused: Record<string, string>[] = [
      { 'sec-fetch-site': 'cross-site' },
      { 'sec-fetch-site': 'same-site', origin: 'https://www.example.test' },
      { origin: 'https://evil.example' },
      { origin: 'not a url' },
    ];
    for (const headers of refused) {
      const res = await relayIntroCallAnswer(post(valid, headers), relayConfig());
      assert.deepEqual(
        await result(res),
        { status: 403, body: { ok: false, error: 'forbidden' } },
        JSON.stringify(headers)
      );
    }
    assert.equal(calls.length, 0);

    const admitted: Record<string, string>[] = [
      { 'sec-fetch-site': 'same-origin', origin: 'https://www.example.test' },
      { origin: 'https://www.example.test' },
      {},
    ];
    for (const headers of admitted) {
      const res = await relayIntroCallAnswer(post(valid, headers), relayConfig());
      assert.equal(res.status, 200, JSON.stringify(headers));
    }
    assert.equal(calls.length, admitted.length);
  });

  it('refuses a body that is not sent as JSON, so a cross-site simple request cannot reach it', async () => {
    const calls = stubFetch({ status: 200 });
    for (const type of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data']) {
      const res = await relayIntroCallAnswer(post(valid, { 'Content-Type': type }), relayConfig());
      assert.deepEqual(await result(res), { status: 415, body: { ok: false, error: 'invalid' } }, type);
    }
    assert.equal(calls.length, 0);
  });

  it('stops a flood from one address before it reaches the platform, and malformed requests spend nothing', async () => {
    const calls = stubFetch({ status: 200 });
    const rateLimiter = createTourFocusRateLimiter();
    for (let i = 0; i < TOUR_FOCUS_RATE_MAX; i++) {
      const res = await relayIntroCallAnswer(post(valid), relayConfig({ rateLimiter }));
      assert.equal(res.status, 200);
    }
    const over = await relayIntroCallAnswer(post(valid), relayConfig({ rateLimiter }));
    assert.deepEqual(await result(over), { status: 429, body: { ok: false, error: 'rate_limited' } });
    assert.equal(calls.length, TOUR_FOCUS_RATE_MAX);

    const other = await relayIntroCallAnswer(post(valid), relayConfig({ rateLimiter, clientIp: '198.51.100.2' }));
    assert.equal(other.status, 200);

    const fresh = createTourFocusRateLimiter(1);
    await relayIntroCallAnswer(post('not json'), relayConfig({ rateLimiter: fresh }));
    const first = await relayIntroCallAnswer(post(valid), relayConfig({ rateLimiter: fresh }));
    assert.equal(first.status, 200);
  });

  it('caps sends from every address together, so forged addresses cannot get past it', async () => {
    const calls = stubFetch({ status: 200 });
    const globalRateLimiter = createTourFocusRateLimiter(3);
    const rateLimiter = createTourFocusRateLimiter();
    for (let i = 0; i < 3; i++) {
      const res = await relayIntroCallAnswer(
        post(valid),
        relayConfig({ rateLimiter, globalRateLimiter, clientIp: `198.51.100.${i}` })
      );
      assert.equal(res.status, 200);
    }
    const over = await relayIntroCallAnswer(
      post(valid),
      relayConfig({ rateLimiter, globalRateLimiter, clientIp: '198.51.100.99' })
    );
    assert.deepEqual(await result(over), { status: 429, body: { ok: false, error: 'rate_limited' } });
    assert.equal(calls.length, 3);
  });

  it('fails quietly when the platform is not configured', async () => {
    const calls = stubFetch({ status: 200 });
    for (const missing of [
      { apiUrl: undefined, secret: 'shh' },
      { apiUrl: config.apiUrl, secret: undefined },
    ]) {
      const res = await relayIntroCallAnswer(post(valid), missing);
      assert.deepEqual(await result(res), { status: 502, body: { ok: false, error: 'failed' } });
    }
    assert.equal(calls.length, 0);
  });
});
