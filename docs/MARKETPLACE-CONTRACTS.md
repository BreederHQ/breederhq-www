# BreederHQ Marketplace — Real Contracts (Source of Truth)

**Status:** Verified 2026-05-19 against the live `breederhq` marketplace codebase.
**Scope:** Browse routes, public API filters, provider-flow URLs used by `breederhq-www`.
**Audience:** Every engineer and AI agent touching `/services/*` or `/facilities/*` pages on `breederhq-www`.

This is the authoritative reference. **Do not invent routes or query params.** Verify against this file before introducing a new buyer hub URL, listing fetch URL, or provider CTA.

If the real marketplace contract changes, update this file in the same commit.

---

## 1. Browse routes (real)

Defined in `breederhq/apps/marketplace/src/routes/MarketplaceRoutes.tsx`:

| Route | Real handler | Purpose |
|---|---|---|
| `/services` | `ServicesIndexPage` | Marketplace services index — all categories, filter UI |
| `/services/category/:categorySlug` | `ServicesIndexPage` (filter locked by categorySlug) | Browse a service category |
| `/services/facilities` | `PrivateDogParksIndexPage` | Facilities hub (canonical) |
| `/services/facilities/:facilitySlug` | `ServicesIndexPage` (filter locked by facilitySlug) | Browse a facility type |
| `/services/:slugOrId` | `ServiceDetailPage` | **Service detail page — NOT a category route** |
| `/listings/:slug` | `MktListingIndividualAnimalPage` | Listing detail (legacy alias used by listing cards) |
| `/providers/:idOrSlug` | `ProviderProfilePage` | Provider profile page |

**Critical:** `/services/<X>` resolves as `:slugOrId` and renders the ServiceDetailPage. Do not use `https://marketplace.breederhq.com/services/farriers` as a "browse farriers" link — it will try to render a service detail with slug `farriers`. Use `/services/category/farriers`.

`categorySlug` and `facilitySlug` are auto-derived from the SERVICE_TYPE enum value by lowercasing + hyphenating. See `marketplace-hubs.ts`.

---

## 2. Public listings API (real)

Defined in `breederhq-api/src/routes/marketplace-listings.ts` at the route `GET /public/listings` (full path: `/api/v1/marketplace/public/listings`).

```
GET https://marketplace.breederhq.com/api/v1/marketplace/public/listings
    ?category=<canonical_id | url_slug | legacy_alias>
    [&subcategory=<string>]
    [&city=<string>]
    [&state=<string>]
    [&search=<string>]
    [&sort=<newest|rating-desc|price-asc|price-desc|name-asc|name-desc|-publishedAt>]
    [&page=<int>]
    [&limit=<int (max 50)>]
```

### Canonical category contract (updated 2026-05-19, PR 1 of vocabulary unification)

The `category` param accepts any of three forms, all resolved through the canonical catalog at `breederhq-api/src/services/marketplace-service-categories.ts`:

1. **Canonical id** — lowercase snake_case singular (e.g. `farrier`, `equine_boarding`, `private_dog_park`). This is what the DB stores.
2. **URL slug** — hand-written per category in the catalog; often plural for SEO (e.g. `farriers`, `equine-boarding`, `private-dog-parks`). Slugs and ids are NOT mechanically derived from each other — never assume `slug = id.replace("_", "-")`.
3. **Legacy alias** — uppercase singular forms from pre-2026-05 vocabulary (e.g. `FARRIER`, `EQUINE_BOARDING`). Maintained transparently by the alias resolver until PR 7 retires them after telemetry confirms zero traffic.

All three forms resolve to the same canonical id and hit the same SQL filter. The response always returns the canonical id, never an alias.

**Resolution behavior:**

