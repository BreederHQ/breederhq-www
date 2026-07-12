# Fireball Agency Plan — Pre-Work Audit
*Investigations run 2026-07-12. Return this file to Claude Code before 
starting any implementation work.*

---

## GSC Zero-Click Keyword Analysis (sc-domain:breederhq.com, 28-day window)
**Status:** DONE
**Summary:** Fresh 28-day GSC pull (2026-06-14 to 2026-07-12, pulled live via the Search Analytics API on 2026-07-12 after gcloud re-auth): 30 keywords had over 20 impressions with zero clicks (none fell in the nonzero-but-under-1% CTR band), concentrated on just 8 pages. The compare page `/compare/best-dog-breeding-software` absorbs 14 of them (~710 impressions) with a dog-only title that fails generic "breeder software" intent, and the Valais Blacknose article holds page-one positions (4-9) for 9 Clarkson-related queries with zero clicks. Side finding: `/find-breeders/cats` carries the title "Find Verified Cat Breeders", which conflicts with the legally locked no-verify/vet/vouch trust posture and needs a wording fix regardless of SEO.

**Raw findings:**

Source: `scripts/seo/data/perf_scdomain_breederhq.com_page_query_20260712.csv` (breederhq monorepo). Position is impression-weighted across all pages ranking for the query; URL is the top page by impressions. All 30 keywords had 0 clicks. Title tags quoted verbatim from live pages fetched 2026-07-12.

