/**
 * Build-time marketplace listing fetch + URL builders for /services and /facilities pages.
 *
 * Single source of truth for:
 *   - category/subcategory slugs used by the marketplace API
 *   - the public marketplace browse URL scheme
 *   - the public marketplace listing-detail URL scheme
 *
 * Mirrors the pattern proven by src/pages/dog-parks/[city].astro.
 *
 * Fetches happen at Astro build time. If the marketplace API is unreachable,
 * helpers return zero-listing results so pages still render their static
 * editorial content with an honest empty state. No fake counts, no fake
 * inventory.
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
}

const MARKETPLACE_HOST = 'https://marketplace.breederhq.com';
const ACCOUNTS_HOST = 'https://accounts.breederhq.com';
const API_BASE = `${MARKETPLACE_HOST}/api/v1/marketplace/public/listings`;

/**
 * Category map.
 *
 * The marketplace's public listing index supports two top-level filters:
 *   - category=services with serviceCategory=<slug> for service providers
 *   - category=facilities with subcategory=<slug> for bookable facilities
 *
 * Categories that are still pure provider directories (no marketplace
 * listing inventory yet) point to the category browse page; listings
 * will surface automatically once providers start listing.
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

export type FacilityKey =
  | 'dog-parks'
  | 'equine'
  | 'indoor-training'
  | 'boarding'
  | 'wash-grooming'
  | 'events-shows'
  | 'livestock'
  | 'specialty';

interface CategoryDescriptor {
  /** Path segment in the marketplace browse URL. */
  browseSlug: string;
  /** API filter value passed to the listings index. */
  apiCategory: string;
  apiServiceCategory?: string;
  /** Provider acquisition flow descriptor for the new-listing URL. */
  intentCategory: string;
}

const CATEGORY_MAP: Record<CategoryKey, CategoryDescriptor> = {
  'farriers': { browseSlug: 'services/farriers', apiCategory: 'services', apiServiceCategory: 'farriers', intentCategory: 'farriers' },
  'equine-boarding': { browseSlug: 'services/equine-boarding', apiCategory: 'services', apiServiceCategory: 'equine-boarding', intentCategory: 'equine-boarding' },
  'equine-services': { browseSlug: 'services/equine-services', apiCategory: 'services', apiServiceCategory: 'equine-services', intentCategory: 'equine-services' },
  'equine-repro': { browseSlug: 'services/equine-repro', apiCategory: 'services', apiServiceCategory: 'equine-repro', intentCategory: 'equine-repro' },
  'livestock-services': { browseSlug: 'services/livestock-services', apiCategory: 'services', apiServiceCategory: 'livestock-services', intentCategory: 'livestock-services' },
  'dog-training': { browseSlug: 'services/dog-training', apiCategory: 'services', apiServiceCategory: 'dog-training', intentCategory: 'dog-training' },
  'behavioral': { browseSlug: 'services/behavioral', apiCategory: 'services', apiServiceCategory: 'behavioral', intentCategory: 'behavioral' },
  'show-handling': { browseSlug: 'services/show-handling', apiCategory: 'services', apiServiceCategory: 'show-handling', intentCategory: 'handling' },
  'grooming': { browseSlug: 'services/grooming', apiCategory: 'services', apiServiceCategory: 'grooming', intentCategory: 'grooming' },
  'boarding': { browseSlug: 'services/boarding', apiCategory: 'services', apiServiceCategory: 'boarding', intentCategory: 'boarding' },
  'pet-sitting': { browseSlug: 'services/pet-sitting', apiCategory: 'services', apiServiceCategory: 'pet-sitting', intentCategory: 'pet-sitting' },
  'veterinary-specialists': { browseSlug: 'services/veterinary-specialists', apiCategory: 'services', apiServiceCategory: 'veterinary-specialists', intentCategory: 'veterinary' },
  'health-testing': { browseSlug: 'services/health-testing', apiCategory: 'services', apiServiceCategory: 'health-testing', intentCategory: 'health-testing' },
  'rehabilitation': { browseSlug: 'services/rehabilitation', apiCategory: 'services', apiServiceCategory: 'rehabilitation', intentCategory: 'rehabilitation' },
  'nutrition': { browseSlug: 'services/nutrition', apiCategory: 'services', apiServiceCategory: 'nutrition', intentCategory: 'nutrition' },
  'transport': { browseSlug: 'services/transport', apiCategory: 'services', apiServiceCategory: 'transport', intentCategory: 'transport' },
  'photography': { browseSlug: 'services/photography', apiCategory: 'services', apiServiceCategory: 'photography', intentCategory: 'photography' }
};

