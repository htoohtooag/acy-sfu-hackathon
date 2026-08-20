"use client";

import type { UIMessage } from "@ai-sdk/react";
import type { ChatStatus } from "ai";
import { AlertCircle, LoaderCircle } from "lucide-react";

import { OverlapCardCarousel } from "@/components/features/ai-search/overlap-card-carousel";
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
import {
  getToolPartName,
  getToolPartOutput,
  getToolPartState,
  parseAiSearchPackageResults,
} from "@/features/ai-search/ai-search-api";
import { aiAssistantIdentity } from "@/features/ai-search/mock-data";

interface AiSearchTranscriptProps {
  messages: UIMessage[];
  status: ChatStatus;
  error: Error | undefined;
}

function getMessageText(message: UIMessage): string[] {
  return message.parts.flatMap((part) => (part.type === "text" ? [part.text] : []));
}

function getSearchParts(message: UIMessage): unknown[] {
  return message.parts.filter((part) => getToolPartName(part) !== null);
}

export function AiSearchTranscript({ messages, status, error }: AiSearchTranscriptProps) {
  const lastMessage = messages.at(-1);
  const showConnectingMarker = status === "submitted" && lastMessage?.role === "user";

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
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";
              const text = getMessageText(message);
              const toolParts = getSearchParts(message);
              const pendingSearch = toolParts.some((part) => {
                const name = getToolPartName(part);
                const partState = getToolPartState(part);
                return (name === "searchPackages" || name === "searchPlatformDocs") && (partState === "input-streaming" || partState === "input-available");
              });
              const pendingToolName = toolParts
                .map((part) => getToolPartName(part))
                .find((name) => name === "searchPackages" || name === "searchPlatformDocs");
              const packageResults = toolParts
                .filter((part) => getToolPartName(part) === "searchPackages" && getToolPartState(part) === "output-available")
                .map((part) => parseAiSearchPackageResults(getToolPartOutput(part)))
                .find((result) => result !== null);
              const hasInvalidPackageOutput = toolParts.some(
                (part) => getToolPartName(part) === "searchPackages" && getToolPartState(part) === "output-available" && parseAiSearchPackageResults(getToolPartOutput(part)) === null,
              );

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
                      {text.map((value, index) => (
                        <Bubble key={`${message.id}-text-${index}`} variant={isAssistant ? "tinted" : "default"} align={isAssistant ? "start" : "end"}>
                          <BubbleContent>
                            <p className="whitespace-pre-wrap">{value}</p>
                          </BubbleContent>
                        </Bubble>
                      ))}
                      {pendingSearch ? (
                        <Marker variant="border">
                          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                          <MarkerContent>{pendingToolName === "searchPlatformDocs" ? "Checking platform guidance…" : "Searching database..."}</MarkerContent>
                        </Marker>
                      ) : null}
                      {hasInvalidPackageOutput ? (
                        <Marker variant="border" className="text-destructive">
                          <AlertCircle aria-hidden="true" className="size-4" />
                          <MarkerContent>Search results were unavailable. Please try again.</MarkerContent>
                        </Marker>
                      ) : null}
                      {packageResults ? (
                        packageResults.length > 0 ? <OverlapCardCarousel packages={packageResults} /> : <Marker variant="border"><MarkerContent>No matching packages found yet. Try adding a skill, budget, or delivery timeline.</MarkerContent></Marker>
                      ) : null}
                      <MessageFooter>{isAssistant ? "Gigmatch AI" : "Just now"}</MessageFooter>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              );
            })}
            {showConnectingMarker ? (
              <MessageScrollerItem messageId="ai-search-connecting">
                <Marker variant="border">
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  <MarkerContent>Connecting to Gigmatch AI…</MarkerContent>
                </Marker>
              </MessageScrollerItem>
            ) : null}
            {error ? (
              <MessageScrollerItem messageId="ai-search-error">
                <Marker variant="border" className="text-destructive">
                  <AlertCircle aria-hidden="true" className="size-4" />
                  <MarkerContent>{error.message || "The AI search could not be completed. Please try again."}</MarkerContent>
                </Marker>
              </MessageScrollerItem>
            ) : null}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
