# Marketing Screenshots — Validation List for Carie

**Captured:** 2026-04-28 (light mode, 1440px viewport, 1x DPI — dropped from 2x to keep PNGs under the 2000px many-image limit for AI review)
**Demo tenant:** Cedar Ridge Kennels (slug `screenshots-demo`)
**Source:** auto-captured by `npm run screenshots:capture` from breederhq-www, against the `screenshots-demo` seed in `breederhq-api/scripts/seeding/screenshots-demo/`

---

## What I need you to verify, per shot

For each screenshot, please confirm:

1. **Accuracy** — Does the page correctly represent the feature it's selling? Anything labeled wrong, mislabeled, or out of date?
2. **Marketing-quality** — Looks polished and breeder-friendly? No empty/embarrassing states, no broken UI, no debug banners?
3. **Brand consistency** — Light theme matches www site, BreederHQ orange used appropriately, no accidental dark-theme leftovers?
4. **Caption fit** — The italic caption I wrote underneath each screenshot on the marketing page — does it accurately describe what the buyer is seeing?

If anything's off, call it out by **shot id** (the kebab-case key in the table below). I'll fix the seed or recapture as needed.

---

## The 21 captured shots

| Shot ID | What it shows | Marketing pages where it appears | My note |
|---|---|---|---|
| `platform-dashboard` | Logged-in dashboard — first thing a breeder sees | Homepage hero, /for-breeders, /workflows | Hero shot. Marketing-quality. |
| `animals-list` | Animals list — 6 dogs with breed, sex, status, tags | /for-breeders, /workflows, /compare/breederhq-vs-spreadsheets | Marketing-quality. |
| `breeding-plans-list` | Breeding plans — Marlow×Hudson + Willow×Hudson with phase progress | /workflows/breeding-plans, /workflows/breeding-cycles, /for-breeders | Marketing-quality. |
| `breeding-calendar` | April 2026 calendar with breeding events | /workflows/breeding-cycles, /workflows/heat-tracking | Marketing-quality. |
| `offspring-list` | Litter view — 7 puppies with collar colors + placement state | /workflows/offspring-care, /for-breeders | **Best shot.** Genuinely marketing-grade. |
| `contacts-list` | Contacts — buyers, prospects with marketplace activity | /workflows/client-management | Marketing-quality. |
| `finance-invoices` | Invoice ledger — INV-2026-001 paid | /workflows/invoicing-expenses | Marketing-quality. |
| `animal-detail-overview` | Willow's detail — breed, DOB, microchip, breeding status, due date | /for-breeders, /compare/breederhq-vs-spreadsheets, /dogs | Marketing-quality. Note: drawer modal shape, dimmed backdrop. |
| `animal-pedigree` | Willow's lineage tab — sire/dam/grandparents tree | /workflows/pedigrees, /for-breeders | Marketing-quality. |
| `animal-genetics` | Willow's genetics tab — Embark panel + coat color loci | /workflows/genetics-and-health-testing, /workflows/breeding-intelligence, /workflows/scout-ai | Marketing-quality. |
| `breeding-plan-journey` | Plan phase pipeline — Planning → Cycle → Bred → **Birth** active → Weaned → … | /workflows/breeding-plans, /workflows/breeding-intelligence, /for-breeders | Marketing-quality. |
| `breeding-plan-buyers` | Plan Buyers tab — 3 buyers assigned (David, Olivia, Sarah) with pick order, match status, deposit, balance | /workflows/waitlists-and-placement | Marketing-quality. |
| `contact-detail` | Sarah Johnson contact drawer — sales pipeline, animals, finances tabs | /workflows/client-management, /for-breeders | Real, but only first/last name + email populated. Could enrich seed later for richer demo. |
| `sales-pipeline` | Pipeline stages — Inquiry, Next Step Sent — KPI cards | /workflows/client-management | Marketing-quality. |
| `invoice-detail` | INV-2026-001 detail — line items, payment history | /workflows/invoicing-expenses | Marketing-quality. |
| `finance-dashboard` | Finance home — Getting Started + Outstanding/Overdue at $0 | /workflows/invoicing-expenses, /for-breeders | Acceptable. Empty-state shot — not the strongest marketing shot but honest. **Skipped enrichment per Aaron.** |
| `comms-hub-inbox` | Communications Hub — buyer message threads (Sarah, Olivia) | /workflows/communications-hub, /for-breeders | Marketing-quality. |
| `waitlist-list` | Approved waitlist — Olivia + David on Willow×Hudson plan | /workflows/waitlists-and-placement | Marketing-quality. |
| `marketplace-breeder-profile` | Public Cedar Ridge marketplace profile | Homepage, /for-breeders, /buyers/why-breederhq-marketplace, /find-breeders/dogs | Marketing-quality. |
| `portal-buyer-home` | Buyer's portal Overview — Sarah's dashboard, Cedar Ridge branded | /workflows/client-portal, /for-breeders, /buyers | Marketing-quality. |
| `portal-buyer-animals` | Buyer's My Animals — Sarah's puppy Maple with RESERVED badge | /workflows/client-portal, /for-breeders, /buyers | Marketing-quality. **Minor copy bug:** says "1 records" instead of "1 record" — non-blocking, file under engineering. |

