"use client";

import { Chat, type UIMessage, type UseChatHelpers, useChat } from "@ai-sdk/react";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useCurrentUser } from "@/features/app/app-api";
import { createAiSearchTransport } from "@/features/ai-search/ai-search-api";
import { getAiSearchMessagesForUser, useAiSearchStore } from "@/features/ai-search/ai-search-store";

const AiSearchChatContext = createContext<UseChatHelpers<UIMessage> | null>(null);

interface AiSearchChatProviderProps {
  children: ReactNode;
}

export function AiSearchChatProvider({ children }: AiSearchChatProviderProps) {
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id ?? null;

  const persistedMessages = useAiSearchStore((state) => getAiSearchMessagesForUser(state, userId));
  const setActiveUserId = useAiSearchStore((state) => state.setActiveUserId);
  const transport = useMemo(() => createAiSearchTransport(), []);

  const [chat] = useState(
    () => new Chat<UIMessage>({
      messages: getAiSearchMessagesForUser(useAiSearchStore.getState(), userId),
      transport,
      onFinish: ({ messages }) => {
        const activeUserId = useAiSearchStore.getState().activeUserId;
        if (activeUserId) useAiSearchStore.getState().saveMessages(activeUserId, messages);
      },
    }),
  );

  const chatHelpers = useChat({ chat });
  const { setMessages } = chatHelpers;
  const loadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    setActiveUserId(userId);
  }, [setActiveUserId, userId]);

  useEffect(() => {
    if (!userId || loadedUserIdRef.current === userId) return;
    setMessages(persistedMessages);
    loadedUserIdRef.current = userId;
  }, [persistedMessages, setMessages, userId]);

  return <AiSearchChatContext.Provider value={chatHelpers}>{children}</AiSearchChatContext.Provider>;
}

export function useAiSearchChat(): UseChatHelpers<UIMessage> {
  const context = useContext(AiSearchChatContext);
  if (!context) throw new Error("useAiSearchChat must be used inside AiSearchChatProvider.");
  return context;
}
