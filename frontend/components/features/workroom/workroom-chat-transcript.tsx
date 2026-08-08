"use client";

import Image from "next/image";
import { ExternalLink, MessageCircle } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message";
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/components/ui/message-scroller";
import { formatTimestamp, getFreelancerName, getInitials, sortWorkroomMessages, type WorkroomRole } from "@/features/workroom/workroom-types";
import { cn } from "@/lib/utils";
import type { OrderListItem, WorkroomMessage } from "shared/schemas";
import { WorkroomImageLightbox } from "./workroom-image-lightbox";

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
  const [lightboxMessage, setLightboxMessage] = useState<WorkroomMessage | null>(null);

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
  const chronologicalMessages = sortWorkroomMessages(messages);

  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent className="gap-6 px-5 py-7 sm:px-7">
            {chronologicalMessages.map((message) => {
              const isSelf = message.sender_id === currentUserId;
              if (message.type !== "TEXT" && message.type !== "FILE") {
                return (
                  <MessageScrollerItem key={message.id} messageId={message.id}>
                    <Marker variant="separator"><MarkerContent>{message.content?.trim() || `${message.type.toLowerCase()} message`}</MarkerContent></Marker>
                  </MessageScrollerItem>
                );
              }

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
                      {message.type === "FILE" ? (
                        <FileMessageBubble message={message} isSelf={isSelf} onOpen={() => setLightboxMessage(message)} />
                      ) : (
                        <Bubble variant={isSelf ? "default" : "tinted"} align={isSelf ? "end" : "start"}>
                          <BubbleContent><p>{message.content}</p></BubbleContent>
                        </Bubble>
                      )}
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
      <WorkroomImageLightbox
        src={lightboxMessage?.attachment_type === "IMAGE" ? lightboxMessage.attachment_url : null}
        alt="Watermarked workroom image"
        open={lightboxMessage !== null}
        onOpenChange={(open) => {
          if (!open) setLightboxMessage(null);
        }}
      />
    </MessageScrollerProvider>
  );
}

interface FileMessageBubbleProps {
  message: WorkroomMessage;
  isSelf: boolean;
  onOpen: () => void;
}

function signedImageLoader({ src }: { src: string }): string {
  return src;
}

function FileMessageBubble({ message, isSelf, onOpen }: FileMessageBubbleProps): React.ReactNode {
  const imageUrl = message.attachment_type === "IMAGE" ? message.attachment_url : null;
  return (
    <Bubble variant={isSelf ? "default" : "tinted"} align={isSelf ? "end" : "start"}>
      <BubbleContent className={cn(imageUrl && "p-2")}>
        {imageUrl ? (
          <button
            type="button"
            className="block max-w-sm rounded-lg text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={onOpen}
            aria-label="Open watermarked workroom image"
          >
            <span className="relative block aspect-square w-full overflow-hidden rounded-lg bg-muted">
              <Image loader={signedImageLoader} src={imageUrl} alt="Watermarked work shared in this workroom" fill sizes="(max-width: 640px) 70vw, 24rem" unoptimized className="object-cover" />
            </span>
            <span className="mt-2 block px-1 text-xs font-medium">Watermarked image · Open preview</span>
          </button>
        ) : message.attachment_url ? (
          <Button
            nativeButton={false}
            render={<a href={message.attachment_url} target="_blank" rel="noreferrer" />}
            variant="outline"
          >
            Open attachment <ExternalLink data-icon="inline-end" />
          </Button>
        ) : (
          <p>Attachment unavailable.</p>
        )}
      </BubbleContent>
    </Bubble>
  );
}
