import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { ApiError } from '../../utils/api-error.js';

type SubscriptionAudience = 'CLIENT' | 'FREELANCER';

export async function ensureFreeSubscription(
  userId: string,
  audience: SubscriptionAudience,
  transaction: Prisma.TransactionClient,
): Promise<void> {
  const plan = await transaction.subscriptionPlan.findFirst({
    where: {
      audience,
      level: 'FREE',
      is_active: true,
    },
    orderBy: { created_at: 'asc' },
    select: { id: true },
  });

  if (plan === null) {
    throw new ApiError(
      500,
      'SUBSCRIPTION_PLAN_CONFIGURATION_ERROR',
      'The default subscription plan is not configured.',
    );
  }

  await transaction.userSubscription.upsert({
    where: {
      user_id_plan_id: {
        user_id: userId,
        plan_id: plan.id,
      },
    },
    create: {
      user_id: userId,
      plan_id: plan.id,
      status: 'ACTIVE',
    },
    update: {},
  });
}
