import assert from 'node:assert/strict';
import test from 'node:test';
import { createReviewSchema, reviewOrderParamsSchema, reviewStatusResponseSchema } from 'shared/schemas';

test('review schema accepts a bounded rating and optional comment', () => {
  const result = createReviewSchema.safeParse({
    rating: 5,
    comment: 'Excellent delivery.',
  });

  assert.equal(result.success, true);
});

test('review schema rejects malformed ids and ratings outside the allowed range', () => {
  assert.equal(reviewOrderParamsSchema.safeParse({ id: 'not-an-id' }).success, false);
  assert.equal(createReviewSchema.safeParse({ rating: 0 }).success, false);
  assert.equal(createReviewSchema.safeParse({ rating: 6 }).success, false);
  assert.equal(createReviewSchema.safeParse({ rating: 4.5 }).success, false);
});

test('review schema rejects client supplied reviewee ids and unknown fields', () => {
  assert.equal(createReviewSchema.safeParse({ rating: 5, reviewee_id: 'user-id' }).success, false);
  assert.equal(createReviewSchema.safeParse({ rating: 5, status: 'COMPLETED' }).success, false);
});

test('review schema rejects comments longer than 2000 characters', () => {
  assert.equal(createReviewSchema.safeParse({ rating: 5, comment: 'a'.repeat(2001) }).success, false);
});

test('review status responses expose only the persisted review state', () => {
  assert.deepEqual(reviewStatusResponseSchema.parse({ reviewed: true }), { reviewed: true });
  assert.equal(reviewStatusResponseSchema.safeParse({ reviewed: 'true' }).success, false);
});
