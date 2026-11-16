/**
 * The Founders tour "one thing" answer: its cleaning, its length rule, and the
 * relay route's checks and its call to the platform.
 *
 * Run: node --import tsx --test src/lib/server/__tests__/tourFocus.test.ts
 */
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { postTourFocus } from '../leadCapture';
import {
  TOUR_FOCUS_GLOBAL_RATE_MAX,
  TOUR_FOCUS_MAX_BODY_BYTES,
  TOUR_FOCUS_RATE_MAX,
  TOUR_FOCUS_RATE_WINDOW_MS,
  createTourFocusRateLimiter,
  relayTourFocus,
} from '../tourFocusRelay';
import {
  TOUR_FOCUS_MAX_CHARS,
  normalizeTourFocusAnswer,
  tourFocusLength,
  tourFocusProblem,
} from '../../tourFocus';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const config = { apiUrl: 'https://api.example.test/api/v1', secret: 'shh' };

function stubFetch(status: number | Error): { url: string; init: RequestInit }[] {
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    if (status instanceof Error) throw status;
    return new Response('{}', { status });
  }) as typeof fetch;
  return calls;
}

describe('tour focus answer rules', () => {
  it('counts code points, not UTF-16 units', () => {
    const emoji = '\u{1F415}'.repeat(TOUR_FOCUS_MAX_CHARS);
    assert.equal(emoji.length, TOUR_FOCUS_MAX_CHARS * 2);
    assert.equal(tourFocusLength(emoji), TOUR_FOCUS_MAX_CHARS);
    assert.equal(tourFocusProblem(emoji), null);
    assert.equal(tourFocusProblem(emoji + 'a'), 'too_long');
  });

  it('cleans before it counts', () => {
    assert.equal(normalizeTourFocusAnswer('  a\r\nb\rc\u0000\u0007  '), 'a\nb\nc');
    assert.equal(tourFocusProblem('  \r\n\u0000  '), 'empty');
    assert.equal(tourFocusProblem('x'.repeat(TOUR_FOCUS_MAX_CHARS)), null);
  });
});

describe('postTourFocus', () => {
  it('sends the secret and the answer to the platform route', async () => {
    const calls = stubFetch(200);
    assert.equal(await postTourFocus({ submissionKey: 'k1', answer: 'Heat tracking' }, config), 'ok');
    assert.equal(calls[0].url, 'https://api.example.test/api/v1/marketing-leads/tour-focus');
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers['x-bhq-lead-secret'], 'shh');
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
      submissionKey: 'k1',
      answer: 'Heat tracking',
    });
  });

  it('passes 400 and 404 through and turns everything else into failed', async () => {
    stubFetch(400);
    assert.equal(await postTourFocus({ submissionKey: 'k', answer: 'a' }, config), 'invalid');
    stubFetch(404);
    assert.equal(await postTourFocus({ submissionKey: 'k', answer: 'a' }, config), 'not_found');
    for (const status of [401, 403, 429, 500, 503]) {
      stubFetch(status);
      assert.equal(await postTourFocus({ submissionKey: 'k', answer: 'a' }, config), 'failed');
    }
    stubFetch(new Error('network down'));
    assert.equal(await postTourFocus({ submissionKey: 'k', answer: 'a' }, config), 'failed');
  });

  it('never logs the answer', async () => {
    const logged: string[] = [];
    const realLog = console.log;
    const realError = console.error;
    console.log = (...a: unknown[]) => void logged.push(a.join(' '));
    console.error = (...a: unknown[]) => void logged.push(a.join(' '));
    try {
      for (const status of [404, 500, new Error('boom SECRET-ANSWER')] as const) {
        stubFetch(status);
        await postTourFocus({ submissionKey: 'k', answer: 'SECRET-ANSWER' }, config);
      }
    } finally {
      console.log = realLog;
      console.error = realError;
    }
    assert.ok(logged.length > 0);
    assert.ok(logged.every((line) => !line.includes('SECRET-ANSWER')));
  });
});

