/**
 * The three reviews shown on /pricing, side by side under the intro-call video.
 *
 * Picked by review id, never by position in the list, so adding a review to
 * src/data/testimonials.ts cannot change which three show here. Each shows a
 * short excerpt: whole sentences taken in order from one paragraph of the text
 * as posted, never reworded. When sentences are left out, the excerpt ends in an
 * ellipsis, and "Read All Reviews" links to every review in full.
 */
import { testimonials, type Testimonial } from '../../data/testimonials';

export interface ReviewPick {
  id: string;
  /** Which paragraph of the review the excerpt is taken from (0-based). */
  paragraph: number;
  /** How many sentences of that paragraph to show; omitted shows all of it. */
  sentences?: number;
}

export const FOUNDERS_REVIEW_PICKS: ReviewPick[] = [
  { id: 'google-farmstead-51', paragraph: 0 },
  { id: 'google-vondoodles', paragraph: 0, sentences: 2 },
  { id: 'app-store-whyunicornsdied', paragraph: 1, sentences: 2 },
];

export interface ReviewExcerpt {
  review: Testimonial;
  excerpt: string;
}

/**
 * The excerpt for one pick. Throws when the review, or the paragraph, is not
 * there, so a removed or edited review fails the build instead of showing an
 * empty card.
 */
export function reviewExcerpt(pick: ReviewPick, list: Testimonial[] = testimonials): ReviewExcerpt {
  const review = list.find((t) => t.id === pick.id);
  if (!review) throw new Error(`Founders review "${pick.id}" is not in testimonials.ts`);
  if (typeof review.quote !== 'string') {
    throw new Error(`Founders review "${pick.id}" has no single quote to excerpt`);
  }
  const paragraph = review.quote.split('\n\n')[pick.paragraph]?.trim();
  if (!paragraph) {
    throw new Error(`Founders review "${pick.id}" has no paragraph ${pick.paragraph}`);
  }
  const all = paragraph.split(/(?<=[.!?])\s+/);
  const kept = pick.sentences === undefined ? all : all.slice(0, pick.sentences);
  // An excerpt that stops before the end of the review is marked as cut.
  const lastParagraph = review.quote.split('\n\n').length - 1;
  const cut = kept.length < all.length || pick.paragraph < lastParagraph;
  let excerpt = kept.join(' ');
  if (cut) excerpt = `${excerpt.replace(/[.,;:]$/, '')}…`;
  return { review, excerpt };
}

export function foundersReviews(list: Testimonial[] = testimonials): ReviewExcerpt[] {
  return FOUNDERS_REVIEW_PICKS.map((pick) => reviewExcerpt(pick, list));
}
