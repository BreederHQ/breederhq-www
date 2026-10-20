// Breeder reviews: the single source of truth for /reviews, the carousel on
// the homepage and /mobile, and the compact rotator on /pricing. All of them
// show every entry below, in full.
//
// Every entry is a public review posted by its author on the named platform.
// Text is stored exactly as posted (curly apostrophes, double spaces and
// paragraph breaks included) and is never corrected, trimmed or paraphrased.
// To add a review, add one entry to the array below. Nothing else changes.
//
// Structured data: do NOT emit Review or AggregateRating JSON-LD from this
// data. Reviews a business publishes about itself are self-serving and
// ineligible for review rich results.

export type ReviewSource = 'google' | 'app-store' | 'google-play';

export interface Testimonial {
  id: string;
  source: ReviewSource;
  /** The reviewer's name or handle exactly as posted. */
  reviewerName: string;
  title?: string;
  /** Full review text. Paragraphs are separated by a blank line ("\n\n"). */
  quote: string;
  /** Whole stars, 1 to 5. */
  rating: 1 | 2 | 3 | 4 | 5;
  /**
   * ISO date (YYYY-MM-DD). Omit when the platform shows only a relative date
   * (Google does). Never estimate one: no date is rendered when absent.
   */
  date?: string;
  /** Where the review lives on the source platform. */
  sourceUrl: string;
  /** Optional, left unset unless the reviewer stated them. */
  program?: string;
  species?: string;
}

export const SOURCE_LABELS: Record<ReviewSource, string> = {
  google: 'Google',
  'app-store': 'App Store',
  'google-play': 'Google Play',
};

export const testimonials: Testimonial[] = [
  {
    id: 'google-farmstead-51',
    source: 'google',
    reviewerName: 'Farmstead 51',
    quote:
      'This has helped simplify every aspect of our breeding program! All of our information is kept in one place, maximizing our efficiency!',
    rating: 5,
    sourceUrl: 'https://g.page/r/Cax9mYrHclivEAI',
  },
  {
    id: 'app-store-whyunicornsdied',
    source: 'app-store',
    reviewerName: 'WhyUnicornsDied?',
    title: 'Breeder HQ is awesome!',
    quote:
      'I’ve been really impressed with BreederHQ and would definitely recommend it to other breeders.\n\nIt makes everything so much easier by having all your tools in one place. No more bouncing between spreadsheets, emails, and random apps. I can keep track of my dogs, health testing, litters, and even communicate with families all in one system, which has been a huge time saver.\n\nI also love that the marketplace is transparent and data-driven, so families can actually see important info like health testing and pedigrees. It just builds a lot more trust from the start.\n\nThe client portal is another big win. It keeps everything organized; messages, contracts and payments.  Makes the whole process feel way more professional and smooth for both sides.\n\nOverall, it’s been a great tool for staying organized and leveling up my program. Highly recommend if you want something simple, professional, and all-in-one!',
    rating: 5,
    date: '2026-04-26',
    sourceUrl: 'https://apps.apple.com/us/app/breederhq/id6761625868?see-all=reviews',
  },
  {
    id: 'app-store-thatrandomguyoverthere36',
    source: 'app-store',
    reviewerName: 'ThatRandomGuyOverThere36',
    title: 'NOTHING LIKE IT!! A MUST!',
    quote:
      'Breeder HQ will completely transform how I manage our breeding program. The app works seamlessly with the online platform and keeps everything organized from animal tracking and client communication to vet records and expenses. The predictive modeling for future breedings is on another level and gives you insights you just won’t find anywhere else. It saves time, reduces stress, and makes the entire process more efficient. Highly recommend!',
    rating: 5,
    date: '2026-04-26',
    sourceUrl: 'https://apps.apple.com/us/app/breederhq/id6761625868?see-all=reviews',
  },
  {
    id: 'app-store-help-oliver-blast',
    source: 'app-store',
    reviewerName: 'Help Oliver blast',
    title: 'Breeder’s Best Friend!',
    quote:
      'This is going to save me so much time and headache! I can easily plan my litters in advance and have my whole year laid out and the app will give me push reminders of important dates along the way. I love that I can communicate with buyers and it’s easy to keep it all in one place. Since the app connects to my online BreederHQ account I can record expenses, add weights as soon as babies are born, and scan records while at the vets office.',
    rating: 5,
    date: '2026-04-09',
    sourceUrl: 'https://apps.apple.com/us/app/breederhq/id6761625868?see-all=reviews',
  },
];

/** Newest first. Undated entries (no known date) follow the dated ones. */
export function sortedTestimonials(list: Testimonial[] = testimonials): Testimonial[] {
  return [...list].sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}

export interface SourceStats {
  source: ReviewSource;
  label: string;
  count: number;
  average: number;
}

/** Average rating per source, computed from the data. */
export function sourceStats(list: Testimonial[] = testimonials): SourceStats[] {
  const order: ReviewSource[] = ['app-store', 'google', 'google-play'];
  return order
    .map((source) => {
      const rows = list.filter((t) => t.source === source);
      const total = rows.reduce((sum, t) => sum + t.rating, 0);
      return {
        source,
        label: SOURCE_LABELS[source],
        count: rows.length,
        average: rows.length ? total / rows.length : 0,
      };
    })
    .filter((s) => s.count > 0);
}
