# FIREBALL Changes Log 2

## AlternativeTo submission copy

**Prepared:** 2026-07-12. Drafted for the BreederHQ listing submission on alternativeto.net.

### Short description (listing card, 271 chars)

Breeding management software for professional breeders of dogs, cats, horses, goats, sheep, cattle, alpacas, llamas, and rabbits. Health records, pedigrees, genetics, breeding plans, waitlists, invoicing, and a commission-free marketplace. From $29/month with a 14-day free trial.

### Long description (full listing page, ~660 chars)

BreederHQ is a connected platform for running a breeding program across nine species: dogs, cats, horses, goats, sheep, cattle, alpacas, llamas, and rabbits. It brings health records, pedigrees, and genetics tools (OFA sync, CHIC tracking, COI calculations) together with breeding plans, waitlists, a buyer portal, and invoicing. Animals can be listed on the built-in marketplace with no commission, and breeders keep ownership of their data. Scout AI answers plain-language questions about your program, and the mobile app covers day-to-day recording on the go. Pricing starts at $29/month with a 14-day free trial; Founders get 50% off Pro and Enterprise.

### Suggested tags (10)

1. Kennel Management
2. Dog Breeding
3. Cat Breeding
4. Horse Breeding
5. Livestock Management
6. Herd Management
7. Pedigree Software
8. Animal Health Records
9. Breeding Software
10. Waitlist Management

### Competitors to tag BreederHQ as an alternative to

**Availability check (2026-07-12):** none of the five competitors currently has a listing on AlternativeTo. Searches on alternativeto.net for "good dog", "breeder", and "easykeeper" returned no match for any of them (the only "Good Dogs!" result is an unrelated mobile game). AlternativeTo only lets you tag alternatives against apps that already exist on the site, so each competitor must be suggested as a new app first (or during the BreederHQ submission flow, which allows suggesting the apps it is an alternative to). Use the official product names when suggesting them:

| # | Name to submit | Product website |
|---|---|---|
| 1 | Good Dog | gooddog.com |
| 2 | BreederBuddy | breederbuddy.com |
| 3 | Breeder Cloud Pro | breedercloudpro.com |
| 4 | EasyKeeper | easykeeper.com |
| 5 | Breeder's Assistant | tenset.co.uk |

Listing URL to submit: https://breederhq.com

## Dynamic breeder profile title tags
- file: apps/marketplace/src/marketplace/pages/BreederPage.tsx
- lines: 163-184 (replaced old title logic at former lines 163-170)
- change: Rewrote the SERP title built in the profile-load SEO useEffect. Old format was "[Name] in [Location] | [Breeds] Breeder | BreederHQ Marketplace"; new format follows "[Breeder Name] – [Breeds] Breeder in [City, State] | BreederHQ" with graduated fallbacks: location-only "[Name] – Breeder in [City, State] | BreederHQ", breeds-only "[Name] – [Breeds] Breeder | BreederHQ", and neither "[Name] | BreederHQ Marketplace". Breed names (max 2, joined with " & ") are used as the species qualifier because they match location-specific queries better than the raw species enum; location comes from buildLocationDisplay() so publicLocationMode/showCity/showState privacy flags are still respected. Also fixed a latent bug: the old code fell back to `profile.location` (an object) in the title string, which could render "[object Object]". Only the title passed to updateSEO() changed; description, canonical, keywords, OG image, and structured data are untouched. tsc --noEmit clean; change staged (not committed) on branch aaron.

## Verified body copy sweep
- file: src/pages/find-breeders/cats.astro
- lines: 52, 151
- change: H1 "Find verified cat breeders" -> "Find responsible cat breeders"; closing CTA "Browse verified cat breeders on the BreederHQ Marketplace." -> "Browse responsible cat breeders..."

- file: src/pages/find-breeders/dogs.astro
- lines: 53, 162
- change: H1 "Find verified dog breeders" -> "Find responsible dog breeders"; closing CTA "Browse verified dog breeders..." -> "Browse responsible dog breeders..."