```ts
// Pseudocode of what the route does today
const resolved = resolveCategoryWithSource(query.category);
// resolved = { raw, canonical, isAlias }
if (resolved.isAlias) {
  logger.info({ raw: resolved.raw, resolved: resolved.canonical, source: "public_filter" });
}
if (resolved.canonical && isValidListingCategory(resolved.canonical)) {
  // SQL: WHERE LOWER(l.category) = ${resolved.canonical}
} else if (rawWasSupplied) {
  // Fail closed: return empty result set, not a silent no-op filter.
  // Prevents the previous bug shape where /services/category/farriers
  // showed homepage results because the filter silently dropped.
}
```

**Two notable behaviors:**

- **Slug ≠ id.** `farrier` (id) and `farriers` (URL slug) are both valid. Listings are stored under the canonical id `farrier`. The URL is `farriers`. This singular-id / plural-slug split is intentional — see [breederhq/docs/codebase/architecture/CATEGORY-VOCABULARY-UNIFICATION-2026-05.md](../../breederhq/docs/codebase/architecture/CATEGORY-VOCABULARY-UNIFICATION-2026-05.md) Decision 2.
- **Unknown values fail closed.** `?category=invented_thing` returns an empty result set + logs the alias miss. Pre-PR-1 behavior silently dropped the filter, which is what surfaced homepage listings on broken category URLs. Today's behavior makes the failure visible.

**Alias examples (current):**

| URL form | Resolves to | Notes |
|---|---|---|
| `farrier` | `farrier` | canonical |
| `farriers` | `farrier` | URL slug |
| `FARRIER` | `farrier` | legacy uppercase, drained in PR 7 |
| `equine-boarding` | `equine_boarding` | URL slug (dashed) |
| `EQUINE_BOARDING` | `equine_boarding` | legacy uppercase |
| `private-dog-parks` | `private_dog_park` | URL slug (pluralized) |
| `dog_park` | `private_dog_park` | legacy alias |
| `product` | `merchandise` | legacy alias |
| `unknown_thing` | (null) | empty result set + logged |

`city` and `state` are ILIKE-matched (substring, case-insensitive). These are unaffected by the category-catalog work.

### Catalog source-of-truth (architectural note)

The category catalog lives in `breederhq-api` and is the single source of truth. A codegen script emits a TS mirror to `breederhq/packages/commerce-shared/src/categories/service-categories.generated.ts`. CI gates: API drift check (regenerate + diff) and frontend hash-integrity check (SHA-256 header matches body). To add or rename a category, edit the API source, run `npm run codegen:service-categories`, and commit both regenerated snapshots in a single PR pair.

Full architecture: [breederhq/docs/codebase/architecture/CATEGORY-VOCABULARY-UNIFICATION-2026-05.md](../../breederhq/docs/codebase/architecture/CATEGORY-VOCABULARY-UNIFICATION-2026-05.md).

---

## 3. Real SERVICE_TYPE enum values

Defined in `breederhq/apps/marketplace/src/marketplace/features/services-index/services-index.constants.ts` as `CATEGORY_OPTIONS`. All values valid for the `category` API param (in lowercase form):

