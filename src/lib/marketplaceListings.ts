/**
 * Build-time marketplace listing fetch + URL builders for /services and /facilities pages.
 *
 * SOURCE OF TRUTH — DO NOT INVENT ROUTES OR PARAMS.
 *
 * Real marketplace contracts (verified against breederhq):
 *
 *   Browse routes (apps/marketplace/src/routes/MarketplaceRoutes.tsx):
 *     /services                                  → services index
 *     /services/category/:categorySlug           → service-category browse (filter locked)
 *     /services/facilities                       → facilities hub
 *     /services/facilities/:facilitySlug         → facility-category browse (filter locked)
 *     /services/:slugOrId                        → service detail (NOT a category route)
 *     /listings/:slug                            → listing detail (legacy alias)
 *     /providers/:idOrSlug                       → provider profile
 *
 *   Public API (breederhq-api/src/routes/marketplace-listings.ts ::: /public/listings):
 *     GET /api/v1/marketplace/public/listings
 *       ?category=<lowercase_enum>      // e.g. category=training, category=farriers
 *       &subcategory=<string>           // optional finer split inside a category
 *       &city=<string>                  // ILIKE %city%
 *       &state=<string>                 // ILIKE %state%
 *       &search=<string>
 *       &sort=-publishedAt | newest | rating-desc | price-asc | price-desc | name-asc | name-desc
 *       &page=<int>&limit=<int (max 50)>
 *     Backend normalises category to lowercase and compares exactly:
 *       LOWER(l.category) = '<lowercase_enum>'
 *     Enum values come from apps/marketplace/src/marketplace/features/services-index/services-index.constants.ts
 *     CATEGORY_OPTIONS — currently:
 *       TRAINING, GROOMING, TRANSPORT, BOARDING, VETERINARY, PHOTOGRAPHY,
 *       HEALTH_TESTING, HANDLING, NUTRITION, PET_SITTING, REHABILITATION,
 *       BEHAVIORAL, FARRIERS, EQUINE_BOARDING, EQUINE_SERVICES, EQUINE_REPRO,
 *       LIVESTOCK_SERVICES, PRIVATE_DOG_PARK, EQUINE_FACILITY,
 *       LIVESTOCK_FACILITY, INDOOR_TRAINING_FACILITY, BOARDING_FACILITY,
 *       WASH_GROOMING_FACILITY, EVENT_SHOW_FACILITY, SPECIALTY_FACILITY,
 *       MERCHANDISE, OTHER_SERVICE.
 *     The marketplace's marketplace-hubs.ts derives the slug for each value
 *     by `value.toLowerCase().replace(/_/g, "-")`. The browse route consumes
 *     that slug via `getServiceCategoryHubBySlug(slug)` and locks the filter.
 *
 *   Provider intent (accounts.breederhq.com/register):
 *     ?intent=provider_marketplace
 *     The accounts app consumes only `intent`. After register/login the visitor
 *     is routed through /provider/start (ProviderEntryPage) where they
 *     self-select category. Earlier scheme included `?category=<X>` and
 *     `?returnTo=<X>` but neither is consumed — they were dropped in Phase 6.
 *     See docs/MARKETPLACE-CONTRACTS.md for the authoritative scheme.
 *
 * If a /services/<category> hub on breederhq-www does not map to a real
 * CATEGORY_OPTIONS value, fetchServiceListings returns an empty result
 * synchronously (no API call), and helpers return a degraded browseUrl
 * that points at the marketplace services index. The page still renders
 * editorial content + an honest empty state.
 *
 * Mirrors the pattern proven by src/pages/dog-parks/[city].astro.
 */

export interface MarketplaceListing {
  id: number;
  slug: string;
  title: string;
  city: string | null;
  state: string | null;
  priceCents: number | null;
  priceType: string | null;
  priceDisplay?: string;
  images: string[];
  cardSummary?: string | null;
}

export interface ListingsResult {
  items: MarketplaceListing[];
  total: number;
  /** Marketplace browse URL scoped to this category + optional location. */
  browseUrl: string;
  /** Marketplace listing-creation flow URL for providers in this category. */
  listingFlowUrl: string;
  /**
   * True when this result resolves to a real marketplace browse category.
   * False when the category does not exist in the real marketplace and the
   * result is a graceful degraded empty (browseUrl points at /services).
   * Used by the page to suppress fake "0 listings in <Category>" framing.
   */
  scopedToRealCategory: boolean;
}

