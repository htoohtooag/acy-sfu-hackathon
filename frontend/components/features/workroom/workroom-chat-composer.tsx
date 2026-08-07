"use client";

import { useState, type FormEvent } from "react";
import { Paperclip, Send } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";

interface WorkroomChatComposerProps {
  orderId: string;
  disabled: boolean;
  onSendMessage: (orderId: string, content: string) => boolean;
}

export function WorkroomChatComposer({ orderId, disabled, onSendMessage }: WorkroomChatComposerProps): React.ReactNode {
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const content = draft.trim();
    if (!content || content.length > 4000 || disabled) return;
    if (onSendMessage(orderId, content)) setDraft("");
  }

  return (
    <form className="shrink-0 border-t border-border bg-background px-5 py-4 sm:px-7" onSubmit={handleSubmit} aria-label="Send a workroom message">
      <label className="sr-only" htmlFor="workroom-message-input">Write a message</label>
      <InputGroup className="h-12 rounded-xl bg-card">
        <InputGroupAddon align="inline-start">
          <InputGroupButton type="button" aria-label="File sharing is not available yet" disabled>
            <Paperclip aria-hidden="true" data-icon="inline-start" />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput
          id="workroom-message-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={disabled ? "Connecting to workroom…" : "Write a message"}
          autoComplete="off"
          maxLength={4000}
          disabled={disabled}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton type="submit" aria-label="Send message" disabled={disabled || !draft.trim() || draft.trim().length > 4000}>
            <Send aria-hidden="true" data-icon="inline-start" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p className="mt-2 text-center text-xs text-muted-foreground">Text messages are delivered through this secured workroom.</p>
    </form>
  );
}
