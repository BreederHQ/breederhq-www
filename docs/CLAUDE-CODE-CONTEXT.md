# Claude Code Context - Integration Protection Guide

**Purpose**: Detailed guide for preserving critical integrations in breederhq-www
**Status**: ✅ Active - Read before modifying any integration files
**Last Updated**: 2026-01-21

---

## 🚨 CRITICAL: Why This Document Exists

The breederhq-www marketing site contains **carefully configured integrations** for:
- **Analytics** (Google Analytics, Microsoft Clarity, Leadfeeder)
- **SEO & AI Search** (Schema.org structured data, meta tags, sitemap)
- **Lead Capture** (forms, enrichment, Slack notifications)
- **Security** (headers, CORS, middleware)

These integrations are **fragile** and **easy to accidentally break**. This document explains what NOT to change and why.

---

## Integration Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER VISITS SITE                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                              │
│  src/middleware.ts                                               │
│  • Security headers (X-Frame-Options, CSP, etc.)                │
│  • Request interception                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PAGE RENDER                                   │
│  src/layouts/BaseLayout.astro                                   │
│  ├─ SEO Meta Tags (title, description, canonical, OG, Twitter) │
│  ├─ Schema.org Structured Data (Organization, Software, FAQ)   │
│  ├─ Analytics.astro (all tracking scripts)                     │
│  └─ TrackingInit.astro (client-side initialization)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               CLIENT-SIDE TRACKING                               │
│  src/lib/tracking.ts                                            │
│  • UTM parameter capture                                         │
│  • Scroll depth tracking (25%, 50%, 75%, 100%)                  │
│  • Time on page tracking (30s, 1m, 3m)                          │
│  • CTA click tracking                                            │
│  • Form interaction tracking                                     │
│  • Conversion tracking (multi-platform)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Protected Integration: Analytics Scripts

**File**: `src/components/Analytics.astro`

### What It Does

Loads tracking scripts for GA4, Clarity, Leadfeeder, and optional pixels (Meta, LinkedIn, Twitter).

### Critical Pattern: Production-Only Loading

```astro
---
const isProduction = import.meta.env.PROD;
---

{isProduction && (
  <>
    <!-- GA4, Clarity, etc. only load in production -->
  </>
)}
```

**⚠️ NEVER REMOVE the `isProduction` check!**
- Development mode should NOT send tracking data
- Removing this pollutes production analytics with test data

### Critical Pattern: Inline Scripts with `define:vars`

```astro
<!-- ✅ CORRECT - Astro pattern for env vars in inline scripts -->
<script is:inline define:vars={{ measurementId: PUBLIC_GA4_MEASUREMENT_ID }}>
  gtag('config', measurementId);
</script>

<!-- ❌ WRONG - This will NOT work -->
<script>
  // Can't access import.meta.env in client-side scripts this way
  gtag('config', import.meta.env.PUBLIC_GA4_MEASUREMENT_ID);
</script>
```

### Critical Pattern: Async Non-Blocking Loading

All scripts use `async` attribute to prevent render blocking:

