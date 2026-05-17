# Claude Code Instructions - Auto-Loaded Context

**Purpose**: Automatically loaded instructions for every Claude Code session
**Repository**: breederhq-www (Marketing Website - Astro)

---

## Session Start Acknowledgment

**At the start of every new session**, before responding to any user request, acknowledge that you have loaded these instructions by saying:

> "CLAUDE.md loaded for breederhq-www. Context docs imported. Key rules I will follow:
> - PROTECTED FILES: Analytics.astro, BaseLayout.astro, robots.txt - will ASK before modifying
> - NEVER remove isProduction checks, Schema.org data, or inline script patterns
> - NEVER refactor is:inline scripts to imports (breaks Astro tracking)
> - Env vars MUST use PUBLIC_ prefix for client exposure
> - **SITE UPDATES: Any content change MUST add a fragment under `src/pages/_site-updates/YYYY-MM-DD-<slug>.astro` — NEVER edit `site-updates.astro` directly (multi-agent contention hazard, see CLAUDE.md)**"

This confirms the instructions are active and that Claude has read the imported documentation.

---

## Imported Documentation (auto-loaded into context)

@docs/CLAUDE-CODE-CONTEXT.md

---

## 🚨 CRITICAL: This is a Marketing Site with Fragile Integrations

This repository contains carefully configured **analytics, SEO, and lead capture integrations** that are **easy to accidentally break**. Many of these integrations took significant time to configure and test.

---

## 🛡️ Protected Files - DO NOT MODIFY Without Explicit Approval

These files contain critical integrations. **Ask before changing**:

| File | Contains | Risk if Broken |
|------|----------|----------------|
| `src/components/Analytics.astro` | GA4, Clarity, Leadfeeder, Meta Pixel, LinkedIn, Twitter | Lose all tracking data |
| `src/layouts/BaseLayout.astro` | Schema.org structured data, SEO meta tags | Break AI search, social sharing |
| `src/components/TrackingInit.astro` | UTM capture, scroll tracking, time-on-page | Lose behavioral analytics |
| `src/lib/tracking.ts` | Client-side tracking utilities | Break conversion tracking |
| `src/pages/api/contact.ts` | Lead capture endpoint | Lose leads |
| `src/lib/server/leadCapture.ts` | Lead enrichment, Slack notifications | Break lead flow |
| `src/pages/api/track-visitor.ts` | High-value visitor detection | Lose B2B intelligence |
| `src/middleware.ts` | Security headers | Security vulnerabilities |
| `public/robots.txt` | Search engine directives (advertises auto-generated sitemap-index.xml) | Could block crawlers |
| `vercel.json` | Security headers, redirects | Security/routing issues |
| `.env.example` | Environment variable template | Break setup documentation |

---

## ❌ Forbidden Actions

### NEVER Do These Without Explicit Approval:

1. **Remove or modify the `isProduction` check** in Analytics.astro
   - This prevents analytics from loading in development

2. **"Clean up" or "simplify" the Schema.org structured data** in BaseLayout.astro
   - The 26-item `featureList` is intentionally comprehensive for AI search

