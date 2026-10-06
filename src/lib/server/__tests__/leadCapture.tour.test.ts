/**
 * Tour status in the New Lead alert, and the confirmation email's timeline log.
 *
 * Run: node --import tsx --test src/lib/server/__tests__/leadCapture.tour.test.ts
 *
 * The functions under test take their configuration as arguments, because
 * `import.meta.env` exists only inside the Astro build. `fetch` is replaced per
 * test.
 */
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLeadAlertHtml,
  describeTour,
  parseTourStatus,
  postApplicantEmailLog,
  postLeadToPlatform,
  sendWaitlistConfirmation,
  type EnrichedLead,
  type TourStatus,
} from '../leadCapture';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

// 2026-10-06 09:33 UTC is 4:33 AM in Chicago (CDT, UTC-5).
const NOW = new Date('2026-10-06T06:00:00.000Z');

const waitlistLead: EnrichedLead = {
  email: 'applicant@example.com',
  name: 'Jo Breeder',
  source: 'launch_waitlist',
  submission_key: 'sub-key-1',
};

function tour(overrides: Partial<TourStatus>): TourStatus {
  return {
    status: 'not_booked',
    bookedStartTime: null,
    reminderDueAt: null,
    reminderSkipReason: null,
    ...overrides,
  };
}

interface Call {
  url: string;
  init: RequestInit;
}

/** Replace fetch with a handler; returns the recorded calls. */
function stubFetch(handler: (url: string, init: RequestInit) => Promise<Response>): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;
  return calls;
}

