/**
 * Idempotency keys for lead form submissions.
 *
 * The platform records one immutable row per submission. Without a stable key,
 * a retry after the server committed but its response was lost would be
 * recorded as a second, separate application — indistinguishable from someone
 * genuinely applying twice.
 *
 * The key must be minted in the BROWSER and held across retries of one attempt.
 * A server-generated key would be fresh on every request and so would not
 * survive the retry it exists to absorb.
 *
 * Lifetime is deliberately per-attempt, not per-page: it is cleared once a
 * submission is confirmed, because a later application from the same page is a
 * genuinely new submission that should produce its own row.
 */

/**
 * Holds one key across the retries of a single submission attempt.
 *
 * Usage: call `get()` when building the payload, and `clear()` only after the
 * server confirms success. Leaving it uncleared would make a deliberate second
 * application silently collapse into the first.
 */
export function createSubmissionKeyHolder() {
  let key: string | null = null;

  return {
    get(): string {
      if (!key) key = mintKey();
      return key;
    },
    clear(): void {
      key = null;
    },
  };
}

function mintKey(): string {
  // randomUUID needs a secure context. The fallback is not
  // cryptographically strong, and does not need to be: this value is an
  // idempotency token scoped to one form attempt, never a secret or an
  // authorization check.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
