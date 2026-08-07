"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/app/app-api";
import {
  conversationMatchesFilter,
  getMessagePreview,
  isWorkroomConversationFilter,
  type WorkroomConversationFilter,
} from "@/features/workroom/workroom-types";
import {
  useWorkroomMessages,
  useWorkroomOrders,
  workroomMessagesQueryKey,
} from "@/features/workroom/workroom-api";
import { useWorkroomSocket } from "@/features/workroom/use-workroom-socket";
import { useAppStore } from "@/store/use-app-store";
import type { WorkroomMessageHistory } from "shared/schemas";
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

  const selectedOrderIdForView = ordersQuery.isSuccess && selectedOrderId && orders.some((order) => order.id === selectedOrderId)
    ? selectedOrderId
    : null;
  const selectedOrder = orders.find((order) => order.id === selectedOrderIdForView) ?? null;
  const messagesQuery = useWorkroomMessages(selectedOrderIdForView);

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
  }, [activeRole, queryClient]);

  const socket = useWorkroomSocket({
    selectedOrderId: selectedOrderIdForView,
    onMessage: handleMessage,
    onWorkroomEvent: handleWorkroomEvent,
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
      return `${order.other_party.full_name ?? ""} ${order.source?.title ?? ""} ${getMessagePreview(latestMessage, order)}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [filter, messagesQuery.data, orders, queryClient, search, selectedOrderIdForView]);

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
        onSendMessage={socket.sendMessage}
      />
    </section>
  );
}
