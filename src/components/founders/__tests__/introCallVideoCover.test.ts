/**
 * The intro-call video cover on /pricing: a click on a screen wide enough for the
 * inline player swaps the cover for the Arcade frame, and the cover's setup runs
 * from its own script, so nothing else on the page can stop it.
 *
 * Run: node --import tsx --test src/components/founders/__tests__/introCallVideoCover.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { INLINE_PLAYER_QUERY, initIntroCallVideoCover } from '../introCallVideoCover';

// The parts of IntroCallVideoCover.astro the setup reads.
const COVER = `
  <div data-intro-video>
    <a href="https://demo.arcade.software/video/abc" target="_blank" data-intro-video-cover>
      <span id="label">Why Become a Founder</span>
    </a>
  </div>
`;

function page(wide: boolean): { dom: JSDOM; doc: Document } {
  const dom = new JSDOM(`<!doctype html><body>${COVER}</body>`);
  const win = dom.window as unknown as Window & { matchMedia: (q: string) => { matches: boolean } };
  win.matchMedia = (query: string) => ({ matches: query === INLINE_PLAYER_QUERY ? wide : false });
  return { dom, doc: dom.window.document as unknown as Document };
}

function click(dom: JSDOM, target: Element, init: MouseEventInit = {}): MouseEvent {
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('introCallVideoCover click', () => {
  it('on a wide screen replaces the cover with an autoplay frame and cancels the link', () => {
    const { dom, doc } = page(true);
    initIntroCallVideoCover(doc);
    const event = click(dom, doc.querySelector('[data-intro-video-cover]')!);
    assert.equal(event.defaultPrevented, true);
    assert.equal(doc.querySelector('[data-intro-video-cover]'), null);
    const frame = doc.querySelector('[data-intro-video] iframe') as HTMLIFrameElement;
    assert.ok(frame, 'the frame replaced the cover');
    assert.match(frame.src, /autoplay=true/);
    assert.match(frame.getAttribute('allow') ?? '', /autoplay/);
  });

  it('a click on the label inside the cover plays inline too', () => {
    const { dom, doc } = page(true);
    initIntroCallVideoCover(doc);
    const event = click(dom, doc.getElementById('label')!);
    assert.equal(event.defaultPrevented, true);
    assert.ok(doc.querySelector('[data-intro-video] iframe'));
  });

  it('on a narrow screen leaves the link to open the video in a new tab', () => {
    const { dom, doc } = page(false);
    initIntroCallVideoCover(doc);
    const event = click(dom, doc.querySelector('[data-intro-video-cover]')!);
    assert.equal(event.defaultPrevented, false);
    assert.ok(doc.querySelector('[data-intro-video-cover]'));
    assert.equal(doc.querySelector('iframe'), null);
  });

  it('keeps the normal meaning of a modified click', () => {
    const { dom, doc } = page(true);
    initIntroCallVideoCover(doc);
    const event = click(dom, doc.querySelector('[data-intro-video-cover]')!, { ctrlKey: true });
    assert.equal(event.defaultPrevented, false);
    assert.equal(doc.querySelector('iframe'), null);
  });

  it('attaches once however many times it is called', () => {
    const { dom, doc } = page(true);
    initIntroCallVideoCover(doc);
    initIntroCallVideoCover(doc);
    click(dom, doc.querySelector('[data-intro-video-cover]')!);
    assert.equal(doc.querySelectorAll('iframe').length, 1);
  });
});

describe('introCallVideoCover wiring', () => {
  const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');
  const cover = read('../IntroCallVideoCover.astro');
  const pricing = read('../../../pages/pricing/index.astro');

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
});
