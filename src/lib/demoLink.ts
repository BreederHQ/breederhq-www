/**
 * Links from the marketing site into the live demo sandbox.
 *
 * The sandbox is the no-commitment step before the waitlist: a visitor can walk
 * through a working breeding operation without signing up. Every link to it is
 * built here so each one carries the same campaign tags and its own placement,
 * which is what lets GA4 report clicks, sandboxes started and Founders clicks
 * per spot on the site.
 *
 * This is the only source file that spells the demo origin. vercel.json is the
 * one exception: its /demo short-link redirects cannot import this module, so
 * they repeat the URL with utm_medium=short_link.
 */

export const DEMO_ORIGIN = 'https://demo.breederhq.com';

/**
 * Where on breederhq.com a demo link sits. Sent as utm_medium on the link and as
 * the `placement` parameter of the GA4 demo_cta_click event. A new placement is
 * added here, never passed as a free string, so the report has no typos in it.
 */
export type DemoMedium =
  | 'header'
  | 'nav_platform'
  | 'mobile_menu'
  | 'hero'
  | 'hero_recording'
  | 'feature_heat_cycle_tracking'
  | 'feature_heat_tracking'
  | 'feature_breeding_cycles'
  | 'waitlist'
  | 'compare_faq'
  | 'short_link';

/** The demo URL for one placement. Links open it in the same tab. */
export function demoUrl(medium: DemoMedium): string {
  const params = new URLSearchParams({
    utm_source: 'www',
    utm_medium: medium,
    utm_campaign: 'demo',
  });
  return `${DEMO_ORIGIN}/?${params.toString()}`;
}

/** The attribute that marks a demo link for click tracking; its value is the medium. */
export const DEMO_CTA_ATTR = 'data-demo-cta';

declare global {
  interface Window {
    __bhqDemoCtaTracking?: boolean;
  }
}

/**
 * Sends demo_cta_click to GA4 for every click on a [data-demo-cta] link, from
 * one delegated listener. It never calls preventDefault or waits on anything:
 * the link navigates in the same tab at once, and the beacon transport lets the
 * event leave the page while it unloads. Without gtag (development, or a
 * blocker) it does nothing. Safe to call more than once per page.
 */
export function initDemoCtaTracking(): void {
  if (typeof window === 'undefined' || window.__bhqDemoCtaTracking) return;
  window.__bhqDemoCtaTracking = true;

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest(`a[${DEMO_CTA_ATTR}]`);
      if (!link) return;
      const placement = link.getAttribute(DEMO_CTA_ATTR);
      if (!placement) return;
      try {
        const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
        if (typeof gtag === 'function') {
          gtag('event', 'demo_cta_click', {
            placement,
            transport_type: 'beacon',
          });
        }
      } catch {
        // Analytics must never stand between the visitor and the demo.
      }
    },
    { capture: true },
  );
}
