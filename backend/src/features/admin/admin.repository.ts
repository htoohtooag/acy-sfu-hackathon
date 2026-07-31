import type { ModerationRequest } from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { paymentVerificationSelect, moderationSelect } from './admin.types.js';
import type { AdminAssignment, PaymentVerificationRecord, ModerationRecord } from './admin.types.js';

export type AdminClient = Prisma.TransactionClient | typeof prisma;

export async function findAdminAssignment(
  userId: string,
  client: AdminClient = prisma,
): Promise<AdminAssignment | null> {
  return client.adminProfile.findFirst({
    where: {
      user_id: userId,
      is_active: true,
    },
    select: {
      is_active: true,
      admin_role: { select: { name: true } },
    },
  });
}

export async function findPaymentById(
  paymentId: string,
  client: AdminClient = prisma,
): Promise<PaymentVerificationRecord | null> {
  return client.paymentTransaction.findFirst({
    where: { id: paymentId },
    select: paymentVerificationSelect,
  });
}

export async function markPaymentVerified(
  paymentId: string,
  adminUserId: string,
  verifiedAt: Date,
  client: Prisma.TransactionClient,
): Promise<PaymentVerificationRecord> {
  return client.paymentTransaction.update({
    where: { id: paymentId },
    data: {
      status: 'VERIFIED',
      verified_by: adminUserId,
      verified_at: verifiedAt,
    },
    select: paymentVerificationSelect,
  });
}

export async function markPaymentRejected(
  paymentId: string,
  reason: string,
  client: Prisma.TransactionClient,
): Promise<PaymentVerificationRecord> {
  return client.paymentTransaction.update({
    where: { id: paymentId },
    data: {
      status: 'REJECTED',
      rejection_reason: reason,
      verified_by: null,
      verified_at: null,
    },
    select: paymentVerificationSelect,
  });
}

export async function markOrderActive(
  orderId: string,
  client: Prisma.TransactionClient,
): Promise<boolean> {
  const result = await client.order.updateMany({
    where: {
      id: orderId,
      deleted_at: null,
      status: 'AWAITING_ESCROW',
      is_escrow_funded: false,
    },
    data: {
      status: 'ACTIVE',
      is_escrow_funded: true,
    },
  });

  return result.count === 1;
}

export async function findAuditActionId(
  name: 'VERIFY_PAYMENT' | 'REJECT_PAYMENT' | 'MODERATE_USER',
  client: Prisma.TransactionClient,
): Promise<string | null> {
  const action = await client.auditAction.findUnique({
    where: { name },
    select: { id: true },
  });

  return action?.id ?? null;
}

export async function createPaymentAuditLog(
  input: {
    adminUserId: string;
    auditActionId: string;
    paymentId: string;
    targetUserId: string;
    orderId: string;
    amountMmk: bigint;
  },
  client: Prisma.TransactionClient,
): Promise<void> {
  await client.adminAuditLog.create({
    data: {
      admin_id: input.adminUserId,
      audit_action_id: input.auditActionId,
      target_user_id: input.targetUserId,
      entity_id: input.paymentId,
      notes: 'Escrow payment verified.',
      metadata: {
        order_id: input.orderId,
        amount_mmk: input.amountMmk.toString(),
      },
    },
  });
}

export async function createPaymentRejectionAuditLog(
  input: {
    adminUserId: string;
    auditActionId: string;
    paymentId: string;
    targetUserId: string;
    orderId: string;
    reason: string;
  },
  client: Prisma.TransactionClient,
): Promise<void> {
  await client.adminAuditLog.create({
    data: {
      admin_id: input.adminUserId,
      audit_action_id: input.auditActionId,
      target_user_id: input.targetUserId,
      entity_id: input.paymentId,
      notes: 'Escrow payment rejected.',
      metadata: {
        order_id: input.orderId,
        reason: input.reason,
      },
    },
  });
}

export async function findModerationTarget(
  targetUserId: string,
  client: Prisma.TransactionClient,
): Promise<{
  id: string;
  status: 'LEAD' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  admin_profile: { is_active: boolean; admin_role: { name: string } | null } | null;
} | null> {
  return client.user.findFirst({
    where: { id: targetUserId, deleted_at: null },
    select: {
      id: true,
      status: true,
      admin_profile: {
        select: {
          is_active: true,
          admin_role: { select: { name: true } },
        },
      },
    },
  });
}

export async function createModeration(
  adminUserId: string,
  targetUserId: string,
  input: ModerationRequest,
  client: Prisma.TransactionClient,
): Promise<ModerationRecord> {
  return client.userModeration.create({
    data: {
      user_id: targetUserId,
      admin_id: adminUserId,
      reason: input.reason,
      status: 'ACTIVE',
    },
    select: moderationSelect,
  });
}

export async function suspendUser(
  targetUserId: string,
  client: Prisma.TransactionClient,
): Promise<boolean> {
  const result = await client.user.updateMany({
    where: {
      id: targetUserId,
      deleted_at: null,
      status: { in: ['LEAD', 'ACTIVE'] },
    },
    data: { status: 'SUSPENDED' },
  });

  return result.count === 1;
}

export async function createModerationAuditLog(
  input: {
    adminUserId: string;
    auditActionId: string;
    moderationId: string;
    targetUserId: string;
  },
  client: Prisma.TransactionClient,
): Promise<void> {
  await client.adminAuditLog.create({
    data: {
      admin_id: input.adminUserId,
      audit_action_id: input.auditActionId,
      target_user_id: input.targetUserId,
      entity_id: input.moderationId,
      notes: 'User suspended by administrator.',
      metadata: {
        status: 'SUSPENDED',
      },
    },
  });
}
