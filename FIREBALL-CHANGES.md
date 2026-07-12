# FIREBALL Changes Log

## Remove dead trackConversion() Google Ads placeholder
- file: src/lib/tracking.ts
- lines: 14-18 (removed), 118-159 (removed), 186-189 (replaced, now 136-139)
- change: Removed the `ConversionEvent` interface (lines 14-18) and the entire `trackConversion()` function (lines 118-159), which fired a Google Ads conversion tag with the placeholder `send_to: 'AW-CONVERSION-ID'` that was never replaced with a real conversion ID, so the call silently did nothing. The Meta Pixel, LinkedIn, and Twitter calls inside that function were removed with it since they were only reachable through the dead function. In `trackFormSubmit()`, the `trackConversion({ conversionType: 'form_...' })` call (former lines 186-189) was replaced with a comment explaining the removal and noting to re-add with a real conversion ID when one exists. `trackFormSubmit()` itself and all other analytics code (trackEvent, trackPageView, scroll/time tracking, global type declarations) are untouched. No call-site changes were needed elsewhere: repo-wide search confirmed `trackConversion` was only invoked from inside `trackFormSubmit()`; ContactForm.astro calls `trackFormSubmit()`, which stays. Rationale: placeholder code that pretends to track conversions is worse than no code.

## Rewrite title + meta description on best-dog-breeding-software compare page
- file: src/pages/compare/best-dog-breeding-software.astro
- lines: 193-194
- change: Replaced the BaseLayout `title` and `description` props. Title went from the 85-char "Best Dog Breeding Software 2026 — Puppy Waitlist, Deposit & Breeder Software Reviews" to the 59-char "Best Breeder Software 2026: Dog, Cat & Horse Tools Compared" — now leads with the generic "Best Breeder Software" query, keeps the year, removes the em dash, and fits the ~60-char SERP limit. Description went from ~245 chars (truncated at ~155 in SERPs, hook cut off) to the 152-char "Honest, side-by-side comparison of 8 breeder software tools: waitlists, deposits, buyer portals and pricing on one page. Try BreederHQ free for 14 days." — differentiator first, price signal retained, 14-day trial hook inside the visible window, no em dash. Rationale: GSC showed ~14 zero-click keywords at positions 8-15 landing on this page; the dog-only, over-length title failed generic "breeder software" / "breeding software" intent (133+91+60 impressions, zero clicks). BaseLayout derives OG and Twitter tags from these props, so one edit covers all three. No other page content touched; change staged, not committed.

## Add contextual body links to the /compare hub from homepage and pricing page
- file: src/pages/index.astro
- lines: 733-737 (inserted, after the closing </div> of the three-column comparison grid)
- change: Added a single closing line at the bottom of the "Not Just a Listing Site. Not Just a Breeding App." comparison section: a centered small paragraph reading "See how BreederHQ stacks up head-to-head: compare all tools." with "compare all tools" linking to /compare. Styled to match the section (text-center text-sm text-gray-600 mt-10, link in text-primary with underline). One sentence only, no new block.

- file: src/pages/pricing/index.astro
- lines: 154-155 (line 154 modified, line 155 inserted)
- change: Extended the existing "Switching from another tool? Honest comparisons:" sentence. The terminal period after the ZooEasy link became a comma, followed by "or browse all comparisons." with "all comparisons" linking to /compare, using the same amber link classes (text-amber-600 hover:text-amber-700 font-medium underline) as the five sibling *-alternative links. No new paragraph added.

Rationale for both: the /compare hub page had zero contextual body links anywhere on the site (footer-only reachability), which weakens its internal-link equity and crawl discoverability. These two links give it contextual anchors from the two highest-intent pages. Both files staged, not committed. Note: src/pages/compare/best-dog-breeding-software.astro was already staged from the prior FIREBALL entry and rides in the same staged set.

