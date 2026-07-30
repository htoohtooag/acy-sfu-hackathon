import { z } from 'zod';

const requiredText = z.string().trim().min(1);

const onboardingBase = {
  phone_number: requiredText.max(20),
  nrc_number: requiredText.max(50),
};

export const clientOnboardingSchema = z.object({
  ...onboardingBase,
  role: z.literal('CLIENT'),
  company_name: requiredText.max(255),
  industry: requiredText.max(100),
});

export const freelancerOnboardingSchema = z.object({
  ...onboardingBase,
  role: z.literal('FREELANCER'),
  headline: requiredText.max(255),
  skills: z.array(requiredText.max(100)).min(1),
  experience_level_id: z.uuid(),
  years_of_experience: z.number().int().nonnegative(),
});

export const onboardingRequestSchema = z.discriminatedUnion('role', [
  clientOnboardingSchema,
  freelancerOnboardingSchema,
]);

export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>;

export type OnboardingResponse = {
  user_id: string;
  status: 'ACTIVE';
  role: 'CLIENT' | 'FREELANCER';
  profile_id: string;
};