| # | Keyword | Impr. | Pos. | Current page URL | Current title tag |
|---|---------|------:|-----:|------------------|-------------------|
| 1 | clarkson farm sheep breed | 136 | 8.8 | breederhq.com/articles/valais-blacknose-sheep | What Breed Are Jeremy Clarkson's Sheep? Valais Blacknose Explained \| BreederHQ |
| 2 | breeder software | 133 | 53.1 | breederhq.com/compare/best-dog-breeding-software | Best Dog Breeding Software 2026 — Puppy Waitlist, Deposit & Breeder Software Reviews |
| 3 | breeding software | 91 | 34.6 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 4 | dog breeding software | 81 | 18.4 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 5 | maine coon kittens for sale kansas city | 63 | 51.0 | marketplace.breederhq.com/breeders/augustmc | BreederHQ Marketplace – Breeders & Animal Service Providers |
| 6 | what breed of sheep does jeremy clarkson have | 61 | 8.6 | breederhq.com/articles/valais-blacknose-sheep | (same as #1) |
| 7 | maine coon cats for sale kansas city | 61 | 60.1 | marketplace.breederhq.com/breeders/augustmc | (same as #5) |
| 8 | best breeder software | 60 | 9.9 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 9 | ultimate dog breeding software | 47 | 14.1 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 10 | breed club software | 41 | 6.9 | breederhq.com/for-breed-clubs | Breed Club Software — Manage Members, Shows, Registrations & Stud Books |
| 11 | breeder waitlist software | 40 | 8.2 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 12 | puppy waitlist software | 40 | 15.0 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 13 | puppy deposit software | 39 | 8.6 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 14 | dog breeder software reviews | 36 | 13.8 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 15 | breeder registry software | 35 | 13.1 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 16 | clarksons farm black face sheep | 34 | 8.8 | breederhq.com/articles/valais-blacknose-sheep | (same as #1) |
| 17 | black faced sheep clarksons farm | 33 | 7.1 | breederhq.com/articles/valais-blacknose-sheep | (same as #1) |
| 18 | dog heat cycle calculator | 33 | 19.9 | breederhq.com/dog-heat-cycle-calculator | Dog Heat Cycle Calculator: How It Works \| BreederHQ |
| 19 | dog breeder software | 31 | 24.0 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 20 | what type of sheep does jeremy clarkson have | 31 | 8.1 | breederhq.com/articles/valais-blacknose-sheep | (same as #1) |
| 21 | how long do valais blacknose sheep live | 30 | 8.2 | breederhq.com/articles/valais-blacknose-sheep | (same as #1) |
| 22 | what kind of sheep does jeremy clarkson have | 28 | 9.3 | breederhq.com/articles/valais-blacknose-sheep | (same as #1) |
| 23 | dog breeder management software | 27 | 39.3 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 24 | what kind of sheep did lisa buy | 27 | 4.3 | breederhq.com/articles/valais-blacknose-sheep | (same as #1) |
| 25 | dog breeding record keeping software | 26 | 31.1 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 26 | easy mind system for cat breeders | 25 | 25.2 | breederhq.com/cats | Cat Breeding Software \| BreederHQ |
| 27 | custom software for breeders | 24 | 24.3 | breederhq.com/compare/best-dog-breeding-software | (same as #2) |
| 28 | black face sheep clarksons farm | 24 | 8.1 | breederhq.com/articles/valais-blacknose-sheep | (same as #1) |
| 29 | how to be a cat breeder | 24 | 72.2 | breederhq.com/find-breeders/cats | Find Verified Cat Breeders \| BreederHQ |
| 30 | animal breeding data analysis software | 21 | 73.6 | breederhq.com/articles/animal-genetic-history-software | The Best Genetic History Software for Breeders: Pedigrees, DNA, Coat Color, and COI |

Rewrite priority derived from the data:

1. `/compare/best-dog-breeding-software` (14 keywords, ~710 impressions). Queries at positions 8-15 with zero clicks (breeder waitlist software 8.2, puppy deposit software 8.6, best breeder software 9.9, breeder registry software 13.1) indicate a title/meta-description problem, not a ranking problem. Generic queries at position 34+ (breeder software, breeding software) need a species-neutral hub page rather than a dog compare page. Even exact-intent "dog breeding software" (81 impressions, pos 18.4) got zero clicks.
2. `/articles/valais-blacknose-sheep` (9 keywords, ~404 impressions, positions 4-9). Page one across the Clarkson query family with zero clicks; queries phrase it as "clarkson farm sheep breed" while the title leads with "What Breed Are Jeremy Clarkson's Sheep?". "what kind of sheep did lisa buy" ranks 4.3 with zero clicks.
3. `marketplace.breederhq.com/breeders/augustmc` (2 keywords, 124 impressions, positions 51-60). Breeder profile pages serve the generic marketplace title with no breeder name, species, or city. Structural fix: per-breeder dynamic title tags would benefit every marketplace profile.
4. `/for-breed-clubs` ranks 6.9 on exact-match "breed club software" (41 impressions) with zero clicks; quick meta-description/snippet review warranted.
5. `/dog-heat-cycle-calculator` (pos 19.9) and `/cats` (pos 25.2) are ranking problems, lower priority. `/find-breeders/cats` and the genetic-history article rank at position 72+ for their queries; not worth CTR work, but note the trust-posture wording issue on `/find-breeders/cats` ("Verified") which must be fixed for legal-posture reasons independent of SEO.

Delta vs the stale 2026-06-29 pull (initial version of this section): 6 keywords added (dog breeding software, black faced sheep clarksons farm, what kind of sheep did lisa buy, custom software for breeders, how to be a cat breeder, animal breeding data analysis software), 2 dropped ("jeremy clarkson sheep breed", "software developer for breeders"). Priority order unchanged.

**Recommended action:** Rewrite titles/metas for the compare page and Valais article first, ship per-breeder title tags on marketplace profiles, and separately fix the "Verified" wording on /find-breeders/cats (trust-posture compliance, not SEO).

---

## Title Tag & Meta Description Extraction: Key Marketing Pages (breederhq-www)
**Status:** DONE
**Summary:** Extracted the current `<title>` and meta description from 9 target pages (4 vs-comparison pages, the dog compare roundup, homepage, pricing, for-breeders, dogs). The vs-pages and `/dogs` lead with the keyword and are within length limits; the homepage, pricing, and for-breeders lead with the brand or a generic word instead of the search term, and three descriptions (best-dog compare ~245 chars, for-breeders ~250 chars, homepage ~175 chars) exceed the ~155-160 char SERP display limit, so their strongest hooks are truncated. All titles/descriptions are set per-page as `<BaseLayout title=... description=...>` props; BaseLayout renders them verbatim into `<title>`, meta description, and OG/Twitter tags, so no layout changes are needed (BaseLayout is a PROTECTED file regardless).

**Raw findings:**

| Page (edit location) | `<title>` | Meta description |
|---|---|---|
| `src/pages/compare/best-dog-breeding-software.astro:193` | Best Dog Breeding Software 2026 — Puppy Waitlist, Deposit & Breeder Software Reviews | Dog breeder software reviews for 2026: puppy waitlist software, puppy deposit software, breeder waitlist software, and buyer portal capabilities compared across 8 tools. BreederHQ vs. BreederBuddy, Breeder Cloud Pro & more — pricing on one page. |
| `src/pages/compare/breederhq-vs-breedercloudpro.astro:209` | BreederHQ vs Breeder Cloud Pro: The Honest 2026 Comparison | BreederHQ vs Breeder Cloud Pro compared on pricing, species, marketplace, buyer portal, OFA Sync, CHIC Readiness, Scout AI, and mobile. Publicly verifiable facts, verified July 2026. |
| `src/pages/compare/breederhq-vs-gooddog.astro:164` | BreederHQ vs Good Dog: The Honest 2026 Comparison | BreederHQ vs Good Dog compared on fees, breeder operations, buyer experience, marketplace model, and trust posture. Verified July 2026 with directly-cited customer quotes. |
| `src/pages/compare/breederhq-vs-easykeeper.astro:209` | BreederHQ vs EasyKeeper: The Honest 2026 Comparison | BreederHQ vs EasyKeeper compared on pricing, species coverage, dairy tracking, marketplace, buyer portal, and mobile for goat breeders. Verified July 2026. |
| `src/pages/compare/breederhq-vs-everbreed.astro:197` | BreederHQ vs Everbreed: The Honest 2026 Comparison | BreederHQ vs Everbreed compared on pricing, species, mobile apps, marketplace, buyer portal, financial tracking, and automation for rabbit breeders. Verified July 2026. |
| `src/pages/index.astro:107` (homepage) | BreederHQ - Professional Breeding Management Software | Breeding management software for breeders of dogs, cats, horses, goats, alpacas, llamas, rabbits, sheep, and cattle. Pedigrees, genetics, health testing, waitlists, and more. |
| `src/pages/pricing/index.astro:109` (note: pricing is a directory, not `pricing.astro`) | Pricing - BreederHQ Breeding Management Software | Simple, transparent pricing for professional breeders. Start your 14-day free trial today. Plans from $29/month. Founders get 50% off Pro & Enterprise. |
| `src/pages/for-breeders.astro:49` | BreederHQ for Breeders - Professional Breeding Management Software | Breeding-program management software for nine species: dogs, cats, horses, goats, sheep, cattle, alpacas, llamas, rabbits. Health records, breeding planner, finances, buyer portal, and a public marketplace in one platform. 14-day free trial from $29/mo. |
| `src/pages/dogs.astro:83` | Dog Breeding Software \| BreederHQ | Dog breeding software built for serious breeders. Track cycles, manage pedigrees, organize health testing, communicate with buyers. |

Prop flow (where to edit): `BaseLayout.astro` takes required `title` and `description` string props (destructured at line 104) and renders them verbatim in three places: `<title>` + `<meta name="description">` (lines 414-415), `og:title`/`og:description` (lines 435-436), and `twitter:title`/`twitter:description` (lines 450-451). There is no suffix template or truncation in the layout. One edit to the `<BaseLayout ...>` call in each page updates all three surfaces.

Evaluation notes:
- Keyword-leading and correct length: `/dogs` ("Dog Breeding Software | BreederHQ") and all four vs-pages (comparison query first, under ~60 chars).
- Brand-first or generic-first (keyword buried): homepage and for-breeders lead with "BreederHQ"; pricing leads with the word "Pricing". Matters only for the non-brand queries these pages are expected to rank for.
- SERP truncation: best-dog compare title is ~85 chars (cut around "Deposit &..."); its description is ~245 chars. for-breeders description is ~250 chars, so the "$29/mo + 14-day trial" hook at the end is never displayed. Homepage description is ~175 chars, slightly over.
- Reason-to-click: pricing and for-breeders have concrete hooks (price, trial, founder discount) but the for-breeders hook is truncated out. Homepage description is a flat feature list with no differentiator. The vs-pages' "Honest 2026 Comparison" / "Verified July 2026" framing is a decent trust hook.
- Cross-reference: this confirms the GSC section's #1 priority. The best-dog compare page title that absorbs 13 zero-click keywords is both over-length and dog-only for generic "breeder software" queries.
- Housekeeping: the best-dog title and description both contain em dashes, which conflicts with the no-em-dash content rule; reword when touched.

**Recommended action:** Rewrite the best-dog compare title/meta first (over-length + wrong intent for its biggest queries), trim for-breeders and homepage descriptions to under ~160 chars leading with the keyword and keeping the price/trial hook visible, and leave the four vs-pages and `/dogs` largely as-is.

---

## Internal Link Audit: Inbound Links to /compare and /compare/best-dog-breeding-software (breederhq-www)
**Status:** DONE
**Summary:** The homepage, /pricing, and /for-breeders all already carry contextual body links to /compare/best-dog-breeding-software, so the biggest equity sources are covered. The two real gaps are /dogs, which links only to /compare/breederhq-vs-spreadsheets and never to the dog buyer's guide (every other species hub links its own species guide), and the article library, where only 6 of 23 articles link to any /compare page. The /compare hub itself has zero contextual inbound links; it is reachable only via the sitewide footer and breadcrumbs on /compare/* leaf pages.

**Raw findings:**

Scope: grep for `/compare` across all `.astro` and `.tsx` files in breederhq-www. Excluded from the tables: `/pricing/compare` (different page, the plan-comparison matrix), breadcrumb/related-link plumbing inside `/compare/*` pages themselves, and the `site-updates` changelog pages (noindex).

Sitewide footer (`src/components/Footer.astro:132-135`, on every page):
- "Compare" → /compare
- "Best Breeding Software" → /compare/best-breeding-software
- "Best Dog Breeding Software" → /compare/best-dog-breeding-software
- "BreederHQ vs Spreadsheets" → /compare/breederhq-vs-spreadsheets

Contextual body links to /compare/best-dog-breeding-software:

| Page | Location | Anchor text |
|---|---|---|
| / (homepage) | `src/pages/index.astro:205` | Card titled "Dog Breeding Software" ("Compare the eight dog breeding software tools real breeders shortlist in 2026") |
| /pricing | `src/pages/pricing/index.astro:136` | "dog breeding software" |
| /for-breeders | `src/pages/for-breeders.astro:733` | "Dog breeding software compared: BreederHQ vs. seven alternatives" (plus a plain-text URL mention in the FAQ answer at line 39 — NOT a crawlable link) |
| /breeder-management-software | line 338 | "buyer's guide for dog breeding software" |
| /tools/puppy-application-builder | line 473 | link in closing CTA section |
| /articles/animal-genetic-history-software | lines 478, 600 | "compare multiple platforms" (x2) |
| /articles/breeder-communication-platforms | line 299 | "legacy desktop software" |
| /articles/breeder-crm | line 398 | "best dog breeding software" (also links "best goat breeding software" to the goat guide) |
| /articles/breeder-email-templates | line 431 | "Dedicated breeder software" |
| /articles/cloud-breeder-software | line 527 | "focus exclusively on dogs" |
| /articles/litter-reservation-platforms | line 487 | "dog-only" |
| 7 pages under /compare/* (breederbuddy-, breedercloudpro-, dogbreederpro-, breeders-assistant-, zooeasy-alternative, breederhq-vs-gooddog, breederhq-vs-breedercloudpro) | various | "our dog breeding software comparison" |

Species hubs link their own species guides (correct pattern): /cats → best-cat (line 577), /horses → best-horse (line 1007), /goats → best-goat (secondary CTA, line 536), /cat-cattery-software → best-cat, /horse-breeding-software → best-horse, /workflows/kidding-management → best-goat.

Links to the /compare hub itself: footer only, plus breadcrumbs inside /compare/* pages. No contextual body link anywhere on the site points at the hub.

High-traffic pages NOT linking to /compare/best-dog-breeding-software:
1. **/dogs** (`src/pages/dogs.astro:724`) — links only "→ BreederHQ vs. Spreadsheets". The dog hub is the ONLY species hub that does not link its own species buyer's guide.
2. **17 of 23 articles have zero /compare links.** Dog/general-relevant ones where a link fits naturally: puppy-deposit-refund-rules-by-state, puppy-health-guarantee-what-it-covers, litter-tracking-software, breeding-management-software, buyer-application-tools, buyer-screening-tools, breeder-email-automation, email-automation-tools-for-breeders, ai-is-only-as-good-as-your-records, breeder-software-has-a-data-problem, pyometra-in-breeding-females. Goat articles (dairy-goat-record-keeping-software, goat-herd-health-software, goat-kidding-tracking-software, goat-kid-deposit-and-sale-terms, goat-kid-health-guarantee-what-it-covers) fit best-goat-breeding-software better; valais-blacknose-sheep fits best-sheep. The articles index page also has no compare link.

Related context: the 2026-06-26 site-update fragment (`_site-updates/2026-06-26-breeder-management-software-lp.astro`) records a deliberately deferred reciprocal-link sweep touching /, /for-breeders, /pricing, and the /compare/best-X-software pages. Any link pass from this audit should bundle with that sweep as one atomic commit.

**Recommended action:** Add the best-dog buyer's-guide link to /dogs (matching the other species hubs) and sweep the 11 dog/general articles with one contextual link each; skip homepage/pricing/for-breeders (already linked) and bundle with the deferred Cluster A reciprocal-link sweep.

---

## Article Outbound Internal Link Audit: src/pages/articles/ (breederhq-www)
**Status:** DONE
**Summary:** All 23 articles (plus the index hub) were inventoried for outbound internal links. Every article has at least some internal links (all link to /articles and /), but 3 articles link to zero feature, workflow, species, or compare pages, 16 of 23 have no /compare link, and 12 of 23 have no species-page link. The goat cluster (5 articles) links /goats consistently but 4 of the 5 never link a workflow or the best-goat-breeding-software guide. Note: partial overlap with the "Internal Link Audit: Inbound Links to /compare" section above; this section is the per-article outbound view and adds the feature/workflow/species dimensions.

**Raw findings:**

Classification used: workflow pages = /workflows/*; feature pages = standalone feature landers (/puppy-application-management, /heat-cycle-tracking, etc.); species pages = /dogs, /cats, /horses, /goats, /sheep, /rabbits, /cattle, /alpacas, /llamas; compare = /compare/*. Free tools (/tools/*) and audience pages (/for-breeders, /buyers/*) were tracked but not counted as feature pages.

| Article slug | Has internal links? | Links to /compare? | Links to feature/workflow page? | Links to species page? |
|---|---|---|---|---|
| ai-is-only-as-good-as-your-records | Yes (only /for-breeders + articles) | NO | NO | NO |
| animal-genetic-history-software | Yes | YES (best-dog x2) | YES (3 workflows) | YES (dogs, horses) |
| breeder-communication-platforms | Yes | YES | YES (3 workflows + puppy-app-mgmt) | NO |
| breeder-crm | Yes | YES (dog, goat) | YES (3 workflows + puppy-app-mgmt) | YES (sheep, horses, goats) |
| breeder-email-automation | Yes | NO | YES (4 workflows + puppy-app-mgmt) | NO |
| breeder-email-templates | Yes | YES | YES (puppy-app-mgmt; no /workflows) | NO |
| breeder-software-has-a-data-problem | Yes | NO | YES (6 workflows) | NO |
| breeding-management-software | Yes | NO | YES (4 workflows + puppy-app-mgmt) | NO |
| buyer-application-tools | Yes | NO | YES (1 workflow + puppy-app-mgmt) | NO |
| buyer-screening-tools | Yes | NO | YES (3 workflows) | NO |
| cloud-breeder-software | Yes | YES | YES (4 workflows + puppy-app-mgmt) | NO |
| dairy-goat-record-keeping-software | Yes | NO | NO | YES (goats x2) |
| email-automation-tools-for-breeders | Yes | NO | YES (1 workflow) | YES (dogs) |
| goat-herd-health-software | Yes | NO | NO | YES (goats x2) |
| goat-kid-deposit-and-sale-terms | Yes | NO | NO | YES (goats) |
| goat-kid-health-guarantee-what-it-covers | Yes | NO | NO | YES (goats) |
| goat-kidding-tracking-software | Yes | NO | YES (kidding x2 + 3 more) | YES (goats x2, dogs) |
| litter-reservation-platforms | Yes | YES | YES (4 workflows) | NO |
| litter-tracking-software | Yes | NO | YES (3 workflows) | YES (dogs) |
| puppy-deposit-refund-rules-by-state | Yes (only /buyers/* + articles) | NO | NO | NO |
| puppy-health-guarantee-what-it-covers | Yes (only /buyers/* + articles) | NO | NO | NO |
| pyometra-in-breeding-females | Yes | NO | YES (/heat-cycle-tracking x2) | NO |
| valais-blacknose-sheep | Yes | NO | YES (3 workflows) | YES (sheep) |

(index.astro is the article hub; it links only to / plus article cards, which is expected.)

Key gaps:

1. Complete orphans (zero links to any of the four categories, 3 articles): ai-is-only-as-good-as-your-records (only /for-breeders; /workflows/scout-ai and /workflows/breeding-intelligence are obvious fits), puppy-deposit-refund-rules-by-state and puppy-health-guarantee-what-it-covers (both link only /buyers/* buyer-education pages; no /dogs, no compare, no /workflows/waitlists-and-placement despite high-intent legal topics).
2. Goat cluster: dairy-goat-record-keeping-software, goat-herd-health-software, goat-kid-deposit-and-sale-terms, goat-kid-health-guarantee-what-it-covers all link /goats but none link /workflows/kidding-management, /workflows/medication-tracking, or /compare/best-goat-breeding-software, all of which exist and are directly relevant.
3. Compare concentration: only 7 articles link any /compare page and 6 of those point at best-dog-breeding-software. best-goat-breeding-software gets one article link total; best-sheep-breeding-software gets zero despite the Clarkson-traffic Valais article being a natural feeder.
4. Species misses: every dog-adjacent listicle (litter-reservation-platforms, buyer-application-tools, buyer-screening-tools, both breeder-email articles) skips /dogs.

**Recommended action:** Fix the 3 orphan articles and the 4 goat articles first (workflow + compare links), add a best-sheep link to the Valais article, then fold the remaining per-article compare/species links into the article sweep already recommended in the inbound /compare audit section so it ships as one pass.

---

## Google Ads Conversion Tag & Conversion Signal Audit (breederhq-www)
**Status:** DONE
**Summary:** There is no working Google Ads conversion tag anywhere in the www codebase. The only `gtag('event', 'conversion', ...)` call carries the literal placeholder `send_to: 'AW-CONVERSION-ID'` that was never replaced, and it only fires on contact-form submits, so Google Ads silently drops it. GTM loader code exists but `PUBLIC_GTM_CONTAINER_ID` is unconfigured, so GTM never loads and there is no GTM container hiding tag config; the `free_trial_started` and `account_created` conversion events fire on accounts.breederhq.com (shipped 2026-06-22), not from www, meaning Ads conversion measurement currently depends entirely on GA4-imported conversions.

**Raw findings:**

| Signal | Present in code? | Actually firing? | Notes |
|---|---|---|---|
| Google Ads conversion tag (`AW-` ID) | Placeholder only | NO | `src/lib/tracking.ts:126-127` — `gtag('event', 'conversion', { send_to: 'AW-CONVERSION-ID', ... })` with comment "Replace with actual conversion ID". Never replaced. Only call path: `trackFormSubmit()` → `trackConversion()`, wired solely to ContactForm (`src/components/ContactForm.astro:506`). No real `AW-` account ID anywhere in the repo. |
| GTM container | Loader code only | NO | `src/components/Analytics.astro:70-80` gated on `PUBLIC_GTM_CONTAINER_ID`; env var blank in `.env.example`, repo CLAUDE.md lists GTM as "Available But Not Configured". GA4 gtag.js (via `PUBLIC_GA4_MEASUREMENT_ID`) is the tag container, not GTM. If GTM were ever enabled, its tag config would live in the GTM UI, not code — moot today. |
| `free_trial_started` | Comments only | Not from www | Fires on accounts.breederhq.com per site-update fragment `2026-06-23-paid-traffic-hero-cta-on-species-pages.astro` (shipped 2026-06-22 as GA4 events). www contributes attribution plumbing only: GA4 cross-domain linker (`Analytics.astro:43-52`, www → accounts → app → marketplace) + query-string forwarding in PaidTrafficHero. |
| `account_created` | Comments only | Not from www | Same as above — GA4 event on accounts.breederhq.com. |
| `pricing_view` GA4 event (2026-06-29 fix) | YES | YES (prod only) | `src/pages/pricing/index.astro:396-424` — custom event, prod-only, hostname-gated to breederhq.com/www.breederhq.com, 15×200ms retry poll to beat the gtag.js async race. Matches the described fix. |

What IS firing on www in production: GA4 auto `page_view`; `pricing_view` on /pricing; `trackEvent`-based CTA clicks, scroll depth (25/50/75/100%), time-on-page (30s/60s/180s), form start/submit (via TrackingInit + ContactForm); Microsoft Clarity; Leadfeeder; Ahrefs (hardcoded key). Meta/LinkedIn/Twitter pixels and Sentry: code present, env vars unconfigured, inert.

**Recommended action:** Before any Google Ads spend, either create a real Ads conversion action and replace the `AW-CONVERSION-ID` placeholder (or delete the dead code), and confirm the GA4 `free_trial_started`/`account_created` events on accounts.breederhq.com are imported as conversions in the Google Ads account — nothing in this repo currently reports a conversion to Ads.

---

## Article H1 & Answer-First Opening Audit: Top 8 Articles by Depth (src/pages/articles/)
**Status:** DONE
**Summary:** The 8 largest articles by file size were checked for question-phrased H1s and answer-first openings. None of the 8 use a question H1 (all are topic/category labels), but 6 of 8 already open with a direct definitional answer in the styled lede paragraph under the H1, so they need no restructure. Only 2 articles pair a label H1 with a context-first opening and are true restructure candidates: valais-blacknose-sheep (narrative Clarkson scene-setting before any facts) and pyometra-in-breeding-females (definition buried under a disclaimer and two framing paragraphs).

**Raw findings:**

Method: top 8 by file size as a depth proxy (file size includes markup and large tables, so approximate). "Opening" = the styled lede paragraph directly under the H1 plus the first body paragraphs, since that is the first content readers and AI crawlers encounter.

| Article (size) | H1 | H1 a question? | Direct answer first? | Opening (condensed) |
|---|---|---|---|---|
| pyometra-in-breeding-females (56KB) | Pyometra in Breeding Females: The Emergency Every Breeder Should Know About | No (topic label + tagline) | **NO** | Lede: "Pyometra is common, it moves fast, and it can be fatal..." Body opens "If you breed animals long enough, you will eventually face a reproductive emergency," then an audience-framing paragraph. Definition ("serious infection of the uterus affecting intact, unspayed females") delayed until the first H2 section, after a disclaimer. |
| puppy-deposit-refund-rules-by-state (48KB) | Puppy Deposit Refund Rules by State | No (reference label) | Mostly yes | "Most puppy buyers find out the hard way that deposits are governed by two layers of law... The contract usually wins." Substantively answers "is my deposit refundable" in sentence one. |
| breeding-management-software (48KB) | Breeding Management Software for Animal Breeders: Programs, Litters, Pedigrees, and Buyer Pipelines | No (category label) | YES | "Breeding management software is a digital platform that centralizes animal records, breeding plans, health data, pedigrees, and buyer workflows in one connected system..." Textbook definitional lede. |
| valais-blacknose-sheep (44KB) | Valais Blacknose Sheep: The Clarkson's Farm Breed Everyone Suddenly Wants | No (label + hook) | **NO** | "Since Valais Blacknose sheep appeared at Diddly Squat Farm on Clarkson's Farm, one fluffy, black-faced breed has been quietly stealing scenes..." Pure scene-setting; substantive facts live in a Quick Facts box below a hero image and two narrative paragraphs. |
| goat-kidding-tracking-software (44KB) | Goat Kidding Tracking Software: How Goat Breeders Record Kidding Dates, Weights, FAMACHA, and Tattoos | No (label) | YES | "Goat kidding software records every data point about kids from birth through placement: kidding dates, daily weights, FAMACHA and FEC on the dam, disbudding and tattoo records, and buyer assignments..." |
| puppy-health-guarantee-what-it-covers (44KB) | Puppy Health Guarantee: What It Actually Covers (and What It Doesn't) | No, but question-adjacent | YES | "'Health guarantee' sounds like a money-back promise. It usually isn't. In most puppy contracts, the health guarantee is a narrow clause that covers a short list of named conditions..." Strongest answer-first opening of the eight. |
| animal-genetic-history-software (40KB) | Animal Genetic History Software: How Breeders Track Pedigrees, DNA Results, Coat Color, and COI | No (label) | YES | "Genetic history software for animal breeders is a system that stores pedigrees, DNA test results, and inherited trait data in one place... It calculates coefficient of inbreeding, predicts offspring coat colors, and flags lethal gene pairings." Ancestry/MyHeritage disambiguation follows the answer, not before it. |
| cloud-breeder-software (40KB) | Cloud-Based Breeder Software: Tools for Managing Programs, Litters, and Buyers From Any Device | No (label) | YES | "Cloud-based breeder software stores your program data on remote servers and lets you access it from any device with internet, replacing the desktop tools and spreadsheets that lock your records to one machine..." |

Restructure candidates (label H1 AND context-first opening):

1. **valais-blacknose-sheep** — clearest candidate. The query cluster ("what are Valais Blacknose sheep," "what breed of sheep on Clarkson's Farm," cost/lifespan queries) gets no direct answer until the Quick Facts box. An answer-first lede (breed definition + cost range + care level) before the Clarkson hook would fix it without losing the editorial voice. Cross-reference: the GSC section shows this exact page holding positions 4-9 on 9 Clarkson queries with zero clicks, so the opening restructure and the title/meta rewrite should ship together.
2. **pyometra-in-breeding-females** — the definition is buried under a disclaimer, an audience paragraph, and a "why this matters" section. For "what is pyometra" queries the answer should lead; the Clarkson anecdote and framing can follow.

Not flagged: the five software/category articles all follow a consistent answer-first definitional lede pattern despite label H1s, and the two puppy legal articles answer directly up front.

**Recommended action:** Restructure only valais-blacknose-sheep (bundle with its GSC title/meta rewrite) and pyometra-in-breeding-females to lead with the answer; leave the other six openings as-is.

---

## JSON-LD Schema Audit: /compare Index & Pillar Pages vs. the Four /vs Pages (breederhq-www)
**Status:** DONE
**Summary:** The best-dog pillar is the best-schema'd page in the directory (Article + ItemList + a dog-specific SoftwareApplication, plus layout-provided FAQPage/BreadcrumbList), so it is NOT the gap. The real gaps are the /compare hub (only compare page with no FAQPage, and no Article/ItemList/CollectionPage of its own) and the five other species pillars (best-breeding-software, cat, goat, horse, rabbit, sheep) which have zero inline schema. Important context: BaseLayout.astro unconditionally emits Organization + the site-wide BreederHQ SoftwareApplication on every page, and emits BreadcrumbList/FAQPage whenever a page passes breadcrumbs/faqs props — so page files alone understate what ships.

**Raw findings:**

| Schema | /vs pages (x4) | best-dog pillar | /compare hub (index.astro) | other best-* pillars (x6) | *-alternative pages (x5) |
|---|---|---|---|---|---|
| SoftwareApplication (BreederHQ, site-wide via BaseLayout) | yes | yes + page-specific dog variant | yes (site-wide only) | yes (site-wide only) | yes (site-wide only) |
| Competitor @graph (SoftwareApplication/Organization + Reviews + pricing Offers) | yes | no | no | no | no |
| FAQPage (via faqs prop) | yes | yes | **NO — only compare page missing it** | yes | yes |
| BreadcrumbList (via breadcrumbs prop) | yes | yes | yes | yes | yes |
| Article (inline) | yes | yes | no | no | yes |
| ItemList (inline) | no | yes (8 compared products) | no | no | no |

Details:
- The four /vs pages (breedercloudpro, easykeeper, everbreed, gooddog) each ship an inline Article schema plus a `competitorReviewGraph` — a true `"@graph"` containing the competitor's SoftwareApplication with per-tier pricing Offers (UnitPriceSpecification) and 4-7 sourced Review nodes (Capterra, BBB, app stores). vs-gooddog models Good Dog as Organization instead of SoftwareApplication (it's a marketplace, not software).
- best-dog-breeding-software.astro (lines 100-202): inline Article, ItemList of 8 products, and a page-specific SoftwareApplication with applicationSubCategory "Dog Breeding Software", dog featureList, and a free-trial Offer.
- compare/index.astro: passes breadcrumbs but NOT faqs; no inline schema of any kind.
- best-breeding-software + best-cat/goat/horse/rabbit/sheep, breederhq-vs-spreadsheets, sniffspot-alternative: no inline schema; layout-provided set only.
- The five *-alternative pages (breederbuddy, breedercloudpro, breeders-assistant, dogbreederpro, zooeasy): inline Article only, no @graph.
- Flag: best-dog emits TWO SoftwareApplication nodes for BreederHQ (site-wide + page-specific) that are not @id-linked. Google tolerates it, but dedupe or wire @id if replicating the pattern.
- BaseLayout.astro is a PROTECTED file (per breederhq-www CLAUDE.md) — any schema changes there need explicit approval; page-level additions are the safe path.

**Recommended action:** Add faqs + an ItemList/CollectionPage schema to /compare index, and clone the best-dog inline-schema pattern (Article + ItemList + species-specific SoftwareApplication) to the six bare pillar pages; the /vs pages and best-dog need nothing.

---

## BreederBuddy Competitor Research: Is a /compare/breederhq-vs-breederbuddy Page Worth Building?
**Status:** DONE (with one gap: no keyword-tool volume data — demand assessed from proxy signals only)
**Summary:** BreederBuddy (breederbuddy.com) is a ~18-month-old solo-founder dog breeding tool (public launch early 2025) with zero Capterra reviews, zero indexed Reddit/forum discussion, no independent listicle coverage, and placeholder "0+" stats still live on its own homepage. Search demand for the brand — and especially for "breederbuddy alternative" — is almost certainly too thin to justify a dedicated vs page. Important context: breederhq-www ALREADY ships `/compare/breederbuddy-alternative.astro` (live since 2026-07-07) and includes BreederBuddy as a row on `/compare/best-dog-breeding-software`, so the thin demand that exists is already covered.

**Raw findings:**

| # | Question | Finding |
|---|----------|---------|
| 1 | Website | https://breederbuddy.com — solo founder ("Kenny"), built ~3 years in stealth, public launch early 2025 |
| 2 | Search volume | No hard numbers obtainable via web search (needs GKP/Semrush). Proxy signals all point to negligible volume: 0 Capterra reviews; G2 listing exists but blocked fetch; zero Reddit/forum mentions indexed; homepage still shows placeholder "0+" usage stats; the only pages targeting "BreederBuddy alternative" are auto-generated SourceForge/Slashdot aggregator pages — no human-written content targets the term. Prediction (unverified): brand term under ~500/mo, "breederbuddy alternative" near zero |
| 3 | Listicle presence | Auto-generated aggregators only (Capterra, G2, SourceForge, Slashdot). NOT in the one independent 2026 listicle found (Built By Dusty kennel software roundup — which also omits BreederHQ). Their only "best of 2026" appearances are self-published posts on their own blog |
| 4 | Species | Dogs, plus a cat mode toggled in Settings > Preferences. All marketing is dog-only; Capterra categorizes as dog-only. No other species |
| 5 | Pricing | Public but inconsistent across sources (recent price increases likely): live homepage $29.99/mo or $300/yr + $29.99/mo website add-on; Capterra still lists $14.99/mo; older snippet $12.49/mo. Flat rate, no per-dog limits, referral discount ($5/mo per referral) |

Site-side context discovered during this investigation:
- `/compare/breederbuddy-alternative.astro` already exists in breederhq-www (site-updates fragment dated 2026-07-07). Per the JSON-LD audit section above, it carries inline Article schema only, no @graph.
- BreederBuddy is already a named competitor on `/compare/best-dog-breeding-software` (one of the 8 tools compared, named in its meta description).

**Recommended action:** Skip the dedicated /compare/breederhq-vs-breederbuddy page — demand is too thin and the existing breederbuddy-alternative page plus the best-dog pillar row already capture it; revisit in 6-12 months if reviews/forum chatter appear. (Optional: one GKP/Semrush lookup of "breederbuddy" would confirm the volume call. Separate lead worth pursuing: BreederHQ is absent from Built By Dusty's independent 2026 kennel-software listicle — outreach there likely beats any vs-BreederBuddy page.)

---

## Full-Page Read: Compare Links on Homepage (index.astro) and /pricing (pricing/index.astro)
**Status:** DONE
**Summary:** Both pages already link to /compare/best-dog-breeding-software with contextual body links, so no compare link needs to be forced onto either page. NOTE: this substantially overlaps the "Internal Link Audit: Inbound Links to /compare" section above, which already recorded the homepage and pricing links sitewide — this section adds only the full-page detail: exact anchor placement, the pricing hero's five *-alternative links, and candidate spots for a link to the /compare hub itself (which still has zero contextual inbound links anywhere on the site).

**Raw findings:**

Homepage (`src/pages/index.astro`, 964 lines, read in full):
- ONE link to /compare/best-dog-breeding-software at lines 204-214, in the sub-hero 4-card SEO strip directly below the hero. Card-style link; effective anchor is the card heading "Dog Breeding Software" with supporting copy "Compare the eight dog breeding software tools real breeders shortlist in 2026."
- ZERO links to the /compare hub. Natural placements if wanted:
  1. The "Not Just a Listing Site. Not Just a Breeding App." section (lines 646-734) — a three-column listing-sites vs. breeding-software vs. BreederHQ comparison with no outbound link at all; a closing "See detailed head-to-head comparisons →" would feel native.
  2. The "Explore by job" small-link row (lines 795-802) — add a fourth item alongside Breeder management software · Breeder CRM · Litter management.
  3. (Not recommended) retarget the line-204 card from best-dog to the hub — best-dog is the higher-value SEO target per the GSC section; leave it.

/pricing (`src/pages/pricing/index.astro`, 425 lines, read in full) — hero is already compare-link saturated:
- Line 131: "See full feature comparison →" goes to **/pricing/compare** (plan-tier matrix), NOT the competitor /compare hub — do not confuse the two.
- Lines 135-138: "Shopping around? See how we stack up in our **dog breeding software** comparison." → /compare/best-dog-breeding-software.
- Lines 148-155: "Switching from another tool? Honest comparisons:" → five links: /compare/breedercloudpro-alternative, /compare/breederbuddy-alternative, /compare/dogbreederpro-alternative, /compare/breeders-assistant-alternative, /compare/zooeasy-alternative.
- ZERO links to the /compare hub. Candidate placements: append "or browse all comparisons" to the lines-148-155 sentence, or add a pricing FAQ ("How does BreederHQ compare to other breeding software?") whose answer links /compare — the FAQ route also feeds the page's FAQPage schema.
- Caution: the pricing hero already stacks four consecutive small-print link paragraphs (lines 128-155); adding a fifth block would read as a link farm. Fold any hub link into an existing line.

**Recommended action:** Skip adding best-dog links to both pages (already present); if the /compare hub needs contextual inbound equity, add one link inside the homepage's existing comparison section (lines 646-734) and fold one into the pricing "Switching from another tool?" line — nothing more.

---
