"use client";

import { FormEvent, useState } from "react";
import type { ChatStatus } from "ai";
import { ArrowUp, Plus, Square } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

interface AiSearchInputProps {
  status: ChatStatus;
  onSend: (text: string) => Promise<void>;
  onStop: () => Promise<void>;
}

export function AiSearchInput({ status, onSend, onStop }: AiSearchInputProps) {
  const [draft, setDraft] = useState("");
  const isStreaming = status === "submitted" || status === "streaming";

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isStreaming) return;

    await onSend(text);
    setDraft("");
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-card p-4">
      <InputGroup className="min-h-14 rounded-2xl bg-muted/60 px-1.5 py-1">
        <InputGroupTextarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask Gigmatch AI to find the right talent..."
          aria-label="Message Gigmatch AI"
          rows={2}
        />
        <InputGroupAddon align="inline-start" className="self-end pb-1">
          <InputGroupButton type="button" size="icon-sm" aria-label="Add an attachment" disabled>
            <Plus aria-hidden="true" data-icon="inline-start" />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end" className="self-end pb-1">
          {isStreaming ? (
            <InputGroupButton type="button" size="icon-sm" aria-label="Stop AI search" onClick={() => void onStop()}>
              <Square aria-hidden="true" data-icon="inline-start" />
            </InputGroupButton>
          ) : (
            <InputGroupButton type="submit" size="icon-sm" disabled={!draft.trim()} aria-label="Send message">
              <ArrowUp aria-hidden="true" data-icon="inline-start" />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {isStreaming ? "Gigmatch AI is searching the marketplace…" : "Ask about a service, skill, budget, or delivery timeline."}
      </p>
    </form>
  );
}
