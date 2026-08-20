import type {
  AdminPaymentDetail,
  AdminPaymentListResponse,
  AdminSessionResponse,
  AdminModerationResponse,
  AdminPaymentRejectionResponse,
  AdminPaymentVerificationResponse,
  ModerationRequest,
} from 'shared/schemas';
import { sendNotification } from '../notifications/notification.service.js';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { ApiError } from '../../utils/api-error.js';
import {
  createModeration,
  createModerationAuditLog,
  createPaymentAuditLog,
  createPaymentRejectionAuditLog,
  findAuditActionId,
  findModerationTarget,
  findPaymentById,
  countPendingPayments,
  findPendingPayments,
  findAdminPaymentById,
  findAdminAssignment,
  markOrderActive,
  markPaymentRejected,
  markPaymentVerified,
  suspendUser,
} from './admin.repository.js';
import type { AdminPaymentReadRecord, ModerationRecord, PaymentVerificationRecord } from './admin.types.js';

const PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS = 300;

function paymentTitle(record: AdminPaymentReadRecord): string {
  if (record.order.package?.deleted_at === null) return record.order.package.title;
  if (record.order.job_post?.deleted_at === null) return record.order.job_post.title;
  return 'Untitled order';
}

function mapAdminPaymentSummary(record: AdminPaymentReadRecord) {
  return {
    id: record.id,
    amount_mmk: record.amount_mmk.toString(),
    transaction_ref: record.transaction_ref,
    status: 'PENDING_ADMIN' as const,
    created_at: record.created_at.toISOString(),
    payment_method: record.payment_method === null ? {
      id: null,
      name: null,
      display_name: null,
      account_name: null,
    } : record.payment_method,
    order: { id: record.order.id, title: paymentTitle(record) },
    client: record.order.client,
    freelancer: record.order.freelancer,
  };
}

async function signPaymentProof(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(env.SUPABASE_PAYMENT_PROOF_BUCKET)
    .createSignedUrl(path, PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS);
  if (error !== null || data?.signedUrl === undefined) {
    throw new ApiError(502, 'PAYMENT_PROOF_STORAGE_FAILED', 'The payment proof could not be opened.');
  }
  return data.signedUrl;
}

export async function getAdminSession(userId: string): Promise<AdminSessionResponse> {
  const assignment = await findAdminAssignment(userId);
  if (assignment === null || assignment.admin_role === null) {
    throw new ApiError(403, 'ADMIN_ASSIGNMENT_REQUIRED', 'An active administrator assignment is required.');
  }
  return {
    display_name: assignment.user.full_name,
    capabilities: assignment.admin_role.name === 'SUPER_ADMIN' || assignment.admin_role.name === 'FINANCE_ADMIN'
      ? ['PAYMENT_REVIEW']
      : [],
  };
}

export async function listAdminPendingPayments(page: number, pageSize: number): Promise<AdminPaymentListResponse> {
  const [totalItems, records] = await prisma.$transaction(async (transaction) => Promise.all([
    countPendingPayments(transaction),
    findPendingPayments(page, pageSize, transaction),
  ]));
  return {
    items: records.map(mapAdminPaymentSummary),
    page,
    page_size: pageSize,
    total_items: totalItems,
    total_pages: Math.ceil(totalItems / pageSize),
  };
}

export async function getAdminPaymentDetail(paymentId: string): Promise<AdminPaymentDetail> {
  const record = await findAdminPaymentById(paymentId);
  if (record === null) {
    const decided = await findPaymentById(paymentId);
    if (decided === null) throw new ApiError(404, 'PAYMENT_NOT_FOUND', 'The payment was not found.');
    throw new ApiError(409, 'PAYMENT_ALREADY_DECIDED', 'This payment has already been decided.');
  }
  return {
    ...mapAdminPaymentSummary(record),
    agreed_price_mmk: record.order.agreed_price_mmk.toString(),
    screenshot_url: await signPaymentProof(record.screenshot_url),
  };
}

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function mapPaymentVerification(payment: PaymentVerificationRecord): AdminPaymentVerificationResponse {
  if (
    payment.status !== 'VERIFIED' ||
    payment.verified_by === null ||
    payment.verified_at === null ||
    payment.order.status !== 'ACTIVE' ||
    !payment.order.is_escrow_funded
  ) {
    throw new ApiError(500, 'PAYMENT_VERIFICATION_FAILED', 'The verified payment state is invalid.');
  }

  return {
    payment_id: payment.id,
    order_id: payment.order_id,
    amount_mmk: payment.amount_mmk.toString(),
    payment_status: 'VERIFIED',
    verified_by: payment.verified_by,
    verified_at: payment.verified_at.toISOString(),
    order_status: 'ACTIVE',
    is_escrow_funded: true,
  };
}

