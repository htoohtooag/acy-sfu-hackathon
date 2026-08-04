import test from 'node:test';
import assert from 'node:assert/strict';
import { freelancerProfileIdSchema } from 'shared/schemas';
import { mapFreelancerProfile } from '../src/features/marketplace/freelancer-profile.types.js';

test('freelancer profile params require a UUID and reject extra fields', () => {
  assert.equal(freelancerProfileIdSchema.safeParse({ id: 'not-a-uuid' }).success, false);
  assert.equal(freelancerProfileIdSchema.safeParse({ id: '00000000-0000-0000-0000-000000000001', extra: true }).success, false);
});

test('public freelancer profile mapping is JSON safe and excludes private fields', () => {
  const record = {
    id: 'profile-id',
    user_id: 'user-id',
    headline: 'Product designer',
    bio: 'Designs useful products.',
    skills: ['Product design'],
    years_of_experience: 5,
    location_city: 'Yangon',
    success_rate: { toString: () => '94.50' },
    is_verified: true,
    completed_projects_count: 12,
    ongoing_projects_count: 1,
    experience_level: { id: 'level-id', name: 'MID', display_name: 'Mid level' },
    packages: [{
      id: 'package-id',
      title: 'Brand identity',
      price_mmk: 200000n,
      delivery_days: 7,
      tier: { id: 'tier-id', name: 'GOLD', display_name: 'Gold' },
    }],
    user: {
      id: 'user-id',
      full_name: 'Aye Aye',
      avatar_url: null,
      orders_as_freelancer: [
        {
          id: 'completed-order',
          source_type: 'PACKAGE',
          agreed_price_mmk: 200000n,
          status: 'COMPLETED',
          created_at: new Date('2026-06-01T00:00:00.000Z'),
          updated_at: new Date('2026-06-08T00:00:00.000Z'),
          package: { title: 'Brand identity', features: ['Branding'], deleted_at: null },
          job_post: null,
          reviews: [{ reviewee_id: 'user-id', rating: 5, comment: 'Excellent work.' }],
        },
        {
          id: 'active-order',
          source_type: 'CUSTOM_OFFER',
          agreed_price_mmk: 350000n,
          status: 'IN_REVIEW',
          created_at: new Date('2026-07-01T00:00:00.000Z'),
          updated_at: new Date('2026-07-10T00:00:00.000Z'),
          package: null,
          job_post: { title: 'Dashboard build', deleted_at: null },
          reviews: [],
        },
        {
          id: 'ignored-order',
          source_type: 'PACKAGE',
          agreed_price_mmk: 100000n,
          status: 'CANCELED',
          created_at: new Date('2026-05-01T00:00:00.000Z'),
          updated_at: new Date('2026-05-02T00:00:00.000Z'),
          package: { title: 'Canceled work', features: [], deleted_at: null },
          job_post: null,
          reviews: [],
        },
      ],
    },
  } satisfies Parameters<typeof mapFreelancerProfile>[0];

  const mapped = mapFreelancerProfile(record);
  assert.equal(mapped.success_rate, '94.50');
  assert.equal(mapped.packages[0]?.price_mmk, '200000');
  assert.equal(mapped.work_history.length, 2);
  assert.equal(mapped.work_history[0]?.status, 'completed');
  assert.equal(mapped.work_history[0]?.rating, 5);
  assert.equal(mapped.work_history[1]?.status, 'in-progress');
  assert.equal(mapped.work_history[1]?.end_date, null);
  assert.equal('email' in mapped.user, false);
  assert.doesNotThrow(() => JSON.stringify(mapped));
});