3. **Rename environment variables** - The `PUBLIC_` prefix is required by Astro
   - `PUBLIC_GA4_MEASUREMENT_ID` ✅
   - `GA4_MEASUREMENT_ID` ❌ (won't be exposed to client)

4. **Refactor `is:inline` scripts to imports** - Astro requires inline for tracking scripts

5. **Remove `define:vars` directives** - Required for passing env vars to inline scripts

6. **Sitemap is auto-generated** - The site uses `@astrojs/sitemap` which generates `sitemap-index.xml` and `sitemap-0.xml` into `dist/client/` at build time from every `.astro` page in `src/pages/`. There is no manual sitemap to maintain. New pages get picked up automatically on the next deploy. (Historical note: `public/sitemap.xml` was a manual sitemap that has been retired — it returned 404 in production, was not advertised in robots.txt, and was not submitted to Google Search Console. Auto-generation now covers everything.)

7. **Change robots.txt crawler directives** - Could block important search engines

8. **Remove noscript fallbacks** from tracking pixels - Required for accessibility tracking

---

## 🚨 MANDATORY: Log Content Changes via the Site Updates Fragment Pattern

**Every time you modify marketing content** (page text, page renames, new pages, removed pages, feature descriptions, CTA changes, navigation changes), you **MUST** log a site-updates entry. **As of 2026-05-17 the policy is: write a fragment file, do NOT edit `site-updates.astro` directly.**

### Why we use fragments (the multi-agent coordination problem)

On 2026-05-17 we ran four agents in parallel to ship four marketplace pages on the same day (Lexington geo page, Trust page, Equine Boarding hub, Farriers hub). All four needed to log entries in `src/pages/site-updates.astro`. The result:
- One agent's `Edit` retry absorbed three other agents' entries into its diff after the "file modified since read" error forced a re-Read.
- Another agent had to retry three times against concurrent writes.
- Cross-references were written to pages that did not yet exist on disk.

The shared changelog file became a write-contention bottleneck. The fix is to remove the shared file from the hot path entirely: each launch writes its own fragment, and the aggregated changelog is rebuilt at compile time.

### The fragment pattern

```
src/pages/_site-updates/
├── 2026-05-17-farriers.astro              ← one fragment per content change
├── 2026-05-17-lexington-equine-boarding.astro
├── 2026-05-17-trust.astro
├── 2026-05-17-equine-boarding-hub.astro
└── _archive/                               ← optional; see Cleanup section
    └── 2025-12-31-end-of-year-roundup.astro
```

`src/pages/site-updates.astro` becomes an aggregator: it uses Vite's `import.meta.glob` (synchronous, eager) to pull every fragment under `_site-updates/`, sorts them by filename descending (newest first), and renders them inline. **No human or agent edits `site-updates.astro` once the aggregator lands.**

### Filename rules (deterministic ordering + collision avoidance)

```
YYYY-MM-DD-<kebab-slug>.astro
```

- **Date prefix is mandatory** — drives sort order (descending filename = newest first).
- **Slug must be unique within the day** — if two agents both ship "farrier" content the same day, qualify the slugs: `2026-05-17-farriers-category-hub.astro` and `2026-05-17-farrier-provider-page.astro`. If the slug collides, the build aborts; fix by qualifying.
- **Lowercase, hyphen-separated.** No spaces, no underscores in the slug (underscore is reserved for the `_archive/` directory and the `_site-updates` parent).
- **Leading underscore on the directory name** (`_site-updates/`) prevents Astro from treating fragments as routable pages. Critical — without the underscore, every fragment becomes a public URL.

### Fragment file shape

Every fragment is a standalone Astro snippet that renders ONE `<article>` block. No `<BaseLayout>`, no `<main>`, no `<section>` — those belong to the aggregator. The fragment is append-only and self-contained.

```astro
---
// src/pages/_site-updates/2026-05-17-farriers.astro
export const updateMeta = {
  date: '2026-05-17',          // ISO date — also encoded in filename, kept here for the rendered <h2>
  title: 'Flagship marketplace category landing page: Farriers',
  tags: ['marketplace', 'seo', 'farriers'],  // optional, for future filtering
};
---
<article class="border-l-4 border-[hsl(24,95%,53%)] pl-6">
  <h2 class="text-2xl font-bold text-gray-900 mb-1">May 17, 2026</h2>
  <p class="text-sm text-gray-500 mb-4">Launched the flagship BreederHQ Marketplace category landing page for farriers at <a href="/services/farriers" class="text-[hsl(24,95%,53%)] hover:underline">/services/farriers</a>...</p>
  <!-- New file / Sections / SEO / Internal links / Navigation blocks as before -->
</article>
```

The exported `updateMeta` object is optional today but reserved for the aggregator to consume later (tag filtering, RSS feed, JSON-LD for the changelog itself). Keep it accurate.

### The aggregator pattern (`src/pages/site-updates.astro`)

The aggregator file is the ONLY place `import.meta.glob('./_site-updates/*.astro')` runs. It is small, stable, and changes only when the rendering shell changes — not when content changes.

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Site Updates', url: '/site-updates' },
];

// Eager glob — every fragment is bundled at build time, sorted by filename descending.
// Filename convention `YYYY-MM-DD-<slug>.astro` makes the sort deterministic.
const fragmentModules = import.meta.glob('./_site-updates/*.astro', { eager: true });
const fragments = Object.entries(fragmentModules)
  .sort(([a], [b]) => b.localeCompare(a))   // newest first
  .map(([, mod]) => (mod as any).default);
---
<BaseLayout
  title="Site Updates - BreederHQ"
  description="Internal update log for the BreederHQ marketing website."
  breadcrumbs={breadcrumbs}
  noindex={true}
>
  <main>
    <section class="bg-gradient-to-b from-white to-gray-50 py-20">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 mb-4">Site Updates</h1>
        <p class="text-lg text-gray-600">A running log of content changes to breederhq.com. Newest first.</p>
      </div>
    </section>
    <section class="py-16 bg-white">
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-16">
        {fragments.map((Fragment) => <Fragment />)}
      </div>
    </section>
  </main>