function mapPaymentRejection(payment: PaymentVerificationRecord): AdminPaymentRejectionResponse {
  if (
    payment.status !== 'REJECTED' ||
    payment.rejection_reason === null ||
    payment.order.status !== 'AWAITING_ESCROW' ||
    payment.order.is_escrow_funded
  ) {
    throw new ApiError(500, 'PAYMENT_REJECTION_FAILED', 'The rejected payment state is invalid.');
  }

  return {
    payment_id: payment.id,
    order_id: payment.order_id,
    amount_mmk: payment.amount_mmk.toString(),
    payment_status: 'REJECTED',
    rejection_reason: payment.rejection_reason,
    order_status: 'AWAITING_ESCROW',
    is_escrow_funded: false,
  };
}

function mapModeration(moderation: ModerationRecord): AdminModerationResponse {
  if (moderation.status !== 'ACTIVE') {
    throw new ApiError(500, 'MODERATION_FAILED', 'The moderation state is invalid.');
  }

  return {
    moderation_id: moderation.id,
    target_user_id: moderation.user_id,
    moderation_status: 'ACTIVE',
    user_status: 'SUSPENDED',
    reason: moderation.reason,
    created_at: moderation.created_at.toISOString(),
  };
}

async function sendEscrowNotification(
  userId: string,
  orderId: string,
  title: string,
  body: string,
): Promise<void> {
  try {
    await sendNotification(userId, 'ORDERS_ESCROW', title, body, {
      link: `/messages/${orderId}`,
    });
  } catch (error: unknown) {
    console.error('Escrow notification persistence failed.', {
      order_id: orderId,
      user_id: userId,
      title,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    });
  }
}

