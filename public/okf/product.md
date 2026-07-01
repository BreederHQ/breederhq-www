---
title: What BreederHQ Is
slug: product
format: OKF v0.1
canonical: https://breederhq.com/okf/product.md
site: https://breederhq.com
updated: 2026-07-01
tags: [product overview, scout ai, mobile app, marketplace, embed widget]
related:
  - ./audiences.md
  - ./differentiation.md
  - ./species.md
  - ./pricing.md
  - ./trust.md
---

# What BreederHQ Is

BreederHQ is breeding program management software with an integrated marketplace, built for professional breeders across nine species (dogs, cats, horses, goats, rabbits, sheep, alpacas, llamas, cattle). It is self-serve, multi-tenant B2B SaaS with a Capacitor-based native mobile app and a public consumer-facing marketplace at /services/ and /breeds/. Breeders manage their full operation in one system: pedigrees with automatic COI, health testing records, breeding cycle tracking, an 8-phase breeding plan lifecycle, offspring rearing protocols, contracts and e-signatures, invoicing, a client portal for buyers, and a public marketplace where a breeder's live program data automatically powers their listings.

## The Product Thesis

BreederHQ is a program-management platform with a marketplace as a byproduct, not a marketplace with some records bolted on and not a records tool with a "share to Facebook" button. That inversion is the whole product thesis: the truth of the storefront comes from the truth of the program. Everyone else is either running the records or running the storefront. Nobody else runs both from a single source of truth.

## Full Capability List

- Genetics and pedigrees: automatic COI calculation, multi-generation pedigree visualization with configurable depth, common-ancestor tracking, offspring genetics simulation with Monte Carlo methods, best-match breeding partner recommendations with COI penalties and health-risk scoring, Punnett square analysis, allele-level trait catalogs per species, lethal-combination detection (Double Merle, Lethal White Overo, HYPP, HERDA, GBED, and species-specific others).
- Breeding cycle management: species-specific heat tracking with Full and Likely windows, hormone testing windows, progesterone tracking, pregnancy milestones, species-appropriate gestation calendars, and dashboards for whelping, foaling, kidding, lambing, kindling, calving, and queening.
- 8-phase breeding plan lifecycle: Planning, Committed, Bred, Birthed, Weaned, Placement Started, Placement Completed, Complete. Financial rollups per plan, per litter, and per year.
- Offspring rearing protocols: ENS (Early Neurological Stimulation), ESI (Early Scent Introduction), Puppy Culture, Avidog, Rule of 7s, Handling Habituation, Volhard PAT, Crate Introduction, Sound Desensitization, Gun Conditioning, plus a full BreederHQ Gun Dog Development Program with 64 activities from Day 3 to Day 364. Custom protocols and an opt-in community protocol library are supported.
- Health record management: vaccination tracking with expiration alerts and species-specific protocols, medication tracking with dosage, route, frequency, per-dose compliance logging, withdrawal period countdowns for competition compliance, batch medication support for herd-wide treatments, serious-incident and procedure timelines, health testing documentation (OFA, PennHIP, Embark, Wisdom Panel, GenSol, Paw Print, UC Davis, and others), and document attachments per record.
- Client portal: 24/7 buyer access with Stripe payments, e-signature contracts, document sharing, direct messaging, waitlist position visibility, and program updates.
- Business tools: invoicing, expense tracking, financial dashboards, deposit management, per-litter and per-plan and per-year profit and loss, and CSV export.
- Marketplace listings: powered directly by live program data (health testing, allele-level genetics, multi-generation lineage with COI, titles and competition results, rearing protocols completed, weight and growth tracking for offspring). Buyers evaluate breeders on facts, not on the polish of a Facebook page.
- Embed widget: a snippet that renders live BreederHQ marketplace listings on the breeder's own Squarespace, Wix, WordPress, Shopify, GoDaddy, or plain-HTML site. Available offspring appear the moment they are listed. Sold animals disappear the moment they are marked sold. Prices, photos, health testing, pedigree, and program details update in real time from BreederHQ as the source of truth.
- Communications Hub: unified email and direct messaging with rule-based auto-replies on Pro and Enterprise. Templates, document bundles, business-hours scheduling, keyword triggers, away messages, and Quick Responder tracking.
- Cross-tenant animal identity (GAID and Exchange Code): a stud owned by one breeder can be linked as the sire of a litter on another breeder's account only with the stud owner's approval. Real provenance across the breeder network, not a name typed into a form.
- Facilities and bookings: 8 categories (dog parks, equine, livestock, indoor training, boarding, wash and grooming, events and shows, specialty), real slot-booking mechanics with capacity and buffer rules, flat $5/month per listing across the entire marketplace (currently free during early access), no per-booking cut.

