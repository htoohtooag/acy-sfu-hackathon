import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createJobPostSchema,
  createPackageSchema,
  jobPostListQuerySchema,
  packageListQuerySchema,
  updateJobPostSchema,
} from 'shared/schemas';

test('catalog package schema accepts string money values for JSON safety', () => {
  const result = createPackageSchema.safeParse({
    title: 'Logo design',
    description: 'A complete logo package.',
    price_mmk: '150000',
    delivery_days: 5,
    features: ['Three concepts'],
  });

  assert.equal(result.success, true);
});

test('catalog schemas reject invalid package money and pagination', () => {
  assert.equal(createPackageSchema.safeParse({
    title: 'Logo design',
    description: 'A complete logo package.',
    price_mmk: '0',
    delivery_days: 5,
  }).success, false);

  assert.equal(packageListQuerySchema.safeParse({ page: '1', page_size: '51' }).success, false);
});

test('job schema rejects a budget minimum above its maximum', () => {
  const result = createJobPostSchema.safeParse({
    title: 'Build a website',
    description: 'Need a responsive company website.',
    budget_min_mmk: '500000',
    budget_max_mmk: '100000',
  });

  assert.equal(result.success, false);
});

test('job update schema accepts status and date fields', () => {
  const result = updateJobPostSchema.safeParse({ status: 'HIRING', expected_deadline: '2026-08-30' });
  assert.equal(result.success, true);
});

test('catalog query schemas apply pagination defaults', () => {
  const packageQuery = packageListQuerySchema.parse({});
  const jobQuery = jobPostListQuerySchema.parse({});
  assert.deepEqual(packageQuery, { page: 1, page_size: 20 });
  assert.deepEqual(jobQuery, { page: 1, page_size: 20 });
});
