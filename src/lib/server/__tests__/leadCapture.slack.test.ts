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

const HEY_LENDING_2 =
  'Hi Aaron, Businesses like BreederHQ typically qualify for $100K–$500K at about 1% per month to fund their growth. ' +
  "Want to see what that could look like for BreederHQ? Just reply and we'll find 10 minutes to walk you through it. " +
  'Daniela Brown HeyLending | daniela@heylending.com';

function captureSlack(): { bodies: any[] } {
  const bodies: any[] = [];
  globalThis.fetch = (async (_url: any, init: any) => {
    bodies.push(JSON.parse(init.body));
    return new Response('ok', { status: 200 });
  }) as typeof fetch;
  return { bodies };
}

function lead(over: Partial<EnrichedLead>): EnrichedLead {
  return { email: 'someone@gmail.com', name: 'Some One', ...over };
}

const URL = 'https://hooks.example.test/slack';
const T0 = Date.parse('2026-11-02T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

describe('repeat suppression', () => {
  it('posts the first submission and skips an identical repeat', async () => {
    const { bodies } = captureSlack();
    const l = lead({ email: 'dup1@gmail.com', message: HEY_LENDING });
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
    const l = lead({ email: 'dup0c@gmail.com', message: 'Skip is not delivery' });
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
      const l = lead({ email: 'dup0d@gmail.com', message: 'Stalled webhook' });
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
    const l = lead({ email: 'dup0@gmail.com', message: 'Overlapping' });
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
    const l = lead({ email: 'dup0b@gmail.com', message: 'Overlap then failure' });
    const results = await Promise.all([sendToSlack(l, URL, T0), sendToSlack(l, URL, T0)]);
    assert.equal(calls, 2);
    assert.deepEqual(results, [false, true]);
  });

  it('treats case, spacing and whitespace differences as the same message', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'dup2@gmail.com', message: 'Hello   there\n friend' }), URL, T0);
    await sendToSlack(lead({ email: ' DUP2@GMail.com ', message: ' hello there friend ' }), URL, T0 + 1);
    assert.equal(bodies.length, 1);
  });

  it('posts a different message from the same email', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'dup3@gmail.com', message: 'First note' }), URL, T0);
    await sendToSlack(lead({ email: 'dup3@gmail.com', message: 'A different note' }), URL, T0 + 1);
    assert.equal(bodies.length, 2);
  });

  it('posts the same message from a different email', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'dup4a@gmail.com', message: 'Same words' }), URL, T0);
    await sendToSlack(lead({ email: 'dup4b@gmail.com', message: 'Same words' }), URL, T0 + 1);
    assert.equal(bodies.length, 2);
  });

  it('never treats an empty message as a repeat', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'dup5@gmail.com' }), URL, T0);
    await sendToSlack(lead({ email: 'dup5@gmail.com', message: '   ' }), URL, T0 + 1);
    await sendToSlack(lead({ email: 'dup5@gmail.com' }), URL, T0 + 2);
    assert.equal(bodies.length, 3);
  });

  it('posts again once seven days have passed', async () => {
    const { bodies } = captureSlack();
    const l = lead({ email: 'dup6@gmail.com', message: 'Still here' });
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
    const l = lead({ email: 'dup7@gmail.com', message: 'Retry me' });
    assert.equal(await sendToSlack(l, URL, T0), false);
    assert.equal(await sendToSlack(l, URL, T0 + 1), true);
    assert.equal(calls, 2);
  });
});

describe('solicitation labeling', () => {
  it('labels the loan pitch and keeps every field', () => {
    const l = lead({
      email: 'pitch@gmail.com',
      name: 'Pat Pitch',
      phone: '+15555550100',
      message: HEY_LENDING,
    });
    assert.equal(isLikelySolicitation(HEY_LENDING), true);
    const payload = buildSlackPayload(l, true);
    assert.equal(payload.blocks[0].text.text, 'Possible Solicitation');
    const rendered = JSON.stringify(payload);
    for (const v of ['Pat Pitch', 'pitch@gmail.com', '+15555550100', 'quick call this week']) {
      assert.ok(rendered.includes(v), `missing ${v}`);
    }
  });

  it('never carries a channel mention or urgency styling on a labeled post', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'pitch2@gmail.com', message: HEY_LENDING }), URL, T0);
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
        email: 'pitch3@gmail.com',
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
    await sendToSlack(lead({ email: 'real@gmail.com', message: 'I breed Labradors.' }), URL, T0);
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

  it('labels both HeyLending pitches', () => {
    assert.equal(isLikelySolicitation(HEY_LENDING_2), true);
    assert.equal(isLikelySolicitation(HEY_LENDING), true);
  });

  it('labels each wider pitch phrase on its own', () => {
    for (const m of [
      'Pre-approved for $10k-$500k today.',
      'Our rate is 1.5% monthly with no hidden fees.',
      'We can help fund your growth this year.',
      'You may qualify for $250,000 with one application.',
      'Companies like yours can hop on a call with us.',
      'Startups like BreederHQ: just reply and we will send details.',
    ]) {
      assert.equal(isLikelySolicitation(m), true, m);
    }
  });

  it('does not label breeders or plain questions that brush the wider phrases', () => {
    for (const m of [
      'Could I set up a payment plan of 5% per month for a puppy?',
      'Can you walk me through pricing?',
      'Do you offer discounts for businesses like ours?',
      'Deposits of $200-$500 per litter, is that supported on the waitlist?',
      'We charge $50 to $75 for the visit. Does the app handle that?',
      'Do businesses like yours have time to talk this week?',
    ]) {
      assert.equal(isLikelySolicitation(m), false, m);
    }
  });
});

