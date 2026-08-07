"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Paperclip, Send } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";

interface WorkroomChatComposerProps {
  orderId: string;
  disabled: boolean;
  onSendMessage: (orderId: string, content: string) => boolean;
  onTypingStatus: (orderId: string, isTyping: boolean) => boolean;
}

export function WorkroomChatComposer({ orderId, disabled, onSendMessage, onTypingStatus }: WorkroomChatComposerProps): React.ReactNode {
  const [draft, setDraft] = useState("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);
  const onTypingStatusRef = useRef(onTypingStatus);

  useEffect(() => {
    onTypingStatusRef.current = onTypingStatus;
  }, [onTypingStatus]);

  const clearTypingTimeout = useCallback((): void => {
    if (typingTimeoutRef.current === null) return;
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
  }, []);

  const stopTyping = useCallback((): void => {
    clearTypingTimeout();
    if (!typingActiveRef.current) return;
    typingActiveRef.current = false;
    onTypingStatusRef.current(orderId, false);
  }, [clearTypingTimeout, orderId]);

  const startTyping = useCallback((): void => {
    if (disabled || typingActiveRef.current) return;
    if (onTypingStatusRef.current(orderId, true)) typingActiveRef.current = true;
  }, [disabled, orderId]);

  useEffect(() => {
    if (disabled) stopTyping();
    return () => stopTyping();
  }, [disabled, stopTyping]);

  function handleDraftChange(value: string): void {
    setDraft(value);
    if (!value.trim() || disabled) {
      stopTyping();
      return;
    }

    startTyping();
    clearTypingTimeout();
    typingTimeoutRef.current = setTimeout(stopTyping, 1500);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const content = draft.trim();
    if (!content || content.length > 4000 || disabled) return;
    if (onSendMessage(orderId, content)) {
      setDraft("");
      stopTyping();
    }
  }

  return (
    <form className="shrink-0 border-t border-border bg-background px-5 py-4 sm:px-7" onSubmit={handleSubmit} aria-label="Send a workroom message">
      <label className="sr-only" htmlFor="workroom-message-input">Write a message</label>
      <InputGroup className="h-12 rounded-xl bg-card">
        <InputGroupAddon align="inline-start">
          <InputGroupButton type="button" aria-label="File messages are not available from the current backend" disabled>
            <Paperclip aria-hidden="true" data-icon="inline-start" />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput
          id="workroom-message-input"
          value={draft}
          onChange={(event) => handleDraftChange(event.target.value)}
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