## Targeted internal linking pass: /dogs hub + 7 orphan/under-linked articles
- file: src/pages/dogs.astro
- lines: 723-727 (inserted, new div before the existing breederhq-vs-spreadsheets div at former line 723)
- change: Added the species buyer's guide link "→ How to choose dog breeding software (buyer's guide)" pointing to /compare/best-dog-breeding-software, placed directly above the existing "→ BreederHQ vs. Spreadsheets" link in the related-links section. /dogs was the only species hub missing its own buyer's-guide compare link; the placement and anchor phrasing match the pattern on /cats (cats.astro lines 577-580), /horses, and /goats.

- file: src/pages/articles/ai-is-only-as-good-as-your-records.astro
- lines: 214-216 (modified), 290-292 (modified)
- change: Orphan article (zero links to any feature/workflow/species/compare page). Two contextual links added. Line 215: "With properly structured records, AI can surface answers in seconds." became "...an AI assistant like Scout AI can surface answers in seconds." with "Scout AI" linking to /workflows/scout-ai. Line 291: "The future is having systems that continuously help breeders answer questions such as:" became "The future is having breeding intelligence systems that..." with "breeding intelligence" linking to /workflows/breeding-intelligence. No other prose touched.

- file: src/pages/articles/puppy-deposit-refund-rules-by-state.astro
- lines: 295 (modified), 368 (modified)
- change: Orphan article. Line 295 (pre-birth deposits section): extended the sentence "A well-written pre-birth deposit contract spells out exactly which of these applies and under what conditions" with ", and breeders who run a structured waitlist and placement workflow usually have those terms documented before the first deposit is taken." — "waitlist and placement workflow" links to /workflows/waitlists-and-placement. Line 368 (sample contract language closing): extended the existing breeder-facing sentence ending "...covers the broader contract structure these clauses sit inside" with ", and our dog breeding software buyer's guide compares the tools breeders use to manage deposits, waitlists, and contracts in one place." — linking to /compare/best-dog-breeding-software.

- file: src/pages/articles/puppy-health-guarantee-what-it-covers.astro
- lines: 391-393 (modified), 410-411 (modified)
- change: Orphan article. Sample-contract-language closing paragraph: appended "For breeders comparing tools to manage contracts, guarantees, and buyer records alongside the rest of the program, our dog breeding software buyer's guide covers the current field." linking to /compare/best-dog-breeding-software. Closing paragraph: "BreederHQ helps breeders write clear, defensible contracts and helps buyers find breeders who use them." became "BreederHQ helps breeders manage waitlists, deposits, and placement, write clear, defensible contracts, and helps buyers find breeders who use them." with the waitlist phrase linking to /workflows/waitlists-and-placement.

- file: src/pages/articles/dairy-goat-record-keeping-software.astro
- lines: 103 (modified), 195-197 (modified)
- change: Missing workflow + compare links. List item 1 of "The Six Record Types" (kidding and reproductive history): appended ", the record set a dedicated kidding management workflow captures as it happens" linking to /workflows/kidding-management. "Where BreederHQ Fits" first paragraph: appended "For how BreederHQ stacks up against other platforms on these records, see our goat breeding software comparison." linking to /compare/best-goat-breeding-software.

- file: src/pages/articles/goat-herd-health-software.astro
- lines: 133-135 (modified), 189-191 (modified)
- change: Missing workflow + compare links. Parasite-program section first paragraph: extended "The platform treats each of those as structured records" with ", and the dewormer doses themselves live in the medication tracking workflow so treatment history stays tied to the animal." linking to /workflows/medication-tracking. "Where BreederHQ Fits" first paragraph: appended "For how BreederHQ compares with other platforms on herd-health records, see our goat breeding software comparison." linking to /compare/best-goat-breeding-software.

- file: src/pages/articles/goat-kid-deposit-and-sale-terms.astro
- lines: 178-180 (modified), 182-184 (modified)
- change: Missing workflow + compare links. "Where BreederHQ Fits" first paragraph: the connected-records list "deposit collection, invoice for balance, sale-to-registry transfer-packet generation, and the buyer portal" now leads with "kidding management," linking to /workflows/kidding-management. The following link-out paragraph: extended "For the broader goat surface, see /goats" with ", and to weigh the platforms side by side, see our goat breeding software comparison." linking to /compare/best-goat-breeding-software.

