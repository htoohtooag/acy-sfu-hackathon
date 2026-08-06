"use client";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Bubble,
  BubbleContent,
} from "@/components/ui/bubble";
import {
  Marker,
  MarkerContent,
} from "@/components/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { aiAssistantIdentity, aiSearchMessages, getAiSearchRecommendations } from "@/features/ai-search/mock-data";
import { OverlapCardCarousel } from "@/components/features/ai-search/overlap-card-carousel";

export function AiSearchTranscript() {
  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent className="gap-5 px-5 py-6">
            <MessageScrollerItem messageId="ai-search-marker-start">
              <Marker variant="separator">
                <MarkerContent>Today</MarkerContent>
              </Marker>
            </MessageScrollerItem>
            {aiSearchMessages.map((message) => {
              const isAssistant = message.role === "assistant";
              const recommendations = message.recommendationIds ? getAiSearchRecommendations(message.recommendationIds) : [];

              return (
                <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={!isAssistant}>
                  <Message align={isAssistant ? "start" : "end"}>
                    <MessageAvatar>
                      <Avatar size="sm" aria-label={isAssistant ? aiAssistantIdentity.name : "You"}>
                        <AvatarFallback>{isAssistant ? aiAssistantIdentity.initials : "You"}</AvatarFallback>
                      </Avatar>
                    </MessageAvatar>
                    <MessageContent>
                      <MessageHeader>{isAssistant ? aiAssistantIdentity.name : "You"}</MessageHeader>
                      <Bubble variant={isAssistant ? "tinted" : "default"} align={isAssistant ? "start" : "end"}>
                        <BubbleContent>
                          <p>{message.text}</p>
                        </BubbleContent>
                      </Bubble>
                      {recommendations.length > 0 ? <OverlapCardCarousel packages={recommendations} /> : null}
                      <MessageFooter>{isAssistant ? "Indy AI · Mock result" : "Just now"}</MessageFooter>
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
