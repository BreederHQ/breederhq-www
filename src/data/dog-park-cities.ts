export interface DogParkCity {
  /** URL slug. Used in /dog-parks/[city]. */
  slug: string;
  /** Display name with city + state. */
  name: string;
  /** USPS state code, used for marketplace API filter. */
  state: string;
  /** City name as the API stores it (used in marketplace API ?city= filter). */
  apiCityName: string;
  /** Short marketing intro shown in the hero. 1-2 sentences. */
  intro: string;
  /** Why someone in this metro might want a private dog park (off-leash legality, weather, etc.). */
  whyPrivate: string;
  /** Optional: zip-code seed for geographic context (currently unused but reserved). */
  centerZip?: string;
}

/**
 * Phase 1 metros for /dog-parks/[city] city pages.
 *
 * Selection rationale:
 * - Sniffspot strongholds where the keyword volume already exists (Seattle, Portland, LA, Bay Area, Boston, Denver)
 * - Fast-growing metros (Austin, Chicago, Minneapolis-St. Paul)
 * - Kansas City: BreederHQ seed metro for host outreach
 *
 * Easy override: add or remove entries here. The /dog-parks/[city] route auto-generates from this list at build.
 */
export const dogParkCities: DogParkCity[] = [
  {
    slug: 'kansas-city-mo',
    name: 'Kansas City, MO',
    state: 'MO',
    apiCityName: 'Kansas City',
    intro: 'Kansas City has a strong dog culture, plenty of suburban acreage, and a growing private-yard rental market. If your dog is reactive, dog-selective, or recovering from training, a private space beats the public dog park.',
    whyPrivate: 'Public dog parks across the metro are usually unfenced or shared with reactive dogs off-leash. Private bookings give you a fenced, exclusive-use space - no surprises, no off-leash strangers.'
  },
  {
    slug: 'seattle-wa',
    name: 'Seattle, WA',
    state: 'WA',
    apiCityName: 'Seattle',
    intro: 'Seattle-area dog owners run into limited off-leash space, restrictive leash laws in city parks, and weather that makes public outdoor time unpredictable. Private dog parks fill all three gaps.',
    whyPrivate: 'King County off-leash areas can be crowded and muddy half the year. A private fenced yard means consistent, weather-resistant exercise on your schedule.'
  },
  {
    slug: 'portland-or',
    name: 'Portland, OR',
    state: 'OR',
    apiCityName: 'Portland',
    intro: 'Portland is a nationally top-tier dog city, but public off-leash spaces are concentrated and often crowded. Private bookings give your dog room to run without the crowd.',
    whyPrivate: 'Crowding at popular off-leash areas like Sellwood Riverfront and Mt. Tabor pushes reactive-dog owners toward private alternatives. Private bookings let you control the pack size and the timing.'
  },
  {
    slug: 'denver-co',
    name: 'Denver, CO',
    state: 'CO',
    apiCityName: 'Denver',
    intro: 'Denver dog owners benefit from open space and good weather, but the metro\'s public dog parks fill up fast on weekends. Private bookings give you weekend-quality space without the weekend crowd.',
    whyPrivate: 'Front Range dog parks are popular and crowded. A private booking is the difference between sharing a 2-acre fenced area with 30 strange dogs and having your own session.'
  },
  {
    slug: 'austin-tx',
    name: 'Austin, TX',
    state: 'TX',
    apiCityName: 'Austin',
    intro: 'Austin\'s dog community is huge, and so is the demand for private exercise space - especially for working breeds, reactive dogs, and dogs in training.',
    whyPrivate: 'Public dog parks in Austin can be intense, and the Texas summer heat makes shaded private yards a premium amenity. Private bookings let you pick the time of day and the environment.'
  },
  {
    slug: 'los-angeles-ca',
    name: 'Los Angeles, CA',
    state: 'CA',
    apiCityName: 'Los Angeles',
    intro: 'LA has limited public off-leash space relative to its dog population, and most apartment dwellers don\'t have a yard. Private dog park bookings have become a routine part of LA dog-owner life.',
    whyPrivate: 'Most LA off-leash spaces are crowded and the leash laws are strict. A private fenced backyard is what apartment dogs need to actually run.'
  },
  {
    slug: 'san-francisco-ca',
    name: 'San Francisco Bay Area, CA',
    state: 'CA',
    apiCityName: 'San Francisco',
    intro: 'The Bay Area combines dense apartment living with dog-loving residents. Private fenced yards in the East Bay, Peninsula, and South Bay are a high-demand amenity.',
    whyPrivate: 'San Francisco proper has very limited fenced off-leash space. East Bay and Peninsula listings give Bay Area dogs room to run without driving to a state park.'
  },
  {
    slug: 'chicago-il',
    name: 'Chicago, IL',
    state: 'IL',
    apiCityName: 'Chicago',
    intro: 'Chicago winters and dense city living make private indoor and outdoor dog spaces a critical resource for many city dogs.',
    whyPrivate: 'Chicago Park District dog parks are seasonal, often muddy in spring, and frozen in winter. Private indoor practice spaces and heated yards keep dogs exercised year-round.'
  },
  {
    slug: 'boston-ma',
    name: 'Boston, MA',
    state: 'MA',
    apiCityName: 'Boston',
    intro: 'Boston-area dog owners juggle dense urban living, harsh winters, and limited off-leash hours in city parks. Private bookings make year-round exercise possible.',
    whyPrivate: 'Boston Common and Franklin Park off-leash hours are short. Private bookings extend your dog\'s daily exercise window into evenings and weekends without the leash constraint.'
  },
  {
    slug: 'minneapolis-st-paul-mn',
    name: 'Minneapolis-St. Paul, MN',
    state: 'MN',
    apiCityName: 'Minneapolis',
    intro: 'The Twin Cities have a strong dog culture and a long winter. Heated indoor spaces and well-maintained private yards have become essential for active Minnesota dogs.',
    whyPrivate: 'Minnesota winters severely limit public dog park usability. Private indoor practice spaces and well-cleared yards keep training and exercise consistent through the cold months.'
  }
];
