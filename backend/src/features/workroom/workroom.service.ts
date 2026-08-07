import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { mapWorkroomMessagesWithSignedUrls } from './chat-attachment.service.js';
import {
  countOrderMessages,
  createTextMessage,
  findOrderMessages,
  findParticipantOrder,
} from './workroom.repository.js';
import {
  mapWorkroomMessage,
  workroomRoomName,
} from './workroom.types.js';
import { assertWorkroomChatIsActive } from './workroom.rules.js';
import type { WorkroomMessage, WorkroomRoom } from 'shared/schemas';

export { assertWorkroomChatIsActive } from './workroom.rules.js';

const maxHistoryPageSize = 50;

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function assertHistoryPage(page: number, pageSize: number): void {
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > maxHistoryPageSize) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Message history pagination is invalid.');
  }
}

export async function getOrderMessages(
  userId: string,
  orderId: string,
  page: number,
  pageSize: number,
): Promise<{
  items: WorkroomMessage[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}> {
  assertHistoryPage(page, pageSize);

  const result = await prisma.$transaction(async (transaction) => {
    const order = await findParticipantOrder(orderId, userId, transaction);
    if (order === null) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
    }

    const [totalItems, records] = await Promise.all([
      countOrderMessages(order.id, transaction),
      findOrderMessages(order.id, page, pageSize, transaction),
    ]);

    return { records, page, pageSize, totalItems };
  });

  return {
    items: await mapWorkroomMessagesWithSignedUrls(result.records),
    page: result.page,
    page_size: result.pageSize,
    total_items: result.totalItems,
    total_pages: Math.ceil(result.totalItems / result.pageSize),
  };
}

export async function joinWorkroom(userId: string, orderId: string): Promise<WorkroomRoom> {
  const order = await findParticipantOrder(orderId, userId);
  if (order === null) {
    throw new ApiError(403, 'ROOM_ACCESS_DENIED', 'You cannot access this workroom.');
  }

  return {
    order_id: order.id,
    room: workroomRoomName(order.id),
  };
}

export async function sendWorkroomMessage(
  userId: string,
  orderId: string,
  content: string,
): Promise<WorkroomMessage> {
  try {
    return await prisma.$transaction(async (transaction) => {
      const order = await findParticipantOrder(orderId, userId, transaction);
      if (order === null) {
        throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
      }

      assertWorkroomChatIsActive(order.status);

      const message = await createTextMessage(order.id, userId, content, transaction);
      return mapWorkroomMessage(message);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaError(error, 'P2034')) {
      throw new ApiError(409, 'CHAT_RETRY_REQUIRED', 'The chat changed while sending. Please retry.');
    }

    throw error;
  }
}