describe('relayTourFocus', () => {
  function post(body: string, headers: Record<string, string> = {}): Request {
    return new Request('https://www.example.test/api/tour-focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    });
  }
  const valid = JSON.stringify({ submissionKey: ' k1 ', answer: '  Heat\r\ntracking\u0007 ' });

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

  it('relays the cleaned answer and the trimmed key, and answers 200 on a save', async () => {
    const calls = stubFetch(200);
    const res = await relayTourFocus(post(valid), relayConfig());
    assert.deepEqual(await result(res), { status: 200, body: { ok: true } });
    assert.equal(calls.length, 1);
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
      submissionKey: 'k1',
      answer: 'Heat\ntracking',
    });
  });

  it('maps the platform outcome to the page', async () => {
    const cases: [number | Error, number, string][] = [
      [400, 400, 'invalid'],
      [404, 404, 'not_found'],
      [401, 502, 'failed'],
      [500, 502, 'failed'],
      [new Error('network down'), 502, 'failed'],
    ];
    for (const [platform, status, error] of cases) {
      stubFetch(platform);
      const res = await relayTourFocus(post(valid), relayConfig());
      assert.deepEqual(await result(res), { status, body: { ok: false, error } });
    }
  });

  it('refuses what the platform would refuse, without calling it', async () => {
    const calls = stubFetch(200);
    const bodies = [
      'not json',
      'null',
      '[]',
      JSON.stringify({ answer: 'a' }),
      JSON.stringify({ submissionKey: '   ', answer: 'a' }),
      JSON.stringify({ submissionKey: 'k'.repeat(129), answer: 'a' }),
      // 100 code points but 200 UTF-16 units: the platform counts units.
      JSON.stringify({ submissionKey: '\u{1F415}'.repeat(100), answer: 'a' }),
      JSON.stringify({ submissionKey: 'k', answer: 5 }),
      JSON.stringify({ submissionKey: 'k', answer: ' \r\n\u0000 ' }),
      JSON.stringify({ submissionKey: 'k', answer: 'x'.repeat(TOUR_FOCUS_MAX_CHARS + 1) }),
    ];
    for (const body of bodies) {
      const res = await relayTourFocus(post(body), relayConfig());
      assert.deepEqual(await result(res), { status: 400, body: { ok: false, error: 'invalid' } }, body);
    }
    assert.equal(calls.length, 0);
  });

  it('accepts the longest key and answer the platform accepts', async () => {
    const calls = stubFetch(200);
    const body = JSON.stringify({
      submissionKey: 'k'.repeat(128),
      answer: '\u{1F415}'.repeat(TOUR_FOCUS_MAX_CHARS),
    });
    const res = await relayTourFocus(post(body), relayConfig());
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
  });

  it('reads no more than 16 KB of body', async () => {
    const calls = stubFetch(200);
    const padded = JSON.stringify({
      submissionKey: 'k',
      answer: 'a',
      pad: 'x'.repeat(TOUR_FOCUS_MAX_BODY_BYTES),
    });
    // Without a content-length header the streamed read stops at the cap.
    const res = await relayTourFocus(post(padded), relayConfig());
    assert.deepEqual(await result(res), { status: 400, body: { ok: false, error: 'invalid' } });
    const declared = await relayTourFocus(
      post(valid, { 'content-length': String(TOUR_FOCUS_MAX_BODY_BYTES + 1) }),
      relayConfig()
    );
    assert.equal(declared.status, 400);
    assert.equal(calls.length, 0);
  });

  it('refuses a page on another origin, and admits this one', async () => {
    const calls = stubFetch(200);
    const refused: Record<string, string>[] = [
      { 'sec-fetch-site': 'cross-site' },
      { 'sec-fetch-site': 'same-site', origin: 'https://www.example.test' },
      { origin: 'https://evil.example' },
      { origin: 'not a url' },
    ];
    for (const headers of refused) {
      const res = await relayTourFocus(post(valid, headers), relayConfig());
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
      { origin: 'https://www.breederhq.com', 'x-forwarded-host': 'www.breederhq.com' },
      {},
    ];
    for (const headers of admitted) {
      const res = await relayTourFocus(post(valid, headers), relayConfig());
      assert.equal(res.status, 200, JSON.stringify(headers));
    }
    assert.equal(calls.length, admitted.length);
  });

  it('refuses a body that is not sent as JSON, so a cross-site simple request cannot reach it', async () => {
    const calls = stubFetch(200);
    for (const type of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data']) {
      const res = await relayTourFocus(post(valid, { 'Content-Type': type }), relayConfig());
      assert.deepEqual(await result(res), { status: 415, body: { ok: false, error: 'invalid' } }, type);
    }
    const charset = await relayTourFocus(
      post(valid, { 'Content-Type': 'application/json; charset=utf-8' }),
      relayConfig()
    );
    assert.equal(charset.status, 200);
    assert.equal(calls.length, 1);
  });

  it('stops a flood from one address before it reaches the platform', async () => {
    const calls = stubFetch(200);
    const rateLimiter = createTourFocusRateLimiter();
    for (let i = 0; i < TOUR_FOCUS_RATE_MAX; i++) {
      const res = await relayTourFocus(post(valid), relayConfig({ rateLimiter }));
      assert.equal(res.status, 200);
    }
    const over = await relayTourFocus(post(valid), relayConfig({ rateLimiter }));
    assert.deepEqual(await result(over), { status: 429, body: { ok: false, error: 'rate_limited' } });
    assert.equal(calls.length, TOUR_FOCUS_RATE_MAX);

    // Another address is not held back by the first one's flood.
    const other = await relayTourFocus(
      post(valid),
      relayConfig({ rateLimiter, clientIp: '198.51.100.2' })
    );
    assert.equal(other.status, 200);

    // Malformed requests spend nothing.
    const fresh = createTourFocusRateLimiter(1);
    await relayTourFocus(post('not json'), relayConfig({ rateLimiter: fresh }));
    const first = await relayTourFocus(post(valid), relayConfig({ rateLimiter: fresh }));
    assert.equal(first.status, 200);
  });

  it('caps sends from every address together, so forged addresses cannot get past it', async () => {
    const calls = stubFetch(200);
    const globalRateLimiter = createTourFocusRateLimiter(3);
    const rateLimiter = createTourFocusRateLimiter();
    for (let i = 0; i < 3; i++) {
      const res = await relayTourFocus(
        post(valid),
        relayConfig({ rateLimiter, globalRateLimiter, clientIp: `198.51.100.${i}` })
      );
      assert.equal(res.status, 200);
    }
    const over = await relayTourFocus(
      post(valid),
      relayConfig({ rateLimiter, globalRateLimiter, clientIp: '198.51.100.99' })
    );
    assert.deepEqual(await result(over), { status: 429, body: { ok: false, error: 'rate_limited' } });
    assert.equal(calls.length, 3);

    // One address over its own brake does not spend the shared allowance.
    const shared = createTourFocusRateLimiter(2);
    const single = createTourFocusRateLimiter(1);
    await relayTourFocus(post(valid), relayConfig({ rateLimiter: single, globalRateLimiter: shared }));
    const held = await relayTourFocus(
      post(valid),
      relayConfig({ rateLimiter: single, globalRateLimiter: shared })
    );
    assert.equal(held.status, 429);
    const someoneElse = await relayTourFocus(
      post(valid),
      relayConfig({ rateLimiter: single, globalRateLimiter: shared, clientIp: '192.0.2.5' })
    );
    assert.equal(someoneElse.status, 200);
  });

  it('the flood brake forgets a send after its window and stays bounded', () => {
    const limiter = createTourFocusRateLimiter(2, TOUR_FOCUS_RATE_WINDOW_MS, 4);
    assert.equal(limiter('a', 0), false);
    assert.equal(limiter('a', 1), false);
    assert.equal(limiter('a', 2), true);
    assert.equal(limiter('a', TOUR_FOCUS_RATE_WINDOW_MS + 2), false);

    // Addresses past the cap evict the oldest, so a forged-address flood
    // cannot keep a real address limited forever or grow the map unbounded.
    const capped = createTourFocusRateLimiter(1, TOUR_FOCUS_RATE_WINDOW_MS, 4);
    assert.equal(capped('first', 0), false);
    assert.equal(capped('first', 1), true);
    for (let i = 0; i < 8; i++) capped(`forged-${i}`, 10 + i);
    assert.equal(capped('first', 100), false);
  });

  it('fails quietly when the platform is not configured', async () => {
    const calls = stubFetch(200);
    for (const missing of [
      { apiUrl: undefined, secret: 'shh' },
      { apiUrl: config.apiUrl, secret: undefined },
    ]) {
      const res = await relayTourFocus(post(valid), missing);
      assert.deepEqual(await result(res), { status: 502, body: { ok: false, error: 'failed' } });
    }
    assert.equal(calls.length, 0);
  });
});
