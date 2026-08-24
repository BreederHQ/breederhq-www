# GA4 Page Views Are Double-Counted Site-Wide

**Found**: 2026-08-24, during adversarial review of the invitation-only pricing change.
**Status**: Confirmed from source, not yet fixed. Deliberately scoped OUT of the
pricing change, which neither introduced nor worsened it.

## What is wrong

Every page load sends **two** GA4 `page_view` events instead of one.

1. `src/components/Analytics.astro:36` calls `gtag('config', measurementId, {...})`
   with `anonymize_ip`, `cookie_flags` and `linker`, but **no `send_page_view: false`**.
   GA4's config call sends an automatic `page_view` by default.
2. `src/lib/tracking.ts:89-95` then sends a second one explicitly:

   ```ts
   gtag('event', 'page_view', {
     page_path: pagePath,
     page_location: window.location.href,
     page_title: document.title,
   });
   ```

   `page_view` is GA4's reserved event name, so this lands in the same metric as the
   automatic hit. GA4 does not deduplicate them.

Timing does not save it. The inline script in `Analytics.astro` defines the `gtag`
dataLayer stub synchronously, so by the time `TrackingInit`'s bundled module runs, the
`typeof gtag !== 'undefined'` guard in `trackPageView()` passes and the second event
queues.

`BaseLayout.astro` mounts `<Analytics />` (493) and `<TrackingInit />` (511), so this
applies to every page that uses the layout, and has for as long as both components have
existed.

**Reported page views are therefore roughly 2x actual.** Anything derived from them is
affected: bounce-adjacent metrics, per-page comparisons, and any conversion rate whose
denominator is page views. Ratios BETWEEN pages are broadly unaffected, because the
inflation is uniform.

## The fix

Add `send_page_view: false` to the `gtag('config', ...)` call in `Analytics.astro`.

Fix it there rather than by removing `trackPageView()` from `TrackingInit`. The manual
event is the better single source of truth: `TrackingInit.astro:58` re-fires it on
`popstate`, which the automatic config-time page view does not do.

Also check the GA4 property's Enhanced Measurement setting **"page changes based on
browser history"**. It can interact with that `popstate` handler the same way and
reintroduce a duplicate on history navigation.

## Why this is not a rider on another change

`Analytics.astro` is a PROTECTED file (`.claude/CLAUDE.md`). Changing it alters
page-view counting across roughly 290 pages, which is far too large a blast radius to
carry inside an unrelated commit. It needs its own change, its own protected-file
approval, and a GA4 real-time verification pass confirming exactly one `page_view` per
load afterwards.

**Sizing note for whoever picks this up:** the fix drops reported page views by about
half, immediately and permanently. Add a dated annotation in GA4 when it ships, or
every trend chart will show a phantom traffic collapse on that date and someone will
chase it as a real regression.

## Provenance

Raised by Codex during review of the invitation-only pricing change. The author
initially disputed it as a false positive on the grounds that the pairing is
pre-existing rather than newly introduced. Arbitration confirmed the double-count is
real and the author's hoped-for escape (that `trackPageView` sent a distinct custom
event) does not exist, while also confirming the finding does not belong to that diff:
with a site-wide defect in place, a single page counting differently from the other 290
would skew exactly the cross-page comparisons a pricing page is measured by.
