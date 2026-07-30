import type { OnboardingRequest, OnboardingResponse } from 'shared/schemas';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { ensureFreeSubscription } from './subscription.repository.js';

type OnboardingUserSnapshot = {
  id: string;
  status: 'LEAD' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  client_profile: { id: string } | null;
  freelancer_profile: { id: string } | null;
};

type OnboardingPersistenceInput = {
  userId: string;
  payload: OnboardingRequest;
  embedding: number[] | undefined;
};

export async function findOnboardingUser(
  userId: string,
): Promise<OnboardingUserSnapshot | null> {
  return prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: {
      id: true,
      status: true,
      client_profile: { select: { id: true } },
      freelancer_profile: { select: { id: true } },
    },
  });
}

export async function findActiveExperienceLevel(
  experienceLevelId: string,
): Promise<{ name: string } | null> {
  return prisma.experienceLevel.findFirst({
    where: { id: experienceLevelId, is_active: true },
    select: { name: true },
  });
}

function vectorLiteral(values: number[]): string {
  return `[${values.map((value) => String(value)).join(',')}]`;
}

export async function persistOnboarding(
  input: OnboardingPersistenceInput,
): Promise<OnboardingResponse> {
  return prisma.$transaction(async (transaction): Promise<OnboardingResponse> => {
    const role = await transaction.role.findUnique({
      where: { name: input.payload.role },
      select: { id: true },
    });

    if (role === null) {
      throw new ApiError(
        500,
        'ROLE_CONFIGURATION_ERROR',
        'Required role configuration is missing.',
      );
    }

    const updatedUser = await transaction.user.update({
      where: { id: input.userId },
      data: { phone_number: input.payload.phone_number },
      select: { id: true },
    });

    await transaction.identityVerification.upsert({
      where: { user_id: input.userId },
      create: {
        user_id: input.userId,
        nrc_number: input.payload.nrc_number,
        status: 'NOT_SUBMITTED',
      },
      update: { nrc_number: input.payload.nrc_number },
    });

    await transaction.userRole.create({
      data: { user_id: input.userId, role_id: role.id },
    });

    const profileId =
      input.payload.role === 'CLIENT'
        ? (
            await transaction.clientProfile.create({
              data: {
                user_id: input.userId,
                company_name: input.payload.company_name,
                industry: input.payload.industry,
              },
              select: { id: true },
            })
          ).id
        : (
            await transaction.freelancerProfile.create({
              data: {
                user_id: input.userId,
                headline: input.payload.headline,
                skills: input.payload.skills,
                experience_level_id: input.payload.experience_level_id,
                years_of_experience: input.payload.years_of_experience,
              },
              select: { id: true },
            })
          ).id;

    if (input.payload.role === 'FREELANCER' && input.embedding !== undefined) {
      await transaction.$executeRaw`
        UPDATE freelancer_profiles
        SET embedding = ${vectorLiteral(input.embedding)}::vector
        WHERE id = ${profileId}::uuid
      `;
    }

    await ensureFreeSubscription(input.userId, input.payload.role, transaction);

    await transaction.user.update({
      where: { id: input.userId },
      data: { status: 'ACTIVE' },
    });

    return {
      user_id: updatedUser.id,
      status: 'ACTIVE',
      role: input.payload.role,
      profile_id: profileId,
    };
  });
}
