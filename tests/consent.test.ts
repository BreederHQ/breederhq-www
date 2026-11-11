import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import {
  CONSENT_EVENT,
  initConsent,
  readConsent,
  setConsent,
  type ConsentConfig,
} from '../src/lib/consent.ts';

const CFG: ConsentConfig = {
  ga4Id: 'G-TEST123',
  gtmId: 'GTM-TEST1',
  metaPixelId: '111',
  linkedinPartnerId: '222',
  twitterPixelId: 'tw333',
  ahrefsKey: 'ahrefs-key',
};

function makeWin(opts: { cookie?: string; gpc?: boolean; url?: string } = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: opts.url || 'https://www.breederhq.com/pricing',
  });
  const win = dom.window as any;
  if (opts.gpc) Object.defineProperty(win.navigator, 'globalPrivacyControl', { value: true });
  // Seeded exactly as the contract writes it, so a later write replaces it.
  if (opts.cookie) win.document.cookie = opts.cookie + '; Path=/; Domain=.breederhq.com';
  return win;
}

function scriptSrcs(win: any): string[] {
  return Array.from(win.document.querySelectorAll('script')).map((s: any) => s.src);
}

const has = (srcs: string[], host: string) => srcs.some((s) => s.includes(host));

test('no answer: nothing gated loads, no gtag or dataLayer exists', () => {
  const win = makeWin();
  assert.equal(readConsent(win), null);
  initConsent(win, CFG);
  assert.deepEqual(scriptSrcs(win), []);
  assert.equal(typeof win.gtag, 'undefined');
  assert.equal(typeof win.dataLayer, 'undefined');
  assert.equal(typeof win.fbq, 'undefined');
});

test('granted cookie: every configured tool loads on init', () => {
  const win = makeWin({ cookie: 'bhq_consent=v1.analytics=granted' });
  assert.equal(readConsent(win), 'granted');
  initConsent(win, CFG);
  const srcs = scriptSrcs(win);
  assert.ok(has(srcs, 'googletagmanager.com/gtag/js?id=G-TEST123'));
  assert.ok(has(srcs, 'googletagmanager.com/gtm.js'));
  assert.ok(has(srcs, 'analytics.ahrefs.com/analytics.js'));
  assert.ok(has(srcs, 'connect.facebook.net'));
  assert.ok(has(srcs, 'snap.licdn.com'));
  assert.ok(has(srcs, 'static.ads-twitter.com'));
  assert.equal(typeof win.gtag, 'function');
});

test('denied cookie: nothing loads', () => {
  const win = makeWin({ cookie: 'bhq_consent=v1.analytics=denied' });
  assert.equal(readConsent(win), 'denied');
  initConsent(win, CFG);
  assert.deepEqual(scriptSrcs(win), []);
});

test('GPC counts as denied even over a stored Accept, and loads nothing', () => {
  const win = makeWin({ cookie: 'bhq_consent=v1.analytics=granted', gpc: true });
  assert.equal(readConsent(win), 'denied');
  initConsent(win, CFG);
  assert.deepEqual(scriptSrcs(win), []);
  assert.equal(typeof win.gtag, 'undefined');
});

test('GPC: Accept cannot load tools', () => {
  const win = makeWin({ gpc: true });
  setConsent(win, 'granted', CFG);
  assert.deepEqual(scriptSrcs(win), []);
});

test('garbage cookie values read as no answer', () => {
  for (const v of ['granted', 'v1.analytics=maybe', 'v2.analytics=granted', 'v1.analytics=granted2', '']) {
    const win = makeWin({ cookie: 'bhq_consent=' + v });
    assert.equal(readConsent(win), null, v);
    initConsent(win, CFG);
    assert.deepEqual(scriptSrcs(win), [], v);
  }
});

test('Accept writes the shared cookie, announces it, and loads tools without a reload', () => {
  const win = makeWin();
  const seen: string[] = [];
  win.addEventListener(CONSENT_EVENT, (e: any) => seen.push(e.detail.analytics));
  let reloaded = 0;
  assert.deepEqual(scriptSrcs(win), []);
  setConsent(win, 'granted', CFG, { reload: () => void reloaded++ });
  assert.equal(readConsent(win), 'granted');
  assert.match(win.document.cookie, /bhq_consent=v1\.analytics=granted/);
  assert.ok(has(scriptSrcs(win), 'googletagmanager.com/gtag/js'));
  assert.ok(has(scriptSrcs(win), 'analytics.ahrefs.com'));
  assert.deepEqual(seen, ['granted']);
  assert.equal(reloaded, 0);
});

test('page_view: sent once on an in-session Accept, never added on init with a standing grant', () => {
  const fresh = makeWin();
  initConsent(fresh, CFG);
  setConsent(fresh, 'granted', CFG);
  const views = (w: any) => w.dataLayer.filter((a: any) => a[0] === 'event' && a[1] === 'page_view');
  assert.equal(views(fresh).length, 1);

  const returning = makeWin({ cookie: 'bhq_consent=v1.analytics=granted' });
  initConsent(returning, CFG);
  assert.equal(views(returning).length, 0);
});

test('granted to denied: deletes the Google cookies, reloads, announces', () => {
  const win = makeWin({ cookie: 'bhq_consent=v1.analytics=granted' });
  win.document.cookie = '_ga=GA1.1.1; Path=/; Domain=.breederhq.com';
  win.document.cookie = '_ga_ABC123=GS1.1; Path=/; Domain=.breederhq.com';
  win.document.cookie = 'other=keep; Path=/';
  initConsent(win, CFG);
  const seen: string[] = [];
  win.addEventListener(CONSENT_EVENT, (e: any) => seen.push(e.detail.analytics));
  let reloaded = 0;
  setConsent(win, 'denied', CFG, { reload: () => void reloaded++ });
  assert.equal(readConsent(win), 'denied');
  assert.equal(reloaded, 1);
  assert.deepEqual(seen, ['denied']);
  assert.doesNotMatch(win.document.cookie, /_ga/);
  assert.match(win.document.cookie, /other=keep/);
});

test('Reject without a prior Accept stores denied and does not reload', () => {
  const win = makeWin();
  let reloaded = 0;
  setConsent(win, 'denied', CFG, { reload: () => void reloaded++ });
  assert.equal(readConsent(win), 'denied');
  assert.equal(reloaded, 0);
  assert.deepEqual(scriptSrcs(win), []);
});

test('Analytics.astro carries no tracker script tag, and Clarity and Leadfeeder are gone', () => {
  const src = readFileSync(new URL('../src/components/Analytics.astro', import.meta.url), 'utf8');
  for (const needle of ['googletagmanager', 'clarity', 'lfeeder', 'leadfeeder', 'ahrefs.com', 'connect.facebook', 'licdn', 'ads-twitter']) {
    assert.ok(!src.toLowerCase().includes(needle), needle);
  }
});
