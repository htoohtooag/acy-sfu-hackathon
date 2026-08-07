import { io, type Socket } from "socket.io-client";
import type { WorkroomClientToServerEvents, WorkroomServerToClientEvents } from "shared/schemas";

import { env } from "@/lib/env";

export type WorkroomSocket = Socket<WorkroomServerToClientEvents, WorkroomClientToServerEvents>;

export function createWorkroomSocket(accessToken: string): WorkroomSocket {
  return io(env.NEXT_PUBLIC_API_URL, {
    autoConnect: false,
    auth: { token: accessToken },
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 30_000,
    randomizationFactor: 0.5,
    timeout: 10_000,
  });
}