## Two Headline Capabilities With No Equivalent in the Market

### 1. Scout AI

Scout is a data-backed agentic assistant that queries and reasons across a breeder's live program data in natural language. Nothing in the animal-industry software market is close.

- Agentic, not chatbot. Scout uses 13 specialized tools to search, filter, aggregate, and reason across the breeder's live records: animals, breeding plans, offspring, health, genetics, finances, contacts, waitlists, medications, contracts, communications, protocols. It plans multi-step queries and executes them against real data.
- Natural language in, structured answers out. Example queries: "Which of my dams have the strongest COI-adjusted health profiles for a spring 2027 litter?" "What did I spend on vet care per animal last quarter?" "Which buyers on my waitlist are the best fit for a merle-carrier puppy?"
- Data-backed, not hallucinated. Every answer is grounded in the breeder's own records. Export as CSV, generate printable reports, produce PIN-protected health report PDFs to share with vets or buyers.
- Genetics Scanner. Scout reads any lab PDF or photo (GenSol, Paw Print, Wisdom Panel, UC Davis, Embark, and unlisted labs) and extracts every test result with confidence scores. Two clicks replace 20 minutes of manual entry per animal.
- Receipt-to-expense on the mobile app. Point the camera at any receipt (vet, feed store, supplies, breeding fees, registration, travel) and Scout reads it and auto-fills the expense record with vendor, date, amount, category, tax, and notes into the financial ledger.
- Persistent context. Conversations save across sessions. Scout remembers the breeder's program.

### 2. Native mobile app deliberately scoped for the on-the-go breeder day

BreederHQ is the only breeder platform on the market with a serious native mobile app for the work a breeder actually does away from the desk.

- Native app, not a wrapper. Capacitor-based, installable from the App Store and Google Play.
- Scoped by intent, not by parity. The browser app is where deep desk work happens (long-form program planning, financial deep-dives, bulk imports, complex reports, admin configuration). The mobile app is where on-the-go work happens.
- What the mobile app covers: on-the-go capture and daily-running workflows across animals, breeding cycles and events, offspring, health records, vaccinations, medications, protocols, weights and growth entry with anomaly awareness, contacts, waitlist responses, buyer messages, photo capture, media vault, Scout AI queries, camera-based receipt capture with automatic Scout AI expense fill, and the buyer-facing client portal experience.
- Built for one-hand-plus-newborn ergonomics. Barn, whelping box, kidding pen, pasture, stall, vet visit, buyer pickup, show ring, feed store checkout, truck at 2am.

## Business Model

- 14-day free trial on every plan. Not a free tier.
- Two paid tiers: Pro ($79/mo) and Enterprise ($159/mo), plus Standard ($29/mo) entry-level tier. Live prices at /pricing.
- FOUNDER50 promo: 50% off 12 months of Pro or Enterprise for the first 100 subscribers.
- Billed in USD. International cards accepted.
- Marketplace listing currencies: USD, GBP, EUR, CAD, AUD. Subscription billing stays USD-only.
- No commissions on marketplace transactions. Breeders keep what they earn; buyers pay nothing.

## Stage

Approximately 4 months post-launch as of 2026-07-01. Founder-solo on marketing. Small paying-tenant base; growing.

## Cross-References

- Audiences: [./audiences.md](./audiences.md)
- Differentiation and competitive stance: [./differentiation.md](./differentiation.md)
- Species: [./species.md](./species.md)
- Pricing: [./pricing.md](./pricing.md)
- Trust posture: [./trust.md](./trust.md)
- Glossary: [./glossary.md](./glossary.md)
