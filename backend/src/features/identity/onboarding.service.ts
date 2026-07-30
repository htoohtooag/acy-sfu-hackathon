import type { OnboardingRequest, OnboardingResponse } from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { env } from '../../config/env.js';
import { createTextEmbedding } from '../../config/gemini.js';
import { ApiError } from '../../utils/api-error.js';
import {
  findActiveExperienceLevel,
  findOnboardingUser,
  persistOnboarding,
} from './onboarding.repository.js';
import { canCreateOnboardingProfile } from './onboarding.rules.js';

const VECTOR_DIMENSION = 1536;

type OnboardingServiceInput = {
  userId: string;
  payload: OnboardingRequest;
};

function isPrismaKnownError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export async function completeOnboarding(
  input: OnboardingServiceInput,
): Promise<OnboardingResponse> {
  const currentUser = await findOnboardingUser(input.userId);

  if (currentUser === null) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  }

  const selectedProfileExists =
    input.payload.role === 'CLIENT'
      ? currentUser.client_profile !== null
      : currentUser.freelancer_profile !== null;

  if (!canCreateOnboardingProfile(currentUser.status, selectedProfileExists)) {
    throw new ApiError(
      409,
      'ONBOARDING_ALREADY_COMPLETED',
      'Onboarding has already been completed.',
    );
  }

  let embedding: number[] | undefined;

  if (input.payload.role === 'FREELANCER') {
    const experienceLevel = await findActiveExperienceLevel(input.payload.experience_level_id);

    if (experienceLevel === null) {
      throw new ApiError(
        404,
        'EXPERIENCE_LEVEL_NOT_FOUND',
        'The selected experience level was not found.',
      );
    }

    embedding = await createTextEmbedding(
      [
        `Headline: ${input.payload.headline}`,
        `Skills: ${input.payload.skills.join(', ')}`,
        `Experience level: ${experienceLevel.name}`,
      ].join('\n'),
    );

    if (
      embedding.length !== env.GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY ||
      embedding.length !== VECTOR_DIMENSION
    ) {
      throw new ApiError(
        502,
        'EMBEDDING_DIMENSION_MISMATCH',
        'Embedding generation returned an unsupported dimension.',
      );
    }
  }

  try {
    return await persistOnboarding({
      userId: input.userId,
      payload: input.payload,
      embedding,
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaKnownError(error, 'P2002')) {
      throw new ApiError(
        409,
        'ONBOARDING_ALREADY_COMPLETED',
        'Onboarding has already been completed.',
      );
    }

    if (isPrismaKnownError(error, 'P2025')) {
      throw new ApiError(404, 'ONBOARDING_RESOURCE_NOT_FOUND', 'Required onboarding data was not found.');
    }

    throw error;
  }
}