const MARKETPLACE_HOST = 'https://marketplace.breederhq.com';
const ACCOUNTS_HOST = 'https://accounts.breederhq.com';
const API_BASE = `${MARKETPLACE_HOST}/api/v1/marketplace/public/listings`;

/**
 * Service categories supported on breederhq-www buyer hubs.
 *
 * - `apiEnum` is the exact lowercase value the public listings API expects
 *   in the `category` query parameter. It must match the lowercased value
 *   from CATEGORY_OPTIONS in apps/marketplace/.../services-index.constants.ts.
 * - `browseSlug` is the marketplace browse slug under `/services/category/<slug>`.
 *   It is derived from the enum value by lowercasing + hyphenating, matching
 *   what marketplace-hubs.ts builds.
 */
export type CategoryKey =
  | 'farriers'
  | 'equine-boarding'
  | 'equine-services'
  | 'equine-repro'
  | 'livestock-services'
  | 'dog-training'
  | 'behavioral'
  | 'show-handling'
  | 'grooming'
  | 'boarding'
  | 'pet-sitting'
  | 'veterinary-specialists'
  | 'health-testing'
  | 'rehabilitation'
  | 'nutrition'
  | 'transport'
  | 'photography';

interface CategoryDescriptor {
  /** Lowercase enum sent to the API `category` param. Empty = no real support. */
  apiEnum: string;
  /** Marketplace browse slug under `/services/category/`. Empty = degrade to /services. */
  browseSlug: string;
  /** Provider-flow `category` value on accounts.breederhq.com/register. */
  intentCategory: string;
}

/**
 * Mapping: breederhq-www slug → real marketplace contract.
 *
 * Every entry here is verified against the actual CATEGORY_OPTIONS in
 * apps/marketplace/.../services-index.constants.ts. The 5 specialist
 * categories (farriers, equine-boarding, equine-services, equine-repro,
 * livestock-services) were added to the marketplace constants in the
 * same change that introduced this file's current form — they are now
 * real first-class categories.
 *
 * Note on `veterinary-specialists` and `show-handling`: these breederhq-www
 * slugs are buyer-side editorial labels. The real marketplace has parent
 * categories `VETERINARY` and `HANDLING`. We map to those parents truthfully.
 */
const CATEGORY_MAP: Record<CategoryKey, CategoryDescriptor> = {
  farriers:               { apiEnum: 'farriers',           browseSlug: 'farriers',           intentCategory: 'farriers' },
  'equine-boarding':      { apiEnum: 'equine_boarding',    browseSlug: 'equine-boarding',    intentCategory: 'equine_boarding' },
  'equine-services':      { apiEnum: 'equine_services',    browseSlug: 'equine-services',    intentCategory: 'equine_services' },
  'equine-repro':         { apiEnum: 'equine_repro',       browseSlug: 'equine-repro',       intentCategory: 'equine_repro' },
  'livestock-services':   { apiEnum: 'livestock_services', browseSlug: 'livestock-services', intentCategory: 'livestock_services' },
  'dog-training':         { apiEnum: 'training',           browseSlug: 'training',           intentCategory: 'training' },
  behavioral:             { apiEnum: 'behavioral',         browseSlug: 'behavioral',         intentCategory: 'behavioral' },
  // show-handling on www → HANDLING in the marketplace (no specialist sub-route exists).
  'show-handling':        { apiEnum: 'handling',           browseSlug: 'handling',           intentCategory: 'handling' },
  grooming:               { apiEnum: 'grooming',           browseSlug: 'grooming',           intentCategory: 'grooming' },
  boarding:               { apiEnum: 'boarding',           browseSlug: 'boarding',           intentCategory: 'boarding' },
  'pet-sitting':          { apiEnum: 'pet_sitting',        browseSlug: 'pet-sitting',        intentCategory: 'pet_sitting' },
  // veterinary-specialists on www → VETERINARY parent (no specialist sub-route exists).
  'veterinary-specialists': { apiEnum: 'veterinary',       browseSlug: 'veterinary',         intentCategory: 'veterinary' },
  'health-testing':       { apiEnum: 'health_testing',     browseSlug: 'health-testing',     intentCategory: 'health_testing' },
  rehabilitation:         { apiEnum: 'rehabilitation',     browseSlug: 'rehabilitation',     intentCategory: 'rehabilitation' },
  nutrition:              { apiEnum: 'nutrition',          browseSlug: 'nutrition',          intentCategory: 'nutrition' },
  transport:              { apiEnum: 'transport',          browseSlug: 'transport',          intentCategory: 'transport' },
  photography:            { apiEnum: 'photography',        browseSlug: 'photography',        intentCategory: 'photography' },
};

