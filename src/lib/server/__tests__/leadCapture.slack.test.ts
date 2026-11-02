/**
 * Slack noise control: repeat suppression and solicitation labeling.
 *
 * Run: node --import tsx --test src/lib/server/__tests__/leadCapture.slack.test.ts
 *
 * Both rules change only the Slack post. `sendToSlack` takes the webhook URL as
 * an argument because `import.meta.env` exists only inside the Astro build.
 * Each test uses its own email so the in-memory repeat map never leaks between
 * tests.
 */
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSlackPayload,
  isLikelySolicitation,
  sendToSlack,
  type EnrichedLead,
} from '../leadCapture';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const HEY_LENDING =
  'Hi, we provide IT firms like BreederHQ with fast access to $10K–$500K, at rates as low as 1% per month. ' +
  'Funding within 24 hours, no collateral. Open to a quick call this week?';

function captureSlack(): { bodies: any[] } {
  const bodies: any[] = [];
  globalThis.fetch = (async (_url: any, init: any) => {
    bodies.push(JSON.parse(init.body));
    return new Response('ok', { status: 200 });
  }) as typeof fetch;
  return { bodies };
}

function lead(over: Partial<EnrichedLead>): EnrichedLead {
  return { email: 'someone@example.com', name: 'Some One', ...over };
}

const URL = 'https://hooks.example.test/slack';
const T0 = Date.parse('2026-11-02T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

describe('repeat suppression', () => {
  it('posts the first submission and skips an identical repeat', async () => {
    const { bodies } = captureSlack();
    const l = lead({ email: 'dup1@example.com', message: HEY_LENDING });
    await sendToSlack(l, URL, T0);
    const second = await sendToSlack(l, URL, T0 + 1000);
    assert.equal(bodies.length, 1);
    // A skipped repeat is not a delivery, so it never masks a total failure in processLead.
    assert.equal(second, false);
  });

  it('a skipped repeat never counts as a delivery, so a submission no channel recorded is not reported received', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      return new Response('ok', { status: 200 });
    }) as typeof fetch;
    const l = lead({ email: 'dup0c@example.com', message: 'Skip is not delivery' });
    assert.equal(await sendToSlack(l, URL, T0), true);
    assert.equal(await sendToSlack(l, URL, T0 + 1000), false);
    assert.equal(calls, 1);
  });

  it('bounds a stalled webhook so an overlapping repeat is released and posts', async () => {
    let calls = 0;
    const signals: (AbortSignal | undefined)[] = [];
    globalThis.fetch = ((_url: any, init: any) => {
      calls++;
      signals.push(init.signal);
      if (calls === 1) {
        return new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(init.signal.reason));
        });
      }
      return Promise.resolve(new Response('ok', { status: 200 }));
    }) as typeof fetch;
    const realTimeout = AbortSignal.timeout;
    AbortSignal.timeout = ((ms: number) => realTimeout.call(AbortSignal, Math.min(ms, 30))) as typeof AbortSignal.timeout;
    try {
      const l = lead({ email: 'dup0d@example.com', message: 'Stalled webhook' });
      const results = await Promise.all([sendToSlack(l, URL, T0), sendToSlack(l, URL, T0)]);
      assert.equal(calls, 2);
      assert.ok(signals[0] instanceof AbortSignal);
      assert.deepEqual(results, [false, true]);
    } finally {
      AbortSignal.timeout = realTimeout;
    }
  });

  it('posts once when identical submissions overlap before the first post returns', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 20));
      return new Response('ok', { status: 200 });
    }) as typeof fetch;
    const l = lead({ email: 'dup0@example.com', message: 'Overlapping' });
    await Promise.all([sendToSlack(l, URL, T0), sendToSlack(l, URL, T0), sendToSlack(l, URL, T0)]);
    assert.equal(calls, 1);
  });

  it('an overlapping repeat posts itself when the first post fails, and is not counted as delivered meanwhile', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      const mine = calls;
      await new Promise((r) => setTimeout(r, 20));
      return mine === 1 ? new Response('nope', { status: 500 }) : new Response('ok', { status: 200 });
    }) as typeof fetch;
    const l = lead({ email: 'dup0b@example.com', message: 'Overlap then failure' });
    const results = await Promise.all([sendToSlack(l, URL, T0), sendToSlack(l, URL, T0)]);
    assert.equal(calls, 2);
    assert.deepEqual(results, [false, true]);
  });

  it('treats case, spacing and whitespace differences as the same message', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'dup2@example.com', message: 'Hello   there\n friend' }), URL, T0);
    await sendToSlack(lead({ email: ' DUP2@Example.com ', message: ' hello there friend ' }), URL, T0 + 1);
    assert.equal(bodies.length, 1);
  });

  it('posts a different message from the same email', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'dup3@example.com', message: 'First note' }), URL, T0);
    await sendToSlack(lead({ email: 'dup3@example.com', message: 'A different note' }), URL, T0 + 1);
    assert.equal(bodies.length, 2);
  });

  it('posts the same message from a different email', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'dup4a@example.com', message: 'Same words' }), URL, T0);
    await sendToSlack(lead({ email: 'dup4b@example.com', message: 'Same words' }), URL, T0 + 1);
    assert.equal(bodies.length, 2);
  });

  it('never treats an empty message as a repeat', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'dup5@example.com' }), URL, T0);
    await sendToSlack(lead({ email: 'dup5@example.com', message: '   ' }), URL, T0 + 1);
    await sendToSlack(lead({ email: 'dup5@example.com' }), URL, T0 + 2);
    assert.equal(bodies.length, 3);
  });

  it('posts again once seven days have passed', async () => {
    const { bodies } = captureSlack();
    const l = lead({ email: 'dup6@example.com', message: 'Still here' });
    await sendToSlack(l, URL, T0);
    await sendToSlack(l, URL, T0 + 7 * DAY - 1000);
    assert.equal(bodies.length, 1);
    await sendToSlack(l, URL, T0 + 7 * DAY);
    assert.equal(bodies.length, 2);
  });

  it('does not remember a post Slack refused, so the next one is tried', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      return calls === 1 ? new Response('nope', { status: 500 }) : new Response('ok', { status: 200 });
    }) as typeof fetch;
    const l = lead({ email: 'dup7@example.com', message: 'Retry me' });
    assert.equal(await sendToSlack(l, URL, T0), false);
    assert.equal(await sendToSlack(l, URL, T0 + 1), true);
    assert.equal(calls, 2);
  });
});

