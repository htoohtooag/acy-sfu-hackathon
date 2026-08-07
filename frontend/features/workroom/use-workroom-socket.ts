"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deliverableSubmittedEventSchema,
  deliverableUnlockedEventSchema,
  sendMessageSchema,
  typingStatusEventSchema,
  typingStatusRequestSchema,
  workroomMessageSchema,
  workroomSocketErrorSchema,
  type DeliverableSubmittedEvent,
  type DeliverableUnlockedEvent,
} from "shared/schemas";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createWorkroomSocket, type WorkroomSocket } from "@/lib/socket";

type WorkroomSocketState = "idle" | "connecting" | "connected" | "disconnected" | "error";
type TypingState = { orderId: string; userId: string } | null;

interface UseWorkroomSocketOptions {
  selectedOrderId: string | null;
  onMessage: (message: import("shared/schemas").WorkroomMessage) => void;
  onWorkroomEvent: (orderId: string) => void;
  onDeliverableSubmitted: (event: DeliverableSubmittedEvent) => void;
  onDeliverableUnlocked: (event: DeliverableUnlockedEvent) => void;
}

interface UseWorkroomSocketResult {
  connectionState: WorkroomSocketState;
  joinedOrderId: string | null;
  socketError: string | null;
  typingUserId: string | null;
  sendMessage: (orderId: string, content: string) => boolean;
  sendTypingStatus: (orderId: string, isTyping: boolean) => boolean;
}

export function useWorkroomSocket({ selectedOrderId, onMessage, onWorkroomEvent, onDeliverableSubmitted, onDeliverableUnlocked }: UseWorkroomSocketOptions): UseWorkroomSocketResult {
  const socketRef = useRef<WorkroomSocket | null>(null);
  const selectedOrderIdRef = useRef<string | null>(selectedOrderId);
  const roomOrderIdRef = useRef<string | null>(null);
  const joinedOrderIdRef = useRef<string | null>(null);
  const onMessageRef = useRef(onMessage);
  const onWorkroomEventRef = useRef(onWorkroomEvent);
  const onDeliverableSubmittedRef = useRef(onDeliverableSubmitted);
  const onDeliverableUnlockedRef = useRef(onDeliverableUnlocked);
  const [connectionState, setConnectionState] = useState<WorkroomSocketState>("idle");
  const [joinedOrderId, setJoinedOrderId] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [typingState, setTypingState] = useState<TypingState>(null);
  const typingClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTypingTimeout = useCallback((): void => {
    if (typingClearTimeoutRef.current === null) return;
    clearTimeout(typingClearTimeoutRef.current);
    typingClearTimeoutRef.current = null;
  }, []);

  const clearTypingUser = useCallback((): void => {
    clearTypingTimeout();
    setTypingState(null);
  }, [clearTypingTimeout]);

  useEffect(() => {
    selectedOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId]);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onWorkroomEventRef.current = onWorkroomEvent;
    onDeliverableSubmittedRef.current = onDeliverableSubmitted;
    onDeliverableUnlockedRef.current = onDeliverableUnlocked;
  }, [onDeliverableSubmitted, onDeliverableUnlocked, onMessage, onWorkroomEvent]);

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
        clearTypingUser();
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
        clearTypingUser();
      });

      socket.on("new_message", (payload) => {
        const parsed = workroomMessageSchema.safeParse(payload.data);
        if (!parsed.success) {
          setSocketError("A live chat message could not be displayed.");
          return;
        }
        onMessageRef.current(parsed.data);
      });

      socket.on("typing_status", (payload) => {
        const parsed = typingStatusEventSchema.safeParse(payload.data);
        if (!parsed.success) {
          setSocketError("A live typing status could not be displayed.");
          return;
        }
        if (parsed.data.order_id !== selectedOrderIdRef.current) return;
        if (!parsed.data.is_typing) {
          clearTypingUser();
          return;
        }

        clearTypingTimeout();
        setTypingState({ orderId: parsed.data.order_id, userId: parsed.data.user_id });
        typingClearTimeoutRef.current = setTimeout(clearTypingUser, 2500);
      });

      socket.on("deliverable_submitted", (payload) => {
        const parsed = deliverableSubmittedEventSchema.safeParse(payload.data);
        if (!parsed.success) {
          setSocketError("A submitted deliverable could not be displayed.");
          return;
        }
        if (parsed.data.order_id === selectedOrderIdRef.current) {
          onDeliverableSubmittedRef.current(parsed.data);
          onWorkroomEventRef.current(parsed.data.order_id);
        }
      });

      socket.on("deliverable_unlocked", (payload) => {
        const parsed = deliverableUnlockedEventSchema.safeParse(payload.data);
        if (!parsed.success) {
          setSocketError("An unlocked deliverable could not be displayed.");
          return;
        }
        if (parsed.data.order_id === selectedOrderIdRef.current) {
          onDeliverableUnlockedRef.current(parsed.data);
          onWorkroomEventRef.current(parsed.data.order_id);
        }
      });

      socket.on("chat_error", (payload) => {
        const parsed = workroomSocketErrorSchema.safeParse(payload);
        if (!parsed.success) {
          setSocketError("The live chat returned an invalid error.");
          return;
        }
        setSocketError(parsed.data.error.message);
        if (parsed.data.error.code === "CHAT_LOCKED") {
          joinedOrderIdRef.current = null;
          setJoinedOrderId(null);
          clearTypingUser();
        }
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
      clearTypingUser();
    };
  }, [clearTypingTimeout, clearTypingUser, joinSelectedRoom]);

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

  const sendTypingStatus = useCallback((orderId: string, isTyping: boolean): boolean => {
    const socket = socketRef.current;
    if (!socket?.connected || joinedOrderIdRef.current !== orderId) return false;
    const parsed = typingStatusRequestSchema.safeParse({ order_id: orderId, is_typing: isTyping });
    if (!parsed.success) return false;
    socket.emit("typing_status", parsed.data);
    return true;
  }, []);

  const typingUserId = typingState?.orderId === selectedOrderId ? typingState.userId : null;
  return { connectionState, joinedOrderId, socketError, typingUserId, sendMessage, sendTypingStatus };
}
