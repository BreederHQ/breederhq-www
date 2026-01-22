# Claude Code Instructions - Auto-Loaded Context

**Purpose**: Automatically loaded instructions for every Claude Code session
**Repository**: breederhq-www (Marketing Website - Astro)

---

## Session Start Acknowledgment

**At the start of every new session**, before responding to any user request, acknowledge that you have loaded these instructions by saying:

> "CLAUDE.md loaded for breederhq-www. Context docs imported. Key rules I will follow:
> - PROTECTED FILES: Analytics.astro, BaseLayout.astro, sitemap.xml, robots.txt - will ASK before modifying
> - NEVER remove isProduction checks, Schema.org data, or inline script patterns
> - NEVER refactor is:inline scripts to imports (breaks Astro tracking)
> - Env vars MUST use PUBLIC_ prefix for client exposure"

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
| `public/robots.txt` | Search engine directives | Could block crawlers |
| `public/sitemap.xml` | 164 indexed URLs with priorities | Break search indexing |
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

6. **Modify sitemap.xml priorities or changefreq values** - These affect crawl behavior

7. **Change robots.txt crawler directives** - Could block important search engines

8. **Remove noscript fallbacks** from tracking pixels - Required for accessibility tracking

---

## ✅ Safe Operations

These are generally safe without special approval:

- Adding new pages (following the existing pattern with BaseLayout)
- Updating page content (text, images)
- Styling changes (Tailwind classes)
- Adding new components that don't touch analytics/SEO
- Bug fixes that don't modify protected files

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
