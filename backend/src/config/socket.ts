import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { configureNotificationEmitter, userRoomName } from '../features/notifications/notification.socket.js';
import { env } from './env.js';
import { initializeWorkroomSocket } from '../features/workroom/workroom.socket.js';
import type { WorkroomSocketServer } from '../features/workroom/workroom.socket.js';

export function createSocketServer(httpServer: HttpServer): WorkroomSocketServer {
  const io: WorkroomSocketServer = new Server(httpServer, {
    cors: {
      credentials: true,
      origin: env.NODE_ENV === 'development' ? true : false,
    },
    pingInterval: 25_000,
    pingTimeout: 20_000,
    maxHttpBufferSize: 1_000_000,
  });

  initializeWorkroomSocket(io);
  configureNotificationEmitter((userId, payload) => {
    io.to(userRoomName(userId)).emit('new_notification', { success: true, data: payload });
  });
  io.on('connection', (socket) => {
    socket.join(userRoomName(socket.data.user.id));
  });

  return io;
}
