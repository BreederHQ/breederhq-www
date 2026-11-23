/**
 * The unfinished Founders application, kept on the applicant's own device.
 *
 * A breeder who stops to watch the walkthrough, open the demo or ask the
 * breeder who sent her should not come back to an empty form. The answers she
 * has typed are saved to localStorage as she types and put back when the page
 * loads, and the draft is removed once the application is sent.
 *
 * What is never saved:
 *  - the submission key: a key belongs to one attempt, and replaying a saved
 *    one would tie a new application to an old record;
 *  - the honeypot, so a filled one never comes back on its own;
 *  - the SMS consent and partnership boxes: agreement is given on the page she
 *    submits, never carried in ticked from an earlier visit.
 *
 * Several /pricing tabs share one draft. Two rules keep one tab from undoing
 * another:
 *  - a successful application leaves a "submitted at" marker. Every draft
 *    records when the oldest tab that wrote into it was opened, and a draft
 *    written by a tab opened at or before the marker is never restored, so an
 *    older tab cannot bring back the answers that were just sent (and invite
 *    sending them twice), however its last save interleaves with the submit.
 *    Such a tab also stops writing once it sees the marker;
 *  - a save is field-level: a tab writes only the answers that changed since
 *    its own last save, merged into what is stored, so one tab's edit does not
 *    revert a different answer another tab saved. When two tabs change the
 *    same answer, the last edit wins.
 *
 * The read-merge-write of a save is atomic within one tab's task, not across
 * browser processes: two tabs saving in the same instant can each merge into
 * a copy that lacks the other's write, and the later write then drops one
 * answer from the device-local draft. This is accepted. The draft is a
 * convenience copy (both on-screen forms keep what was typed, and nothing
 * reaches the server from it), so the cost is a retyped answer, while a
 * cross-tab lock could not cover the pagehide flush that saves her last
 * keystrokes when she leaves the page.
 *
 * Storage can be missing, full or refused (private windows, blocked site
 * data), so every access is wrapped and a failure only means no draft.
 *
 * The parsing half is pure, so the tests can exercise it without a browser.
 */

/** Versioned, so a later change to the draft's shape can ignore old drafts. */
export const DRAFT_STORAGE_KEY = 'bhq:founders-application-draft:v1';
const DRAFT_VERSION = 1;

/** When an application was last sent from this device, as epoch ms. */
export const SUBMITTED_STORAGE_KEY = 'bhq:founders-application-submitted:v1';

/** A draft older than this is dropped rather than restored. */
export const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Field names that are never written to or read from a draft. */
export const DRAFT_EXCLUDED_FIELDS: ReadonlySet<string> = new Set([
  'bhq_c9x',
  'submission_key',
  'sms_consent',
  'partnership_ack',
]);

/** The longest value kept for one field; every field on the form is shorter. */
const MAX_VALUE_CHARS = 1000;
const MAX_FIELDS = 40;
const MAX_VALUES_PER_FIELD = 20;

/** One answer per field name: a string, or the checked values of a group. */
export type DraftFields = Record<string, string | string[]>;

interface StoredDraft {
  v: number;
  savedAt: number;
  /** When the oldest tab that wrote any of these answers was opened, epoch ms. */
  openedAt: number;
  fields: DraftFields;
}

/**
 * The JSON written to storage for these answers at `now`, written by tabs the
 * oldest of which was opened at `openedAt` (defaults to `now`).
 */
export function serializeDraft(fields: DraftFields, now: number, openedAt: number = now): string {
  const kept: DraftFields = {};
  for (const [name, value] of Object.entries(fields)) {
    if (DRAFT_EXCLUDED_FIELDS.has(name)) continue;
    kept[name] = Array.isArray(value)
      ? value.slice(0, MAX_VALUES_PER_FIELD).map((v) => v.slice(0, MAX_VALUE_CHARS))
      : value.slice(0, MAX_VALUE_CHARS);
  }
  const stored: StoredDraft = { v: DRAFT_VERSION, savedAt: now, openedAt: Math.min(openedAt, now), fields: kept };
  return JSON.stringify(stored);
}

