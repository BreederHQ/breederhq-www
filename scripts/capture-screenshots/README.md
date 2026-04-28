# Marketing Screenshots Toolkit

Captures product screenshots from a real running BreederHQ environment and writes
them into `public/images/screenshots/` for use on marketing pages via the
`<Screenshot id="..." />` component.

This is **Phase 1 infrastructure**. The list of screenshots in `manifest.ts` is intentionally
small until the toolkit is exercised end-to-end against the dev environment. Add entries
as Phase 2 progresses.

## How it works

```
manifest.ts ── single source of truth (id, url, viewport, selectors)
     │
     ▼
capture.ts  ── logs in to dev as the screenshots-demo tenant, walks the manifest,
                writes WebP + PNG to public/images/screenshots/{id}.{webp,png}
     │
     ▼
Screenshot.astro ── renders on marketing pages with <picture> + optional frame + annotations
```

## One-time setup

1. **Seed the demo tenant** (in `breederhq-api`):
   ```bash
   cd ../breederhq-api
   npm run db:dev:seed:screenshots
   ```
   Creates the `screenshots-demo` tenant ("Cedar Ridge Kennels") and the
   `screenshots@breederhq.com` user. Password is `Cedar!Ridge#2026`
   (hardcoded, dev-only — same convention as the other seed scripts).

2. **Install dependencies** (in `breederhq-www`):
   ```bash
   cd ../breederhq-www
   npm install
   ```
   Playwright is already a project dependency. If browsers aren't installed yet:
   `npx playwright install chromium`.

## Capturing

```bash
# List what would be captured
npm run screenshots:list

# Capture everything in the manifest (against dev)
npm run screenshots:capture

# Capture a single entry
npm run screenshots:capture -- --id=platform-dashboard

# Capture against a local dev server instead of dev.breederhq.com
npm run screenshots:capture -- --env=local
```

Outputs go to `public/images/screenshots/{id}.png` and `{id}.webp`. Both files
should be committed.

## Adding a new screenshot

1. Open `manifest.ts`, add a new `ScreenshotEntry`. The `id` becomes the filename
   and the prop you pass to `<Screenshot>`.
2. Run `npm run screenshots:capture -- --id=<new-id>` to capture it.
3. Commit the generated WebP + PNG.
4. Render it on a marketing page:
   ```astro
   ---
   import Screenshot from "../components/Screenshot.astro";
   ---

   <Screenshot
     id="my-new-shot"
     alt="Describe what the screenshot shows"
     frame="browser"
     loading="lazy"
   />
   ```

## Refresh cadence

- When a feature changes, re-run capture for affected manifest entries.
- The `usedOn` field in each manifest entry helps locate where it appears so you
  can decide whether to recapture or rotate.
- Quarterly: walk the manifest, drop stale entries, capture replacements.

## Conventions

- **Realism over theming**: the demo tenant is "Cedar Ridge Kennels" with plausible
  human names — never themed (no Hogwarts, no test labels, no placeholder text).
- **Dark theme**: the platform is dark by default; screenshots match that aesthetic.
- **No PII**: never seed real breeder names, contact emails, or animal data — only
  the curated values in `seed-screenshots-demo.ts`.
- **Reproducibility over perfection**: a slightly imperfect automated screenshot
  beats a hand-crafted one that goes stale.

## Hiding dev affordances

The capture script appends `?screenshot=1` to every URL. Components that should
hide themselves during capture (e.g. floating help widgets, env banners) can use
the `useScreenshotMode` hook from `@bhq/ui` or style themselves off
`body[data-screenshot="1"]`.