| Enum value | API value (lowercase) | Browse slug | i18n key |
|---|---|---|---|
| `TRAINING` | `training` | `training` | `service_types.training` |
| `GROOMING` | `grooming` | `grooming` | `service_types.grooming` |
| `TRANSPORT` | `transport` | `transport` | `service_types.transport` |
| `BOARDING` | `boarding` | `boarding` | `service_types.boarding` |
| `VETERINARY` | `veterinary` | `veterinary` | `service_types.veterinary` |
| `PHOTOGRAPHY` | `photography` | `photography` | `service_types.photography` |
| `HEALTH_TESTING` | `health_testing` | `health-testing` | `service_types.health_testing` |
| `HANDLING` | `handling` | `handling` | `service_types.handling` |
| `NUTRITION` | `nutrition` | `nutrition` | `service_types.nutrition` |
| `PET_SITTING` | `pet_sitting` | `pet-sitting` | `service_types.pet_sitting` |
| `REHABILITATION` | `rehabilitation` | `rehabilitation` | `service_types.rehabilitation` |
| `BEHAVIORAL` | `behavioral` | `behavioral` | `service_types.behavioral` |
| `FARRIERS` | `farriers` | `farriers` | `service_types.farriers` |
| `EQUINE_BOARDING` | `equine_boarding` | `equine-boarding` | `service_types.equine_boarding` |
| `EQUINE_SERVICES` | `equine_services` | `equine-services` | `service_types.equine_services` |
| `EQUINE_REPRO` | `equine_repro` | `equine-repro` | `service_types.equine_repro` |
| `LIVESTOCK_SERVICES` | `livestock_services` | `livestock-services` | `service_types.livestock_services` |
| `PRIVATE_DOG_PARK` | `private_dog_park` | `private-dog-parks` (FACILITY_HUBS) | `service_types.private_dog_park` |
| `EQUINE_FACILITY` | `equine_facility` | `equine` (FACILITY_HUBS) | `service_types.equine_facility` |
| `LIVESTOCK_FACILITY` | `livestock_facility` | `livestock` (FACILITY_HUBS) | `service_types.livestock_facility` |
| `INDOOR_TRAINING_FACILITY` | `indoor_training_facility` | `indoor-training` (FACILITY_HUBS) | `service_types.indoor_training_facility` |
| `BOARDING_FACILITY` | `boarding_facility` | `boarding` (FACILITY_HUBS) | `service_types.boarding_facility` |
| `WASH_GROOMING_FACILITY` | `wash_grooming_facility` | `wash-grooming` (FACILITY_HUBS) | `service_types.wash_grooming_facility` |
| `EVENT_SHOW_FACILITY` | `event_show_facility` | `events-shows` (FACILITY_HUBS) | `service_types.event_show_facility` |
| `SPECIALTY_FACILITY` | `specialty_facility` | `specialty` (FACILITY_HUBS) | `service_types.specialty_facility` |
| `MERCHANDISE` | `merchandise` | `merchandise` | `service_types.merchandise` |
| `OTHER_SERVICE` | `other_service` | `other-service` | `service_types.other_service` |

The 5 specialist categories (FARRIERS, EQUINE_BOARDING, EQUINE_SERVICES, EQUINE_REPRO, LIVESTOCK_SERVICES) were added 2026-05-19 to align the marketplace constants with the SEO-concentrated clusters in `docs/MARKETPLACE-ARCHITECTURE.md` Item 4.

**Adding a new category requires (in `breederhq`):**
1. `apps/marketplace/.../services-index.constants.ts` — add to `CATEGORY_OPTIONS` and `SERVICE_TYPE_LABELS`
2. `packages/i18n/src/locales/{en,es,fr,de,pt-BR}/commerce.json` — add to `service_types`
3. `npm run -w @bhq/i18n build` to rebuild the i18n bundle
4. The marketplace hub auto-derives the slug from the enum value, the route works without further changes

---

## 4. Provider-flow URL (real)

The single real provider entry point is:

```
https://accounts.breederhq.com/register?intent=provider_marketplace
```

After register/login the user is routed by the accounts app (via the platform redirect) through `/provider/start` (ProviderEntryPage) in the marketplace. The provider chooses their category there.

**Do not add fake parameters.** Specifically:

- `category=<X>` on the register URL is **not** consumed by the accounts app or backend. Adding it is fake specificity.
- `returnTo=<X>` is consumed only on the `/login` page in the accounts app (not on `/register`). Most "list your space" CTAs send unauthenticated users to `/register`, so `returnTo` is ignored.
- City/state/location params: not consumed anywhere in the provider register flow.

The shared helper `buildListingFlowUrl` in `src/lib/marketplaceListings.ts` accepts these args for forward-compatibility but ignores them. If we add a real channel for category preselection later (e.g. session storage handoff), update both this doc and the helper.

---

## 5. Mapping table — breederhq-www → real marketplace

Every buyer-side hub on `breederhq-www` maps to one of three buckets:

### Direct (real first-class browse category)