export type FacilityKey =
  | 'dog-parks'
  | 'equine'
  | 'indoor-training'
  | 'boarding'
  | 'wash-grooming'
  | 'events-shows'
  | 'livestock'
  | 'specialty';

interface FacilityDescriptor {
  /** Lowercase enum sent to the API `category` param. */
  apiEnum: string;
  /** Marketplace facility browse slug under `/services/facilities/`. */
  browseSlug: string;
  /** Provider-flow category value. */
  intentCategory: string;
}

/**
 * Facility categories. Browse slug matches FACILITY_HUBS in
 * apps/marketplace/src/marketplace/features/hubs/marketplace-hubs.ts.
 * The API `category` filter takes the SERVICE_TYPE enum value lowercased
 * — the marketplace stores facilities under the same `category` column as
 * services, not under a separate `subcategory` field.
 */
const FACILITY_MAP: Record<FacilityKey, FacilityDescriptor> = {
  'dog-parks':       { apiEnum: 'private_dog_park',          browseSlug: 'private-dog-parks', intentCategory: 'private_dog_park' },
  equine:            { apiEnum: 'equine_facility',           browseSlug: 'equine',            intentCategory: 'equine_facility' },
  'indoor-training': { apiEnum: 'indoor_training_facility',  browseSlug: 'indoor-training',   intentCategory: 'indoor_training_facility' },
  boarding:          { apiEnum: 'boarding_facility',         browseSlug: 'boarding',          intentCategory: 'boarding_facility' },
  'wash-grooming':   { apiEnum: 'wash_grooming_facility',    browseSlug: 'wash-grooming',     intentCategory: 'wash_grooming_facility' },
  'events-shows':    { apiEnum: 'event_show_facility',       browseSlug: 'events-shows',      intentCategory: 'event_show_facility' },
  livestock:         { apiEnum: 'livestock_facility',        browseSlug: 'livestock',         intentCategory: 'livestock_facility' },
  specialty:         { apiEnum: 'specialty_facility',        browseSlug: 'specialty',         intentCategory: 'specialty_facility' },
};

export interface ScopedQuery {
  /** Optional metro city. */
  city?: string;
  /** US state abbreviation (e.g. 'KY', 'TX') or full state name. */
  state?: string;
}

function buildServiceCategoryBrowseUrl(browseSlug: string, scope: ScopedQuery = {}): string {
  const url = new URL(`${MARKETPLACE_HOST}/services/category/${browseSlug}`);
  if (scope.city) url.searchParams.set('city', scope.city);
  if (scope.state) url.searchParams.set('state', scope.state);
  return url.toString();
}

function buildFacilityBrowseUrl(browseSlug: string, scope: ScopedQuery = {}): string {
  const url = new URL(`${MARKETPLACE_HOST}/services/facilities/${browseSlug}`);
  if (scope.city) url.searchParams.set('city', scope.city);
  if (scope.state) url.searchParams.set('state', scope.state);
  return url.toString();
}

/** Degraded browse URL when no real category mapping exists. */
function buildServicesIndexUrl(scope: ScopedQuery = {}): string {
  const url = new URL(`${MARKETPLACE_HOST}/services`);
  if (scope.city) url.searchParams.set('city', scope.city);
  if (scope.state) url.searchParams.set('state', scope.state);
  return url.toString();
}

/**
 * Provider listing-flow URL. Sends the visitor to the real provider intent
 * on accounts.breederhq.com. The `category` param is intentionally omitted
 * — the accounts/login flow only consumes `intent` and does not branch on
 * category. Adding a category= param would be fake specificity.
 *
 * After register/login the user lands at marketplace's /provider/start
 * (ProviderEntryPage), where they choose their category from the real
 * provider onboarding UI.
 *
 * The `_intentCategory` and `_scope` args are kept on the signature so
 * future consumers can be extended without breaking call sites, and so
 * analytics could be re-added via a real channel if needed later.
 */
