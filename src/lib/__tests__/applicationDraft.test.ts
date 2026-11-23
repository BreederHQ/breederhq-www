/**
 * The unfinished Founders application kept on the applicant's device.
 *
 * Run: node --import tsx --test src/lib/__tests__/applicationDraft.test.ts
 */
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  DRAFT_MAX_AGE_MS,
  DRAFT_STORAGE_KEY,
  SUBMITTED_STORAGE_KEY,
  applyDraftFields,
  changedDraftFields,
  loadDraft,
  markDraftSubmitted,
  parseDraft,
  parseSubmittedAt,
  readDraftFields,
  saveDraft,
  serializeDraft,
} from '../applicationDraft';

const NOW = Date.UTC(2026, 10, 22, 18, 0, 0);

function formFrom(html: string): HTMLFormElement {
  const dom = new JSDOM(`<!doctype html><form>${html}</form>`);
  return dom.window.document.querySelector('form') as unknown as HTMLFormElement;
}

const FORM = `
  <input type="text" name="bhq_c9x" />
  <input type="text" name="name" maxlength="5" />
  <select name="start"><option value="" disabled selected>Pick</option><option value="asap">ASAP</option><option value="few_months">Later</option></select>
  <input type="radio" name="country" value="US" checked /><input type="radio" name="country" value="CA" />
  <input type="radio" name="timing" value="asap" /><input type="radio" name="timing" value="few_months" />
  <input type="checkbox" name="modes" value="a" /><input type="checkbox" name="modes" value="b" />
  <input type="checkbox" name="sms_consent" value="yes" />
  <input type="checkbox" name="partnership_ack" value="yes" />
  <textarea name="motivation"></textarea>
`;

describe('serializeDraft / parseDraft', () => {
  it('round-trips the answers', () => {
    const fields = { name: 'Sarah', modes: ['a', 'b'], country: 'CA' };
    assert.deepEqual(parseDraft(serializeDraft(fields, NOW), NOW + 1000), fields);
  });

  it('never stores or restores the honeypot, the submission key or either agreement', () => {
    const raw = serializeDraft(
      { name: 'Sarah', bhq_c9x: 'bot', submission_key: 'k1', sms_consent: ['yes'], partnership_ack: ['yes'] },
      NOW,
    );
    assert.doesNotMatch(raw, /bhq_c9x|submission_key|sms_consent|partnership_ack|k1/);
    const smuggled = JSON.stringify({
      v: 1,
      savedAt: NOW,
      openedAt: NOW,
      fields: { name: 'Sarah', submission_key: 'k1', partnership_ack: ['yes'] },
    });
    assert.deepEqual(parseDraft(smuggled, NOW), { name: 'Sarah' });
  });

  it('drops a draft that is missing, unparseable, another version, too old or from the future', () => {
    assert.equal(parseDraft(null, NOW), null);
    assert.equal(parseDraft('{not json', NOW), null);
    assert.equal(parseDraft(JSON.stringify({ v: 2, savedAt: NOW, fields: {} }), NOW), null);
    assert.equal(parseDraft(serializeDraft({ name: 'x' }, NOW - DRAFT_MAX_AGE_MS - 1), NOW), null);
    assert.equal(parseDraft(serializeDraft({ name: 'x' }, NOW + 60_000), NOW), null);
    assert.equal(parseDraft(JSON.stringify({ v: 1, savedAt: NOW, fields: ['x'] }), NOW), null);
  });

  it('drops a draft with no open time or one later than its save', () => {
    assert.equal(parseDraft(JSON.stringify({ v: 1, savedAt: NOW, fields: { name: 'x' } }), NOW), null);
    assert.equal(parseDraft(JSON.stringify({ v: 1, savedAt: NOW, openedAt: NOW + 1, fields: { name: 'x' } }), NOW + 5), null);
  });

  it('lists only the answers that changed', () => {
    assert.deepEqual(
      changedDraftFields(
        { name: 'Sarah', modes: ['a'], country: 'US', motivation: '' },
        { name: 'Sarah', modes: ['a', 'b'], country: 'US', motivation: 'Litters' },
      ),
      { modes: ['a', 'b'], motivation: 'Litters' },
    );
  });

  it('skips values that are not the shape the page writes', () => {
    const raw = JSON.stringify({
      v: 1,
      savedAt: NOW,
      openedAt: NOW,
      fields: { name: 'Sarah', modes: [1, 2], other: { a: 1 } },
    });
    assert.deepEqual(parseDraft(raw, NOW), { name: 'Sarah' });
  });
});