/** A fetch that never answers and rejects only when its signal aborts. */
function hangUntilAborted(_url: string, init: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init.signal;
    if (!signal) return; // never settles; the test would time out, which is the failure
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('describeTour: one line per variant', () => {
  it('booked with a future start: already booked for that time', () => {
    assert.equal(
      describeTour(tour({ status: 'booked', bookedStartTime: '2026-10-08T20:00:00.000Z', reminderSkipReason: 'booked' }), NOW),
      'Already booked for Thu Oct 8, 3:00 PM CT.'
    );
  });

  it('booked with a past start: toured on that date', () => {
    assert.equal(
      describeTour(tour({ status: 'booked', bookedStartTime: '2026-09-18T15:00:00.000Z', reminderSkipReason: 'booked' }), NOW),
      'Toured on Fri Sep 18.'
    );
  });

  it('booked with a past start in an earlier year: the year is shown', () => {
    assert.equal(
      describeTour(tour({ status: 'booked', bookedStartTime: '2025-09-18T15:00:00.000Z', reminderSkipReason: 'booked' }), NOW),
      'Toured on Thu Sep 18, 2025.'
    );
  });

  it('not booked with a reminder due: names the reminder time in Central', () => {
    assert.equal(
      describeTour(tour({ reminderDueAt: '2026-10-06T09:33:00.000Z' }), NOW),
      "Not booked yet. If they haven't booked by Tue Oct 6, 4:33 AM CT, they'll get one reminder email with their booking link."
    );
  });

  it('a winter time is still labeled CT (CST, UTC-6)', () => {
    assert.equal(
      describeTour(tour({ reminderDueAt: '2026-12-01T18:05:00.000Z' }), NOW),
      "Not booked yet. If they haven't booked by Tue Dec 1, 12:05 PM CT, they'll get one reminder email with their booking link."
    );
  });

  it('closed', () => {
    assert.equal(
      describeTour(tour({ reminderSkipReason: 'closed' }), NOW),
      'Not booked yet. No reminder will be sent: this application is closed.'
    );
  });

  it('recent reminder', () => {
    assert.equal(
      describeTour(tour({ reminderSkipReason: 'recent_reminder' }), NOW),
      'Not booked yet. No reminder will be sent: they already got one this week.'
    );
  });

  it('superseded', () => {
    assert.equal(
      describeTour(tour({ reminderSkipReason: 'superseded' }), NOW),
      'Not booked yet. No reminder will be sent: a newer application from them is pending.'
    );
  });

  it('not scheduled', () => {
    assert.equal(
      describeTour(tour({ reminderSkipReason: 'not_scheduled' }), NOW),
      'Not booked yet. No reminder is scheduled for this application.'
    );
  });

  it('tour absent: status unavailable, with no booking claim', () => {
    assert.equal(describeTour(undefined, NOW), 'Tour status unavailable.');
  });
});

describe('parseTourStatus: only the documented shape is accepted', () => {
  it('accepts each valid shape and copies only the four fields', () => {
    const parsed = parseTourStatus({
      status: 'not_booked',
      bookedStartTime: null,
      reminderDueAt: '2026-10-06T09:33:00.000Z',
      reminderSkipReason: null,
      extra: 'ignored',
    });
    assert.deepEqual(parsed, {
      status: 'not_booked',
      bookedStartTime: null,
      reminderDueAt: '2026-10-06T09:33:00.000Z',
      reminderSkipReason: null,
    });
    for (const reason of ['booked', 'closed', 'recent_reminder', 'superseded', 'not_scheduled'] as const) {
      assert.ok(parseTourStatus(tour({ reminderSkipReason: reason })), reason);
    }
  });

  it('accepts real instants: a leap day, an explicit offset, no seconds', () => {
    for (const due of ['2028-02-29T09:33:00.000Z', '2026-10-06T04:33:00-05:00', '2026-10-06T09:33Z']) {
      assert.ok(parseTourStatus(tour({ reminderDueAt: due })), due);
    }
  });

  const malformed: [string, unknown][] = [
    ['undefined (an API that predates the field)', undefined],
    ['null', null],
    ['an array', []],
    ['a string', 'booked'],
    ['an unknown status', { ...tour({ reminderSkipReason: 'closed' }), status: 'pending' }],
    ['a missing field', { status: 'not_booked', bookedStartTime: null, reminderSkipReason: 'closed' }],
    ['an unknown reason', tour({ reminderSkipReason: 'later' as never })],
    ['a non-ISO time', tour({ reminderDueAt: 'tomorrow' })],
    ['a time without an offset', tour({ reminderDueAt: '2026-10-06T09:33:00' })],
    ['a numeric time', { ...tour({}), reminderDueAt: 1759743180000 }],
    ['a nonexistent date (Feb 31)', tour({ reminderDueAt: '2026-02-31T09:33:00Z' })],
    ['a non-leap Feb 29', tour({ reminderDueAt: '2027-02-29T09:33:00Z' })],
    ['hour 24', tour({ reminderDueAt: '2026-10-06T24:00:00Z' })],
    ['minute 60', tour({ reminderDueAt: '2026-10-06T09:60:00Z' })],
    ['second 60', tour({ reminderDueAt: '2026-10-06T09:33:60Z' })],
    ['an out-of-range offset', tour({ reminderDueAt: '2026-10-06T09:33:00+25:00' })],
    ['a nonexistent booked start', tour({ status: 'booked', bookedStartTime: '2026-04-31T15:00:00.000Z', reminderSkipReason: 'booked' })],
    ['not booked with neither a due time nor a reason', tour({})],
  ];
  for (const [label, value] of malformed) {
    it(`rejects ${label}`, () => {
      assert.equal(parseTourStatus(value), undefined);
    });
  }
});

describe('buildLeadAlertHtml: Tour section', () => {
  it('a launch_waitlist alert carries the Tour section', () => {
    const html = buildLeadAlertHtml(waitlistLead, tour({ reminderSkipReason: 'closed' }), NOW);
    assert.match(html, /<h3>Tour:<\/h3>/);
    assert.match(html, /No reminder will be sent: this application is closed\./);
  });

  it('an absent tour renders "Tour status unavailable."', () => {
    const html = buildLeadAlertHtml(waitlistLead, undefined, NOW);
    assert.match(html, /<p>Tour status unavailable\.<\/p>/);
    assert.doesNotMatch(html, /booked for|Toured on/);
  });

  it('the line is escaped like every other interpolated value', () => {
    const html = buildLeadAlertHtml(waitlistLead, tour({ reminderDueAt: '2026-10-06T09:33:00.000Z' }), NOW);
    assert.match(html, /If they haven&#39;t booked by Tue Oct 6, 4:33 AM CT, they&#39;ll get one reminder/);
  });

  it('other sources have no Tour section', () => {
    const html = buildLeadAlertHtml({ ...waitlistLead, source: 'lets_connect' }, undefined, NOW);
    assert.doesNotMatch(html, /Tour/);
  });
});

describe('postLeadToPlatform: tour comes only from a 2xx with a valid object', () => {
  const config = { apiUrl: 'https://api.test/api/v1', secret: 's3cret' };

  it('a 2xx with a valid tour returns it', async () => {
    const t = tour({ reminderDueAt: '2026-10-06T09:33:00.000Z' });
    const calls = stubFetch(async () => json(200, { ok: true, leadId: 54, tour: t }));
    const result = await postLeadToPlatform(waitlistLead, config);
    assert.deepEqual(result, { ok: true, tour: t });
    assert.equal(calls[0].url, 'https://api.test/api/v1/marketing-leads');
  });

  it('a 2xx without tour (the current prod API) is recorded with no tour', async () => {
    stubFetch(async () => json(200, { ok: true, leadId: 54 }));
    assert.deepEqual(await postLeadToPlatform(waitlistLead, config), { ok: true });
  });

  it('a 2xx with a malformed tour is recorded with no tour', async () => {
    stubFetch(async () => json(200, { ok: true, tour: { status: 'booked' } }));
    assert.deepEqual(await postLeadToPlatform(waitlistLead, config), { ok: true });
  });

  it('a 2xx with an unreadable body is still recorded', async () => {
    stubFetch(async () => new Response('not json', { status: 200 }));
    assert.deepEqual(await postLeadToPlatform(waitlistLead, config), { ok: true });
  });

  it('a non-2xx ignores any tour in the body', async () => {
    stubFetch(async () => json(500, { tour: tour({ reminderSkipReason: 'closed' }) }));
    assert.deepEqual(await postLeadToPlatform(waitlistLead, config), { ok: false });
  });

  it('a timeout returns unrecorded with no tour, within the bound, and the alert says unavailable', async () => {
    stubFetch(hangUntilAborted);
    const started = Date.now();
    const result = await postLeadToPlatform(waitlistLead, { ...config, timeoutMs: 50 });
    assert.ok(Date.now() - started < 2000, 'returned within the bound');
    assert.deepEqual(result, { ok: false });
    assert.match(buildLeadAlertHtml(waitlistLead, result.tour, NOW), /<p>Tour status unavailable\.<\/p>/);
  });
});

describe('postApplicantEmailLog: never throws, never waits past its bound', () => {
  const config = { apiUrl: 'https://api.test/api/v1', secret: 's3cret' };
  const entry = {
    submissionKey: 'sub-key-1',
    kind: 'application_confirmation' as const,
    subject: 'Next step: pick your tour time, Jo',
    status: 'sent' as const,
  };

  it('a 404 (an API without the endpoint) is ignored', async () => {
    const calls = stubFetch(async () => new Response('', { status: 404 }));
    await assert.doesNotReject(postApplicantEmailLog(entry, config));
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.test/api/v1/marketing-leads/email-log');
  });

  it('a network error is ignored', async () => {
    stubFetch(async () => {
      throw new TypeError('fetch failed');
    });
    await assert.doesNotReject(postApplicantEmailLog(entry, config));
  });

  it('a hang is cut off by the timeout', async () => {
    stubFetch(hangUntilAborted);
    const started = Date.now();
    await assert.doesNotReject(postApplicantEmailLog(entry, { ...config, timeoutMs: 50 }));
    assert.ok(Date.now() - started < 2000, 'returned within the bound');
  });
});

describe('sendWaitlistConfirmation: logs what Resend answered', () => {
  const platform = { apiUrl: 'https://api.test/api/v1', secret: 's3cret' };

  function route(
    resend: () => Promise<Response>,
    log: (url: string, init: RequestInit) => Promise<Response>
  ) {
    return stubFetch((url, init) => (url.startsWith('https://api.resend.com') ? resend() : log(url, init)));
  }

  it('sent: logs after Resend answers, with the insert secret, and a 404 does not fail it', async () => {
    const calls = route(async () => json(200, { id: 'em_1' }), async () => new Response('', { status: 404 }));
    const sent = await sendWaitlistConfirmation(waitlistLead, { resendApiKey: 're_key', platform });
    assert.equal(sent, true);
    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /^https:\/\/api\.resend\.com\/emails$/);
    assert.equal(calls[1].url, 'https://api.test/api/v1/marketing-leads/email-log');
    assert.equal((calls[1].init.headers as Record<string, string>)['x-bhq-lead-secret'], 's3cret');
    assert.deepEqual(JSON.parse(String(calls[1].init.body)), {
      submissionKey: 'sub-key-1',
      kind: 'application_confirmation',
      subject: 'Next step: pick your tour time, Jo',
      status: 'sent',
    });
  });

  it('a 4xx from Resend logs failed', async () => {
    const calls = route(async () => json(422, { message: 'invalid' }), async () => json(200, { ok: true }));
    const sent = await sendWaitlistConfirmation(waitlistLead, { resendApiKey: 're_key', platform });
    assert.equal(sent, false);
    assert.equal(JSON.parse(String(calls[1].init.body)).status, 'failed');
  });

  it('a 5xx or no answer from Resend logs nothing', async () => {
    let calls = route(async () => json(503, {}), async () => json(200, { ok: true }));
    assert.equal(await sendWaitlistConfirmation(waitlistLead, { resendApiKey: 're_key', platform }), false);
    assert.equal(calls.length, 1);

    calls = route(
      async () => {
        throw new TypeError('fetch failed');
      },
      async () => json(200, { ok: true })
    );
    assert.equal(await sendWaitlistConfirmation(waitlistLead, { resendApiKey: 're_key', platform }), false);
    assert.equal(calls.length, 1);
  });

  it('a hanging log call is cut off by its default 2 s bound and the result stands', async () => {
    route(async () => json(200, { id: 'em_1' }), hangUntilAborted);
    const started = Date.now();
    assert.equal(await sendWaitlistConfirmation(waitlistLead, { resendApiKey: 're_key', platform }), true);
    const elapsed = Date.now() - started;
    assert.ok(elapsed >= 1900 && elapsed < 3500, `elapsed ${elapsed} ms`);
  });

  it('without a recorded submission (no platform) or without a key, nothing is logged', async () => {
    let calls = route(async () => json(200, { id: 'em_1' }), async () => json(200, { ok: true }));
    assert.equal(await sendWaitlistConfirmation(waitlistLead, { resendApiKey: 're_key' }), true);
    assert.equal(calls.length, 1);

    calls = route(async () => json(200, { id: 'em_1' }), async () => json(200, { ok: true }));
    const noKey = { ...waitlistLead, submission_key: undefined };
    assert.equal(await sendWaitlistConfirmation(noKey, { resendApiKey: 're_key', platform }), true);
    assert.equal(calls.length, 1);
  });
});
