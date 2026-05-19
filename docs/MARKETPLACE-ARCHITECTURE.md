# BreederHQ Marketplace — Architecture Lock

**Status:** Locked 2026-05-19
**Scope:** breederhq-www marketplace IA, navigation, taxonomy, and SEO strategy
**Audience:** Every engineer and AI agent making changes to marketplace surfaces

This document is the canonical architectural reference for the BreederHQ Marketplace surfaces on breederhq-www. It supersedes prior ad-hoc IA decisions. Do not relitigate the principles below without one of the explicit triggers in Item 12.

---

## 1. Marketplace Philosophy

BreederHQ Marketplace is **a broad animal-services marketplace with deep specialist ecosystem authority.**

It is NOT:

- a generic pet directory
- an equine-only marketplace
- a Yelp clone
- a breeder-only tool
- an SEO farm

That sentence drives every downstream decision in this document.

---

## 2. The Four-Layer System

| Layer | Purpose |
|---|---|
| **UX Layer** | Broad marketplace visibility distributed across nav + `/services` + footer |
| **Semantic Layer** | Specialist authority concentration in defensible niches |
| **Crawl Layer** | Structured hierarchy, canonical hubs, restrained geo expansion |
| **Marketplace Layer** | Real provider inventory and structured professional identity |

Never collapse these layers together again. SEO emphasis is not visible marketplace taxonomy. Visible marketplace taxonomy is not SEO emphasis.

---

## 3. Navigation Philosophy

Breadth is communicated across **nav + `/services` + footer as a system.** Nav is curated, not exhaustive.

Nav surfaces ~6-9 highest-resonance categories plus the Facilities branch. The full taxonomy lives on `/services` and the footer. This avoids reproducing directory sprawl inside the global nav while still communicating broad marketplace identity.

**Curation principle:** if a category gets promoted into nav later, another category gets demoted to `/services` and footer. The dropdown does not grow.

---

## 4. SEO Philosophy

SEO investment is selective. Heavy authority concentration only on:

- Farriers
- Equine (boarding, training, repro, vet)
- Facilities (equine + livestock)
- Livestock services
- Show handlers
- Health testing *(uniquely BreederHQ — OFA Sync + CHIC moat; SEO-concentrated but not promoted to top-tier nav prominence — this is the cleanest test case of Item 3: SEO investment ≠ nav prominence)*

These become semantic authority clusters with deep editorial content, schema enrichment, and concentrated internal-link weight.

All other categories exist for breadth and usability, not maximum SEO conquest. Their hubs remain real, marketplace-native, and useful — but they do not receive editorial geo expansion or content-hub investment.

---

## 5. Geo Philosophy

| Category type | Geo strategy | Example URL pattern |
|---|---|---|
| Dense consumer services | Metro pages, top metros only | `/services/dog-grooming/kansas-city` |
| Sparse specialist ecosystems | State/regional pages | `/services/farriers/kentucky` |
| Major equine ecosystems | Named-ecosystem metros | `/services/equine-boarding/lexington-ky` |
| Provider profiles | Suburb/service-area metadata on profile | (provider record) |

**Geo never appears in global nav.** Geo lives on category hubs, regional ecosystem pages, and footer-adjacent discovery (e.g., a single "Regional spotlights →" pointer). Surfacing geo in nav leaks SEO concentration into UX and violates Item 3.

Do not mass-generate geo pages. Do not build suburb spam. Add geo pages one at a time, gated on real Search Console signal and the reciprocal-backlink rule.

---

## 6. Facilities Philosophy

Facilities are **first-class marketplace infrastructure** — bookable physical spaces, not secondary categories.

Facilities are simultaneously:

- A **peer branch** to Services, surfaced at `/facilities` as the canonical hub
- **Integrated** into `/services` taxonomy with a dedicated Facilities section
- **Cross-linked** from adjacent service hubs (Boarding ↔ Boarding Facilities, Grooming ↔ Wash & Grooming Spaces, Dog Training ↔ Indoor Training Halls, Equine Boarding ↔ Equine Facilities)

Not isolated. Not buried. Not collapsed into a generic "amenities" list. This is a moat — generic marketplaces do not model bookable facilities as first-class entities.

---

## 7. Buyer Hub Philosophy

Buyer-side category hubs live at `/services/<category>` and are concise, browse-oriented, marketplace-native pages.

**The locked hub spec (operational definition of "lightly editorial"):**

- ~180-220 lines total
- 6 sections in order:
  1. Breadcrumb + hero (H1, ~40-word buyer-framed lede, primary marketplace CTA)
  2. What this category covers (6-10 concrete sub-specialties, sourced from matching `/for-providers/<category>` page)
  3. How to browse on the marketplace (3-4 bullets on filtering — species, breed, coverage area, methodology)
  4. What to look for when hiring (4-6 buyer-side evaluation bullets)
  5. Related / cross-link strip (2-3 sibling categories + facilities cross-link when relevant)
  6. Provider cross-link (small bottom strip pivoting to `/for-providers/<category>`)
- No fake provider counts
- No "verified" or trust framing (Trust is surfaced at `/trust`, not as a category-page default)
- No "coming soon" or "in development" labels
- No geographic content unless the category is on the SEO-concentrated list
- No editorial long-form content (that lives on SEO-concentrated category hubs only)

**Anything thinner than this spec is a stub. Stubs are not allowed.**

A buyer hub ships only when it resolves to one of:

- A real browse destination (filters + inventory exist)
- A meaningful lightweight category page (the hub spec above, fully met)
- A strong marketplace bridge page (clear funnel to marketplace deep-link)

It does not ship as:

- An empty SEO shell
- A "coming soon" nav target
- A thin taxonomy placeholder

---

## 8. Provider Page Separation

Provider pages at `/for-providers/<category>` remain provider-facing. Buyer flow and provider flow never cross.

- Buyer flow: `/services/*`
- Provider flow: `/for-providers/*`

Do not route buyers directly into provider acquisition funnels. Audience-context mismatch — a buyer clicking "Dog Training" and landing on "List your training business" — damages marketplace legitimacy more than thin hubs do.

The single allowed cross-link is the small "Are you a [category] provider? List your business on BreederHQ →" strip at the bottom of each buyer hub.

---

## 9. Dropdown Philosophy

The Services dropdown shows curated, broad marketplace taxonomy.

**Locked constraints:**

- Maximum ~9 service links + 1 Facilities card + utility links
- Width capped at 640px
- Geo links never appear in nav (per Item 5)
- Facilities surfaced as a single full-width card linking to `/facilities`, not as an 8-item grid
- If a new category gets promoted into the dropdown, an existing category gets demoted to `/services` and footer only

No mega-directory clutter. The dropdown should feel like product navigation, not a directory sprawl.

---

## 10. Expansion Philosophy

**Do:**

- Deepen the SEO-concentrated authority clusters
- Improve provider profiles and structured identity
- Add real inventory
- Build specialist ecosystem content
- Build out facilities coverage
- Reinforce semantic graphs and internal linking

**Do not:**

- Mass-generate geo pages
- Build suburb spam
- Chase generic pet SEO outside the concentrated clusters
- Create empty category shells
- Constantly reinvent the taxonomy

---

## 11. Provider Identity Philosophy

The marketplace moat is **structured professional identity**, not generic listings.

Every surface should reinforce:

- Specialties and sub-specialties
- Facility type and capabilities
- Credentials and certifications
- Methodologies and operational practices
- Species and breed expertise
- Service area and coverage
- Operational differentiation (what makes this provider distinct in their ecosystem)

Generic "name + photo + reviews" is the Yelp/Rover failure mode. Don't drift toward it.

---

## 12. The Final Rule

The marketplace should always feel **broader than the SEO strategy.**

The SEO strategy should always be **more concentrated than the visible marketplace.**

That is the final balance. Lock it. Build it.

**Do not revisit fundamentals unless one of these triggers fires:**

- Analytics behavior proves a principle materially wrong (impressions, clicks, conversions)
- Crawl behavior proves a principle materially wrong (indexing, ranking, canonical issues)
- User behavior proves a principle materially wrong (engagement, bounce, funnel completion)
- Provider behavior proves a principle materially wrong (sign-ups, listing quality, churn)
- **Schema or platform changes** (schema.org standard shifts, Google deprecating Service.provider semantics, marketplace adding new first-class entities)

Otherwise: do not revisit. Execute against the lock.

---

## Phasing of Implementation

The architecture above is the target state. Rollout is phased to avoid bundling IA correction with category-hub expansion.

### Phase 1 — IA correction (locks the framework)

- `docs/MARKETPLACE-ARCHITECTURE.md` (this document)
- `src/components/HeaderV2.astro` — desktop Services dropdown + mobile Services accordion
- `src/pages/services/index.astro` — full-taxonomy hub with integrated Facilities section + Regional Spotlights
- `src/components/Footer.astro` — dedicated Services column + single "Regional spotlights →" pointer

Phase 1 nav links for categories without buyer hubs resolve to `/services#section-id` (anchor links to the relevant section on the hub). Categories with existing hubs (`/services/farriers`, `/services/equine-boarding`) link directly.

### Phase 2 — First buyer hubs (gated on quality)

- `/services/dog-training`
- `/services/grooming`
- `/services/boarding`
- `/services/transport`
- `/services/veterinary-specialists` (scoped to specialist veterinary only; general vet is out of scope per Item 4)

Each shipped against the locked hub spec in Item 7. Each passes the quality gate before merge:

- 6+ concrete sub-specialties exist
- A buyer-side evaluation framework exists
- Marketplace filter parity exists or is imminent
- Survives the "would a buyer arriving here feel they're in the right place" test against the `/services/equine-boarding` quality bar

### Phase 3 — Specialist and support hubs (gated on inventory + intent)

- `/services/equine-services`
- `/services/livestock-services`
- `/services/health-testing` (only if narrow-scope buyer journey — geneticists, repro vets, specialist clinics — is real and inventory supports it; otherwise remains a semantic/support cluster surfaced through Articles + Workflows)
- `/services/equine-repro` and `/services/handlers` only if they pass the gate independently

---

## Quick-Reference Decision Tests

When facing an ambiguous IA call, ask:

1. **"Does this surface SEO concentration through UX?"** If yes → wrong. Per Item 3.
2. **"Does this collapse the four layers?"** If yes → wrong. Per Item 2.
3. **"Does a buyer arriving here feel they're in the right place?"** If no → wrong. Per Item 8.
4. **"Could this be in `/services` or footer instead of nav?"** If yes → put it there. Per Items 3 and 9.
5. **"Is this hub a real destination or a stub?"** If stub → don't ship. Per Item 7.
6. **"Are we mass-generating geo pages?"** If yes → stop. Per Items 5 and 10.

---

**Locked 2026-05-19. Do not edit without one of the Item 12 triggers.**
