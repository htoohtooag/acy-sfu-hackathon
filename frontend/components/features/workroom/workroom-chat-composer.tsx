"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Paperclip, Send } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useUploadWorkroomImage } from "@/features/workroom/workroom-api";
import { ApiRequestError } from "@/lib/api-client";

interface WorkroomChatComposerProps {
  orderId: string;
  disabled: boolean;
  onSendMessage: (orderId: string, content: string) => boolean;
  onTypingStatus: (orderId: string, isTyping: boolean) => boolean;
}

export function WorkroomChatComposer({ orderId, disabled, onSendMessage, onTypingStatus }: WorkroomChatComposerProps): React.ReactNode {
  const [draft, setDraft] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);
  const onTypingStatusRef = useRef(onTypingStatus);
  const uploadMutation = useUploadWorkroomImage();

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

  function selectImage(file: File | null): void {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadError(null);
    if (!file) return;
    if (!("image/jpeg" === file.type || "image/png" === file.type || "image/webp" === file.type)) {
      setUploadError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Chat images must be 10 MB or smaller.");
      return;
    }

    uploadMutation.mutate({ orderId, file }, {
      onError: (error: unknown) => {
        if (error instanceof ApiRequestError || error instanceof Error) {
          setUploadError(error.message);
          return;
        }
        setUploadError("The image could not be uploaded. Please try again.");
      },
    });
  }

  const imagePickerDisabled = disabled || uploadMutation.isPending;

  return (
    <form className="shrink-0 border-t border-border bg-background px-5 py-4 sm:px-7" onSubmit={handleSubmit} aria-label="Send a workroom message">
      <label className="sr-only" htmlFor="workroom-message-input">Write a message</label>
      <label className="sr-only" htmlFor="workroom-image-input">Attach a JPEG, PNG, or WebP image</label>
      <input
        ref={fileInputRef}
        id="workroom-image-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => selectImage(event.target.files?.[0] ?? null)}
        disabled={imagePickerDisabled}
      />
      <InputGroup className="h-12 rounded-xl bg-card">
        <InputGroupAddon align="inline-start">
          <InputGroupButton
            type="button"
            aria-label="Attach an image"
            aria-describedby="workroom-image-help"
            disabled={imagePickerDisabled}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? <Spinner data-icon="inline-start" /> : <Paperclip aria-hidden="true" data-icon="inline-start" />}
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
      <p id="workroom-image-help" className="mt-2 text-center text-xs text-muted-foreground">Images are watermarked and limited to 10 MB. Text messages stay inside this secured workroom.</p>
      {uploadMutation.isPending ? <p className="mt-1 text-center text-xs text-muted-foreground" role="status">Uploading watermarked image…</p> : null}
      {uploadError ? <p className="mt-1 text-center text-xs text-destructive" role="alert">{uploadError}</p> : null}
    </form>
  );
}
