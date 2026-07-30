import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '../prisma/generated/prisma/client.js';
import { ensureFreeSubscription } from '../src/features/identity/subscription.repository.js';

type SubscriptionCall = {
  planLookupAudience: string | undefined;
  upserted: boolean;
};

function transactionDouble(
  planId: string | null,
  existingSubscription: boolean,
  call: SubscriptionCall,
): Prisma.TransactionClient {
  const transaction = {
    subscriptionPlan: {
      findFirst: async (args: { where?: { audience?: string } }): Promise<{ id: string } | null> => {
        call.planLookupAudience = args.where?.audience;
        return planId === null ? null : { id: planId };
      },
    },
    userSubscription: {
      upsert: async (): Promise<void> => {
        call.upserted = true;
      },
    },
  };

  if (existingSubscription) {
    return transaction as unknown as Prisma.TransactionClient;
  }

  return transaction as unknown as Prisma.TransactionClient;
}

test('provisions the free client plan by audience', async () => {
  const call: SubscriptionCall = { planLookupAudience: undefined, upserted: false };
  await ensureFreeSubscription('user-id', 'CLIENT', transactionDouble('client-plan', false, call));
  assert.equal(call.planLookupAudience, 'CLIENT');
  assert.equal(call.upserted, true);
});

test('provisions the free freelancer plan by audience', async () => {
  const call: SubscriptionCall = { planLookupAudience: undefined, upserted: false };
  await ensureFreeSubscription('user-id', 'FREELANCER', transactionDouble('freelancer-plan', false, call));
  assert.equal(call.planLookupAudience, 'FREELANCER');
  assert.equal(call.upserted, true);
});

test('fails safely when the default plan is missing', async () => {
  const call: SubscriptionCall = { planLookupAudience: undefined, upserted: false };
  await assert.rejects(
    ensureFreeSubscription('user-id', 'CLIENT', transactionDouble(null, false, call)),
    (error: unknown) => error instanceof Error && error.name === 'ApiError',
  );
  assert.equal(call.upserted, false);
});