- file: src/pages/find-breeders/horses.astro
- lines: 53, 162
- change: H1 "Find verified horse breeders" -> "Find responsible horse breeders"; closing CTA "Browse verified horse breeders..." -> "Browse responsible horse breeders..."

- file: src/pages/find-breeders/sheep.astro
- lines: 45, 76
- change: H1 "Find verified sheep breeders" -> "Find responsible sheep breeders"; closing CTA "Browse verified sheep breeders..." -> "Browse responsible sheep breeders..."

- file: src/pages/find-breeders/rabbits.astro
- lines: 41, 72
- change: H1 "Find verified rabbit breeders" -> "Find responsible rabbit breeders"; closing CTA "Browse verified rabbit breeders..." -> "Browse responsible rabbit breeders..."

- file: src/pages/find-breeders/cattle.astro
- lines: 45, 76
- change: H1 "Find verified cattle breeders" -> "Find responsible cattle breeders"; closing CTA "Browse verified cattle breeders..." -> "Browse responsible cattle breeders..."

- file: src/pages/find-breeders/alpacas.astro
- lines: 45, 76
- change: H1 "Find verified alpaca breeders" -> "Find responsible alpaca breeders"; closing CTA "Browse verified alpaca breeders..." -> "Browse responsible alpaca breeders..."

- file: src/pages/find-breeders/llamas.astro
- lines: 45, 76
- change: H1 "Find verified llama breeders" -> "Find responsible llama breeders"; closing CTA "Browse verified llama breeders..." -> "Browse responsible llama breeders..."

- file: src/pages/find-breeders/goats.astro
- lines: n/a
- change: No change needed. The goats page contained no verify/vet/vouch language (confirmed by grep for verif/vett/vouch variants).

- file: src/pages/find-breeders/index.astro
- lines: 14, 64
- change: Dog species card description "Health-tested, pedigreed dogs from verified programs." -> "...from responsible programs."; section heading "Why \"verified\" matters here" -> "What stands behind the profiles here". The section body was left as-is: it already explains the three layers BreederHQ does show (identity confirmation via Stripe Identity, public-registry passthrough with source links, breeder self-attestation) and correctly states BreederHQ does not verify or vouch beyond passthroughs, so no body rewrite was required to satisfy the trust posture. NOTE: the task pointed to src/pages/index.astro line 64 for this heading, but the "Why 'verified' matters here" section actually lives here in find-breeders/index.astro:64; the root index has no such section.

- file: src/pages/index.astro
- lines: 130, 323, 723
- change: Three trust-posture violations replaced: hero paragraph "buyers discover verified programs backed by real data" -> "buyers discover responsible programs backed by real data" (line 130); How It Works step 2 heading "Buyers find verified programs" -> "Buyers find responsible programs" (line 323); breeder benefits checklist item "Buyers find verified programs" -> "Buyers find responsible programs" (line 723). Left untouched: line 37 FAQ answer ("BreederHQ does not verify or vouch for breeders...") and line 893 ("BreederHQ does not verify, vet, or vouch...") since both correctly state the posture; and line 49's titles-system status list "(In Progress, Earned, Verified)" plus "document verification", which describe competition-title record statuses, not a claim that BreederHQ verifies breeders.

- file: src/pages/_site-updates/2026-07-12-find-breeders-verified-body-copy-sweep.astro
- lines: new file
- change: Added the mandatory site-updates fragment documenting this sweep (per breederhq-www CLAUDE.md content-change policy), as a follow-up to the committed 2026-07-12-find-breeders-trust-language-sweep.astro fragment which covered titles/meta only.

