import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateSuccessRate } from '../src/features/reputation/review.service.js';
import { mapReview } from '../src/features/reputation/review.types.js';

test('success rate scales five star and one star reviews to percentages', () => {
  assert.equal(calculateSuccessRate(5, 1), '100.00');
  assert.equal(calculateSuccessRate(1, 1), '20.00');
});

test('success rate uses the average of all nondeleted reviews', () => {
  assert.equal(calculateSuccessRate(8, 2), '80.00');
  assert.equal(calculateSuccessRate(10, 3), '66.67');
});

test('review response maps dates and decimals to JSON safe values', () => {
  const result = mapReview(
    {
      id: 'review-id',
      order_id: 'order-id',
      reviewer_id: 'client-id',
      reviewee_id: 'freelancer-id',
      rating: 5,
      comment: 'Great work.',
      created_at: new Date('2026-07-31T00:00:00.000Z'),
    },
    '100.00',
  );

  assert.deepEqual(result, {
    review_id: 'review-id',
    order_id: 'order-id',
    reviewer_id: 'client-id',
    reviewee_id: 'freelancer-id',
    rating: 5,
    comment: 'Great work.',
    success_rate: '100.00',
    created_at: '2026-07-31T00:00:00.000Z',
  });
  assert.doesNotThrow(() => JSON.stringify(result));
});
