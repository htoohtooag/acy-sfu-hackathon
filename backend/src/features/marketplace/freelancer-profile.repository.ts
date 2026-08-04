import { prisma } from '../../config/prisma.js';
import { freelancerProfileSelect } from './freelancer-profile.types.js';
import type { FreelancerProfileRecord } from './freelancer-profile.types.js';

export async function findPublicFreelancerProfile(
  profileId: string,
): Promise<FreelancerProfileRecord | null> {
  return prisma.freelancerProfile.findFirst({
    where: {
      id: profileId,
      deleted_at: null,
      user: { deleted_at: null },
    },
    select: freelancerProfileSelect,
  });
}
