import type { FreelancerPublicProfile } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { findPublicFreelancerProfile } from './freelancer-profile.repository.js';
import { mapFreelancerProfile } from './freelancer-profile.types.js';

export async function getPublicFreelancerProfile(profileId: string): Promise<FreelancerPublicProfile> {
  const profile = await findPublicFreelancerProfile(profileId);
  if (profile === null) {
    throw new ApiError(404, 'FREELANCER_NOT_FOUND', 'The freelancer profile was not found.');
  }

  return mapFreelancerProfile(profile);
}
