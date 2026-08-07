import { z } from 'zod';
import type { DeliverableSubmittedEvent, DeliverableUnlockedEvent } from './deliverables.js';

const pageQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    page_size: z.coerce.number().int().positive().max(50).default(50),
  })
  .strict();

export const workroomOrderIdSchema = z
  .object({ id: z.uuid() })
  .strict();

export const workroomHistoryQuerySchema = pageQuerySchema;

export const joinRoomSchema = z
  .object({ order_id: z.uuid() })
  .strict();

export const sendMessageSchema = z
  .object({
    order_id: z.uuid(),
    type: z.literal('TEXT'),
    content: z.string().trim().min(1).max(4000),
  })
  .strict();

export const workroomMessageSchema = z.object({
  id: z.uuid(),
  order_id: z.uuid(),
  sender_id: z.uuid(),
  type: z.enum(['TEXT', 'FILE', 'SYSTEM', 'CUSTOM_OFFER']),
  content: z.string().nullable(),
  attachment_url: z.string().nullable(),
  attachment_type: z.string().nullable(),
  audio_duration_seconds: z.number().nullable(),
  created_at: z.iso.datetime({ offset: true }),
}).strict();

export const workroomMessageHistorySchema = z.object({
  items: z.array(workroomMessageSchema),
  page: z.number().int().positive(),
  page_size: z.number().int().positive().max(50),
  total_items: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
}).strict();

export const workroomSocketErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).strict(),
}).strict();

export type WorkroomOrderIdParams = z.infer<typeof workroomOrderIdSchema>;
export type WorkroomHistoryQuery = z.infer<typeof workroomHistoryQuerySchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;

export type WorkroomMessageType = 'TEXT' | 'FILE' | 'SYSTEM' | 'CUSTOM_OFFER';

export type WorkroomMessage = {
  id: string;
  order_id: string;
  sender_id: string;
  type: WorkroomMessageType;
  content: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  audio_duration_seconds: number | null;
  created_at: string;
};

export type WorkroomMessageHistory = {
  items: WorkroomMessage[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export type WorkroomRoom = {
  order_id: string;
  room: string;
};

export type WorkroomSocketSuccess<TData> = {
  success: true;
  data: TData;
};

export type WorkroomSocketError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type WorkroomClientToServerEvents = {
  join_room: (payload: JoinRoomRequest) => void;
  leave_room: (payload: JoinRoomRequest) => void;
  send_message: (payload: SendMessageRequest) => void;
};

export type WorkroomServerToClientEvents = {
  room_joined: (payload: WorkroomSocketSuccess<WorkroomRoom>) => void;
  room_left: (payload: WorkroomSocketSuccess<WorkroomRoom>) => void;
  new_message: (payload: WorkroomSocketSuccess<WorkroomMessage>) => void;
  deliverable_submitted: (payload: WorkroomSocketSuccess<DeliverableSubmittedEvent>) => void;
  deliverable_unlocked: (payload: WorkroomSocketSuccess<DeliverableUnlockedEvent>) => void;
  chat_error: (payload: WorkroomSocketError) => void;
};