| breederhq-www hub | API category | Browse URL |
|---|---|---|
| `/services/dog-training` | `training` | `/services/category/training` |
| `/services/grooming` | `grooming` | `/services/category/grooming` |
| `/services/boarding` | `boarding` | `/services/category/boarding` |
| `/services/transport` | `transport` | `/services/category/transport` |
| `/services/behavioral` | `behavioral` | `/services/category/behavioral` |
| `/services/pet-sitting` | `pet_sitting` | `/services/category/pet-sitting` |
| `/services/health-testing` | `health_testing` | `/services/category/health-testing` |
| `/services/rehabilitation` | `rehabilitation` | `/services/category/rehabilitation` |
| `/services/nutrition` | `nutrition` | `/services/category/nutrition` |
| `/services/photography` | `photography` | `/services/category/photography` |
| `/services/farriers` | `farriers` | `/services/category/farriers` |
| `/services/equine-boarding` | `equine_boarding` | `/services/category/equine-boarding` |
| `/services/equine-services` | `equine_services` | `/services/category/equine-services` |
| `/services/equine-repro` | `equine_repro` | `/services/category/equine-repro` |
| `/services/livestock-services` | `livestock_services` | `/services/category/livestock-services` |

### Parent-mapped (no specialist sub-route exists — mapping to nearest real parent)

| breederhq-www hub | API category | Browse URL | Reason |
|---|---|---|---|
| `/services/veterinary-specialists` | `veterinary` | `/services/category/veterinary` | The marketplace has only `VETERINARY` (general), no specialist sub-filter. The www hub stays editorial and points at the parent category. |
| `/services/show-handling` | `handling` | `/services/category/handling` | The marketplace enum is `HANDLING`; "show handling" is the www-side editorial framing. |

### Geo pages

Geo pages reuse the parent category mapping with `city`/`state` query params. The API ILIKE-matches both. Example: `/services/farriers/kentucky` → `fetchServiceListings('farriers', { state: 'Kentucky' })` → `category=farriers&state=Kentucky`.

### Facilities

| breederhq-www hub | API category | Browse URL |
|---|---|---|
| `/facilities/dog-parks` | `private_dog_park` | `/services/facilities/private-dog-parks` |
| `/facilities/equine` | `equine_facility` | `/services/facilities/equine` |
| `/facilities/indoor-training` | `indoor_training_facility` | `/services/facilities/indoor-training` |
| `/facilities/boarding` | `boarding_facility` | `/services/facilities/boarding` |
| `/facilities/wash-grooming` | `wash_grooming_facility` | `/services/facilities/wash-grooming` |
| `/facilities/events-shows` | `event_show_facility` | `/services/facilities/events-shows` |
| `/facilities/livestock` | `livestock_facility` | `/services/facilities/livestock` |
| `/facilities/specialty` | `specialty_facility` | `/services/facilities/specialty` |

---

## 6. Code that enforces this mapping

`src/lib/marketplaceListings.ts` is the single source of truth on the `breederhq-www` side. It contains the `CATEGORY_MAP` and `FACILITY_MAP` registries, the URL builders, and the build-time fetcher. Adding or changing a route should happen there in the same commit as any change to this doc.

Pages (geo and hub) consume the helpers and never hard-code marketplace browse URLs or API filter values. If you see a `marketplace.breederhq.com/services/<slug>` URL in a page that doesn't go through the lib, it's drift. Fix it.

The dog-park city pages (`src/pages/dog-parks/[city].astro`) are the historical reference pattern. They were also corrected on 2026-05-19 to use the real `category=private_dog_park` API filter (previously used a non-functional `category=facilities&subcategory=private_dog_park` combo).

---

## 7. Triggers to revisit this doc

- New SERVICE_TYPE enum value added or removed
- New marketplace route added under `/services/*` or `/facilities/*`
- Backend changes the `/public/listings` filter contract
- Accounts app adds real consumption of `category=` or `returnTo=` for provider intent
- `MarketplaceRoutes.tsx` is refactored

Otherwise: do not edit.
