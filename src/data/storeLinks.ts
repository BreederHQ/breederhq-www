/**
 * Public store listings for the BreederHQ app.
 *
 * ONE place for both URLs. The same listings are linked from the compare pages
 * and reviews.astro (as literal hrefs); new pages should import from here.
 */
export const STORE_LINKS = {
  appStore: 'https://apps.apple.com/us/app/breederhq/id6761625868',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.breederhq.mobile',
} as const;
