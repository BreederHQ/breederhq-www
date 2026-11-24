/**
 * Runs each intro-call video cover on the page (IntroCallVideoCover.astro).
 *
 * The markup ships the video with its native controls on, so it can be played
 * with no script. Setup turns the controls off while our cover is up (they
 * would otherwise be reachable by keyboard underneath it). A click on the cover
 * hides it, turns the controls back on and starts the video with sound, in the
 * page, on every screen size: there is no new tab. The controls come back at
 * the click rather than once playback starts, so a slow connection shows the
 * player loading instead of a blank box, and if the browser refuses to play
 * (play() rejects) the viewer still has the native play button.
 *
 * Focus moves to the video so keyboard and screen reader users land on the
 * player they asked for.
 */

export function initIntroCallVideoCover(doc: Document = document): void {
  for (const root of Array.from(doc.querySelectorAll<HTMLElement>('[data-intro-video]'))) {
    if (root.dataset.ready === 'true') continue;
    const video = root.querySelector<HTMLVideoElement>('[data-intro-video-player]');
    const cover = root.querySelector<HTMLButtonElement>('[data-intro-video-cover]');
    if (!video || !cover) continue;
    root.dataset.ready = 'true';

    video.controls = false;
    cover.addEventListener('click', () => {
      cover.hidden = true;
      video.controls = true;
      // Not every browser makes a video focusable on its own (Safari does not).
      video.tabIndex = 0;
      video.focus();
      let started: Promise<void> | undefined;
      try {
        started = video.play();
      } catch {
        // An old browser that throws instead of rejecting: the controls are on.
      }
      // The rejection is expected on some browsers; the controls are already on.
      started?.catch?.(() => {});
    });
  }
}
