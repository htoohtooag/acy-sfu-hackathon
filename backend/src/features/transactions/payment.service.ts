import { randomUUID } from 'node:crypto';
import type { PaymentProofFields, PaymentResponse } from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { ApiError } from '../../utils/api-error.js';
import {
  createPayment,
  findPaymentOrder,
  hasActivePaymentMethod,
  hasSubmittedPayment,
} from './order.repository.js';
import type { PaymentRecord } from './order.types.js';

type PaymentProofFile = {
  buffer: Buffer;
  mimetype: string;
};

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function paymentProofPath(clientUserId: string, orderId: string, mimetype: string): string {
  const extension = extensionByMimeType[mimetype];
  if (extension === undefined) {
    throw new ApiError(415, 'PAYMENT_PROOF_TYPE_NOT_ALLOWED', 'Only JPEG, PNG, and WebP images are allowed.');
  }

  return `payment-proofs/${clientUserId}/${orderId}/${randomUUID()}.${extension}`;
}

async function removeUploadedProof(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_PAYMENT_PROOF_BUCKET).remove([path]);
  if (error !== null) {
    console.error('Payment proof cleanup failed.');
  }
}

async function uploadProof(path: string, file: PaymentProofFile): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_PAYMENT_PROOF_BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error !== null) {
    throw new ApiError(502, 'PAYMENT_STORAGE_FAILED', 'The payment proof could not be stored.');
  }
}

export function mapPayment(payment: PaymentRecord): PaymentResponse {
  return {
    id: payment.id,
    order_id: payment.order_id,
    amount_mmk: payment.amount_mmk.toString(),
    payment_method_id: payment.payment_method_id,
    transaction_ref: payment.transaction_ref,
    status: payment.status,
    created_at: payment.created_at.toISOString(),
    updated_at: payment.updated_at.toISOString(),
  };
}

export async function createPaymentProof(
  clientUserId: string,
  orderId: string,
  fields: PaymentProofFields,
  file: PaymentProofFile,
): Promise<PaymentResponse> {
  const order = await findPaymentOrder(orderId, clientUserId);
  if (order === null) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
  }

  if (order.status !== 'AWAITING_ESCROW') {
    throw new ApiError(409, 'INVALID_ORDER_STATE', 'Payment proof can only be submitted for an awaiting escrow order.');
  }

  if (await hasSubmittedPayment(orderId)) {
    throw new ApiError(409, 'PAYMENT_ALREADY_SUBMITTED', 'A payment proof has already been submitted for this order.');
  }

  if (BigInt(fields.amount_mmk) !== order.agreed_price_mmk) {
    throw new ApiError(409, 'PAYMENT_AMOUNT_MISMATCH', 'The payment amount must equal the order amount.');
  }

  if (!(await hasActivePaymentMethod(fields.payment_method_id))) {
    throw new ApiError(404, 'PAYMENT_METHOD_NOT_FOUND', 'The payment method was not found.');
  }

  const path = paymentProofPath(clientUserId, orderId, file.mimetype);
  await uploadProof(path, file);

  try {
    const payment = await prisma.$transaction(async (transaction) => {
      const currentOrder = await findPaymentOrder(orderId, clientUserId, transaction);
      if (currentOrder === null) {
        throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
      }

      if (currentOrder.status !== 'AWAITING_ESCROW') {
        throw new ApiError(409, 'INVALID_ORDER_STATE', 'Payment proof can only be submitted for an awaiting escrow order.');
      }

      if (await hasSubmittedPayment(orderId, transaction)) {
        throw new ApiError(409, 'PAYMENT_ALREADY_SUBMITTED', 'A payment proof has already been submitted for this order.');
      }

      if (!(await hasActivePaymentMethod(fields.payment_method_id, transaction))) {
        throw new ApiError(404, 'PAYMENT_METHOD_NOT_FOUND', 'The payment method was not found.');
      }

      if (BigInt(fields.amount_mmk) !== currentOrder.agreed_price_mmk) {
        throw new ApiError(409, 'PAYMENT_AMOUNT_MISMATCH', 'The payment amount must equal the order amount.');
      }

      return createPayment(orderId, fields, path, transaction);
    });

    return mapPayment(payment);
  } catch (error: unknown) {
    await removeUploadedProof(path);

    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaError(error, 'P2002')) {
      throw new ApiError(409, 'PAYMENT_ALREADY_SUBMITTED', 'A payment proof has already been submitted for this order.');
    }

    throw error;
  }
}