```astro
<script async src={`https://www.googletagmanager.com/gtag/js?id=${PUBLIC_GA4_MEASUREMENT_ID}`}></script>
```

**⚠️ NEVER change `async` to `defer` or remove it!**

### Critical Pattern: Noscript Fallbacks

```astro
{PUBLIC_META_PIXEL_ID && (
  <>
    <script><!-- pixel code --></script>
    <noscript>
      <img height="1" width="1" style="display:none"
        src={`https://www.facebook.com/tr?id=${PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  </>
)}
```

**⚠️ NEVER remove noscript fallbacks!**
- Required for tracking users with JS disabled
- Required for certain accessibility compliance

---

## 🛡️ Protected Integration: Schema.org Structured Data

**File**: `src/layouts/BaseLayout.astro`

### What It Does

Provides machine-readable data about BreederHQ for:
- Google Search rich snippets
- AI assistants (ChatGPT, Claude, Perplexity)
- Social media previews

### Critical: Organization Schema

```typescript
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BreederHQ",
  "url": "https://breederhq.com",
  "logo": "https://breederhq.com/logo.png",
  "description": "Professional breeding program management software...",
  "foundingDate": "2024",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "https://breederhq.com/contact"
  }
};
```

**⚠️ DO NOT "simplify" or remove fields!**
- Each field serves a purpose for search engines and AI

### Critical: Software Application Schema

```typescript
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BreederHQ",
  "applicationCategory": "BusinessApplication",
  "featureList": [
    "Pedigree tracking with automatic COI calculation",
    "Multi-locus coat color genetics (E, K, A, B, D, M, S loci)",
    "Offspring genetics simulator with Monte Carlo simulation",
    // ... 26 total features
  ],
  // ...
};
```

**⚠️ THE `featureList` IS INTENTIONALLY COMPREHENSIVE!**

This 26-item list is specifically crafted for AI search optimization. When someone asks an AI assistant "What breeding software has genetics simulation?", this structured data helps BreederHQ appear in results.

**NEVER:**
- Remove "redundant" features
- "Simplify" to just top 5 features
- Consolidate similar features
- Remove technical details like "(E, K, A, B, D, M, S loci)"

**The verbosity is intentional and valuable for AI discoverability.**

### Critical: FAQ Schema (Page-Specific)

```typescript
// If FAQs provided to BaseLayout
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};
```

**⚠️ FAQ schema must follow exact Google specifications!**

---

## 🛡️ Protected Integration: SEO Meta Tags

**File**: `src/layouts/BaseLayout.astro`

### What It Does

Provides metadata for search engines and social media.

### Critical Elements

```astro
<head>
  <!-- Essential SEO -->
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={fullUrl} />

  <!-- Conditional noindex -->
  {noindex && <meta name="robots" content="noindex, nofollow" />}

  <!-- Open Graph (Facebook, LinkedIn) -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={fullUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />

  <!-- Twitter Cards -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={fullUrl} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={description} />
</head>
```

**⚠️ NEVER:**
- Remove canonical URL (causes duplicate content issues)
- Remove OG tags (breaks social sharing)
- Change `twitter:card` type without testing
- Remove the `noindex` conditional (needed for staging/preview pages)

---

## 🛡️ Protected Integration: robots.txt

**File**: `public/robots.txt`

### Current Configuration

```
User-agent: *
Allow: /

Sitemap: https://breederhq.com/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# AI crawlers (commented out - allowing for now)
# User-agent: GPTBot
# Disallow: /
```

**⚠️ CRITICAL RULES:**

1. **NEVER add `Disallow: /` to `User-agent: *`** - This blocks ALL search engines
2. **NEVER remove the Sitemap directive** - Search engines need this
3. **AI crawler blocking is intentionally commented out** - We WANT AI search visibility
4. **The `Crawl-delay: 1` is for politeness** - Don't remove

### If Asked to Block AI Crawlers

The commented-out section shows how to block AI training:

```
# To block AI training (if desired):
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /
```

**Only uncomment if explicitly requested by the user.**

---

## 🛡️ Protected Integration: sitemap.xml

**File**: `public/sitemap.xml`

### What It Contains

164 URLs with specific priorities:

| Page Type | Priority | Change Frequency |
|-----------|----------|------------------|
| Homepage | 1.0 | weekly |
| Species pages | 0.9 | weekly |
| Business pages | 0.8 | monthly |
| Workflow pages | 0.8 | monthly |
| Comparison pages | 0.7 | monthly |

**⚠️ WHEN ADDING NEW PAGES:**

1. Add entry to sitemap.xml
2. Use appropriate priority (0.7-0.9 based on importance)
3. Set changefreq based on update frequency
4. Use lastmod date format: `YYYY-MM-DD`

**⚠️ NEVER:**
- Remove existing entries without explicit approval
- Change homepage priority from 1.0
- Set all pages to same priority (defeats the purpose)

---

## 🛡️ Protected Integration: Lead Capture

**Files**:
- `src/pages/api/contact.ts`
- `src/lib/server/leadCapture.ts`
- `src/components/ContactForm.astro`

### Data Flow

```
User Submits Form
       │
       ▼
POST /api/contact.ts
       │
       ├─ Validate email (required)
       ├─ Capture metadata (IP, user agent, referrer)
       ├─ Extract UTM parameters
       │
       ▼
leadCapture.ts (parallel execution)
       │
       ├─ Clearbit enrichment (if configured)
       ├─ Slack webhook notification
       ├─ HubSpot CRM creation (if configured)
       ├─ Resend email notification (if configured)
       └─ Zapier webhook (if configured)
       │
       ▼
Return success response
```

**⚠️ CRITICAL:**

1. **Email validation is required** - Never make email optional
2. **Parallel execution uses `Promise.allSettled()`** - Don't change to `Promise.all()` (one failure shouldn't break all)
3. **Slack webhook format is specific** - Test changes in #test channel first
4. **UTM capture must preserve all 5 parameters** (source, medium, campaign, term, content)

---

## 🛡️ Protected Integration: Security Headers

**Files**: `src/middleware.ts`, `vercel.json`

### Current Headers

```typescript
// middleware.ts
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
```

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**⚠️ NEVER:**
- Remove X-Frame-Options (prevents clickjacking)
- Remove X-Content-Type-Options (prevents MIME sniffing)
- Change DENY to SAMEORIGIN without approval
- Remove Permissions-Policy restrictions

---

## Environment Variables

### Naming Convention (CRITICAL)

Astro requires `PUBLIC_` prefix for client-exposed variables:

```bash
# ✅ CORRECT - Exposed to client
PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
PUBLIC_CLARITY_ID=xxxxxxxxxx

# ✅ CORRECT - Server-only (no PUBLIC_ prefix)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
CLEARBIT_SECRET_KEY=sk_...

# ❌ WRONG - Won't be exposed to client
GA4_MEASUREMENT_ID=G-XXXXXXXXXX  # Missing PUBLIC_ prefix
```

### Currently Active

| Variable | Type | Status |
|----------|------|--------|
| `PUBLIC_GA4_MEASUREMENT_ID` | Client | ✅ Active |
| `PUBLIC_CLARITY_ID` | Client | ✅ Active |
| `LEADFEEDER_TRACKER_ID` | Client | ✅ Active |
| `SLACK_WEBHOOK_URL` | Server | ✅ Active |
| `PUBLIC_SITE_URL` | Client | ✅ Active |

### Available (Not Configured)

| Variable | Type | Purpose |
|----------|------|---------|
| `PUBLIC_GTM_CONTAINER_ID` | Client | Google Tag Manager |
| `PUBLIC_META_PIXEL_ID` | Client | Facebook/Instagram |
| `PUBLIC_LINKEDIN_PARTNER_ID` | Client | LinkedIn B2B |
| `PUBLIC_TWITTER_PIXEL_ID` | Client | Twitter conversion |
| `PUBLIC_SENTRY_DSN` | Client | Error monitoring |
| `CLEARBIT_SECRET_KEY` | Server | Lead enrichment |
| `HUBSPOT_API_KEY` | Server | CRM integration |
| `RESEND_API_KEY` | Server | Email notifications |

---

## Safe vs. Protected Changes

### ✅ Safe Changes (No Special Approval Needed)

- Adding new pages using BaseLayout
- Updating page text content
- Adding/modifying Tailwind styles
- Creating new components (that don't touch analytics/SEO)
- Adding images to `/public/images/`
- Fixing typos
- Adding new FAQ items to pages

### ⚠️ Protected Changes (Ask First)

- Any change to files listed in Protected Files table
- Adding new tracking scripts
- Modifying Schema.org data
- Changing meta tag structure
- Modifying API endpoints
- Changing environment variable names
- Updating robots.txt or sitemap.xml

### ❌ Forbidden Changes (Never Do)

- Removing the `isProduction` check from Analytics.astro
- "Simplifying" the Schema.org featureList
- Changing `is:inline` scripts to imports
- Removing `define:vars` directives
- Adding `Disallow: /` to robots.txt User-agent: *
- Removing security headers
- Making email optional in contact form
- Changing `Promise.allSettled` to `Promise.all` in lead capture

---

## Testing Changes

### Development Mode

```bash
npm run dev
```

- Analytics are DISABLED (check console for "🚧 Development mode - Analytics disabled")
- All pages should render correctly
- Forms should work (but won't send to Slack in dev)

### Production Build Test

```bash
npm run build
npm run preview
```

- Analytics should load (check Network tab)
- Schema.org should be in page source
- Meta tags should be present

### Vercel Preview Deployments

- Every PR gets a preview URL
- Test analytics load on preview (they should work)
- Test form submissions go to Slack

---

## Adding New Integrations

### Step 1: Environment Variable

Add to `.env.example` with documentation:

```bash
# New Integration Name
# Purpose: What it does
# Get key at: https://example.com/settings
# Cost: FREE / $X/month
NEW_INTEGRATION_KEY=
```

### Step 2: Add to Analytics.astro (if client-side)

Follow existing pattern:

```astro
{PUBLIC_NEW_INTEGRATION_ID && (
  <script is:inline define:vars={{ integrationId: PUBLIC_NEW_INTEGRATION_ID }}>
    // Integration script
  </script>
)}
```

### Step 3: Document in .docs/

Add setup instructions to `.docs/PRE-LAUNCH-SETUP.md` or create new doc.

### Step 4: Update This Document

Add to environment variables table and integration list.

---

## Troubleshooting

### Analytics Not Loading

1. Check `import.meta.env.PROD` is true (production only)
2. Verify environment variable is set in Vercel
3. Check browser console for errors
4. Verify ad blockers aren't blocking scripts

### Schema.org Not Appearing in Google

1. Test at https://search.google.com/test/rich-results
2. Verify JSON-LD is valid (no trailing commas)
3. Check Google Search Console for errors
4. Wait 1-2 weeks for Google to re-crawl

### Leads Not Going to Slack

1. Test webhook manually with curl
2. Check Vercel function logs
3. Verify SLACK_WEBHOOK_URL is set in Vercel
4. Check Slack channel still exists

### Sitemap Not Being Indexed

1. Submit sitemap in Google Search Console
2. Verify sitemap URL is correct in robots.txt
3. Check for XML syntax errors
4. Ensure no `noindex` on important pages

---

## Related Documentation

- **[.claude/instructions.md](../.claude/instructions.md)** - Quick reference (auto-loaded)
- **[.docs/ARCHITECTURE.md](../.docs/ARCHITECTURE.md)** - Full system architecture
- **[.docs/QUICK-REFERENCE.md](../.docs/QUICK-REFERENCE.md)** - Configuration quick reference
- **[.docs/PRE-LAUNCH-SETUP.md](../.docs/PRE-LAUNCH-SETUP.md)** - Integration setup guides

---

**Last Updated**: 2026-01-21
**Maintained By**: Development Team
