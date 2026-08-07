import { authenticateSupabaseUser, getSocketToken } from '../../auth/supabase-auth.js';
import { ApiError } from '../../utils/api-error.js';
import {
  joinRoomSchema,
  sendMessageSchema,
  typingStatusRequestSchema,
  type WorkroomSocketError,
  type WorkroomSocketSuccess,
} from 'shared/schemas';
import {
  joinWorkroom,
  sendWorkroomMessage,
} from './workroom.service.js';
import { subscribeWorkroomEvents } from './workroom.events.js';
import {
  workroomRoomName,
} from './workroom.types.js';
import type {
  WorkroomClientToServerEvents,
  WorkroomServerToClientEvents,
  WorkroomSocketData,
} from './workroom.types.js';
import { Server, type Socket } from 'socket.io';

export type WorkroomSocketServer = Server<
  WorkroomClientToServerEvents,
  WorkroomServerToClientEvents,
  Record<string, never>,
  WorkroomSocketData
>;

type WorkroomSocket = Socket<
  WorkroomClientToServerEvents,
  WorkroomServerToClientEvents,
  Record<string, never>,
  WorkroomSocketData
>;

function success<TData>(data: TData): WorkroomSocketSuccess<TData> {
  return { success: true, data };
}

function failure(code: string, message: string): WorkroomSocketError {
  return { success: false, error: { code, message } };
}

function validationFailureMessage(issues: readonly { path: PropertyKey[] }[]): string {
  const fields = issues
    .map((issue) => issue.path.length === 0 ? 'payload' : issue.path.join('.'))
    .join(', ');

  return fields.length === 0
    ? 'The message is invalid.'
    : `The message is invalid. Check: ${fields}.`;
}

function emitError(socket: WorkroomSocket, error: unknown, event: string): void {
  if (error instanceof ApiError) {
    socket.emit('chat_error', failure(error.code, error.message));
    return;
  }

  console.error('Workroom socket handler failed.', { event, code: 'INTERNAL_SERVER_ERROR' });
  socket.emit('chat_error', failure('INTERNAL_SERVER_ERROR', 'The workroom request failed.'));
}

function broadcastTypingStatus(socket: WorkroomSocket, orderId: string, isTyping: boolean): void {
  socket.to(workroomRoomName(orderId)).emit('typing_status', success({
    order_id: orderId,
    user_id: socket.data.user.id,
    is_typing: isTyping,
  }));
}

function registerWorkroomEvents(io: WorkroomSocketServer, socket: WorkroomSocket): void {
  socket.on('join_room', (payload) => {
    void (async (): Promise<void> => {
      const parsed = joinRoomSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('chat_error', failure(
          'VALIDATION_ERROR',
          validationFailureMessage(parsed.error.issues),
        ));
        return;
      }

      try {
        const room = await joinWorkroom(socket.data.user.id, parsed.data.order_id);
        console.log(room , "join succesfully")
        socket.join(room.room);
        socket.emit('room_joined', success(room));
      } catch (error: unknown) {
        emitError(socket, error, 'join_room');
      }
    })().catch((error: unknown) => emitError(socket, error, 'join_room'));
  });

  socket.on('leave_room', (payload) => {
    const parsed = joinRoomSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('chat_error', failure(
        'VALIDATION_ERROR',
        validationFailureMessage(parsed.error.issues),
      ));
      return;
    }

    const room = {
      order_id: parsed.data.order_id,
      room: workroomRoomName(parsed.data.order_id),
    };
    if (socket.rooms.has(room.room)) broadcastTypingStatus(socket, room.order_id, false);
    socket.leave(room.room);
    socket.emit('room_left', success(room));
  });

  socket.on('typing_status', (payload) => {
    const parsed = typingStatusRequestSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('chat_error', failure(
        'VALIDATION_ERROR',
        validationFailureMessage(parsed.error.issues),
      ));
      return;
    }

    const room = workroomRoomName(parsed.data.order_id);
    if (!socket.rooms.has(room)) {
      socket.emit('chat_error', failure('ROOM_NOT_JOINED', 'Join the workroom before sending typing status.'));
      return;
    }

    broadcastTypingStatus(socket, parsed.data.order_id, parsed.data.is_typing);
  });

  socket.on('send_message', (payload) => {
    void (async (): Promise<void> => {
      const parsed = sendMessageSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('chat_error', failure(
          'VALIDATION_ERROR',
          validationFailureMessage(parsed.error.issues),
        ));
        return;
      }

      const room = workroomRoomName(parsed.data.order_id);
      if (!socket.rooms.has(room)) {
        socket.emit('chat_error', failure('ROOM_NOT_JOINED', 'Join the workroom before sending messages.'));
        return;
      }

      try {
        const message = await sendWorkroomMessage(
          socket.data.user.id,
          parsed.data.order_id,
          parsed.data.content,
        );
        io.to(room).emit('new_message', success(message));
      } catch (error: unknown) {
        emitError(socket, error, 'send_message');
      }
    })().catch((error: unknown) => emitError(socket, error, 'send_message'));
  });
}

export function initializeWorkroomSocket(io: WorkroomSocketServer): void {
  io.use((socket, next) => {
    void (async (): Promise<void> => {
      try {
        const token = getSocketToken(
          socket.handshake.auth?.token ??
            socket.handshake.headers.authorization ??
            socket.handshake.headers.token,
        );
        socket.data.user = await authenticateSupabaseUser(token);
        next();
      } catch (error: unknown) {
        if (!(error instanceof ApiError)) {
          console.error('Workroom socket authentication failed.', { code: 'UNAUTHORIZED' });
        }
        next(new Error('UNAUTHORIZED'));
      }
    })().catch((_error: unknown) => next(new Error('UNAUTHORIZED')));
  });

  io.on('connection', (socket) => {
    registerWorkroomEvents(io, socket);
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (!room.startsWith('order:')) continue;
        broadcastTypingStatus(socket, room.slice('order:'.length), false);
      }
    });
  });

  subscribeWorkroomEvents((event) => {
    const room = workroomRoomName(event.order_id);

    if (event.type === 'message') {
      io.to(room).emit('new_message', success(event.message));
      return;
    }

    if (event.type === 'deliverable_submitted') {
      io.to(room).emit('deliverable_submitted', success(event.data));
      return;
    }

    io.to(room).emit('deliverable_unlocked', success(event.data));
  });
}