---

## How to view the live placements

```bash
cd breederhq-www
npm run dev
# open http://localhost:4321
```

Then visit each marketing page in the right column above to see the screenshot in context with its caption.

---

## How to refresh a shot if you find an issue

1. **If the seed needs to change** (e.g. enrich contact data, populate buyers, etc.) — edit `breederhq-api/scripts/seeding/screenshots-demo/seed-screenshots-demo.ts` and rerun `npm run db:dev:seed:screenshots`.
2. **If the URL/click pattern needs to change** — edit `breederhq-www/scripts/capture-screenshots/manifest.ts`.
3. **Recapture:**
   ```bash
   cd breederhq-www
   npm run screenshots:capture -- --id=breeding-plan-buyers   # single shot
   npm run screenshots:capture                                  # all shots
   ```

---

## Horse-specific shots (Willow Creek Equine — `horses-demo` tenant)

A second seed tenant covers a Quarter Horse breeding program. Login: `horses@breederhq.com / Willow!Creek#2026`. Seeded via `npm run db:dev:seed:horses` from breederhq-api.

| Shot ID | What it shows | Marketing pages where it appears | My note |
|---|---|---|---|
| `horse-platform-dashboard` | Equine breeder dashboard with **Mare Status Overview** (Overdue/Imminent/Due/Pregnant), Foals YTD, Season Bookings | /horses | Marketing-quality. Horse-specific UI clearly different from dog dashboard. |
| `horse-animals-list` | 9 horses card view — Quarter Horse mares, stallions, foals | /horses | Marketing-quality. |
| `horse-breeding-plans-list` | Plans with Planning/Plans/**Foaling** tabs (horse-specific vocabulary) | /horses, /workflows/breeding-plans | Marketing-quality. |
| `horse-breeding-plan-journey` | Dakota × Cimarron 2026 — phase pipeline with Birth Phase active, Birth Checklist tab | /horses, /workflows/breeding-intelligence | Marketing-quality. |
| `horse-animal-detail` | Dakota broodmare detail — Currently Breeding, Due 12/4/2026 | /horses | Marketing-quality. |
| `horse-animal-pedigree` | Dakota's 3-gen pedigree — Sundance × Juniper Star, grandparents linked | /horses, /workflows/pedigrees | Marketing-quality. |
| `horse-animal-titles` | Sienna's titles — WC World Champion + SH Superior Halter + ROM (AQHA, Verified) | /horses | Marketing-quality. **Note**: ROM listed as APHA, not AQHA — leftover from earlier seed run. Re-seed the tenant if it needs to match AQHA. |
| `horse-marketplace-profile` | Public Willow Creek profile — AQHA/NRHA registries, HYPP/HERDA/PSSM1 health, placement policies | /horses, /find-breeders/horses | Marketing-quality. |

## Open items / known gaps

- `finance-dashboard` is intentionally empty-state (skipped enrichment).
- ✅ Portal copy bug `"1 records"` → fixed to `"1 record"` via i18next plurals; portal-buyer-animals re-captured.
- ✅ Horse-specific shots shipped (Willow Creek Equine, Quarter Horse breeder).
- Cats, goats, rabbits, sheep still have no species-specific shots. Future work: light-weight seed tenants for those.

---

## QA pass 2026-04-28 — post-photo-upload re-inspection

After the user uploaded all tenant logos, banners, animal photos, and re-seeded storefront Standards & Credentials, we recaptured all 29 shots (1x DPR) and re-inspected each. Findings below are **product-side polish bugs** surfaced by marketing-quality screenshots, not screenshot-tooling issues.

### Confirmed marketing-grade (no blockers)
`platform-dashboard`, `animals-list`, `animal-detail-overview`, `animal-genetics`, `breeding-plans-list`, `breeding-plan-journey`, `breeding-plan-buyers`, `offspring-list`, `contacts-list`, `finance-invoices`, `invoice-detail`, `comms-hub-inbox`, `marketplace-breeder-profile`, `portal-buyer-home`, `horse-platform-dashboard`, `horse-animals-list`, `horse-animal-detail`, `horse-animal-titles`, `horse-breeding-plans-list`, `horse-marketplace-profile`.

### Product polish bugs found during marketing QA

| Where seen | Issue |
|---|---|
| `portal-buyer-animals` | "DOG · Labrador Retriever ·" trailing bullet (empty field rendering separator) |
| `portal-buyer-animals` | "Maple (FEMALE)" — raw enum, should be "Female" via `toUiSpecies()` (per platform rule) |
| `animal-genetics` | Test Date renders raw ISO `"2024-06-15T00:00:00.000Z"` instead of formatted "Jun 15, 2024" |
| `contact-detail` | Sales Pipeline shows raw enum `"WEBSITE_FORM"` — should be Title Case "Website Form" |
| `sales-pipeline` | Same — `"WEBSITE_FORM"`, `"MARKETPLACE_INQUIRY"` raw enums |
| `sales-pipeline` | "Program #238" raw program ID — should show humanized program name |
| `invoice-detail` | Status `"paid"`, `"Manual"`, Method `"card"`, Kind `"OTHER"` — inconsistent casing, raw enums |
| `waitlist-list` | Species column shows `"DOG"` raw enum — should be "Dog" via `toUiSpecies()` |
| `breeding-plans-list` (dog) | Plan card thumbnails use generic dog/puppy emoji avatar instead of the dam/sire's real photo. Horse equivalent (`horse-breeding-plans-list`) DOES use real photos — inconsistent. |
| `animal-pedigree` / `horse-animal-pedigree` | Deeper-generation pedigree node labels render as truncated ID-like strings ("Maw...", "Lik..."). May be label truncation or async-render race. Worth bumping post-click wait or auditing the label component. |
| `horse-breeding-plan-journey` | Plan is in Birth phase, but the manifest description says "AI breeding, ~120 days into 340-day gestation" — seed has advanced past the spec'd marketing state. Either re-seed at Pregnant phase or update manifest description. |
| `horse-breeding-plan-journey` | Only 7 phases visible (Planning/Cycle/Breeding/Birth/Weaned/Placed/Complete) — horses should have 8 per the plan-journey spec. Either Dakota is a singleton mare (so 8th phase doesn't apply) or the 8-phase upgrade isn't kicking in. |
| `contact-detail` | Sarah's Address card is entirely empty (every field shows "-") and Tags card empty — seed enrichment opportunity to make this shot fuller. |
| `finance-dashboard` | Renders the Getting Started educational state instead of the data dashboard, despite the seed having 3 paid invoices. Either the threshold for switching is too high, or the route always shows education. |
| `breeding-calendar` | Only 2 events visible across the whole month — sparse for a marketing calendar shot. Seed adds more breeding events spread across April for a richer view. |

### "Sidebar logo bug" — RESOLVED, not actually a bug
The previous session flagged that the platform sidebar header still shows the BreederHQ default logo rather than Cedar Ridge Kennels' uploaded logo. **This is intentional product design.** `App-Platform.tsx` does not pass `brand={...}` to NavShell, so the sidebar always renders BreederHQ chrome — the tenant's logo is meant for the public marketplace profile (HeroSection.tsx) and storefront, not in-app navigation. No code change needed.

### Capture-tooling note
- Manifest `VIEWPORTS[*].deviceScaleFactor` was changed from 2 → 1.
- `capture.ts` `newContext({ deviceScaleFactor: 2, ... })` was changed from 2 → 1.
- All shots are now 1440px wide (down from 2880px), comfortably under the 2000px many-image limit Anthropic uses for multi-image review.
- Marketing-site display quality is fine at 1x for the embed sizes used; if hi-DPI is needed for any specific shot in the future, capture it on a per-entry basis with a custom viewport.
