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

export type ReviewSource = 'google' | 'app-store' | 'google-play' | 'capterra' | 'trustpilot';

/** A labeled part of a review, such as the "Pros" or "Cons" Capterra posts. */
export interface ReviewSection {
  /** The label exactly as the platform shows it. */
  label: string;
  /** Section text. Paragraphs are separated by a blank line ("\n\n"). */
  text: string;
}

/** A review has either one `quote` or labeled `sections`, never neither. */
export type ReviewBody =
  | {
      /** Full review text. Paragraphs are separated by a blank line ("\n\n"). */
      quote: string;
      sections?: never;
    }
  | {
      quote?: never;
      /** For platforms that post labeled sections. Stored as posted, in order. */
      sections: ReviewSection[];
    };

export type Testimonial = ReviewBase & ReviewBody;

interface ReviewBase {
  id: string;
  source: ReviewSource;
  /** The reviewer's name or handle exactly as posted. */
  reviewerName: string;
  title?: string;
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
  capterra: 'Capterra',
  trustpilot: 'Trustpilot',
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
    id: 'google-tk-standard-mini-toy-aussies',
    source: 'google',
    reviewerName: 'TK Standard Mini & Toy Aussies',
    quote:
      "I started using Breeder HQ after struggling to find software that truly offered EVERYTHING I needed as a breeder—all in one place. I wanted a comprehensive system that didn't charge per transaction and, most importantly, never passed fees along to the buyer.\n\nBreeder HQ has not only met those expectations but exceeded them! It has allowed me to eliminate several additional subscriptions, saving both time and money while keeping everything organized in one place.\n\nIn my opinion, Breeder HQ is hands-down the best breeder software on the market. The developers are continually improving the platform, refining features, and finding new ways to make the experience better for both breeders and buyers.\n\nAnd the customer service? Absolutely second to none! They are responsive, helpful, and genuinely invested in making sure their users succeed.\n\nI couldn't be happier with my decision to make the switch. If you're a breeder looking for an all-in-one solution, I highly recommend Breeder HQ!",
    rating: 5,
    sourceUrl: 'https://g.page/r/Cax9mYrHclivEAI',
  },
  {
    id: 'google-vondoodles',
    source: 'google',
    reviewerName: 'VonDoodles',
    quote:
      "BreederHQ has been a valuable tool for keeping my breeding program organized and running efficiently. It makes it easy to manage health records, litters, puppy information, and communication all in one place. The platform is user-friendly, reliable, and has saved me a significant amount of time by streamlining everyday tasks. I would recommend BreederHQ to any breeder looking for an organized and professional way to manage their kennel.",
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
  {
    id: 'capterra-the-breeder-dream-software',
    source: 'capterra',
    reviewerName: 'Reviewer',
    title: 'The Breeder Dream Software',
    sections: [
      {
        label: 'Pros',
        text:
          "This software is a game changer for breeders!! I'm not even sure where to start. I've been breeding for years and have only dreamed of a software that does everything all in one. I can do away with all of my spreadsheets. This program tracks my guardians, my breedings, my heat cycles, all my puppies, all of my communication with my customers, my reminders to worm my puppies every 2 weeks etc, deposits and invoicing, and it keeps track of your expenses and income! This software literally does everything and you have your own marketplace page with all your upcoming litters and available puppies where people can find you and place deposits and communicate with you. They can pay deposits on there and pay the balance at the end. They also have an app ANDDD a customer portal for your clients!! When you upload your pics of the puppies in the system they can go to everyone on your waitlist and get posted to the Marketplace which will basically be my website now. There's just so much more it does but these are just the highlights!!! Trust me you wont be disappointed.",
      },
      {
        label: 'Cons',
        text:
          "Just learning a new system but it is so worth it!!! It doesn't take long to set up but the developer will help walk you through it. Definitely do a zoom call with him. I learned so much",
      },
    ],
    rating: 5,
    date: '2026-07-28',
    sourceUrl: 'https://www.capterra.com/p/10049441/BreederHQ/#b45db6b6-38cc-4f19-a75c-4bd01830873d/',
  },
  {
    id: 'trustpilot-centerfire-mini-aussies',
    source: 'trustpilot',
    reviewerName: 'Centerfire Mini Aussies',
    title: 'A Must-Have Software for Every Breeder!',
    quote:
      "Whether you breed dogs, cats, goats, horses, cattle, or any other species, having the right systems in place can make ALL the difference in running an efficient, organized breeding program.\n\nTime is one of the most valuable resources we have as breeders. Between health testing, pedigrees, certifications, medical records, breeding schedules, litter records, offspring information, and communicating with families or buyers, there are a LOT of moving pieces to keep up with. BreederHQ brings so much of that information together in one organized place, saving valuable time that would otherwise be spent digging through spreadsheets, folders, paperwork, messages, and multiple platforms.\n\nI've tried multiple breeding software platforms, and BreederHQ is hands down the best I've used. The ability to have your information organized, accessible, and managed in one system is invaluable. It's not just about organization; it's about creating better systems, improving efficiency, and giving breeders more time to focus on what matters most.\n\nWhat I especially appreciate is that BreederHQ isn't standing still. They are continually improving, refining, and growing the platform with the needs of breeders in mind. You can see the commitment to building a system that evolves alongside the industry and serves breeders across multiple species.\n\nWhether you're just starting your first breeding program or you've been breeding for decades, investing in systems that save you time and simplify your operation is worth every bit of it.\n\nI genuinely believe BreederHQ is becoming an essential tool for the breeding industry as a whole. I'm excited to see where the platform goes and can't wait to see what they continue to bring to the table!\n\nStop spending so much time managing the paperwork of your breeding program and start putting systems in place that work FOR you. Five stars all the way!\n\n-Casey H\nCenterfire Mini Aussies",
    rating: 5,
    date: '2026-11-04',
    sourceUrl: 'https://www.trustpilot.com/reviews/6aeb4f0714ae053a4fb11e64',
  },
];

export interface ReviewBlock {
  label?: string;
  paragraphs: string[];
}

/** The review text as blocks: one unlabeled block for a quote, one per labeled section. */
export function reviewBlocks(t: Testimonial): ReviewBlock[] {
  if (t.sections) return t.sections.map((s) => ({ label: s.label, paragraphs: s.text.split('\n\n') }));
  return [{ paragraphs: t.quote.split('\n\n') }];
}

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
  const order: ReviewSource[] = ['app-store', 'google', 'google-play', 'capterra', 'trustpilot'];
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
