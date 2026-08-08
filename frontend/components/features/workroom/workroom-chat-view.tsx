"use client";

import { CheckCircle2, LoaderCircle, LockKeyhole, MessageCircle, ShieldAlert } from "lucide-react";
import type { OrderDetail, OrderListItem, WorkroomMessage } from "shared/schemas";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getConversationStatusLabel, getFreelancerName, getInitials, getWorkroomStatusPresentation, type WorkroomRole } from "@/features/workroom/workroom-types";
import { cn } from "@/lib/utils";
import { WorkroomDeliverablePanel } from "./workroom-deliverable-panel";
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
  typingUserId: string | null;
  role: WorkroomRole;
  currentUserName: string | null;
  detail: OrderDetail | null;
  deliverableId: string | null;
  watermarkedUrl: string | null;
  cleanUrl: string | null;
  reviewSubmitted: boolean;
  onWatermarkedUrl: (deliverableId: string, url: string) => void;
  onCleanUrl: (deliverableId: string, url: string) => void;
  onDeliverableRejected: (deliverableId: string) => void;
  onReviewSubmitted: () => void;
  onSendMessage: (orderId: string, content: string) => boolean;
  onTypingStatus: (orderId: string, isTyping: boolean) => boolean;
}

export function WorkroomChatView({ order, messages, messagesPending, messagesError, currentUserId, connectionState, joinedOrderId, socketError, typingUserId, role, currentUserName, detail, deliverableId, watermarkedUrl, cleanUrl, reviewSubmitted, onWatermarkedUrl, onCleanUrl, onDeliverableRejected, onReviewSubmitted, onSendMessage, onTypingStatus }: WorkroomChatViewProps): React.ReactNode {
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

  const participantName = getFreelancerName(order, role, currentUserId, currentUserName);
  const typingParticipantName = typingUserId === order.freelancer_id
    ? participantName
    : order.other_party.full_name?.trim() || "Client";
  const isRemoteTyping = typingUserId !== null && typingUserId !== currentUserId;
  const presentation = getWorkroomStatusPresentation(order.status, role);
  const isComposerDisabled = connectionState !== "connected" || joinedOrderId !== order.id;

  return (
    <section className="flex min-h-[28rem] min-w-0 flex-col bg-muted/20 lg:min-h-0" aria-labelledby="active-chat-title">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-5 py-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={order.freelancer.avatar_url ?? undefined} alt={`${participantName} avatar`} />
            <AvatarFallback>{getInitials(participantName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 id="active-chat-title" className="truncate font-heading text-lg font-semibold tracking-tight">{participantName}</h2>
            <p className="truncate text-sm text-muted-foreground" role="status" aria-live="polite">
              {isRemoteTyping ? (
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                  <span>{typingParticipantName} is typing…</span>
                </span>
              ) : order.source?.title || "Workroom conversation"}
            </p>
          </div>
        </div>
        <Badge>{getConversationStatusLabel(order.status)}</Badge>
      </header>

      {socketError ? <p className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive sm:px-7" role="alert">{socketError}</p> : null}

      <WorkroomChatTranscript
        order={order}
        role={role}
        currentUserName={currentUserName}
        messages={messages}
        messagesPending={messagesPending}
        messagesError={messagesError}
        currentUserId={currentUserId}
      />

      <WorkroomDeliverablePanel
        order={order}
        detail={detail}
        role={role}
        deliverableId={deliverableId}
        watermarkedUrl={watermarkedUrl}
        cleanUrl={cleanUrl}
        reviewSubmitted={reviewSubmitted}
        onWatermarkedUrl={onWatermarkedUrl}
        onCleanUrl={onCleanUrl}
        onRejected={onDeliverableRejected}
        onReviewSubmitted={onReviewSubmitted}
      />

      {presentation.roleNote ? <p className="shrink-0 border-t border-border bg-muted/40 px-5 py-3 text-sm text-muted-foreground sm:px-7">{presentation.roleNote}</p> : null}

      {presentation.locked ? (
        <StatusBanner tone={presentation.bannerTone ?? "neutral"} message={presentation.bannerMessage ?? "This workroom is locked."} />
      ) : (
        <WorkroomChatComposer orderId={order.id} disabled={isComposerDisabled} onSendMessage={onSendMessage} onTypingStatus={onTypingStatus} />
      )}
    </section>
  );
}

function StatusBanner({ tone, message }: { tone: "warning" | "success" | "destructive" | "neutral"; message: string }): React.ReactNode {
  const Icon = tone === "success" ? CheckCircle2 : tone === "destructive" ? ShieldAlert : LockKeyhole;
  const classes = tone === "warning"
    ? "border-warning/30 bg-warning/20 text-warning-foreground"
    : tone === "success"
      ? "border-primary/30 bg-primary/10 text-primary"
      : tone === "destructive"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-border bg-muted text-muted-foreground";
  return <Alert className={cn("shrink-0 rounded-none border-x-0 border-b-0 px-5 py-4 sm:px-7", classes)}><Icon aria-hidden="true" /><AlertTitle>{message}</AlertTitle><AlertDescription className="sr-only">The message composer is unavailable for this order status.</AlertDescription></Alert>;
}