All 11 files staged with explicit-path git add; staged list verified via git diff --cached --name-only. Unrelated working-tree changes (src/pages/compare/*) and the FIREBALL-*.md files were left unstaged. Not committed.

## Schema additions: /compare hub + best-* pillars
- file: src/pages/compare/index.astro
- change: Added `faqs` prop to BaseLayout (4 FAQs: best breeder software, cost, species supported, species-specific software) which emits FAQPage schema via BaseLayout; added inline CollectionPage JSON-LD with a nested ItemList (11 items: 7 best-* guides + 4 BreederHQ-vs competitor pages).

- file: src/pages/compare/best-breeding-software.astro
- change: Added inline Article JSON-LD (datePublished 2026-01-14 from git history, dateModified 2026-07-12) + page-specific SoftwareApplication JSON-LD (applicationSubCategory "Breeding Software", 6 features pulled from page content: 9-species support, connected animal records, cycle tracking/calendars, client management with waitlists, invoicing, buyer portals; 14-day free trial Offer).

- file: src/pages/compare/best-cat-breeding-software.astro
- change: Added inline Article JSON-LD (datePublished 2026-01-14, dateModified 2026-07-12) + SoftwareApplication JSON-LD (applicationSubCategory "Cat Breeding Software", features: induced ovulation tracking, blood type compatibility warnings, HCM/PKD/PRA tracking, queen cycling patterns, color genetics, TICA/CFA registry support; 14-day free trial Offer).

- file: src/pages/compare/best-goat-breeding-software.astro
- change: Added inline Article JSON-LD (datePublished 2026-02-25, dateModified 2026-07-12) + SoftwareApplication JSON-LD (applicationSubCategory "Goat Breeding Software", features: dairy production tracking (305-day/DHIA/butterfat-protein), breeding groups with buck exposure, CAE/CL/Johne's tracking, FAMACHA/FEC parasite records, kidding with individual kid records, ADGA Linear Appraisal scores; 14-day free trial Offer).

- file: src/pages/compare/best-horse-breeding-software.astro
- change: Added inline Article JSON-LD (datePublished 2026-02-25, dateModified 2026-07-12) + SoftwareApplication JSON-LD (applicationSubCategory "Horse Breeding Software", features: mare reproductive tracking (follicle/ovulation/progesterone), stallion service management with stud fees, dose-level semen inventory, 340-day foaling management, lethal gene warnings (LWO/HYPP/HERDA/GBED), performance and racing records; 14-day free trial Offer).

- file: src/pages/compare/best-sheep-breeding-software.astro
- change: Added inline Article JSON-LD (datePublished 2026-02-25, dateModified 2026-07-12) + SoftwareApplication JSON-LD (applicationSubCategory "Sheep Breeding Software", features: fiber/wool production tracking (fleece weights/micron/grading), tupping groups with ram rotation, scrapie genotype tracking, OPP/CL tracking, lambing with individual lamb records, EBV/NSIP performance recording; 14-day free trial Offer).

- file: src/pages/compare/best-rabbit-breeding-software.astro
- change: Added inline Article JSON-LD (datePublished 2026-02-25, dateModified 2026-07-12) + SoftwareApplication JSON-LD (applicationSubCategory "Rabbit Breeding Software", features: ARBA pedigree management (ear numbers/varieties/weights), kindling with individual kit records, show tracking with Grand Champion leg counting, variety color genetics, 31-day rapid cycle scheduling, buyer waitlist matching; 14-day free trial Offer).

Notes: /compare/best-dog-breeding-software was NOT touched (already had Article + ItemList + SoftwareApplication + FAQPage). BaseLayout.astro was NOT edited (protected); no duplicate Organization or site-wide SoftwareApplication nodes were added — all schema is page-scoped inline JSON-LD. Verified via full `astro build`: all 7 pages emit the expected JSON-LD blocks in dist output. Article datePublished values taken from each file's first git commit date.

## Breed Ledger added to best-dog comparison
- file: src/pages/compare/best-dog-breeding-software.astro
- sections updated:
  - ItemList JSON-LD schema: numberOfItems 8 -> 9; added `{ position: 9, name: "Breed Ledger" }`.
  - Article JSON-LD description: appended "and Breed Ledger" to the vendor list so it stays consistent with the ItemList (was a list of 8 named tools).
  - BaseLayout `description` meta prop: "comparison of 8 breeder software tools" -> "9 breeder software tools".
  - Hero intro paragraph: "reviews for the eight tools" -> "reviews for the nine tools" (only the count word changed; existing sentence, including its pre-existing em dash, left intact).
  - TL;DR "who should pick what" box: added a one-line Breed Ledger entry (website + pedigree + genetics on a free/low-cost tier) linking to #breed-ledger, placed after Breeder Cloud Pro and before Breedera.
  - FAQ "What is the best dog breeding software in 2026?" (the "no single best tool" answer): inserted a Breed Ledger sentence in the per-competitor rundown (free start, $29/mo, $49/mo, website + species-aware genetics).
  - Side-by-side pricing/species table: added a Breed Ledger row (Free / $29 / $49, Free plan, multi-species, website+inquiry, directory, responsive web).
  - Workflow matrix: added a Breed Ledger header column and a 9th mark to all 20 data rows (checks on individual tracking, pedigree, applications, waitlist, deposits, contracts; Multi species; Directory marketplace; Free plan; Responsive mobile; dashes on progesterone/OFA/CHIC/temperament/buyer-portal etc.).
  - Detailed per-tool section: added a full `id="breed-ledger"` block matching the BreederBuddy structure (Public positioning, Where it shines, Where BreederHQ pulls ahead, Honest verdict), placed after PedFast and before the GoodDog block.
  - Mobile-experience reference table near the bottom: added a Breed Ledger row ("Web-based with mobile-responsive breeder sites. No native mobile app is publicly listed.").
- key facts used (verified live at breedledger.co on 2026-07-12):
  - Pricing: Free $0 (up to 10 animals, 3-gen pedigree, subdomain, directory listing, inquiry form); Starter $29/mo (up to 50 animals, custom domain + SSL, genetics predictions, 5-gen pedigrees, waitlists, contracts); Professional $49/mo (unlimited animals, unlimited pedigree depth, advanced analytics). Annual saves two months. Club/registry plans start higher. Optional 0.5% fee only when using Breed Ledger's own payment processing.
  - Builder: "Dusty" (builtbydusty.com), a working multi-species breeder who also built ReptiDex. Live in production, actively developed.
  - Species: dogs, cats, reptiles, rabbits, livestock, poultry, exotics (multi-species; morph-oriented).
  - Features used: website builder (Classic/Modern/Minimal templates, subdomain, custom domain + SSL on paid), pedigree database (visual multi-gen, click-through sire/dam, cross-breeder links), species-aware genetics with predictions (het/albino/polygenic color/sex-linked traits, especially reptiles), waitlists tied to animals or trait combinations with per-pup deposits, e-signed contracts, buyer-facing directory (browse by species/region, links to breeder sites), free migration help.
  - Deliberately conservative: did NOT assert "lethal-combination warnings," COI, OFA/CHIC, or a per-buyer portal for Breed Ledger, since the live site does not spell those out; described only what breedledger.co publicly states. No native mobile app (web/responsive only).
  - Source URL: https://breedledger.co (also /features, /pricing).
- All Breed Ledger copy contains no em dashes. Final grep for "8 tools"/"eight tools" run and both hits updated to nine. File staged with explicit-path git add (only this file staged); not committed.

## Pyometra article answer-first restructure
- file: src/pages/articles/pyometra-in-breeding-females.astro
- lines: 106-108 (new answer-first lede paragraph inserted; original lede retained immediately after)
- change: Added a 3-sentence answer-first paragraph in the header before the existing lede. It states what pyometra is (a serious uterine infection in intact, unspayed females), why it is dangerous (can become life-threatening within a short window and prove fatal if untreated), and which species it affects (best documented in dogs, also cats, goats, sheep, and horses). All facts pulled from existing article content (Why Every Breeder Should Understand Pyometra, What Is Pyometra, Species Considerations, and Conclusion sections). No em dashes. Title, meta description, and all H2/H3 sections left unchanged.
