import type { PackageTierLookup, PaymentMethodLookup } from 'shared/schemas';
import { env } from '../../config/env.js';
import { findActiveExperienceLevels, findActivePackageTiers, findActivePaymentMethods } from './lookup.repository.js';
import type { ExperienceLevelLookup, PaymentMethodDetails, PaymentMethodRecord } from './lookup.types.js';

export async function getActiveExperienceLevels(): Promise<ExperienceLevelLookup[]> {
  return findActiveExperienceLevels();
}

export async function getActivePackageTiers(): Promise<PackageTierLookup[]> {
  return findActivePackageTiers();
}

const paymentMethodOrder = ['KBZ_PAY', 'WAVE_MONEY', 'BANK_TRANSFER'];

const paymentMethodDetails: Record<string, PaymentMethodDetails> = {
  KBZ_PAY: {
    account_name: env.PAYMENT_KBZ_PAY_ACCOUNT_NAME || null,
    account_number: env.PAYMENT_KBZ_PAY_ACCOUNT_NUMBER || null,
    instructions: env.PAYMENT_KBZ_PAY_INSTRUCTIONS || null,
  },
  WAVE_MONEY: {
    account_name: env.PAYMENT_WAVE_MONEY_ACCOUNT_NAME || null,
    account_number: env.PAYMENT_WAVE_MONEY_ACCOUNT_NUMBER || null,
    instructions: env.PAYMENT_WAVE_MONEY_INSTRUCTIONS || null,
  },
  BANK_TRANSFER: {
    account_name: env.PAYMENT_BANK_TRANSFER_ACCOUNT_NAME || null,
    account_number: env.PAYMENT_BANK_TRANSFER_ACCOUNT_NUMBER || null,
    instructions: env.PAYMENT_BANK_TRANSFER_INSTRUCTIONS || null,
  },
};

export function mergePaymentMethodDetails(method: PaymentMethodRecord): PaymentMethodLookup {
  const fallback = paymentMethodDetails[method.name] ?? {
    account_name: null,
    account_number: null,
    instructions: null,
  } satisfies PaymentMethodDetails;

  return {
    ...method,
    account_name: method.account_name ?? fallback.account_name,
    account_number: method.account_number ?? fallback.account_number,
    instructions: method.instructions ?? fallback.instructions,
  };
}

export async function getActivePaymentMethods(): Promise<PaymentMethodLookup[]> {
  const methods = await findActivePaymentMethods();
  return methods
    .sort((left, right) => {
      const leftIndex = paymentMethodOrder.indexOf(left.name);
      const rightIndex = paymentMethodOrder.indexOf(right.name);
      if (leftIndex === -1 && rightIndex === -1) return left.name.localeCompare(right.name);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    })
    .map(mergePaymentMethodDetails);
}
