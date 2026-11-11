/**
 * Analytics consent for breederhq.com.
 *
 * The cookie below is shared with the other BreederHQ sites (app, accounts,
 * marketplace), which implement the same contract independently. Keep the name,
 * value format, attributes and event name identical.
 *
 * Until a visitor accepts, no analytics or advertising script is requested and
 * no gtag/dataLayer object exists, so nothing is queued to send later. A
 * browser Global Privacy Control signal counts as a refusal.
 */

export const CONSENT_COOKIE = 'bhq_consent';
export const CONSENT_EVENT = 'bhq:consent-changed';
export const CONSENT_MAX_AGE = 15552000; // 180 days
const COOKIE_DOMAIN = '.breederhq.com';
const GRANTED = 'v1.analytics=granted';
const DENIED = 'v1.analytics=denied';

export type ConsentState = 'granted' | 'denied' | null;

export interface ConsentConfig {
  ga4Id?: string;
  gtmId?: string;
  metaPixelId?: string;
  linkedinPartnerId?: string;
  twitterPixelId?: string;
  ahrefsKey?: string;
}

/** The slice of `window` this module touches (lets tests pass a jsdom window). */
type Win = Window & Record<string, any>;

function rawCookie(win: Win): string | null {
  const parts = String(win.document.cookie || '').split(/;\s*/);
  for (const part of parts) {
    if (part.startsWith(CONSENT_COOKIE + '=')) return part.slice(CONSENT_COOKIE.length + 1);
  }
  return null;
}

/** True when the browser's Global Privacy Control signal is on. */
export function gpcOn(win: Win): boolean {
  return (win.navigator as any)?.globalPrivacyControl === true;
}

/** The visitor's stored answer only (ignores GPC). Garbage reads as no answer. */
export function storedConsent(win: Win): ConsentState {
  const raw = rawCookie(win);
  if (raw === GRANTED) return 'granted';
  if (raw === DENIED) return 'denied';
  return null;
}

/** The effective answer: GPC always wins and counts as denied. */
export function readConsent(win: Win): ConsentState {
  if (gpcOn(win)) return 'denied';
  return storedConsent(win);
}

function cookieDomainFor(host: string): string | null {
  return host === 'breederhq.com' || host.endsWith('.breederhq.com') ? COOKIE_DOMAIN : null;
}

