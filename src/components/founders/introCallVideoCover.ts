/**
 * Runs the intro-call video cover (IntroCallVideoCover.astro). The cover is a
 * real link to the video on Arcade. On a screen wide enough for the inline
 * player (INLINE_PLAYER_QUERY), a click is intercepted and the cover is replaced
 * by the Arcade frame with autoplay on; narrower screens keep the link, which
 * opens the video in a new tab as Arcade's own embed does there.
 *
 * The frame is built on the click, so nothing loads from Arcade before someone
 * asks. Focus moves to the frame so keyboard and screen reader users land on the
 * player they asked for.
 */
import { createIntroCallVideoFrame } from '../../lib/foundersIntroCall';

/** Tablet width and up plays inline; a phone opens the video in a new tab. */
export const INLINE_PLAYER_QUERY = '(min-width: 768px)';

export function initIntroCallVideoCover(doc: Document = document): void {
  const root = doc.querySelector<HTMLElement>('[data-intro-video]');
  const cover = root?.querySelector<HTMLAnchorElement>('[data-intro-video-cover]');
  if (!root || !cover) return;
  if (root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  cover.addEventListener('click', (e) => {
    const win = doc.defaultView;
    if (!win || typeof win.matchMedia !== 'function' || !win.matchMedia(INLINE_PLAYER_QUERY).matches) return;
    // A modified click (new tab, new window) keeps its normal meaning.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const frame = createIntroCallVideoFrame(doc, { autoplay: true });
    root.replaceChildren(frame);
    frame.focus();
  });
}