- file: src/pages/articles/goat-kid-health-guarantee-what-it-covers.astro
- lines: 161-163 (modified), 191-193 (modified)
- change: Missing workflow + compare links. Dam-raised vs bottle-raised section: "These are factual records that a serious breeder can produce from their kidding log." became "...from their kidding management records." linking to /workflows/kidding-management. "Where BreederHQ Fits for Goat Buyers" link paragraph: extended "For the goat product surface, see /goats" with ", and to compare platforms on these records, see our goat breeding software comparison." linking to /compare/best-goat-breeding-software.

- file: src/pages/_site-updates/2026-07-12-internal-linking-pass.astro
- lines: 1-24 (new file)
- change: Site-updates fragment logging this internal-linking pass, per the mandatory breederhq-www CLAUDE.md content-change logging rule (fragment pattern, one article block, updateMeta export, no BaseLayout wrapper).

Rules followed: all links contextual (inserted into existing prose, no "See also" footers), descriptive anchor text, max 2 new links per article (1 on the /dogs hub), no content rewritten beyond the sentence carrying each link, no pages touched beyond the listed set, all seven link targets verified to exist on disk before insertion, orange link class (text-[hsl(24,95%,53%)] hover:underline) matching site convention, no em dashes in inserted copy. All 9 files staged on master, not committed. Note: the index already contained staged files from other workstreams (tracking.ts, find-breeders trust-language sweep, valais-blacknose-sheep, index, pricing, best-dog-breeding-software) — untouched by this pass; consider splitting commits.

## Answer-first lede + title/meta rewrite on Valais Blacknose article
- file: src/pages/articles/valais-blacknose-sheep.astro
- lines: 85-86 (modified), 91 (modified), 118 (modified), 151-154 (inserted), 340 (modified)
- change: Four related fixes targeting the 9 zero-click GSC queries at positions 4-9 ("what breed are Jeremy Clarkson's sheep", "what kind of sheep did Lisa buy", etc.) plus the project no-em-dash rule. (1) Line 85: BaseLayout title rewritten from "What Breed Are Jeremy Clarkson's Sheep? Valais Blacknose Explained | BreederHQ" (79 chars) to "Valais Blacknose Sheep: The Breed From Clarkson's Farm" (54 chars, under the 60-char limit; the "| BreederHQ" suffix was dropped because BaseLayout renders the title prop verbatim and appending it would exceed 60). (2) Line 86: meta description rewritten to the 140-char answer-first "Valais Blacknose sheep are the Swiss breed made famous by Clarkson's Farm. What they cost, how long they live, and how to buy one in the US." (old one was ~181 chars, over the 155 limit). (3) Lines 91 and 118: article.headline schema field and the H1 updated to match the new title exactly. (4) Lines 151-154: new 3-sentence answer-first lede paragraph inserted BEFORE the existing Clarkson scene-setting narrative paragraph (which is preserved unchanged immediately after) — states what the breed is (heritage breed from the Valais canton of Switzerland, bred for steep alpine pasture), what it looks like (thick creamy-white fleece, black markings on nose/ears/knees/hocks/feet, spiral horns in both sexes), and that it is the breed Lisa Hogan brought to Diddly Squat on Clarkson's Farm. All facts pulled from the existing Quick Facts box and the "What Are Valais Blacknose Sheep?" section; nothing invented. (5) Line 340: the ArticleInlineCTA body prop contained the only user-visible em dashes on the page ("continuous record — pedigree, ... — so the documentation"); replaced the em-dash pair with parentheses per the hard no-em-dash rule. Note the title/meta flagged in the prompt contained no literal em dashes; the CTA body did. Remaining em dashes at lines 9-11 are code comments (A/B variant notes), not user-visible, left alone. No H2/H3 headings changed, no other section restructured. File staged on master, not committed; index still carries the pre-staged files from other workstreams noted above.