describe('quiet company domains', () => {
  it('skips a later sender from a domain that sent a labeled pitch', async () => {
    const { bodies } = captureSlack();
    const first = await sendToSlack(lead({ email: 'someone@heylending.com', message: HEY_LENDING }), URL, T0);
    assert.equal(first, true);
    assert.ok(JSON.stringify(bodies[0]).includes('Possible Solicitation'));
    const second = await sendToSlack(
      lead({ email: 'Daniela@HeyLending.com', name: 'Daniela Brown', message: HEY_LENDING_2 }),
      URL,
      T0 + DAY
    );
    assert.equal(second, false);
    assert.equal(bodies.length, 1);
  });

  it('forgets the domain after ninety days', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'a@forgetful.example', message: HEY_LENDING }), URL, T0);
    await sendToSlack(lead({ email: 'b@forgetful.example', message: HEY_LENDING_2 }), URL, T0 + 91 * DAY);
    assert.equal(bodies.length, 2);
  });

  it('never lets a free mail provider quiet later senders', async () => {
    const { bodies } = captureSlack();
    for (const d of ['gmail.com', 'GMAIL.com', 'yahoo.com', 'outlook.com', 'comcast.net']) {
      await sendToSlack(lead({ email: `pitch@${d}`, message: HEY_LENDING }), URL, T0);
    }
    const before = bodies.length;
    await sendToSlack(lead({ email: 'someone.else@gmail.com', message: 'Is the founders waitlist open?' }), URL, T0);
    await sendToSlack(lead({ email: 'another@gmail.com', message: HEY_LENDING_2 }), URL, T0 + 1);
    assert.equal(bodies.length, before + 2);
  });

  it('still posts a breeder writing from a remembered domain', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'x@pitchco.example', message: HEY_LENDING }), URL, T0);
    await sendToSlack(
      lead({ email: 'owner@pitchco.example', message: 'I run a kennel and want to join the waitlist.' }),
      URL,
      T0 + 1000
    );
    assert.equal(bodies.length, 2);
    assert.ok(bodies[1].text.startsWith('<!here>'));
  });

  it('never records the domain of an unlabeled first post', async () => {
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'x@honest.example', message: 'Is this live yet?' }), URL, T0);
    await sendToSlack(lead({ email: 'y@honest.example', message: 'Another plain note.' }), URL, T0 + 1000);
    assert.equal(bodies.length, 2);
  });

  it('posts once when distinct senders from one new domain overlap', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 20));
      return new Response('ok', { status: 200 });
    }) as typeof fetch;
    const results = await Promise.all([
      sendToSlack(lead({ email: 'a@burst.example', message: HEY_LENDING }), URL, T0),
      sendToSlack(lead({ email: 'b@burst.example', message: HEY_LENDING_2 }), URL, T0),
      sendToSlack(lead({ email: 'c@burst.example', message: HEY_LENDING }), URL, T0),
    ]);
    assert.equal(calls, 1);
    assert.deepEqual(results, [true, false, false]);
  });

  it('lets the next sender post when the in-flight labeled post fails', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 20));
      return new Response('no', { status: calls === 1 ? 500 : 200 });
    }) as typeof fetch;
    const results = await Promise.all([
      sendToSlack(lead({ email: 'a@burstfail.example', message: HEY_LENDING }), URL, T0),
      sendToSlack(lead({ email: 'b@burstfail.example', message: HEY_LENDING_2 }), URL, T0),
    ]);
    assert.equal(calls, 2);
    assert.deepEqual(results, [false, true]);
  });

  it('does not record the domain when Slack refused the labeled post', async () => {
    globalThis.fetch = (async () => new Response('no', { status: 500 })) as typeof fetch;
    await sendToSlack(lead({ email: 'x@refused.example', message: HEY_LENDING }), URL, T0);
    const { bodies } = captureSlack();
    await sendToSlack(lead({ email: 'y@refused.example', message: HEY_LENDING_2 }), URL, T0 + 1000);
    assert.equal(bodies.length, 1);
  });
});