</BaseLayout>
```

This file is now PROTECTED. Treat it like `BaseLayout.astro` — do not edit it to add content. Content goes in fragments.

### Append-only behavior (the rule that makes this work)

1. **Agents create new fragments. Agents do not modify existing fragments.** Once a fragment is committed, treat it as immutable history — corrections go in a new fragment that references the older one ("On 2026-05-17 we said X; correction: Y").
2. **Agents do not modify `site-updates.astro`.** If you find yourself reaching for it, you are doing it wrong. The aggregator only changes when its rendering shell changes (rare, requires explicit approval as a PROTECTED file).
3. **One fragment per content change.** Do not bundle three unrelated launches into one fragment. The whole point is to avoid contention; one launch = one fragment.

### Collision avoidance rules (multi-agent launches)

| Scenario | Rule |
|---|---|
| Two agents launching the same day | Each writes its own fragment. Different slugs. No coordination needed. |
| Two agents touching adjacent topics ("farriers" and "farrier-providers") | Qualify slugs explicitly: `farriers-category-hub` vs `farrier-provider-page`. Don't truncate. |
| Slug collision detected at build | `npm run build` aborts (Vite throws on duplicate glob entries — and even if it didn't, our slug-uniqueness convention would catch it). Resolve by renaming and committing again. |
| Agent A references a page Agent B is about to ship | Write the cross-link anyway. Astro doesn't validate internal links at build time. Worst case is a temporary 404 if Agent B doesn't land; document the dependency in `updateMeta` if it matters. |
| Agent's fragment needs to be retracted before launch | Delete the fragment file in the same PR. Don't ship a fragment that documents an unshipped change. |

### What goes in a fragment vs. what does not

| Change Type | Write a fragment? |
|---|---|
| New page added | **YES** — describe sections, SEO targets, internal links |
| Page renamed / moved | **YES** — note old → new URL, redirect status |
| Page content rewritten | **YES** — summarize what changed |
| Page removed | **YES** — note removal and any redirect added |
| Navigation / header / footer restructured | **YES** — describe the structural change |
| Multi-page launch (e.g. four hubs the same day) | **YES, but one fragment per page** — never one fragment covering all four |
| Styling-only changes (colors, spacing) | No |
| Bug fixes (broken links, typos) | No (unless user-visible behavior changed) |
| Analytics / tracking changes | No |
| Infrastructure / config changes | No (use commit messages) |

### Cleanup and archive guidance

The fragment directory will grow unbounded if left alone. Two strategies, in order of preference:

1. **Roll-up after the year ends.** On 2027-01-15 (or first business day after the year boundary), an annual cleanup pass moves all fragments older than the current calendar year into `src/pages/_site-updates/_archive/`. The aggregator's glob can be widened to include the archive, or the archive can be quietly dropped from the live page if the changelog is intended as a recent-changes log only. Repo policy as of 2026-05-17: **archive but keep rendering** (changelog page should show ~13 months of history at any time).
2. **Quarterly roll-up if the directory exceeds ~150 fragments.** At that density the page renders fine but new contributors can't scan the directory in their editor. Cut a quarterly archive: `_archive/2026-Q1/`, `_archive/2026-Q2/`, etc.

Do **not** delete fragments. The changelog is the public log of what shipped — historical accuracy matters when triaging regressions or briefing new hires.

### Migration plan (one-time, not yet executed)

The existing `src/pages/site-updates.astro` is monolithic — every entry since 2026-01 lives in one ~2,000-line file. The migration is straightforward but not free:

1. Extract each `<article class="border-l-4 border-[hsl(24,95%,53%)] pl-6">...</article>` block into its own fragment file under `_site-updates/`.
2. Name each file by the `<h2>` date plus a slug derived from the entry's first heading.
3. Rewrite `site-updates.astro` to the aggregator shape above.
4. Mark `site-updates.astro` PROTECTED in this CLAUDE.md (add to the protected-files table).
5. Verify the build output matches the pre-migration HTML byte-for-byte aside from the fragment-ordering improvement.

Until the migration ships, the legacy "edit `site-updates.astro` directly" workflow remains in effect — but ALL agents working on multi-page launches must coordinate verbally or via a separate channel to avoid the contention pattern from 2026-05-17. The fragment pattern is the durable fix.

### Self-check before finishing content work

- [ ] Did I modify any page content, add/remove pages, or rename URLs?
- [ ] If yes, **did I write a new fragment under `src/pages/_site-updates/`** (preferred), or — if the migration hasn't shipped — append to `site-updates.astro` with full awareness of the contention risk?
- [ ] Is my fragment filename `YYYY-MM-DD-<unique-slug>.astro`?
- [ ] Does my fragment contain exactly one `<article>` block, no `<BaseLayout>` / `<main>` / `<section>` wrapping?
- [ ] Did I avoid editing or renaming any other agent's fragment?

---

## ✅ Safe Operations

These are generally safe without special approval:

- Adding new pages (following the existing pattern with BaseLayout)
- Updating page content (text, images)
- Styling changes (Tailwind classes)
- Adding new components that don't touch analytics/SEO
- Bug fixes that don't modify protected files

---

## 🐾 Species-Agnostic Language on Shared Pages

BreederHQ supports 9 species: **Dogs, Cats, Horses, Goats, Rabbits, Sheep, Alpacas, Llamas, Cattle**.

Note: Alpacas and Llamas launched 2026-05-07. Cattle is stealth-launched (piloted, not yet publicly marketed) but IS a supported species in-platform.

**Shared/general pages** (workflows, features, pricing, FAQ, index, mobile) must use **species-neutral language**. Do NOT use dog-specific terms on shared pages.

| ❌ Dog-Specific (shared pages) | ✅ Species-Neutral |
|-------------------------------|-------------------|
| whelping box | birthing area |
| puppy / puppies | offspring / newborns |
| whelping | birthing / birth |
| fading puppy syndrome | fading newborn syndrome |
| 63 days from breeding | species-specific gestation periods |
| 8 puppies | a large litter |

**Species-specific pages** (`dogs.astro`, `cats.astro`, `horses.astro`, breed comparison pages, buyer guides) **should** use species-appropriate language — that's their purpose.

**Decision matrix:**

| Page Type | Use species-specific terms? |
|-----------|---------------------------|
| `/dogs`, `/cats`, `/horses` | ✅ Yes — that's the point |
| `/breeds/*`, buyer guides | ✅ Yes — species-targeted SEO |
| Workflow pages (`/workflows/*`) | ❌ No — must be species-neutral |
| Feature pages, index, FAQ, mobile | ❌ No — must be species-neutral |

---

## Technology Stack

- **Framework**: Astro 5.x (static site generation)
- **Styling**: Tailwind CSS 4.x
- **Hosting**: Vercel
- **Language**: TypeScript

### Astro-Specific Patterns

```astro
<!-- ✅ CORRECT - Inline script with env vars -->
<script is:inline define:vars={{ measurementId: PUBLIC_GA4_MEASUREMENT_ID }}>
  gtag('config', measurementId);
</script>

<!-- ❌ WRONG - Import won't work for tracking scripts -->
<script>
  import { measurementId } from '../config';
  gtag('config', measurementId);
</script>
```

---

## Quick Reference

### Active Integrations (Currently Configured)

| Integration | Env Variable | Purpose |
|-------------|--------------|---------|
| Google Analytics 4 | `PUBLIC_GA4_MEASUREMENT_ID` | Traffic, events, conversions |
| Microsoft Clarity | `PUBLIC_CLARITY_ID` | Session recordings, heatmaps |
| Leadfeeder | `LEADFEEDER_TRACKER_ID` | B2B company identification |
| Slack Webhook | `SLACK_WEBHOOK_URL` | Lead notifications |

### Available But Not Configured

| Integration | Env Variable | Purpose |
|-------------|--------------|---------|
| Google Tag Manager | `PUBLIC_GTM_CONTAINER_ID` | Tag management |
| Meta Pixel | `PUBLIC_META_PIXEL_ID` | Facebook/Instagram retargeting |
| LinkedIn Insight | `PUBLIC_LINKEDIN_PARTNER_ID` | B2B demographics |
| Twitter Pixel | `PUBLIC_TWITTER_PIXEL_ID` | Twitter conversion tracking |
| Sentry | `PUBLIC_SENTRY_DSN` | Error monitoring |
| Clearbit | `CLEARBIT_SECRET_KEY` | Lead enrichment |
| HubSpot | `HUBSPOT_API_KEY` | CRM integration |
| Resend | `RESEND_API_KEY` | Email notifications |

---

## Documentation

### Existing Documentation (in `.docs/` - gitignored)

- `ARCHITECTURE.md` - Complete data flow diagrams
- `QUICK-REFERENCE.md` - Configuration quick reference
- `PRE-LAUNCH-SETUP.md` - Integration setup guides

### When Adding New Integrations

Document in `.docs/` folder following existing patterns.

---

## Before Making Changes

1. **Read the full context**: [docs/CLAUDE-CODE-CONTEXT.md](../docs/CLAUDE-CODE-CONTEXT.md)
2. **Check if file is protected**: See table above
3. **Understand Astro patterns**: Don't "modernize" inline scripts
4. **Test in development**: `npm run dev` (analytics disabled)
5. **Verify production build**: `npm run build && npm run preview`

---

**Auto-loaded by Claude Code at session start**