## Trust-language sweep: remove "Verified" from find-breeders titles and meta descriptions
- file: src/pages/find-breeders/cats.astro
- lines: 39-40
- change: BaseLayout title "Find Verified Cat Breeders | BreederHQ" changed to "Find Responsible Cat Breeders | BreederHQ"; description "Find verified cat breeders..." changed to "Find responsible cat breeders...". "Verified" in marketing copy violates the legally locked 3-layer trust posture (no verify/vet/vouch claims). "Responsible" was chosen over "Trusted" because "responsible breeder" is the standard buyer search term and "trusted" already appears later in the cats/dogs/horses descriptions ("trusted catteries" / "trusted programs"), which would have read as repetition.

- file: src/pages/find-breeders/dogs.astro
- lines: 40-41
- change: Title "Find Verified Dog Breeders | BreederHQ" changed to "Find Responsible Dog Breeders | BreederHQ"; description "Find verified dog breeders..." changed to "Find responsible dog breeders...". Same rationale as cats.

- file: src/pages/find-breeders/horses.astro
- lines: 40-41
- change: Title "Find Verified Horse Breeders | BreederHQ" changed to "Find Responsible Horse Breeders | BreederHQ"; description "Find verified horse breeders..." changed to "Find responsible horse breeders...". Same rationale.

- file: src/pages/find-breeders/goats.astro
- lines: 39
- change: Title "Find Verified Goat Breeders | BreederHQ" changed to "Find Responsible Goat Breeders | BreederHQ". Title only; the goats description never contained the word "verified".

- file: src/pages/find-breeders/rabbits.astro
- lines: 31-32
- change: Title "Find Verified Rabbit Breeders | BreederHQ" changed to "Find Responsible Rabbit Breeders | BreederHQ"; description had two instances: "Find verified rabbit breeders..." changed to "Find responsible rabbit breeders..." and "verified operations" changed to "active operations" (avoids "responsible... responsible" repetition within one description).

- file: src/pages/find-breeders/sheep.astro
- lines: 35-36
- change: Title "Find Verified Sheep Breeders | BreederHQ" changed to "Find Responsible Sheep Breeders | BreederHQ"; description "Find verified sheep breeders..." changed to "Find responsible sheep breeders...".

- file: src/pages/find-breeders/cattle.astro
- lines: 35-36
- change: Title "Find Verified Cattle Breeders | BreederHQ" changed to "Find Responsible Cattle Breeders | BreederHQ"; description "Find verified cattle breeders..." changed to "Find responsible cattle breeders...".

- file: src/pages/find-breeders/alpacas.astro
- lines: 35-36
- change: Title "Find Verified Alpaca Breeders | BreederHQ" changed to "Find Responsible Alpaca Breeders | BreederHQ"; description "Find verified alpaca breeders..." changed to "Find responsible alpaca breeders...".

- file: src/pages/find-breeders/llamas.astro
- lines: 35-36
- change: Title "Find Verified Llama Breeders | BreederHQ" changed to "Find Responsible Llama Breeders | BreederHQ"; description "Find verified llama breeders..." changed to "Find responsible llama breeders...".

- file: src/pages/_site-updates/2026-07-12-find-breeders-trust-language-sweep.astro
- lines: 1-12 (new file)
- change: Site-updates fragment logging this sweep, per the mandatory breederhq-www CLAUDE.md content-change logging rule (one article block, updateMeta export, no BaseLayout wrapper).

Scope notes: task was title/meta only, and BaseLayout derives OG/Twitter tags from these props so one edit per page covers all three surfaces. src/pages/animals/ does not exist in this repo. Deliberately NOT changed (out of scope, flagged for a follow-up pass): the H1 "Find verified [species] breeders" on every page, the CTA line "Browse verified [species] breeders on the BreederHQ Marketplace" on every page, index.astro line 64 heading (Why "verified" matters here) and line 14 ("from verified programs"). FAQ answers and disclaimer lines stating BreederHQ does NOT verify/vet/vouch were left alone; they state the posture correctly rather than violating it. All 10 files staged by explicit path on master, not committed; staged list verified with git diff --cached --name-only. The index also carries pre-staged files from other workstreams (tracking.ts, valais-blacknose-sheep, best-dog-breeding-software, index, pricing), untouched by this pass; a plain git commit would bundle them.
