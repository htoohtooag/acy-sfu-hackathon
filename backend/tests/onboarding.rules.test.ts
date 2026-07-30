import assert from 'node:assert/strict';
import test from 'node:test';
import { onboardingRequestSchema } from 'shared/schemas';
import { canCreateOnboardingProfile } from '../src/features/identity/onboarding.rules.js';

test('an active user can add the role that does not have a profile', () => {
  assert.equal(canCreateOnboardingProfile('ACTIVE', false), true);
});

test('an active user cannot create the same role profile twice', () => {
  assert.equal(canCreateOnboardingProfile('ACTIVE', true), false);
});

test('the onboarding contract rejects a placeholder experience level id', () => {
  const result = onboardingRequestSchema.safeParse({
    role: 'FREELANCER',
    phone_number: '09987654321',
    nrc_number: 'Yangon/ABC(N)654321',
    headline: 'Senior brand identity designer',
    skills: ['Brand Identity', 'Figma', 'Adobe Illustrator'],
    experience_level_id: 'EXPERIENCE_LEVEL_ID',
    years_of_experience: 5,
  });

  assert.equal(result.success, false);
});

test('the onboarding contract accepts a UUID experience level id', () => {
  const result = onboardingRequestSchema.safeParse({
    role: 'FREELANCER',
    phone_number: '09987654321',
    nrc_number: 'Yangon/ABC(N)654321',
    headline: 'Senior brand identity designer',
    skills: ['Brand Identity', 'Figma', 'Adobe Illustrator'],
    experience_level_id: '00000000-0000-0000-0000-000000000000',
    years_of_experience: 5,
  });

  assert.equal(result.success, true);
});
