/**
 * The /pricing reviews: picked by id, excerpted from the text as posted, and a
 * missing review fails loudly.
 *
 * Run: node --import tsx --test src/components/founders/__tests__/foundersReviews.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { foundersReviews, reviewExcerpt } from '../foundersReviews';
import { testimonials } from '../../../data/testimonials';

describe('foundersReviews', () => {
  it('shows the three picked reviews in order, whatever the list order', () => {
    const shown = foundersReviews([...testimonials].reverse()).map((r) => r.review.id);
    assert.deepEqual(shown, [
      'google-tk-standard-mini-toy-aussies',
      'trustpilot-centerfire-mini-aussies',
      'app-store-whyunicornsdied',
    ]);
  });

  it('never shows a doodle breeder review', () => {
    for (const { review } of foundersReviews()) {
      assert.doesNotMatch(review.reviewerName, /doodle/i);
    }
  });

  it('excerpts whole sentences from the chosen paragraph and marks the cut', () => {
    const [tk, centerfire, appStore] = foundersReviews();
    assert.equal(
      tk.excerpt,
      'Breeder HQ has not only met those expectations but exceeded them! It has allowed me to eliminate several additional subscriptions, saving both time and money while keeping everything organized in one place…',
    );
    assert.equal(
      centerfire.excerpt,
      "I've tried multiple breeding software platforms, and BreederHQ is hands down the best I've used. The ability to have your information organized, accessible, and managed in one system is invaluable…",
    );
    assert.equal(
      appStore.excerpt,
      'It makes everything so much easier by having all your tools in one place. No more bouncing between spreadsheets, emails, and random apps…',
    );
    assert.equal(appStore.review.title, 'Breeder HQ is awesome!');
  });

  it('refuses a review that is no longer in the list', () => {
    assert.throws(() => reviewExcerpt({ id: 'gone', paragraph: 0 }), /not in testimonials/);
  });
});
