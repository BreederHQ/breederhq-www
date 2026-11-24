/**
 * Analytics for a lead form that must work with analytics blocked.
 *
 * Ad blockers refuse the bundled `tracking.*.js` chunk. A form script that
 * imports it statically never runs at all, so a breeder with a blocker could
 * not apply. This module is what a form script imports instead: it holds no
 * static import of `./tracking`, loads that chunk with a dynamic import, and
 * turns a failed load or a throwing call into a no-op. Attribution still
 * reaches the submission, because the UTM read needs nothing from the chunk.
 */

type TrackingModule = typeof import('./tracking');

export type UtmParams = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  term?: string | null;
  content?: string | null;
};

// Same key `initTracking` writes in ./tracking.
const UTM_STORAGE_KEY = 'utm_params';

let loading: Promise<TrackingModule | null> | null = null;

function loadTracking(): Promise<TrackingModule | null> {
  if (!loading) {
    loading = import('./tracking').catch(() => null);
  }
  return loading;
}

// Begin loading early so the first event is not lost to a late chunk.
void loadTracking();

/**
 * The visitor's campaign attribution. The page's own `utm_*` query parameters
 * win and are saved for later pages, as `initTracking` does; otherwise the
 * saved copy is used. Reading the query here matters: the blocked chunk is the
 * one that normally saves them, so with it blocked a first visit would have
 * nothing stored. Empty when there is none or storage is unreadable.
 */
export function getUTMParams(): UtmParams {
  try {
    const q = new URLSearchParams(location.search);
    const fromUrl: UtmParams = {
      source: q.get('utm_source'),
      medium: q.get('utm_medium'),
      campaign: q.get('utm_campaign'),
      term: q.get('utm_term'),
      content: q.get('utm_content'),
    };
    if (Object.values(fromUrl).some((v) => v !== null)) {
      try {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
      } catch {
        /* storage unavailable: the value still reaches this submission */
      }
      return fromUrl;
    }
  } catch {
    /* fall through to the saved copy */
  }
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === 'object' ? (parsed as UtmParams) : {};
  } catch {
    return {};
  }
}

export function trackFormStart(formId: string): void {
  void loadTracking()
    .then((t) => t?.trackFormStart(formId))
    .catch(() => {});
}

export function trackFormSubmit(formId: string): void {
  void loadTracking()
    .then((t) => t?.trackFormSubmit(formId))
    .catch(() => {});
}