function writeCookie(win: Win, value: string): void {
  const domain = cookieDomainFor(win.location.hostname);
  let c = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax`;
  if (domain) c += `; Domain=${domain}`;
  if (win.location.protocol === 'https:') c += '; Secure';
  win.document.cookie = c;
}

const GOOGLE_COOKIE = /^(_ga(_.*)?|_gid|_gat(_.*)?|_gcl_.*)$/;

/** Delete Google measurement cookies on the current host and on .breederhq.com. */
export function clearGoogleCookies(win: Win): void {
  const names = String(win.document.cookie || '')
    .split(/;\s*/)
    .map((p) => p.split('=')[0])
    .filter((n) => GOOGLE_COOKIE.test(n));
  const host = win.location.hostname;
  const domains: Array<string | null> = [null, host];
  const shared = cookieDomainFor(host);
  if (shared) domains.push(shared);
  for (const name of names) {
    for (const d of domains) {
      win.document.cookie = `${name}=; Max-Age=0; Path=/${d ? `; Domain=${d}` : ''}`;
    }
  }
}

const loaded = new WeakSet<object>();

function addScript(win: Win, src: string, attrs: Record<string, string> = {}): void {
  const doc = win.document;
  const s = doc.createElement('script');
  s.async = true;
  s.src = src;
  for (const k of Object.keys(attrs)) s.setAttribute(k, attrs[k]);
  (doc.head || doc.documentElement).appendChild(s);
}

/** Insert every configured gated tool. Safe to call twice: it loads once per window. */
export function loadGatedTools(win: Win, cfg: ConsentConfig): void {
  if (loaded.has(win)) return;
  loaded.add(win);

  // Google Analytics 4 (existing linker config, manual page_view).
  if (cfg.ga4Id) {
    win.dataLayer = win.dataLayer || [];
    win.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      win.dataLayer.push(arguments);
    };
    win.gtag('js', new Date());
    win.gtag('config', cfg.ga4Id, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
      // tracking.ts sends the page_view itself (and again on popstate), so the
      // automatic one is suppressed to avoid counting every page twice.
      send_page_view: false,
      // Cross-domain linker so a visitor's client_id and gclid survive the
      // hand-off between www, accounts, app and marketplace.
      linker: {
        domains: [
          'breederhq.com',
          'www.breederhq.com',
          'accounts.breederhq.com',
          'app.breederhq.com',
          'marketplace.breederhq.com',
        ],
        accept_incoming: true,
      },
    });
    addScript(win, `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4Id)}`);
  }

  if (cfg.gtmId) {
    win.dataLayer = win.dataLayer || [];
    win.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    addScript(win, `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(cfg.gtmId)}`);
  }

  if (cfg.ahrefsKey) {
    addScript(win, 'https://analytics.ahrefs.com/analytics.js', { 'data-key': cfg.ahrefsKey });
  }

  if (cfg.metaPixelId) {
    const n: any = function (...args: any[]) {
      if (n.callMethod) n.callMethod.apply(n, args);
      else n.queue.push(args);
    };
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    if (!win.fbq) win.fbq = n;
    if (!win._fbq) win._fbq = n;
    addScript(win, 'https://connect.facebook.net/en_US/fbevents.js');
    win.fbq('init', cfg.metaPixelId);
    win.fbq('track', 'PageView');
  }

  if (cfg.linkedinPartnerId) {
    win._linkedin_data_partner_ids = win._linkedin_data_partner_ids || [];
    win._linkedin_data_partner_ids.push(cfg.linkedinPartnerId);
    if (!win.lintrk) {
      win.lintrk = function (a: unknown, b: unknown) {
        win.lintrk.q.push([a, b]);
      };
      win.lintrk.q = [];
    }
    addScript(win, 'https://snap.licdn.com/li.lms-analytics/insight.min.js');
  }

  if (cfg.twitterPixelId) {
    const s: any = function (...args: any[]) {
      if (s.exe) s.exe.apply(s, args);
      else s.queue.push(args);
    };
    s.version = '1.1';
    s.queue = [];
    win.twq = s;
    addScript(win, 'https://static.ads-twitter.com/uwt.js');
    win.twq('config', cfg.twitterPixelId);
  }
}

function announce(win: Win, analytics: 'granted' | 'denied'): void {
  win.dispatchEvent(new (win as any).CustomEvent(CONSENT_EVENT, { detail: { analytics } }));
}

/**
 * Record the visitor's answer. Accept loads the tools at once; Reject after a
 * prior Accept deletes the Google cookies and reloads so the tools stop.
 */
export function setConsent(
  win: Win,
  value: 'granted' | 'denied',
  cfg: ConsentConfig,
  opts: { reload?: () => void } = {},
): void {
  const hadGranted = storedConsent(win) === 'granted';
  writeCookie(win, value === 'granted' ? GRANTED : DENIED);
  announce(win, value);
  if (value === 'granted') {
    // GPC still wins: a signal that is on means nothing gated may load.
    if (!gpcOn(win)) {
      const first = !loaded.has(win);
      loadGatedTools(win, cfg);
      // This page's own page_view fired before the answer and went nowhere
      // (no gtag existed), so send it once now. Visitors who already had a
      // grant never need this: TrackingInit's page_view reaches gtag.
      if (first && typeof win.gtag === 'function') {
        win.gtag('event', 'page_view', {
          page_path: win.location.pathname,
          page_location: win.location.href,
          page_title: win.document.title,
        });
      }
    }
    return;
  }
  if (hadGranted || loaded.has(win)) {
    clearGoogleCookies(win);
    (opts.reload || (() => win.location.reload()))();
  }
}

/** Run once per page: load the tools only for a standing, non-GPC grant. */
export function initConsent(win: Win, cfg: ConsentConfig): ConsentState {
  const state = readConsent(win);
  if (state === 'granted') loadGatedTools(win, cfg);
  // A browser privacy signal overrides an older Accept: drop what it left behind.
  else if (gpcOn(win) && storedConsent(win) === 'granted') clearGoogleCookies(win);
  return state;
}