describe('readDraftFields / applyDraftFields', () => {
  it('reads every answer except the excluded fields', () => {
    const form = formFrom(FORM);
    (form.querySelector('[name="name"]') as HTMLInputElement).value = 'Sarah';
    (form.querySelector('[name="bhq_c9x"]') as HTMLInputElement).value = 'bot';
    (form.querySelector('[name="sms_consent"]') as HTMLInputElement).checked = true;
    (form.querySelector('[name="modes"][value="b"]') as HTMLInputElement).checked = true;
    assert.deepEqual(readDraftFields(form), {
      name: 'Sarah',
      start: '',
      country: 'US',
      timing: '',
      modes: ['b'],
      motivation: '',
    });
  });

  it('restores saved answers into a fresh form', () => {
    const form = formFrom(FORM);
    const applied = applyDraftFields(form, {
      name: 'Sarah',
      start: 'few_months',
      country: 'CA',
      timing: 'asap',
      modes: ['a'],
      motivation: 'Litters',
    });
    assert.equal(applied, true);
    assert.deepEqual(readDraftFields(form), {
      name: 'Sarah',
      start: 'few_months',
      country: 'CA',
      timing: 'asap',
      modes: ['a'],
      motivation: 'Litters',
    });
  });

  it('skips an answer the form no longer offers and keeps the default', () => {
    const form = formFrom(FORM);
    applyDraftFields(form, { timing: 'exploring', start: 'exploring', country: 'MX' });
    const read = readDraftFields(form);
    assert.equal(read.timing, '');
    assert.equal(read.start, '');
    assert.equal(read.country, 'US');
  });

  it('never ticks an agreement or fills the honeypot from a draft', () => {
    const form = formFrom(FORM);
    applyDraftFields(form, { sms_consent: ['yes'], partnership_ack: ['yes'], bhq_c9x: 'bot' });
    assert.equal((form.querySelector('[name="sms_consent"]') as HTMLInputElement).checked, false);
    assert.equal((form.querySelector('[name="partnership_ack"]') as HTMLInputElement).checked, false);
    assert.equal((form.querySelector('[name="bhq_c9x"]') as HTMLInputElement).value, '');
  });

  it('holds a restored text answer to the field limit', () => {
    const form = formFrom(FORM);
    applyDraftFields(form, { name: 'Sarah Whitfield' });
    assert.equal((form.querySelector('[name="name"]') as HTMLInputElement).value, 'Sarah');
  });
});