/**
 * The answers in a stored draft, or null when there is none worth restoring:
 * missing, unparseable, another version, from the future, too old, saved or
 * written by a tab opened no later than the last application sent from this
 * device (`submittedAt`), or not the shape this page writes. Excluded fields
 * are dropped even if present.
 */
export function parseDraft(
  raw: string | null,
  now: number,
  submittedAt: number | null = null,
): DraftFields | null {
  return parseStoredDraft(raw, now, submittedAt)?.fields ?? null;
}

function parseStoredDraft(
  raw: string | null,
  now: number,
  submittedAt: number | null,
): { openedAt: number; fields: DraftFields } | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (data === null || typeof data !== 'object') return null;
  const { v, savedAt, openedAt, fields } = data as Partial<StoredDraft>;
  if (v !== DRAFT_VERSION) return null;
  if (typeof savedAt !== 'number' || !Number.isFinite(savedAt)) return null;
  if (typeof openedAt !== 'number' || !Number.isFinite(openedAt) || openedAt > savedAt) return null;
  if (savedAt > now || now - savedAt > DRAFT_MAX_AGE_MS) return null;
  // A tab opened before the last submit may have saved after it (its save read
  // no marker, then the submit landed): its open time, not its save time, is
  // what places its answers before the submission.
  if (submittedAt !== null && (savedAt <= submittedAt || openedAt <= submittedAt)) return null;
  if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) return null;

  const out: DraftFields = {};
  let count = 0;
  for (const [name, value] of Object.entries(fields as Record<string, unknown>)) {
    if (count >= MAX_FIELDS) break;
    if (DRAFT_EXCLUDED_FIELDS.has(name)) continue;
    if (typeof value === 'string') {
      out[name] = value.slice(0, MAX_VALUE_CHARS);
    } else if (Array.isArray(value) && value.every((x) => typeof x === 'string')) {
      out[name] = (value as string[]).slice(0, MAX_VALUES_PER_FIELD).map((x) => x.slice(0, MAX_VALUE_CHARS));
    } else {
      continue;
    }
    count++;
  }
  return { openedAt, fields: out };
}

/**
 * The answers in `next` that differ from `prev`: what one tab changed since
 * its last save. An answer `prev` lacks counts as changed.
 */
export function changedDraftFields(prev: DraftFields, next: DraftFields): DraftFields {
  const changed: DraftFields = {};
  for (const [name, value] of Object.entries(next)) {
    const before = prev[name];
    const same = Array.isArray(value)
      ? Array.isArray(before) && before.length === value.length && value.every((x, i) => before[i] === x)
      : before === value;
    if (!same) changed[name] = value;
  }
  return changed;
}

/** The "submitted at" marker's time, or null when there is none or it is not a time. */
export function parseSubmittedAt(raw: string | null): number | null {
  if (!raw || !/^\d{1,16}$/.test(raw)) return null;
  const ms = Number(raw);
  return Number.isSafeInteger(ms) ? ms : null;
}

/** True when no saved answer has any content, so there is nothing to keep. */
export function isEmptyDraft(fields: DraftFields): boolean {
  return Object.values(fields).every((v) => (Array.isArray(v) ? v.length === 0 : v.trim() === ''));
}

type FieldControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** The named answer controls of a form, excluded fields and buttons left out. */
function answerControls(form: HTMLFormElement): FieldControl[] {
  const SKIP_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'file', 'password', 'image']);
  return Array.from(form.querySelectorAll<FieldControl>('input[name], select[name], textarea[name]')).filter(
    (el) => !DRAFT_EXCLUDED_FIELDS.has(el.name) && !SKIP_TYPES.has(el.type),
  );
}

/**
 * The form's current answers. A checkbox group is always an array, empty when
 * nothing is ticked, so unticking everything is saved too; a radio group is
 * the checked value or "".
 */
export function readDraftFields(form: HTMLFormElement): DraftFields {
  const fields: DraftFields = {};
  for (const el of answerControls(form)) {
    if (el.type === 'checkbox') {
      const list = Array.isArray(fields[el.name]) ? (fields[el.name] as string[]) : [];
      if ((el as HTMLInputElement).checked) list.push(el.value);
      fields[el.name] = list;
    } else if (el.type === 'radio') {
      if ((el as HTMLInputElement).checked) fields[el.name] = el.value;
      else if (!(el.name in fields)) fields[el.name] = '';
    } else {
      fields[el.name] = el.value;
    }
  }
  return fields;
}

