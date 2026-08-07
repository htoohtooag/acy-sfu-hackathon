"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message";
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller";
import { MessageCircle } from "lucide-react";
import { formatTimestamp, getFreelancerName, getInitials, type WorkroomRole } from "@/features/workroom/workroom-types";
import type { OrderListItem, WorkroomMessage } from "shared/schemas";

interface WorkroomChatTranscriptProps {
  order: OrderListItem;
  messages: WorkroomMessage[];
  messagesPending: boolean;
  messagesError: Error | null;
  currentUserId: string | null;
  role: WorkroomRole;
  currentUserName: string | null;
}

export function WorkroomChatTranscript({ order, messages, messagesPending, messagesError, currentUserId, role, currentUserName }: WorkroomChatTranscriptProps): React.ReactNode {
  if (messagesPending) return <div className="flex flex-1 items-center justify-center px-6 text-sm text-muted-foreground" role="status">Loading messages…</div>;
  if (messagesError) return <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-destructive" role="alert">{messagesError.message}</div>;
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><MessageCircle aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>Send the first message to begin this workroom conversation.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const participantName = getFreelancerName(order, role, currentUserId, currentUserName);

  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent className="gap-6 px-5 py-7 sm:px-7">
            {messages.map((message) => {
              if (message.type !== "TEXT") {
                return (
                  <MessageScrollerItem key={message.id} messageId={message.id}>
                    <Marker variant="separator"><MarkerContent>{message.content?.trim() || `${message.type.toLowerCase()} message`}</MarkerContent></Marker>
                  </MessageScrollerItem>
                );
              }

              const isSelf = message.sender_id === currentUserId;
              return (
                <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={isSelf}>
                  <Message align={isSelf ? "end" : "start"}>
                    <MessageAvatar>
                      <Avatar size="sm" aria-label={isSelf ? "Your avatar" : `${participantName} avatar`}>
                        {!isSelf && <AvatarImage src={order.freelancer.avatar_url ?? undefined} alt={`${participantName} avatar`} />}
                        <AvatarFallback>{isSelf ? "You" : getInitials(participantName)}</AvatarFallback>
                      </Avatar>
                    </MessageAvatar>
                    <MessageContent>
                      <MessageHeader>{isSelf ? "You" : participantName}</MessageHeader>
                      <Bubble variant={isSelf ? "default" : "tinted"} align={isSelf ? "end" : "start"}>
                        <BubbleContent><p>{message.content}</p></BubbleContent>
                      </Bubble>
                      <MessageFooter><time dateTime={message.created_at}>{formatTimestamp(message.created_at)}</time></MessageFooter>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              );
            })}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
