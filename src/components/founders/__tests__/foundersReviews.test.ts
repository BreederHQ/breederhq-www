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
    assert.deepEqual(shown, ['google-farmstead-51', 'google-vondoodles', 'app-store-whyunicornsdied']);
  });

  it('excerpts whole sentences from the chosen paragraph and marks the cut', () => {
    const [farmstead, vondoodles, appStore] = foundersReviews();
    assert.equal(
      farmstead.excerpt,
      'This has helped simplify every aspect of our breeding program! All of our information is kept in one place, maximizing our efficiency!',
    );
    assert.equal(
      vondoodles.excerpt,
      'BreederHQ has been a valuable tool for keeping my breeding program organized and running efficiently. It makes it easy to manage health records, litters, puppy information, and communication all in one place…',
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
