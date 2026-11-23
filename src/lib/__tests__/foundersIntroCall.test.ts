/**
 * The Founders hold date and call-time lines on the intro-call booking screen.
 *
 * Run: node --import tsx --test src/lib/__tests__/foundersIntroCall.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  chicagoDate,
  formatHoldDate,
  formatIntroCallStart,
  holdUntilDate,
  isHoldDate,
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
