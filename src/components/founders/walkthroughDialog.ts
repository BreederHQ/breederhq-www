/**
 * Runs the walkthrough dialog (WalkthroughDialog.astro): every
 * [data-walkthrough-open] control opens it, and the close button, Escape and a
 * click on the backdrop close it.
 *
 * Opening builds the video frame and closing removes it, so audio stops the
 * moment the dialog closes and nothing loads from Arcade until someone asks to
 * watch. Focus returns to the control that opened it.
 *
 * A browser without modal dialogs (very old ones) opens the video on Arcade in
 * a new tab instead, so the control still does something and the form stays.
 */
import { INTRO_CALL_VIDEO_URL, createIntroCallVideoFrame } from '../../lib/foundersIntroCall';

export function initWalkthroughDialog(doc: Document = document): void {
  const dialog = doc.querySelector<HTMLDialogElement>('dialog[data-walkthrough-dialog]');
  const openers = Array.from(doc.querySelectorAll<HTMLElement>('[data-walkthrough-open]'));
  if (!dialog || openers.length === 0) return;
  if (dialog.dataset.ready === 'true') return;
  dialog.dataset.ready = 'true';

  const slot = dialog.querySelector<HTMLElement>('[data-walkthrough-frame]');
  const closeBtn = dialog.querySelector<HTMLButtonElement>('[data-walkthrough-close]');
  let returnFocus: HTMLElement | null = null;

  const open = (opener: HTMLElement) => {
    if (typeof dialog.showModal !== 'function') {
      window.open(INTRO_CALL_VIDEO_URL, '_blank', 'noopener');
      return;
    }
    if (dialog.open) return;
    returnFocus = opener;
    slot?.replaceChildren(createIntroCallVideoFrame(doc));
    dialog.showModal();
    // The close button, not the frame: focus moved into a cross-origin frame
    // cannot be brought back by Escape.
    closeBtn?.focus();
  };

  for (const opener of openers) {
    opener.addEventListener('click', () => open(opener));
  }

  closeBtn?.addEventListener('click', () => dialog.close());

  // A click on the dialog element itself, outside its content box, is a
  // click on the backdrop.
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });

  // Escape fires `cancel` and then `close`; every way out ends here.
  dialog.addEventListener('close', () => {
    slot?.replaceChildren();
    const target = returnFocus;
    returnFocus = null;
    if (target && target.isConnected) target.focus();
  });
}
