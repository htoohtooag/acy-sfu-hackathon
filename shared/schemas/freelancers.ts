import { z } from 'zod';

export const freelancerProfileIdSchema = z.object({ id: z.uuid() }).strict();

export type FreelancerPublicPackage = {
  id: string;
  title: string;
  price_mmk: string;
  delivery_days: number;
  tier: { id: string; name: string; display_name: string | null } | null;
};

export type FreelancerWorkHistoryItem = {
  id: string;
  title: string;
  rating: number | null;
  contract_type: 'PACKAGE' | 'CUSTOM_OFFER';
  rate_mmk: string;
  start_date: string;
  end_date: string | null;
  review: string | null;
  skills: string[];
  status: 'completed' | 'in-progress';
};

export type FreelancerPublicProfile = {
  id: string;
  user_id: string;
  headline: string | null;
  bio: string | null;
  skills: string[];
  years_of_experience: number | null;
  location_city: string | null;
  success_rate: string;
  is_verified: boolean;
  completed_projects_count: number;
  ongoing_projects_count: number;
  experience_level: { id: string; name: string; display_name: string | null } | null;
  user: { id: string; full_name: string | null; avatar_url: string | null };
  packages: FreelancerPublicPackage[];
  work_history: FreelancerWorkHistoryItem[];
  sample_works: FreelancerPublicSampleWork[];
};

export type FreelancerPublicSampleWork = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_url: string;
  sort_order: number;
};