describe('solicitation labeling', () => {
  it('labels the loan pitch and keeps every field', () => {
    const l = lead({
      email: 'pitch@example.com',
      name: 'Pat Pitch',
      phone: '+15555550100',
      message: HEY_LENDING,
    });
    assert.equal(isLikelySolicitation(HEY_LENDING), true);
    const payload = buildSlackPayload(l, true);
    assert.equal(payload.blocks[0].text.text, 'Possible Solicitation');
    const rendered = JSON.stringify(payload);
    for (const v of ['Pat Pitch', 'pitch@example.com', '+15555550100', 'quick call this week']) {
      assert.ok(rendered.includes(v), `missing ${v}`);
    }
  });

  it('never carries a channel mention or urgency styling on a labeled post', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'pitch2@example.com', message: HEY_LENDING }), URL, T0);
    assert.equal(bodies.length, 1);
    const sent = JSON.stringify(bodies[0]);
    assert.ok(!sent.includes('<!here>'));
    assert.ok(!sent.includes('🚨'));
    assert.ok(!sent.includes('🎯'));
    assert.ok(sent.includes('Possible Solicitation'));
  });

  it('escapes Slack control syntax typed into any field, so a labeled post cannot alert', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(
      lead({
        email: 'pitch3@example.com',
        name: '<!here> Pat',
        company: '<!channel> Co',
        message: `${HEY_LENDING} <!here> & <@U123>`,
      }),
      URL,
      T0
    );
    const sent = JSON.stringify(bodies[0]);
    assert.ok(!sent.includes('<!here>'));
    assert.ok(!sent.includes('<!channel>'));
    assert.ok(!sent.includes('<@U123>'));
    assert.ok(sent.includes('&lt;!here&gt;'));
    assert.ok(sent.includes('&amp;'));
  });

  it('keeps the normal alert for an unlabeled lead', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'real@example.com', message: 'I breed Labradors.' }), URL, T0);
    assert.ok(bodies[0].text.startsWith('<!here> 🚨 New Lead Submitted'));
    assert.equal(bodies[0].blocks[0].text.text, '🎯 New Lead Submitted!');
  });

  it('does not label a breeder who mentions funding or payment plans', () => {
    const msgs = [
      'Do you offer payment plans or financing so buyers can reserve a litter? We have a waitlist.',
      'We are a small kennel looking for business financing options for our breeding program, rates as low as possible please.',
      'Can we set up a quick call this week about moving our puppy records over?',
      'I run a cattery and need funding within 24 hours for a vet bill, any advice?',
    ];
    for (const m of msgs) assert.equal(isLikelySolicitation(m), false, m);
  });

  it('does not label a short or empty message, or a plain question', () => {
    for (const m of [undefined, '', '   ', 'Hello', 'Is this live yet?', 'Open to a quick call this week?']) {
      assert.equal(isLikelySolicitation(m), false, String(m));
    }
  });

  it('labels other plain vendor pitches', () => {
    assert.equal(
      isLikelySolicitation('We specialize in SEO and link building for software companies like BreederHQ.'),
      true
    );
    assert.equal(
      isLikelySolicitation('Our team can provide web design and mobile app development at low cost.'),
      true
    );
  });

  it('does not label a bare service word without an offer of it', () => {
    assert.equal(isLikelySolicitation('Does your site help with SEO for my own website?'), false);
  });
});
