"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DeliverableSubmittedEvent, DeliverableUnlockedEvent, WorkroomMessageHistory } from "shared/schemas";

import { useCurrentUser } from "@/features/app/app-api";
import {
  conversationMatchesFilter,
  getFreelancerName,
  getMessagePreview,
  isWorkroomConversationFilter,
  type WorkroomConversationFilter,
} from "@/features/workroom/workroom-types";
import {
  useWorkroomMessages,
  useWorkroomOrders,
  useWorkroomOrderDetail,
  workroomMessagesQueryKey,
} from "@/features/workroom/workroom-api";
import { useWorkroomSocket } from "@/features/workroom/use-workroom-socket";
import { useAppStore } from "@/store/use-app-store";
import { WorkroomChatView } from "./workroom-chat-view";
import { WorkroomInboxList } from "./workroom-inbox-list";

interface WorkroomInboxProps {
  initialOrderId?: string;
}

export function WorkroomInbox({ initialOrderId }: WorkroomInboxProps): React.ReactNode {
  const activeRole = useAppStore((state) => state.activeRole);
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const ordersQuery = useWorkroomOrders();
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<WorkroomConversationFilter>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId ?? null);
  const [deliverableAssets, setDeliverableAssets] = useState<Record<string, { deliverableId: string; watermarkedUrl: string | null; cleanUrl: string | null }>>({});
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, boolean>>({});

  const selectedOrderIdForView = ordersQuery.isSuccess && selectedOrderId && orders.some((order) => order.id === selectedOrderId)
    ? selectedOrderId
    : null;
  const selectedOrder = orders.find((order) => order.id === selectedOrderIdForView) ?? null;
  const messagesQuery = useWorkroomMessages(selectedOrderIdForView);
  const orderDetailQuery = useWorkroomOrderDetail(selectedOrderIdForView);

  const handleMessage = useCallback((message: import("shared/schemas").WorkroomMessage): void => {
    queryClient.setQueryData<WorkroomMessageHistory>(workroomMessagesQueryKey(message.order_id), (history) => {
      if (!history || history.items.some((item) => item.id === message.id)) return history;
      return {
        ...history,
        items: [...history.items, message],
        total_items: history.total_items + 1,
        total_pages: Math.max(1, Math.ceil((history.total_items + 1) / history.page_size)),
      };
    });
  }, [queryClient]);

  const handleWorkroomEvent = useCallback((orderId: string): void => {
    void queryClient.invalidateQueries({ queryKey: ["workroom-orders", activeRole] });
    void queryClient.invalidateQueries({ queryKey: workroomMessagesQueryKey(orderId) });
    void queryClient.invalidateQueries({ queryKey: ["workroom-order-detail", orderId] });
  }, [activeRole, queryClient]);

  const handleDeliverableSubmitted = useCallback((event: DeliverableSubmittedEvent): void => {
    setDeliverableAssets((current) => ({
      ...current,
      [event.order_id]: { deliverableId: event.deliverable_id, watermarkedUrl: event.watermarked_url, cleanUrl: current[event.order_id]?.cleanUrl ?? null },
    }));
  }, []);

  const handleDeliverableUnlocked = useCallback((event: DeliverableUnlockedEvent): void => {
    setDeliverableAssets((current) => ({
      ...current,
      [event.order_id]: { deliverableId: event.deliverable_id, watermarkedUrl: current[event.order_id]?.watermarkedUrl ?? null, cleanUrl: event.clean_url },
    }));
  }, []);

  const socket = useWorkroomSocket({
    selectedOrderId: selectedOrderIdForView,
    onMessage: handleMessage,
    onWorkroomEvent: handleWorkroomEvent,
    onDeliverableSubmitted: handleDeliverableSubmitted,
    onDeliverableUnlocked: handleDeliverableUnlocked,
  });

  const visibleOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (!conversationMatchesFilter(order, filter)) return false;
      if (!normalizedSearch) return true;
      const history = order.id === selectedOrderIdForView
        ? messagesQuery.data
        : queryClient.getQueryData<WorkroomMessageHistory>(workroomMessagesQueryKey(order.id));
      const latestMessage = history?.items.at(-1);
      return `${getFreelancerName(order, activeRole, currentUser?.id ?? null, currentUser?.fullName ?? null)} ${order.source?.title ?? ""} ${getMessagePreview(latestMessage, order)}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [activeRole, currentUser?.fullName, currentUser?.id, filter, messagesQuery.data, orders, queryClient, search, selectedOrderIdForView]);

  function handleFilterChange(value: unknown): void {
    if (isWorkroomConversationFilter(value)) setFilter(value);
  }

  return (
    <section className="grid h-full min-h-0 min-w-0 grid-cols-1 overflow-hidden bg-background lg:grid-cols-[minmax(19rem,22rem)_minmax(0,1fr)]" aria-label="Workroom messages">
      <WorkroomInboxList
        search={search}
        filter={filter}
        orders={visibleOrders}
        selectedOrderId={selectedOrderIdForView}
        isPending={ordersQuery.isPending}
        error={ordersQuery.error instanceof Error ? ordersQuery.error : null}
        getPreview={(order) => {
          const history = order.id === selectedOrderIdForView
            ? messagesQuery.data
            : queryClient.getQueryData<WorkroomMessageHistory>(workroomMessagesQueryKey(order.id));
          return getMessagePreview(history?.items.at(-1), order);
        }}
        onSearchChange={setSearch}
        onFilterChange={handleFilterChange}
        onSelectOrder={setSelectedOrderId}
        role={activeRole}
        currentUserId={currentUser?.id ?? null}
        currentUserName={currentUser?.fullName ?? null}
      />
      <WorkroomChatView
        order={selectedOrder}
        messages={messagesQuery.data?.items ?? []}
        messagesPending={messagesQuery.isPending}
        messagesError={messagesQuery.error instanceof Error ? messagesQuery.error : null}
        currentUserId={currentUser?.id ?? null}
        connectionState={socket.connectionState}
        joinedOrderId={socket.joinedOrderId}
        socketError={socket.socketError}
        typingUserId={socket.typingUserId}
        role={activeRole}
        currentUserName={currentUser?.fullName ?? null}
        detail={orderDetailQuery.data ?? null}
        watermarkedUrl={selectedOrderIdForView ? deliverableAssets[selectedOrderIdForView]?.watermarkedUrl ?? null : null}
        cleanUrl={selectedOrderIdForView ? deliverableAssets[selectedOrderIdForView]?.cleanUrl ?? null : null}
        reviewSubmitted={selectedOrderIdForView ? reviewedOrders[selectedOrderIdForView] === true : false}
        onWatermarkedUrl={(deliverableId, url) => {
          if (!selectedOrderIdForView) return;
          setDeliverableAssets((current) => ({ ...current, [selectedOrderIdForView]: { deliverableId, watermarkedUrl: url, cleanUrl: current[selectedOrderIdForView]?.cleanUrl ?? null } }));
        }}
        onCleanUrl={(deliverableId, url) => {
          if (!selectedOrderIdForView) return;
          setDeliverableAssets((current) => ({ ...current, [selectedOrderIdForView]: { deliverableId, watermarkedUrl: current[selectedOrderIdForView]?.watermarkedUrl ?? null, cleanUrl: url } }));
        }}
        onReviewSubmitted={() => {
          if (!selectedOrderIdForView) return;
          setReviewedOrders((current) => ({ ...current, [selectedOrderIdForView]: true }));
        }}
        onSendMessage={socket.sendMessage}
        onTypingStatus={socket.sendTypingStatus}
      />
    </section>
  );
}
