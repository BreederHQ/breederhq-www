/**
 * The Founders hold date and call-time lines on the intro-call booking screen.
 *
 * Run: node --import tsx --test src/lib/__tests__/foundersIntroCall.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INTRO_CALL_MAX_BOOKING_ID,
  INTRO_CALL_MAX_KEY_CHARS,
  chicagoDate,
  formatHoldDate,
  formatHoldMonthDay,
  formatIntroCallStart,
  holdUntilDate,
  isHoldDate,
  parseIntroCallAnswerParams,
  parseIntroCallPageParams,
  usableRescheduleUrl,
} from '../foundersIntroCall';

// ICU separates the clock from AM/PM with a narrow no-break space.
const plain = (s: string) => s.replace(/[  ]/g, ' ');

describe('holdUntilDate', () => {
  it('is the Chicago date plus 14 days', () => {
    // Noon in Chicago on Sunday, November 22.
    assert.equal(holdUntilDate(new Date('2026-11-22T18:00:00Z')), '2026-12-06');
  });

  it('counts from the Chicago day late in the evening, when UTC is already tomorrow', () => {
    // 11:30 PM CST on November 22 is 05:30 UTC on November 23.
    const lateEvening = new Date('2026-11-23T05:30:00Z');
    assert.equal(chicagoDate(lateEvening), '2026-11-22');
    assert.equal(holdUntilDate(lateEvening), '2026-12-06');
  });

  it('moves to the next day at Chicago midnight, not UTC midnight', () => {
    // 12:00 AM CST on November 23 is 06:00 UTC.
    assert.equal(holdUntilDate(new Date('2026-11-23T05:59:59Z')), '2026-12-06');
    assert.equal(holdUntilDate(new Date('2026-11-23T06:00:00Z')), '2026-12-07');
  });

  it('uses the daylight-time offset in summer', () => {
    // 11:30 PM CDT on July 1 is 04:30 UTC on July 2.
    assert.equal(holdUntilDate(new Date('2026-07-02T04:30:00Z')), '2026-07-15');
    assert.equal(holdUntilDate(new Date('2026-07-02T05:00:00Z')), '2026-07-16');
  });

  it('crosses a month and a year end', () => {
    assert.equal(holdUntilDate(new Date('2026-12-25T18:00:00Z')), '2027-01-08');
  });

  it('counts calendar days across the daylight-saving change', () => {
    // Clocks go back on November 1, 2026; the hold is still 14 calendar days.
    assert.equal(holdUntilDate(new Date('2026-10-25T18:00:00Z')), '2026-11-08');
  });
});

describe('formatHoldDate', () => {
  it('writes the weekday, month and day', () => {
    assert.equal(formatHoldDate('2026-12-06'), 'Sunday, December 6');
  });

  it('is not moved a day by any zone', () => {
    assert.equal(formatHoldDate('2027-01-01'), 'Friday, January 1');
  });

  it('refuses a value that is not a real date', () => {
    for (const bad of ['', '2026-02-30', '2026-13-01', '2026-1-5', 'tomorrow', '2026-12-06T00:00']) {
      assert.equal(formatHoldDate(bad), null, bad);
      assert.equal(isHoldDate(bad), false, bad);
    }
    assert.equal(isHoldDate('2026-12-06'), true);
    assert.equal(isHoldDate(20261206), false);
  });
});

describe('formatIntroCallStart', () => {
  it('writes the start in Chicago time and names the zone', () => {
    // 20:00 UTC on December 1 is 2:00 PM CST.
    assert.equal(
      plain(formatIntroCallStart(new Date('2026-12-01T20:00:00Z'))),
      'Tuesday, December 1 at 2:00 PM CT',
    );
  });

  it('keeps the Chicago day for a call late in the evening', () => {
    // 03:30 UTC on December 2 is 9:30 PM CST on December 1.
    assert.equal(
      plain(formatIntroCallStart(new Date('2026-12-02T03:30:00Z'))),
      'Tuesday, December 1 at 9:30 PM CT',
    );
  });
});

describe('formatHoldMonthDay', () => {
  it('is the month and day, or null for a value that is not a date', () => {
    assert.equal(formatHoldMonthDay('2026-12-06'), 'December 6');
    assert.equal(formatHoldMonthDay('2026-02-30'), null);
    assert.equal(formatHoldMonthDay('soon'), null);
  });
});

describe('parseIntroCallPageParams', () => {
  it('reads k, by and ref from the link', () => {
    assert.deepEqual(parseIntroCallPageParams('?k=abc-123&by=2026-12-06&ref=breeder'), {
      submissionKey: 'abc-123',
      holdDate: '2026-12-06',
      referredByBreeder: true,
    });
  });

  it('decodes an encoded key', () => {
    assert.equal(parseIntroCallPageParams('?k=a%20b%26c').submissionKey, 'a b&c');
  });

  it('treats a missing, oversized or control-character key as no key', () => {
    for (const search of [
      '',
      '?k=',
      '?k=%20%20',
      `?k=${'k'.repeat(INTRO_CALL_MAX_KEY_CHARS + 1)}`,
      '?k=a%00b',
    ]) {
      assert.equal(parseIntroCallPageParams(search).submissionKey, '', search);
    }
    assert.equal(
      parseIntroCallPageParams(`?k=${'k'.repeat(INTRO_CALL_MAX_KEY_CHARS)}`).submissionKey.length,
      INTRO_CALL_MAX_KEY_CHARS,
    );
  });

  it('omits a hold date that is not a real date, and a ref that is not breeder', () => {
    for (const by of ['', 'soon', '2026-02-30', '2026-12-6', '2026-12-06x']) {
      assert.equal(parseIntroCallPageParams(`?k=k&by=${by}`).holdDate, null, by);
    }
    for (const ref of ['', 'Breeder', 'google', 'breeder ']) {
      assert.equal(parseIntroCallPageParams(`?k=k&ref=${encodeURIComponent(ref)}`).referredByBreeder, false, ref);
    }
  });
});

describe('parseIntroCallAnswerParams', () => {
  it('reads the key, the booking and the answer', () => {
    assert.deepEqual(parseIntroCallAnswerParams('?k=abc-123&b=42&a=yes'), {
      submissionKey: 'abc-123',
      bookingId: 42,
      answer: 'yes',
    });
    assert.equal(parseIntroCallAnswerParams('?k=k&b=1&a=new')?.answer, 'new');
    assert.equal(
      parseIntroCallAnswerParams(`?k=k&b=${INTRO_CALL_MAX_BOOKING_ID}&a=yes`)?.bookingId,
      INTRO_CALL_MAX_BOOKING_ID,
    );
  });

  it('is null unless the key, the booking and the answer are all usable', () => {
    const unusable = [
      '',
      '?b=1&a=yes',
      '?k=&b=1&a=yes',
      '?k=k&a=yes',
      '?k=k&b=0&a=yes',
      '?k=k&b=-1&a=yes',
      '?k=k&b=1.5&a=yes',
      '?k=k&b=1e3&a=yes',
      '?k=k&b=%207&a=yes',
      '?k=k&b=abc&a=yes',
      `?k=k&b=${INTRO_CALL_MAX_BOOKING_ID + 1}&a=yes`,
      '?k=k&b=99999999999&a=yes',
      '?k=k&b=1',
      '?k=k&b=1&a=maybe',
      '?k=k&b=1&a=YES',
    ];
    for (const search of unusable) {
      assert.equal(parseIntroCallAnswerParams(search), null, search);
    }
  });
});

describe('usableRescheduleUrl', () => {
  it('accepts an https link on reclaim.ai or a subdomain of it', () => {
    assert.equal(usableRescheduleUrl('https://app.reclaim.ai/reschedule/abc'), 'https://app.reclaim.ai/reschedule/abc');
    assert.equal(usableRescheduleUrl('https://reclaim.ai/x'), 'https://reclaim.ai/x');
    assert.equal(usableRescheduleUrl('https://APP.Reclaim.AI/x'), 'https://app.reclaim.ai/x');
  });

  it('refuses anything else', () => {
    const refused: unknown[] = [
      'http://app.reclaim.ai/x',
      'https://evil.example/?u=https://app.reclaim.ai',
      'https://reclaim.ai.evil.example/x',
      'https://notreclaim.ai/x',
      'https://user:pw@app.reclaim.ai/x',
      'javascript:alert(1)',
      '//app.reclaim.ai/x',
      '/reschedule/abc',
      '',
      'not a url',
      `https://app.reclaim.ai/${'a'.repeat(2000)}`,
      42,
      null,
      undefined,
    ];
    for (const value of refused) {
      assert.equal(usableRescheduleUrl(value), null, String(value));
    }
  });
});
