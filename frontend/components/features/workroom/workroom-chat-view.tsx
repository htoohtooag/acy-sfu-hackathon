"use client";

import { LockKeyhole, MessageCircle } from "lucide-react";
import type { OrderListItem, WorkroomMessage } from "shared/schemas";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getConversationStatusLabel, getInitials, isConversationLocked } from "@/features/workroom/workroom-types";
import { WorkroomChatComposer } from "./workroom-chat-composer";
import { WorkroomChatTranscript } from "./workroom-chat-transcript";

interface WorkroomChatViewProps {
  order: OrderListItem | null;
  messages: WorkroomMessage[];
  messagesPending: boolean;
  messagesError: Error | null;
  currentUserId: string | null;
  connectionState: "idle" | "connecting" | "connected" | "disconnected" | "error";
  joinedOrderId: string | null;
  socketError: string | null;
  onSendMessage: (orderId: string, content: string) => boolean;
}

export function WorkroomChatView({ order, messages, messagesPending, messagesError, currentUserId, connectionState, joinedOrderId, socketError, onSendMessage }: WorkroomChatViewProps): React.ReactNode {
  if (!order) {
    return (
      <section className="flex min-h-[28rem] min-w-0 items-center justify-center bg-muted/20 px-6 py-12 lg:min-h-0" aria-labelledby="empty-chat-title">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessageCircle aria-hidden="true" /></EmptyMedia>
            <EmptyTitle id="empty-chat-title">Select a conversation</EmptyTitle>
            <EmptyDescription>Select a conversation to view messages.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>
    );
  }

  const participantName = order.other_party.full_name?.trim() || "Your collaborator";
  const isLocked = isConversationLocked(order.status);
  const isComposerDisabled = connectionState !== "connected" || joinedOrderId !== order.id;

  return (
    <section className="flex min-h-[28rem] min-w-0 flex-col bg-muted/20 lg:min-h-0" aria-labelledby="active-chat-title">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-5 py-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={order.other_party.avatar_url ?? undefined} alt={`${participantName} avatar`} />
            <AvatarFallback>{getInitials(participantName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 id="active-chat-title" className="truncate font-heading text-lg font-semibold tracking-tight">{participantName}</h2>
            <p className="truncate text-sm text-muted-foreground">{order.source?.title || "Workroom conversation"}</p>
          </div>
        </div>
        <Badge>{getConversationStatusLabel(order.status)}</Badge>
      </header>

      {socketError ? <p className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive sm:px-7" role="alert">{socketError}</p> : null}

      <WorkroomChatTranscript
        order={order}
        messages={messages}
        messagesPending={messagesPending}
        messagesError={messagesError}
        currentUserId={currentUserId}
      />

      {isLocked ? (
        <div className="flex shrink-0 items-center gap-3 border-t border-warning/30 bg-warning/20 px-5 py-4 text-sm text-warning-foreground sm:px-7" role="alert">
          <LockKeyhole aria-hidden="true" />
          <span>Chat is locked until escrow is verified.</span>
        </div>
      ) : (
        <WorkroomChatComposer orderId={order.id} disabled={isComposerDisabled} onSendMessage={onSendMessage} />
      )}
    </section>
  );
}
