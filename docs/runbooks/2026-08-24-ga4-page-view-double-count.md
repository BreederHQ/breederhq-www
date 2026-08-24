# GA4 Page Views Are Double-Counted Site-Wide

**Found**: 2026-08-24, during adversarial review of the invitation-only pricing change.
**Status**: FIXED 2026-08-24 in its own change. `send_page_view: false` is now set on
the `gtag('config', ...)` call in `Analytics.astro`, verified present in the built
output across pages. Two follow-ups remain, both outside the codebase, listed at the
end of this document.

## What was wrong

Every page load sent **two** GA4 `page_view` events instead of one.

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

## The fix, as applied

`send_page_view: false` was added to the `gtag('config', ...)` call in
`Analytics.astro`, suppressing GA4's automatic page view and leaving the explicit one
from `tracking.ts` as the single source.

Fixed there rather than by removing `trackPageView()` from `TrackingInit`. The manual
event is the better single source of truth: `TrackingInit.astro:58` re-fires it on
`popstate`, which the automatic config-time page view does not do.

## Two follow-ups, both outside the codebase

Neither can be done from the repo. Both are in the GA4 property itself.

**1. Annotate the date.** Reported page views drop by about half from the moment this
deploys, immediately and permanently. That is the correct number, but every trend chart
will show a cliff on that date. Without a dated annotation in GA4, someone will find it
later and chase it as a real traffic collapse.

**2. Enhanced Measurement's history page views — DONE, 2026-08-24.**

`send_page_view: false` suppresses only the **config-time** page view. Enhanced
Measurement independently emitted its own `page_view` on browser-history changes, and
the `popstate` handler at `TrackingInit.astro:58` fired alongside it, so history
navigations would have kept double-counting after the code fix.

That was closed at the property level via the Analytics Admin API. Stream
`properties/519991284/dataStreams/13300183759` (breederhq.com):
`page_changes_enabled` went `True` to `False`, confirmed by a fresh read afterwards.
The update mask named only that field, so the other six toggles (scrolls, outbound
clicks, site search, form interactions, file downloads, video engagement) are
untouched and all remain enabled.

The equivalent by hand is Admin, Data Streams, the web stream, Enhanced Measurement,
untick **"Page changes based on browser history events"**.

**Both halves of the double-count are now closed.** Worth confirming once in a GA4
real-time report: exactly one `page_view` per page load, and exactly one per in-page
history navigation.

### Note for anyone re-running ADC auth

`gcloud auth application-default login --scopes=...` **drops `quota_project_id`** from
the credentials file. The Analytics Data and Admin APIs both refuse to run without it,
so a re-auth silently breaks `/seo-checkin` and `/marketing-checkin` until it is put
back. Restore it as `scripts/seo/README.md` describes: add
`"quota_project_id": "breederhq-mobile"` to the ADC JSON. This was hit and fixed during
this change.

The same login also warns that `analytics.readonly` and `analytics.edit` will be
blocked for gcloud's default client ID at some point, which would affect the marketing
scripts too. Not urgent, but it is a known future break.

`Analytics.astro` is a PROTECTED file (`.claude/CLAUDE.md`), which is why this was
deliberately kept out of the invitation-only pricing commit and shipped on its own:
altering page-view counting across roughly 290 pages is far too large a blast radius to
carry inside an unrelated change.

## Provenance

Raised by Codex during review of the invitation-only pricing change. The author
initially disputed it as a false positive on the grounds that the pairing is
pre-existing rather than newly introduced. Arbitration confirmed the double-count is
real and the author's hoped-for escape (that `trackPageView` sent a distinct custom
event) does not exist, while also confirming the finding does not belong to that diff:
with a site-wide defect in place, a single page counting differently from the other 290
would skew exactly the cross-page comparisons a pricing page is measured by.
