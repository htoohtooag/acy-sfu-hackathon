"use client";

import type { UIMessage } from "@ai-sdk/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const AI_SEARCH_STORE_KEY = "talentscout-ai-search-memory";
const AI_SEARCH_STORE_VERSION = 1;
const MAX_AI_SEARCH_MESSAGES = 20;

export const aiSearchWelcomeMessage: UIMessage = {
  id: "ai-search-intro",
  role: "assistant",
  parts: [{ type: "text", text: "Tell me what you are building and I will help you find a great fit from the marketplace." }],
};

const defaultAiSearchMessages: UIMessage[] = [aiSearchWelcomeMessage];

type AiSearchPersistedState = {
  messagesByUserId: Record<string, UIMessage[]>;
};

type AiSearchStore = AiSearchPersistedState & {
  activeUserId: string | null;
  setActiveUserId: (userId: string | null) => void;
  saveMessages: (userId: string, messages: UIMessage[]) => void;
  clearMessages: (userId: string) => void;
};

function initialMessages(): UIMessage[] {
  return defaultAiSearchMessages;
}

function isPersistableMessage(message: UIMessage): boolean {
  return message.parts.every((part) => part.type !== "file");
}

function trimMessages(messages: UIMessage[]): UIMessage[] {
  const persistableMessages = messages.filter(isPersistableMessage);
  return persistableMessages.length > MAX_AI_SEARCH_MESSAGES ? persistableMessages.slice(-MAX_AI_SEARCH_MESSAGES) : persistableMessages;
}

export function getAiSearchMessagesForUser(state: AiSearchPersistedState, userId: string | null): UIMessage[] {
  if (!userId) return initialMessages();
  return state.messagesByUserId[userId] ?? initialMessages();
}

export const useAiSearchStore = create<AiSearchStore>()(
  persist(
    (set) => ({
      activeUserId: null,
      setActiveUserId: (activeUserId) => set({ activeUserId }),
      messagesByUserId: {},
      saveMessages: (userId, messages) => {
        if (!userId) return;
        set((state) => ({
          messagesByUserId: {
            ...state.messagesByUserId,
            [userId]: trimMessages(messages),
          },
        }));
      },
      clearMessages: (userId) => {
        if (!userId) return;
        set((state) => {
          const messagesByUserId = { ...state.messagesByUserId };
          delete messagesByUserId[userId];
          return { messagesByUserId };
        });
      },
    }),
    {
      name: AI_SEARCH_STORE_KEY,
      version: AI_SEARCH_STORE_VERSION,
      partialize: (state) => ({ messagesByUserId: state.messagesByUserId }),
    },
  ),
);

export type { AiSearchStore, AiSearchPersistedState };
