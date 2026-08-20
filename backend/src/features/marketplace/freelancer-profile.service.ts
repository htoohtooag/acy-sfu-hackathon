import type { FreelancerPublicProfile } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { findPublicFreelancerProfile } from './freelancer-profile.repository.js';
import { mapFreelancerProfile, type FreelancerProfileRecord } from './freelancer-profile.types.js';
import { env } from '../../config/env.js';
import { supabaseAdmin } from '../../config/supabase.js';

async function sampleImageUrls(records: FreelancerProfileRecord['sample_works']): Promise<Map<string, string>> {
  const entries = await Promise.all(records.map(async (item) => {
    const { data, error } = await supabaseAdmin.storage.from(env.SUPABASE_FREELANCER_SAMPLE_WORK_BUCKET).createSignedUrl(item.image_path, env.FREELANCER_SAMPLE_WORK_SIGNED_URL_TTL_SECONDS);
    if (error !== null || data?.signedUrl === undefined) throw new ApiError(502, 'SAMPLE_WORK_STORAGE_FAILED', 'A sample work image access URL could not be created.');
    return [item.id, data.signedUrl] as const;
  }));
  return new Map(entries);
}

export async function getPublicFreelancerProfile(profileId: string): Promise<FreelancerPublicProfile> {
  const profile = await findPublicFreelancerProfile(profileId);
  if (profile === null) {
    throw new ApiError(404, 'FREELANCER_NOT_FOUND', 'The freelancer profile was not found.');
  }

  return mapFreelancerProfile(profile, await sampleImageUrls(profile.sample_works));
}
