"use client";

import { X } from "lucide-react";

import { AiSearchInput } from "@/components/features/ai-search/ai-search-input";
import { AiSearchTranscript } from "@/components/features/ai-search/ai-search-transcript";
import { useAiSearchChat } from "@/components/features/ai-search/ai-search-chat-provider";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { aiAssistantIdentity } from "@/features/ai-search/mock-data";

export function AiSearchDialog() {
  const { messages, sendMessage, stop, status, error } = useAiSearchChat();

  return (
    <DialogContent
      aria-describedby="ai-search-dialog-description"
      className="left-auto start-auto end-4 top-4 bottom-4 flex h-[calc(100vh-2rem)] w-[min(36rem,calc(100vw-2rem))] max-h-none max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-3xl p-0 shadow-2xl sm:end-6 sm:top-6 sm:bottom-6 sm:h-[calc(100vh-3rem)] sm:w-[min(38rem,calc(100vw-3rem))] sm:p-0 data-ending-style:translate-x-0 data-ending-style:translate-y-2 data-starting-style:translate-x-0 data-starting-style:translate-y-2"
    >
      <DialogHeader className="mb-0 flex shrink-0 flex-row items-start justify-between gap-4 space-y-0 border-b border-border px-6 py-5 text-start sm:px-7 sm:py-6">
        <div className="flex min-w-0 flex-col gap-1">
          <DialogTitle className="truncate text-base">New Chat</DialogTitle>
          <DialogDescription id="ai-search-dialog-description" className="truncate text-sm">
            {aiAssistantIdentity.prompt}
          </DialogDescription>
        </div>
        <DialogClose
          render={
            <Button type="button" variant="ghost" size="icon" aria-label="Close Gigmatch AI assistant" />
          }
        >
          <X aria-hidden="true" data-icon="inline-start" />
        </DialogClose>
      </DialogHeader>
      <div className="flex min-h-0 flex-1 flex-col">
        <AiSearchTranscript messages={messages} status={status} error={error} />
        <AiSearchInput status={status} onSend={(text) => sendMessage({ text })} onStop={() => stop()} />
      </div>
    </DialogContent>
  );
}
