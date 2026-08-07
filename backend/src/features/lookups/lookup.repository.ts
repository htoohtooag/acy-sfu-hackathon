import { prisma } from '../../config/prisma.js';
import type { PackageTierLookup } from 'shared/schemas';
import type { ExperienceLevelLookup } from './lookup.types.js';
import type { PaymentMethodRecord } from './lookup.types.js';

export async function findActiveExperienceLevels(): Promise<ExperienceLevelLookup[]> {
  return prisma.experienceLevel.findMany({
    where: { is_active: true },
    orderBy: { sort_order: 'asc' },
    select: { id: true, name: true, display_name: true, sort_order: true },
  });
}

export async function findActivePackageTiers(): Promise<PackageTierLookup[]> {
  return prisma.packageTier.findMany({
    where: { is_active: true },
    orderBy: { sort_order: 'asc' },
    select: { id: true, name: true, display_name: true, sort_order: true },
  });
}

export async function findActivePaymentMethods(): Promise<PaymentMethodRecord[]> {
  return prisma.paymentMethod.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, display_name: true, logo_url: true, account_name: true, account_number: true, instructions: true },
  });
}
