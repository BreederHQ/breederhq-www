/**
 * The intro-call video cover (on /pricing and the booking screen): a click on
 * the cover hides it and plays our own copy of the video in the page, on every
 * screen size, never opening a new window; and the cover's setup runs from its
 * own script, so nothing else on the page can stop it.
 *
 * Run: node --import tsx --test src/components/founders/__tests__/introCallVideoCover.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { initIntroCallVideoCover } from '../introCallVideoCover';
import { INTRO_CALL_VIDEO_SRC } from '../../../lib/foundersIntroCall';

// The parts of IntroCallVideoCover.astro the setup reads.
const COVER = `
  <div data-intro-video>
    <video data-intro-video-player src="/videos/v.mp4" preload="none" playsinline controls></video>
    <button type="button" data-intro-video-cover><span class="label">Why Become a Founder</span></button>
  </div>
`;

interface Page {
  dom: JSDOM;
  doc: Document;
  plays: HTMLVideoElement[];
  opened: unknown[];
}

function page(opts: { copies?: number; play?: () => Promise<void> | undefined } = {}): Page {
  const dom = new JSDOM(`<!doctype html><body>${COVER.repeat(opts.copies ?? 1)}</body>`);
  const plays: HTMLVideoElement[] = [];
  const opened: unknown[] = [];
  const proto = dom.window.HTMLMediaElement.prototype as unknown as { play: () => Promise<void> | undefined };
  proto.play = function (this: HTMLVideoElement) {
    plays.push(this);
    return opts.play ? opts.play() : Promise.resolve();
  };
  (dom.window as unknown as { open: (...a: unknown[]) => null }).open = (...a: unknown[]) => {
    opened.push(a);
    return null;
  };
  return { dom, doc: dom.window.document as unknown as Document, plays, opened };
}

function click(dom: JSDOM, target: Element): MouseEvent {
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  target.dispatchEvent(event);
  return event;
}

const $ = <T extends Element>(doc: Document, sel: string) => doc.querySelector(sel) as T;

describe('introCallVideoCover', () => {
  it('turns the native controls off while the cover is up', () => {
    const { doc } = page();
    initIntroCallVideoCover(doc);
    const video = $<HTMLVideoElement>(doc, 'video');
    assert.equal(video.controls, false);
    assert.equal($<HTMLButtonElement>(doc, '[data-intro-video-cover]').hidden, false);
  });

  it('a click hides the cover, plays the video in the page with sound and focuses it', () => {
    const { dom, doc, plays, opened } = page();
    initIntroCallVideoCover(doc);
    const video = $<HTMLVideoElement>(doc, 'video');
    click(dom, $(doc, '[data-intro-video-cover]'));
    assert.equal($<HTMLButtonElement>(doc, '[data-intro-video-cover]').hidden, true);
    assert.deepEqual(plays, [video]);
    assert.equal(video.muted, false);
    assert.equal(video.controls, true);
    assert.equal(doc.activeElement, video);
    assert.equal(opened.length, 0, 'no new window');
    assert.equal(doc.querySelector('iframe'), null);
  });

  it('a click on the label inside the cover plays too', () => {
    const { dom, doc, plays } = page();
    initIntroCallVideoCover(doc);
    click(dom, $(doc, '.label'));
    assert.equal(plays.length, 1);
  });

  it('when the browser refuses to play, the native controls are left to start it', async () => {
    const { dom, doc } = page({ play: () => Promise.reject(new Error('NotAllowedError')) });
    initIntroCallVideoCover(doc);
    click(dom, $(doc, '[data-intro-video-cover]'));
    await new Promise((r) => setTimeout(r, 0));
    assert.equal($<HTMLVideoElement>(doc, 'video').controls, true);
  });

  it('sets up every cover on the page, once however many times it is called', () => {
    const { dom, doc, plays } = page({ copies: 2 });
    initIntroCallVideoCover(doc);
    initIntroCallVideoCover(doc);
    const covers = doc.querySelectorAll('[data-intro-video-cover]');
    click(dom, covers[1]);
    const videos = doc.querySelectorAll('video');
    assert.deepEqual(plays, [videos[1]]);
    assert.equal((covers[0] as HTMLButtonElement).hidden, false);
  });
});

describe('IntroCallVideoCover.astro', () => {
  const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');
  const cover = read('../IntroCallVideoCover.astro');
  const pricing = read('../../../pages/pricing/index.astro');

  it('plays our own copy of the video, downloading nothing before the click', () => {
    assert.match(INTRO_CALL_VIDEO_SRC, /^\/videos\/[a-z0-9-]+\.mp4$/);
    const video = /<video[\s\S]*?><\/video>/.exec(cover)?.[0] ?? '';
    assert.match(video, /src=\{INTRO_CALL_VIDEO_SRC\}/);
    assert.match(video, /preload="none"/);
    assert.match(video, /playsinline/);
    // On in the markup so the video plays with no script.
    assert.match(video, /\bcontrols\b/);
    assert.doesNotMatch(cover, /arcade|<iframe|target="_blank"/i);
  });

  it('the cover is a real button named for what it does', () => {
    const button = /<button[\s\S]*?>/.exec(cover)?.[0] ?? '';
    assert.match(button, /type="button"/);
    assert.match(button, /aria-label="Play the intro call video"/);
    assert.match(button, /focus-visible:ring-2/);
  });

  it('with no script the cover is hidden, leaving the native controls', () => {
    assert.match(cover, /<noscript><style is:inline>\[data-intro-video-cover\]\{display:none!important\}<\/style><\/noscript>/);
  });

  it('the cover component starts its own setup from a script of its own', () => {
    const script = /<script>([\s\S]*?)<\/script>/.exec(cover)?.[1] ?? '';
    assert.match(script, /import \{ initIntroCallVideoCover \} from '\.\/introCallVideoCover'/);
    assert.match(script, /^\s*initIntroCallVideoCover\(\);/m);
  });

  it('the pricing page script does not carry the cover, so a failure in the form cannot stop it', () => {
    // The page script also imports the tracking module and the phone-number
    // library; a blocked or slow import, or a throw in the form setup, ends the
    // whole module. The cover must not live in it.
    assert.doesNotMatch(pricing, /initIntroCallVideoCover/);
  });

  it('the pricing page video section is the anchor the confirmation email links to', () => {
    assert.match(pricing, /<section id="intro-call-video"[^>]*>\s*<IntroCallVideoCover \/>/);
  });
});
