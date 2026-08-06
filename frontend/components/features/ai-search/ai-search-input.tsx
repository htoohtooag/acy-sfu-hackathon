"use client";

import { FormEvent, useState } from "react";
import { ArrowUp, Plus } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

export function AiSearchInput() {
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraft("");
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-card p-4">
      <InputGroup className="min-h-14 rounded-2xl bg-muted/60 px-1.5 py-1">
        <InputGroupTextarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask Indy AI to find the right talent..."
          aria-label="Message Indy AI"
          rows={2}
        />
        <InputGroupAddon align="inline-start" className="self-end pb-1">
          <InputGroupButton type="button" size="icon-sm" aria-label="Add an attachment">
            <Plus aria-hidden="true" data-icon="inline-start" />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end" className="self-end pb-1">
          <InputGroupButton type="submit" size="icon-sm" disabled={!draft.trim()} aria-label="Send message">
            <ArrowUp aria-hidden="true" data-icon="inline-start" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p className="mt-2 text-center text-xs text-muted-foreground">Mock interface · AI search connects in the next phase</p>
    </form>
  );
}
