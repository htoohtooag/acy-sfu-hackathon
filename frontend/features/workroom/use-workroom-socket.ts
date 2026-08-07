"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendMessageSchema, workroomMessageSchema, workroomSocketErrorSchema } from "shared/schemas";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createWorkroomSocket, type WorkroomSocket } from "@/lib/socket";

type WorkroomSocketState = "idle" | "connecting" | "connected" | "disconnected" | "error";

interface UseWorkroomSocketOptions {
  selectedOrderId: string | null;
  onMessage: (message: import("shared/schemas").WorkroomMessage) => void;
  onWorkroomEvent: (orderId: string) => void;
}

interface UseWorkroomSocketResult {
  connectionState: WorkroomSocketState;
  joinedOrderId: string | null;
  socketError: string | null;
  sendMessage: (orderId: string, content: string) => boolean;
}

export function useWorkroomSocket({ selectedOrderId, onMessage, onWorkroomEvent }: UseWorkroomSocketOptions): UseWorkroomSocketResult {
  const socketRef = useRef<WorkroomSocket | null>(null);
  const selectedOrderIdRef = useRef<string | null>(selectedOrderId);
  const roomOrderIdRef = useRef<string | null>(null);
  const joinedOrderIdRef = useRef<string | null>(null);
  const onMessageRef = useRef(onMessage);
  const onWorkroomEventRef = useRef(onWorkroomEvent);
  const [connectionState, setConnectionState] = useState<WorkroomSocketState>("idle");
  const [joinedOrderId, setJoinedOrderId] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);

  useEffect(() => {
    selectedOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId]);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onWorkroomEventRef.current = onWorkroomEvent;
  }, [onMessage, onWorkroomEvent]);

  const joinSelectedRoom = useCallback((): void => {
    const socket = socketRef.current;
    const orderId = selectedOrderIdRef.current;
    if (!socket?.connected || !orderId) return;
    const previousOrderId = roomOrderIdRef.current;
    if (previousOrderId && previousOrderId !== orderId) socket.emit("leave_room", { order_id: previousOrderId });
    roomOrderIdRef.current = orderId;
    joinedOrderIdRef.current = null;
    setJoinedOrderId(null);
    socket.emit("join_room", { order_id: orderId });
  }, []);

  useEffect(() => {
    let disposed = false;
    const supabase = createSupabaseBrowserClient();

    async function connect(): Promise<void> {
      setConnectionState("connecting");
      const { data, error } = await supabase.auth.getSession();
      if (disposed) return;
      if (error || !data.session?.access_token) {
        setConnectionState("error");
        setSocketError("Your session could not be loaded for live chat.");
        return;
      }

      const socket = createWorkroomSocket(data.session.access_token);
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnectionState("connected");
        setSocketError(null);
        joinSelectedRoom();
      });

      socket.on("disconnect", () => {
        roomOrderIdRef.current = null;
        joinedOrderIdRef.current = null;
        setJoinedOrderId(null);
        setConnectionState("disconnected");
      });

      socket.on("connect_error", (error: Error) => {
        setConnectionState("error");
        setSocketError(error.message || "Live chat could not connect.");
      });

      socket.on("room_joined", (payload) => {
        if (payload.data.order_id !== selectedOrderIdRef.current) return;
        joinedOrderIdRef.current = payload.data.order_id;
        setJoinedOrderId(payload.data.order_id);
        setSocketError(null);
      });

      socket.on("room_left", (payload) => {
        if (payload.data.order_id !== joinedOrderIdRef.current) return;
        joinedOrderIdRef.current = null;
        setJoinedOrderId(null);
      });

      socket.on("new_message", (payload) => {
        const parsed = workroomMessageSchema.safeParse(payload.data);
        if (!parsed.success) {
          setSocketError("A live chat message could not be displayed.");
          return;
        }
        onMessageRef.current(parsed.data);
      });

      socket.on("deliverable_submitted", (payload) => {
        if (payload.data.order_id === selectedOrderIdRef.current) onWorkroomEventRef.current(payload.data.order_id);
      });

      socket.on("deliverable_unlocked", (payload) => {
        if (payload.data.order_id === selectedOrderIdRef.current) onWorkroomEventRef.current(payload.data.order_id);
      });

      socket.on("chat_error", (payload) => {
        const parsed = workroomSocketErrorSchema.safeParse(payload);
        if (!parsed.success) {
          setSocketError("The live chat returned an invalid error.");
          return;
        }
        setSocketError(parsed.data.error.message);
        if (parsed.data.error.code === "CHAT_LOCKED") joinedOrderIdRef.current = null;
        if (parsed.data.error.code === "CHAT_LOCKED") setJoinedOrderId(null);
      });

      socket.connect();
    }

    void connect().catch(() => {
      if (!disposed) {
        setConnectionState("error");
        setSocketError("Live chat could not connect.");
      }
    });

    return () => {
      disposed = true;
      const socket = socketRef.current;
      if (!socket) return;
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      roomOrderIdRef.current = null;
      joinedOrderIdRef.current = null;
    };
  }, [joinSelectedRoom]);

  useEffect(() => {
    const socket = socketRef.current;
    const previousOrderId = roomOrderIdRef.current;
    if (previousOrderId && previousOrderId !== selectedOrderId) {
      socket?.emit("leave_room", { order_id: previousOrderId });
      roomOrderIdRef.current = null;
      joinedOrderIdRef.current = null;
      setJoinedOrderId(null);
    }
    if (selectedOrderId && socket?.connected) joinSelectedRoom();
  }, [joinSelectedRoom, selectedOrderId]);

  const sendMessage = useCallback((orderId: string, content: string): boolean => {
    const socket = socketRef.current;
    if (!socket?.connected || joinedOrderIdRef.current !== orderId) return false;
    const parsed = sendMessageSchema.safeParse({ order_id: orderId, type: "TEXT", content });
    if (!parsed.success) return false;
    socket.emit("send_message", parsed.data);
    return true;
  }, []);

  return { connectionState, joinedOrderId, socketError, sendMessage };
}