export async function verifyEscrowPayment(
  adminUserId: string,
  paymentId: string,
): Promise<AdminPaymentVerificationResponse> {
  try {
    const verified = await prisma.$transaction(async (transaction) => {
      const payment = await findPaymentById(paymentId, transaction);

      if (payment === null) {
        throw new ApiError(404, 'PAYMENT_NOT_FOUND', 'The payment was not found.');
      }

      if (payment.status !== 'PENDING_ADMIN') {
        throw new ApiError(409, 'PAYMENT_ALREADY_DECIDED', 'This payment has already been decided.');
      }

      if (
        payment.order.deleted_at !== null ||
        payment.order.status !== 'AWAITING_ESCROW' ||
        payment.order.is_escrow_funded
      ) {
        throw new ApiError(409, 'ORDER_NOT_AWAITING_ESCROW', 'The related order is not awaiting escrow.');
      }

      const auditActionId = await findAuditActionId('VERIFY_PAYMENT', transaction);
      if (auditActionId === null) {
        throw new ApiError(500, 'ADMIN_CONFIGURATION_ERROR', 'The payment audit action is not configured.');
      }

      const verifiedAt = new Date();
      await markPaymentVerified(
        paymentId,
        adminUserId,
        verifiedAt,
        transaction,
      );
      const orderUpdated = await markOrderActive(payment.order_id, transaction);

      if (!orderUpdated) {
        throw new ApiError(409, 'ORDER_NOT_AWAITING_ESCROW', 'The related order is not awaiting escrow.');
      }

      const refreshedPayment = await findPaymentById(paymentId, transaction);
      if (refreshedPayment === null) {
        throw new ApiError(500, 'PAYMENT_VERIFICATION_FAILED', 'The verified payment could not be reloaded.');
      }

      await createPaymentAuditLog(
        {
          adminUserId,
          auditActionId,
          paymentId,
          targetUserId: payment.order.client_id,
          orderId: payment.order_id,
          amountMmk: payment.amount_mmk,
        },
        transaction,
      );

      return {
        response: mapPaymentVerification(refreshedPayment),
        clientId: refreshedPayment.order.client_id,
        freelancerId: refreshedPayment.order.freelancer_id,
        orderId: refreshedPayment.order_id,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await Promise.all([
      sendEscrowNotification(
        verified.clientId,
        verified.orderId,
        'Escrow Verified',
        'Your escrow payment was verified and the order is active.',
      ),
      sendEscrowNotification(
        verified.freelancerId,
        verified.orderId,
        'Order Active',
        'The order is active and ready for work.',
      ),
    ]);

    return verified.response;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaError(error, 'P2034')) {
      throw new ApiError(409, 'ADMIN_RETRY_REQUIRED', 'The payment changed while it was being verified. Please retry.');
    }

    throw error;
  }
}

export async function rejectEscrowPayment(
  adminUserId: string,
  paymentId: string,
  reason: string,
): Promise<AdminPaymentRejectionResponse> {
  try {
    return await prisma.$transaction(async (transaction) => {
      const payment = await findPaymentById(paymentId, transaction);

      if (payment === null) {
        throw new ApiError(404, 'PAYMENT_NOT_FOUND', 'The payment was not found.');
      }

      if (payment.status !== 'PENDING_ADMIN') {
        throw new ApiError(409, 'PAYMENT_ALREADY_DECIDED', 'This payment has already been decided.');
      }

      if (
        payment.order.deleted_at !== null ||
        payment.order.status !== 'AWAITING_ESCROW' ||
        payment.order.is_escrow_funded
      ) {
        throw new ApiError(409, 'ORDER_NOT_AWAITING_ESCROW', 'The related order is not awaiting escrow.');
      }

      const auditActionId = await findAuditActionId('REJECT_PAYMENT', transaction);
      if (auditActionId === null) {
        throw new ApiError(500, 'ADMIN_CONFIGURATION_ERROR', 'The payment rejection audit action is not configured.');
      }

      const rejectedPayment = await markPaymentRejected(paymentId, reason, transaction);
      await createPaymentRejectionAuditLog(
        {
          adminUserId,
          auditActionId,
          paymentId,
          targetUserId: payment.order.client_id,
          orderId: payment.order_id,
          reason,
        },
        transaction,
      );

      return mapPaymentRejection(rejectedPayment);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaError(error, 'P2034')) {
      throw new ApiError(409, 'ADMIN_RETRY_REQUIRED', 'The payment changed while it was being rejected. Please retry.');
    }

    throw error;
  }
}

export async function moderateUser(
  adminUserId: string,
  targetUserId: string,
  input: ModerationRequest,
): Promise<AdminModerationResponse> {
  if (adminUserId === targetUserId) {
    throw new ApiError(409, 'SELF_MODERATION', 'You cannot suspend yourself.');
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const target = await findModerationTarget(targetUserId, transaction);

      if (target === null) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'The user was not found.');
      }

      if (target.status === 'SUSPENDED') {
        throw new ApiError(409, 'USER_ALREADY_SUSPENDED', 'The user is already suspended.');
      }

      if (target.status === 'DELETED') {
        throw new ApiError(404, 'USER_NOT_FOUND', 'The user was not found.');
      }

      if (target.admin_profile?.is_active === true && target.admin_profile.admin_role !== null) {
        throw new ApiError(409, 'ADMIN_MODERATION_NOT_ALLOWED', 'Active administrators cannot be suspended here.');
      }

      const auditActionId = await findAuditActionId('MODERATE_USER', transaction);
      if (auditActionId === null) {
        throw new ApiError(500, 'ADMIN_CONFIGURATION_ERROR', 'The moderation audit action is not configured.');
      }

      const moderation = await createModeration(adminUserId, targetUserId, input, transaction);
      const userSuspended = await suspendUser(targetUserId, transaction);

      if (!userSuspended) {
        throw new ApiError(409, 'MODERATION_FAILED', 'The user changed while moderation was being applied.');
      }

      await createModerationAuditLog(
        {
          adminUserId,
          auditActionId,
          moderationId: moderation.id,
          targetUserId,
        },
        transaction,
      );

      return mapModeration(moderation);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaError(error, 'P2034')) {
      throw new ApiError(409, 'ADMIN_RETRY_REQUIRED', 'The user changed while moderation was being applied. Please retry.');
    }

    throw error;
  }
}

export { mapModeration, mapPaymentRejection, mapPaymentVerification };