describe('saveDraft / loadDraft / markDraftSubmitted across tabs', () => {
  const store = new Map<string, string>();
  const fakeStorage = {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  };
  const g = globalThis as Record<string, unknown>;
  let savedWindow: unknown;
  before(() => {
    savedWindow = g.window;
    g.window = { localStorage: fakeStorage };
  });
  after(() => {
    g.window = savedWindow;
  });
  beforeEach(() => store.clear());

  it('saves and restores a tab’s answers', () => {
    assert.equal(saveDraft({ name: 'Sarah' }, Date.now() - 1000), true);
    assert.deepEqual(loadDraft(), { name: 'Sarah' });
  });

  it('a tab opened before another tab sent the application never writes the draft again', () => {
    const olderTabOpenedAt = Date.now() - 60_000;
    saveDraft({ name: 'Sarah' }, olderTabOpenedAt);
    markDraftSubmitted();
    assert.equal(store.has(DRAFT_STORAGE_KEY), false, 'the sent answers are removed');
    assert.equal(saveDraft({ name: 'Sarah' }, olderTabOpenedAt), false);
    assert.equal(store.has(DRAFT_STORAGE_KEY), false, 'the older tab did not bring them back');
    assert.equal(loadDraft(), null);
  });

  it('a tab opened after the application was sent starts a draft of its own', () => {
    store.set(SUBMITTED_STORAGE_KEY, String(Date.now() - 60_000));
    assert.equal(saveDraft({ name: 'Dana' }, Date.now() - 1000), true);
    assert.deepEqual(loadDraft(), { name: 'Dana' });
  });

  it('never restores a draft saved before the last application was sent', () => {
    store.set(DRAFT_STORAGE_KEY, serializeDraft({ name: 'Sarah' }, Date.now() - 60_000));
    store.set(SUBMITTED_STORAGE_KEY, String(Date.now() - 30_000));
    assert.equal(loadDraft(), null);
    assert.equal(store.has(DRAFT_STORAGE_KEY), false);
  });

  it('never restores a draft that an older tab wrote after the submit landed', () => {
    // The older tab's save read no marker, then the other tab's submit wrote
    // the marker and removed the draft, then the older tab's write landed.
    const olderTabOpenedAt = Date.now() - 60_000;
    store.set(SUBMITTED_STORAGE_KEY, String(Date.now() - 30_000));
    store.set(DRAFT_STORAGE_KEY, serializeDraft({ name: 'Sarah' }, Date.now(), olderTabOpenedAt));
    assert.equal(loadDraft(), null);
    assert.equal(store.has(DRAFT_STORAGE_KEY), false);
  });

  it('a newer tab does not carry a stale draft’s answers into its own', () => {
    store.set(SUBMITTED_STORAGE_KEY, String(Date.now() - 30_000));
    store.set(DRAFT_STORAGE_KEY, serializeDraft({ name: 'Sarah' }, Date.now(), Date.now() - 60_000));
    assert.equal(saveDraft({ motivation: 'Litters' }, Date.now() - 1000), true);
    assert.deepEqual(loadDraft(), { motivation: 'Litters' });
  });

  it('two tabs editing different answers keep both', () => {
    const openedAt = Date.now() - 1000;
    const tabA = formFrom(FORM);
    const tabB = formFrom(FORM);
    const savedA = readDraftFields(tabA);
    const savedB = readDraftFields(tabB);
    (tabA.querySelector('[name="name"]') as HTMLInputElement).value = 'Sarah';
    assert.equal(saveDraft(changedDraftFields(savedA, readDraftFields(tabA)), openedAt), true);
    // Tab B still shows the empty name it opened with.
    (tabB.querySelector('[name="motivation"]') as HTMLTextAreaElement).value = 'Litters';
    assert.equal(saveDraft(changedDraftFields(savedB, readDraftFields(tabB)), openedAt), true);
    const draft = loadDraft();
    assert.equal(draft?.name, 'Sarah', 'tab B did not revert the name tab A saved');
    assert.equal(draft?.motivation, 'Litters');
  });

  it('clearing the only answer removes the draft', () => {
    const openedAt = Date.now() - 1000;
    saveDraft({ name: 'Sarah' }, openedAt);
    saveDraft({ name: '' }, openedAt);
    assert.equal(store.has(DRAFT_STORAGE_KEY), false);
  });

  it('reads only a whole-number marker', () => {
    assert.equal(parseSubmittedAt('1795370400000'), 1795370400000);
    for (const bad of [null, '', 'soon', '-5', '1.5', '1e12']) assert.equal(parseSubmittedAt(bad), null, String(bad));
  });

  it('a store that throws means no draft, never an error', () => {
    g.window = {
      get localStorage(): never {
        throw new Error('blocked');
      },
    };
    try {
      assert.equal(saveDraft({ name: 'Sarah' }, 0), false);
      assert.equal(loadDraft(), null);
      assert.doesNotThrow(() => markDraftSubmitted());
    } finally {
      g.window = { localStorage: fakeStorage };
    }
  });
});
