import { z } from 'zod';

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