interface FacilityDescriptor {
  browseSlug: string;
  apiSubcategory: string;
  intentCategory: string;
}

const FACILITY_MAP: Record<FacilityKey, FacilityDescriptor> = {
  'dog-parks': { browseSlug: 'services/facilities/private-dog-parks', apiSubcategory: 'private_dog_park', intentCategory: 'private_dog_park' },
  'equine': { browseSlug: 'services/facilities/equine', apiSubcategory: 'equine', intentCategory: 'equine_facility' },
  'indoor-training': { browseSlug: 'services/facilities/indoor-training', apiSubcategory: 'indoor_training', intentCategory: 'indoor_training' },
  'boarding': { browseSlug: 'services/facilities/boarding', apiSubcategory: 'boarding', intentCategory: 'boarding_facility' },
  'wash-grooming': { browseSlug: 'services/facilities/wash-grooming', apiSubcategory: 'wash_grooming', intentCategory: 'wash_grooming' },
  'events-shows': { browseSlug: 'services/facilities/events-shows', apiSubcategory: 'events_shows', intentCategory: 'event_venue' },
  'livestock': { browseSlug: 'services/facilities/livestock', apiSubcategory: 'livestock', intentCategory: 'livestock_facility' },
  'specialty': { browseSlug: 'services/facilities/specialty', apiSubcategory: 'specialty', intentCategory: 'specialty_facility' }
};

export interface ScopedQuery {
  /** Optional metro city used for both filtering and display. */
  city?: string;
  /** US state abbreviation (e.g. 'KY', 'TX') or full name. */
  state?: string;
}

function buildBrowseUrl(slugPath: string, scope: ScopedQuery = {}): string {
  const url = new URL(`${MARKETPLACE_HOST}/${slugPath}`);
  if (scope.city) url.searchParams.set('city', scope.city);
  if (scope.state) url.searchParams.set('state', scope.state);
  return url.toString();
}

function buildListingFlowUrl(intent: string, scope: ScopedQuery = {}): string {
  const url = new URL(`${ACCOUNTS_HOST}/register`);
  url.searchParams.set('intent', 'provider_marketplace');
  url.searchParams.set('category', intent);
  if (scope.city) url.searchParams.set('city', scope.city);
  if (scope.state) url.searchParams.set('state', scope.state);
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
    // Build proceeds with empty listings; not a fatal failure.
    return { items: [], total: 0 };
  }
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
  const query = new URLSearchParams({
    category: desc.apiCategory,
    limit: String(limit),
    sort: '-publishedAt'
  });
  if (desc.apiServiceCategory) query.set('serviceCategory', desc.apiServiceCategory);
  if (scope.city) query.set('city', scope.city);
  if (scope.state) query.set('state', scope.state);

  const { items, total } = await fetchPublicListings(query);
  return {
    items,
    total,
    browseUrl: buildBrowseUrl(desc.browseSlug, scope),
    listingFlowUrl: buildListingFlowUrl(desc.intentCategory, scope)
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
    category: 'facilities',
    subcategory: desc.apiSubcategory,
    limit: String(limit),
    sort: '-publishedAt'
  });
  if (scope.city) query.set('city', scope.city);
  if (scope.state) query.set('state', scope.state);

  const { items, total } = await fetchPublicListings(query);
  return {
    items,
    total,
    browseUrl: buildBrowseUrl(desc.browseSlug, scope),
    listingFlowUrl: buildListingFlowUrl(desc.intentCategory, scope)
  };
}

/** Public marketplace URL for a listing detail page. */
export function listingDetailUrl(slug: string): string {
  return `${MARKETPLACE_HOST}/listings/${slug}`;
}

/** Scoped browse URL for a category — useful for hero CTAs that don't render listings. */
export function serviceBrowseUrl(category: CategoryKey, scope: ScopedQuery = {}): string {
  return buildBrowseUrl(CATEGORY_MAP[category].browseSlug, scope);
}

export function facilityBrowseUrl(facility: FacilityKey, scope: ScopedQuery = {}): string {
  return buildBrowseUrl(FACILITY_MAP[facility].browseSlug, scope);
}

export function serviceListingFlowUrl(category: CategoryKey, scope: ScopedQuery = {}): string {
  return buildListingFlowUrl(CATEGORY_MAP[category].intentCategory, scope);
}

export function facilityListingFlowUrl(facility: FacilityKey, scope: ScopedQuery = {}): string {
  return buildListingFlowUrl(FACILITY_MAP[facility].intentCategory, scope);
}