function buildListingFlowUrl(_intentCategory: string, _scope: ScopedQuery = {}): string {
  const url = new URL(`${ACCOUNTS_HOST}/register`);
  url.searchParams.set('intent', 'provider_marketplace');
  return url.toString();
}

async function fetchPublicListings(
  query: URLSearchParams
): Promise<{ items: MarketplaceListing[]; total: number }> {
  try {
    const res = await fetch(`${API_BASE}?${query.toString()}`, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return { items: [], total: 0 };
    const data = (await res.json()) as { items?: MarketplaceListing[]; total?: number };
    return { items: data.items || [], total: data.total || 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

/**
 * Fetch ALL listings for a service category, paginated through the public API.
 *
 * Used for build-time aggregation (state grids, getStaticPaths over states).
 * Stops at MAX_PAGES to avoid runaway builds if the API misbehaves.
 *
 * Returns raw items array — caller does its own grouping/filtering.
 * Empty array on any failure (build must not break when the API is down).
 */
export async function fetchAllListingsForCategory(
  category: CategoryKey
): Promise<MarketplaceListing[]> {
  const desc = CATEGORY_MAP[category];
  if (!desc || !desc.apiEnum) return [];

  const PAGE_LIMIT = 50;
  const MAX_PAGES = 20; // hard ceiling: 1000 listings per category
  const all: MarketplaceListing[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const query = new URLSearchParams({
      category: desc.apiEnum,
      limit: String(PAGE_LIMIT),
      page: String(page),
      sort: '-publishedAt',
    });
    const { items, total } = await fetchPublicListings(query);
    all.push(...items);
    if (all.length >= total || items.length < PAGE_LIMIT) break;
  }

  return all;
}

/**
 * Fetch listings for a service category, optionally scoped to a city/state.
 * Returns empty result on any failure — caller renders an empty state.
 */
export async function fetchServiceListings(
  category: CategoryKey,
  scope: ScopedQuery = {},
  limit = 9
): Promise<ListingsResult> {
  const desc = CATEGORY_MAP[category];
  if (!desc || !desc.apiEnum) {
    return {
      items: [],
      total: 0,
      browseUrl: buildServicesIndexUrl(scope),
      listingFlowUrl: buildListingFlowUrl(desc?.intentCategory || '', scope),
      scopedToRealCategory: false,
    };
  }
  const query = new URLSearchParams({
    category: desc.apiEnum,
    limit: String(limit),
    sort: '-publishedAt',
  });
  if (scope.city) query.set('city', scope.city);
  if (scope.state) query.set('state', normalizeStateForApi(scope.state));
  const { items, total } = await fetchPublicListings(query);
  return {
    items,
    total,
    browseUrl: buildServiceCategoryBrowseUrl(desc.browseSlug, scope),
    listingFlowUrl: buildListingFlowUrl(desc.intentCategory, scope),
    scopedToRealCategory: true,
  };
}

/**
 * Fetch listings for a facility type, optionally scoped to a city/state.
 */
export async function fetchFacilityListings(
  facility: FacilityKey,
  scope: ScopedQuery = {},
  limit = 9
): Promise<ListingsResult> {
  const desc = FACILITY_MAP[facility];
  const query = new URLSearchParams({
    category: desc.apiEnum,
    limit: String(limit),
    sort: '-publishedAt',
  });
  if (scope.city) query.set('city', scope.city);
  if (scope.state) query.set('state', normalizeStateForApi(scope.state));
  const { items, total } = await fetchPublicListings(query);
  return {
    items,
    total,
    browseUrl: buildFacilityBrowseUrl(desc.browseSlug, scope),
    listingFlowUrl: buildListingFlowUrl(desc.intentCategory, scope),
    scopedToRealCategory: true,
  };
}

/**
 * Resolve any state representation (full name, slug, or code) to the
 * 2-letter USPS code the marketplace API expects. Falls back to the
 * input unchanged if no descriptor matches (e.g. 'XX' or a non-state
 * string), which lets the API return its own empty result rather than
 * us silently corrupting the query.
 *
 * Examples:
 *   normalizeStateForApi('Kentucky') -> 'KY'
 *   normalizeStateForApi('kentucky') -> 'KY'
 *   normalizeStateForApi('new-york') -> 'NY'
 *   normalizeStateForApi('AL')       -> 'AL'
 */
function normalizeStateForApi(input: string): string {
  if (!input) return input;
  // 2-letter code? Already correct.
  if (input.length === 2) {
    const byCode = stateByCode(input);
    if (byCode) return byCode.code;
  }
  // Slug form ('new-york', 'alabama')?
  const bySlug = stateBySlug(input.toLowerCase().replace(/\s+/g, '-'));
  if (bySlug) return bySlug.code;
  // Full name ('Kentucky', 'New York')?
  const normalizedName = input.trim().toLowerCase();
  const byName = US_STATES.find((s) => s.name.toLowerCase() === normalizedName);
  if (byName) return byName.code;
  return input;
}

/** Public marketplace URL for a listing detail page. */
export function listingDetailUrl(slug: string): string {
  return `${MARKETPLACE_HOST}/listings/${slug}`;
}

/**
 * US state directory: code, full name, URL slug.
 *
 * The marketplace API stores `state` as 2-letter postal codes (AL, UT, KY).
 * www URLs use lowercase hyphenated slugs (alabama, utah, kentucky, new-york).
 * This table is the single source of truth for translating between them.
 *
 * Used by:
 *   - state grids on /services/<category> hubs (group listings by state)
 *   - dynamic /services/<category>/[state].astro route (slug → API filter)
 *   - getStaticPaths over states that have providers
 */
export interface StateDescriptor {
  /** USPS 2-letter code as stored by the marketplace API. */
  code: string;
  /** Full state name, Title Case. */
  name: string;
  /** Lowercase hyphenated slug used in www URLs. */
  slug: string;
}

export const US_STATES: readonly StateDescriptor[] = [
  { code: 'AL', name: 'Alabama',        slug: 'alabama' },
  { code: 'AK', name: 'Alaska',         slug: 'alaska' },
  { code: 'AZ', name: 'Arizona',        slug: 'arizona' },
  { code: 'AR', name: 'Arkansas',       slug: 'arkansas' },
  { code: 'CA', name: 'California',     slug: 'california' },
  { code: 'CO', name: 'Colorado',       slug: 'colorado' },
  { code: 'CT', name: 'Connecticut',    slug: 'connecticut' },
  { code: 'DE', name: 'Delaware',       slug: 'delaware' },
  { code: 'DC', name: 'District of Columbia', slug: 'district-of-columbia' },
  { code: 'FL', name: 'Florida',        slug: 'florida' },
  { code: 'GA', name: 'Georgia',        slug: 'georgia' },
  { code: 'HI', name: 'Hawaii',         slug: 'hawaii' },
  { code: 'ID', name: 'Idaho',          slug: 'idaho' },
  { code: 'IL', name: 'Illinois',       slug: 'illinois' },
  { code: 'IN', name: 'Indiana',        slug: 'indiana' },
  { code: 'IA', name: 'Iowa',           slug: 'iowa' },
  { code: 'KS', name: 'Kansas',         slug: 'kansas' },
  { code: 'KY', name: 'Kentucky',       slug: 'kentucky' },
  { code: 'LA', name: 'Louisiana',      slug: 'louisiana' },
  { code: 'ME', name: 'Maine',          slug: 'maine' },
  { code: 'MD', name: 'Maryland',       slug: 'maryland' },
  { code: 'MA', name: 'Massachusetts',  slug: 'massachusetts' },
  { code: 'MI', name: 'Michigan',       slug: 'michigan' },
  { code: 'MN', name: 'Minnesota',      slug: 'minnesota' },
  { code: 'MS', name: 'Mississippi',    slug: 'mississippi' },
  { code: 'MO', name: 'Missouri',       slug: 'missouri' },
  { code: 'MT', name: 'Montana',        slug: 'montana' },
  { code: 'NE', name: 'Nebraska',       slug: 'nebraska' },
  { code: 'NV', name: 'Nevada',         slug: 'nevada' },
  { code: 'NH', name: 'New Hampshire',  slug: 'new-hampshire' },
  { code: 'NJ', name: 'New Jersey',     slug: 'new-jersey' },
  { code: 'NM', name: 'New Mexico',     slug: 'new-mexico' },
  { code: 'NY', name: 'New York',       slug: 'new-york' },
  { code: 'NC', name: 'North Carolina', slug: 'north-carolina' },
  { code: 'ND', name: 'North Dakota',   slug: 'north-dakota' },
  { code: 'OH', name: 'Ohio',           slug: 'ohio' },
  { code: 'OK', name: 'Oklahoma',       slug: 'oklahoma' },
  { code: 'OR', name: 'Oregon',         slug: 'oregon' },
  { code: 'PA', name: 'Pennsylvania',   slug: 'pennsylvania' },
  { code: 'RI', name: 'Rhode Island',   slug: 'rhode-island' },
  { code: 'SC', name: 'South Carolina', slug: 'south-carolina' },
  { code: 'SD', name: 'South Dakota',   slug: 'south-dakota' },
  { code: 'TN', name: 'Tennessee',      slug: 'tennessee' },
  { code: 'TX', name: 'Texas',          slug: 'texas' },
  { code: 'UT', name: 'Utah',           slug: 'utah' },
  { code: 'VT', name: 'Vermont',        slug: 'vermont' },
  { code: 'VA', name: 'Virginia',       slug: 'virginia' },
  { code: 'WA', name: 'Washington',     slug: 'washington' },
  { code: 'WV', name: 'West Virginia',  slug: 'west-virginia' },
  { code: 'WI', name: 'Wisconsin',      slug: 'wisconsin' },
  { code: 'WY', name: 'Wyoming',        slug: 'wyoming' },
];

const _stateByCode = new Map<string, StateDescriptor>(US_STATES.map(s => [s.code, s]));
const _stateBySlug = new Map<string, StateDescriptor>(US_STATES.map(s => [s.slug, s]));

/** Look up a state descriptor by USPS code (e.g. 'AL'). Case-insensitive. */
export function stateByCode(code: string | null | undefined): StateDescriptor | undefined {
  if (!code) return undefined;
  return _stateByCode.get(code.toUpperCase());
}

/** Look up a state descriptor by URL slug (e.g. 'alabama'). Case-insensitive. */
export function stateBySlug(slug: string | null | undefined): StateDescriptor | undefined {
  if (!slug) return undefined;
  return _stateBySlug.get(slug.toLowerCase());
}

/**
 * Group listings by state. Returns a map of state-code → listings, only
 * including states that have ≥1 listing AND a known descriptor.
 *
 * Listings with null/unknown state are dropped (cannot be placed on a
 * state page, so they don't go in the grid).
 */
export function groupListingsByState(
  listings: MarketplaceListing[]
): Map<string, { state: StateDescriptor; items: MarketplaceListing[] }> {
  const grouped = new Map<string, { state: StateDescriptor; items: MarketplaceListing[] }>();
  for (const listing of listings) {
    const desc = stateByCode(listing.state);
    if (!desc) continue;
    let bucket = grouped.get(desc.code);
    if (!bucket) {
      bucket = { state: desc, items: [] };
      grouped.set(desc.code, bucket);
    }
    bucket.items.push(listing);
  }
  return grouped;
}

/** Scoped browse URL for a service category — for hero CTAs that don't render listings. */
export function serviceBrowseUrl(category: CategoryKey, scope: ScopedQuery = {}): string {
  const desc = CATEGORY_MAP[category];
  if (!desc || !desc.apiEnum) return buildServicesIndexUrl(scope);
  return buildServiceCategoryBrowseUrl(desc.browseSlug, scope);
}

export function facilityBrowseUrl(facility: FacilityKey, scope: ScopedQuery = {}): string {
  return buildFacilityBrowseUrl(FACILITY_MAP[facility].browseSlug, scope);
}

export function serviceListingFlowUrl(category: CategoryKey, scope: ScopedQuery = {}): string {
  return buildListingFlowUrl(CATEGORY_MAP[category]?.intentCategory || '', scope);
}

export function facilityListingFlowUrl(facility: FacilityKey, scope: ScopedQuery = {}): string {
  return buildListingFlowUrl(FACILITY_MAP[facility].intentCategory, scope);
}

/**
 * www URL for a state-scoped page under a service category.
 * e.g. ('farriers', 'alabama') → '/services/farriers/alabama'
 *
 * Used by the state-grid component and the dynamic state-page route to
 * link to themselves. Always returns a www-relative path.
 */
export function servicesStatePageUrl(category: CategoryKey, stateSlug: string): string {
  return `/services/${category}/${stateSlug}`;
}
