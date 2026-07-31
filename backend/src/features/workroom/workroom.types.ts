import type {
  JoinRoomRequest,
  SendMessageRequest,
  WorkroomMessage,
  WorkroomRoom,
} from 'shared/schemas';
import type { Prisma } from '../../../prisma/generated/prisma/client.js';

export const workroomMessageSelect = {
  id: true,
  order_id: true,
  sender_id: true,
  type: true,
  content: true,
  attachment_url: true,
  attachment_type: true,
  audio_duration_seconds: true,
  created_at: true,
} satisfies Prisma.MessageSelect;

export const workroomOrderSelect = {
  id: true,
  client_id: true,
  freelancer_id: true,
  status: true,
} satisfies Prisma.OrderSelect;

export type WorkroomMessageRecord = Prisma.MessageGetPayload<{
  select: typeof workroomMessageSelect;
}>;

export type WorkroomOrderRecord = Prisma.OrderGetPayload<{
  select: typeof workroomOrderSelect;
}>;

export type WorkroomDatabaseClient = typeof import('../../config/prisma.js').prisma | Prisma.TransactionClient;

export type WorkroomService = {
  getOrderMessages: (
    userId: string,
    orderId: string,
    page: number,
    pageSize: number,
  ) => Promise<{
    items: WorkroomMessage[];
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  }>;
  joinWorkroom: (userId: string, orderId: string) => Promise<WorkroomRoom>;
  sendWorkroomMessage: (
    userId: string,
    orderId: string,
    content: string,
  ) => Promise<WorkroomMessage>;
};

export type WorkroomSocketData = {
  user: import('../../types/auth.js').AuthenticatedUser;
};

export type WorkroomClientToServerEvents = {
  join_room: (payload: JoinRoomRequest) => void;
  leave_room: (payload: JoinRoomRequest) => void;
  send_message: (payload: SendMessageRequest) => void;
};

export type WorkroomServerToClientEvents = {
  room_joined: (payload: { success: true; data: WorkroomRoom }) => void;
  room_left: (payload: { success: true; data: WorkroomRoom }) => void;
  new_message: (payload: { success: true; data: WorkroomMessage }) => void;
  chat_error: (payload: {
    success: false;
    error: { code: string; message: string };
  }) => void;
};

export function workroomRoomName(orderId: string): string {
  return `order:${orderId}`;
}

export function mapWorkroomMessage(record: WorkroomMessageRecord): WorkroomMessage {
  return {
    id: record.id,
    order_id: record.order_id,
    sender_id: record.sender_id,
    type: record.type,
    content: record.content,
    attachment_url: record.attachment_url,
    attachment_type: record.attachment_type,
    audio_duration_seconds: record.audio_duration_seconds,
    created_at: record.created_at.toISOString(),
  };
}