/**
 * Put saved answers back into the form. Only a value the form still offers is
 * restored: a select or radio value that is no longer an option (an answer
 * since removed from the form) is skipped and the field keeps its default.
 * Returns true when anything was restored.
 */
export function applyDraftFields(form: HTMLFormElement, fields: DraftFields): boolean {
  let applied = false;
  const radioGroupsSet = new Set<string>();
  for (const el of answerControls(form)) {
    if (!(el.name in fields)) continue;
    const saved = fields[el.name];
    if (el.type === 'checkbox') {
      if (!Array.isArray(saved)) continue;
      (el as HTMLInputElement).checked = saved.includes(el.value);
      applied = applied || (el as HTMLInputElement).checked;
    } else if (el.type === 'radio') {
      if (typeof saved !== 'string' || !saved || radioGroupsSet.has(el.name)) continue;
      const option = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="radio"]')).find(
        (r) => r.name === el.name && r.value === saved,
      );
      if (!option) continue;
      option.checked = true;
      radioGroupsSet.add(el.name);
      applied = true;
    } else if (el.tagName === 'SELECT') {
      if (typeof saved !== 'string' || !saved) continue;
      if (!Array.from((el as HTMLSelectElement).options).some((o) => o.value === saved && !o.disabled)) continue;
      el.value = saved;
      applied = true;
    } else {
      if (typeof saved !== 'string' || !saved) continue;
      const max = (el as HTMLInputElement | HTMLTextAreaElement).maxLength;
      el.value = max > 0 ? saved.slice(0, max) : saved;
      applied = true;
    }
  }
  return applied;
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function submittedAtIn(s: Storage): number | null {
  return parseSubmittedAt(s.getItem(SUBMITTED_STORAGE_KEY));
}

/**
 * Save the answers a tab opened at `openedAt` (epoch ms) changed since its
 * last save (`changes`, see changedDraftFields), merged into the stored draft
 * so answers another tab saved are kept (except when two tabs save in the same
 * instant; see the module header). A stored draft that could not be
 * restored (too old, or from before the last submit) is not merged in. When
 * the merged answers are empty the draft is removed. Returns false, and writes
 * nothing, when an application was sent from this device at or after
 * `openedAt`: that tab's answers are either the ones just sent or older than
 * them. Any storage failure is ignored.
 */
export function saveDraft(changes: DraftFields, openedAt: number): boolean {
  try {
    const s = storage();
    if (!s) return false;
    const submittedAt = submittedAtIn(s);
    if (submittedAt !== null && submittedAt >= openedAt) return false;
    const now = Date.now();
    const stored = parseStoredDraft(s.getItem(DRAFT_STORAGE_KEY), now, submittedAt);
    const merged: DraftFields = { ...(stored?.fields ?? {}), ...changes };
    if (isEmptyDraft(merged)) s.removeItem(DRAFT_STORAGE_KEY);
    else s.setItem(DRAFT_STORAGE_KEY, serializeDraft(merged, now, Math.min(openedAt, stored?.openedAt ?? openedAt)));
    return true;
  } catch {
    // A full or refused store only means the answers are not kept.
    return false;
  }
}

/** The saved answers, or null. A draft that cannot be used is removed. */
export function loadDraft(): DraftFields | null {
  try {
    const s = storage();
    if (!s) return null;
    const raw = s.getItem(DRAFT_STORAGE_KEY);
    const fields = parseDraft(raw, Date.now(), submittedAtIn(s));
    if (raw && !fields) s.removeItem(DRAFT_STORAGE_KEY);
    return fields;
  } catch {
    return null;
  }
}

/**
 * The application was sent: remove the draft and leave the "submitted at"
 * marker that stops every tab opened before now from saving one again. Any
 * storage failure is ignored.
 */
export function markDraftSubmitted(): void {
  try {
    const s = storage();
    if (!s) return;
    s.setItem(SUBMITTED_STORAGE_KEY, String(Date.now()));
    s.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // The marker could not be written (a full store); still remove the draft.
    try {
      storage()?.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Nothing to do: a store that cannot be reached holds no draft to remove.
    }
  }
}
