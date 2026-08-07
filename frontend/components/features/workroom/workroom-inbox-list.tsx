"use client";

import { Search } from "lucide-react";
import type { OrderListItem } from "shared/schemas";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatTimestamp,
  getConversationStatusLabel,
  getInitials,
  getParticipantName,
  workroomConversationFilters,
  type WorkroomConversationFilter,
} from "@/features/workroom/workroom-types";
import { cn } from "@/lib/utils";

interface WorkroomInboxListProps {
  search: string;
  filter: WorkroomConversationFilter;
  orders: OrderListItem[];
  selectedOrderId: string | null;
  isPending: boolean;
  error: Error | null;
  getPreview: (order: OrderListItem) => string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: unknown) => void;
  onSelectOrder: (id: string) => void;
}

export function WorkroomInboxList({
  search,
  filter,
  orders,
  selectedOrderId,
  isPending,
  error,
  getPreview,
  onSearchChange,
  onFilterChange,
  onSelectOrder,
}: WorkroomInboxListProps): React.ReactNode {
  return (
    <aside className="flex min-h-0 flex-col border-b border-border bg-card lg:border-b-0 lg:border-e" aria-label="Conversation inbox">
      <header className="shrink-0 border-b border-border px-5 pb-4 pt-6 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Communication</p>
            <h1 className="mt-2 truncate font-heading text-2xl font-semibold tracking-tight">Messages</h1>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{isPending ? "Loading" : `${orders.length} shown`}</span>
        </div>
        <p className="mt-2 max-w-[32ch] text-sm leading-6 text-muted-foreground">Keep every project conversation close to the work.</p>
        <label className="sr-only" htmlFor="workroom-search">Search conversations</label>
        <InputGroup className="mt-5 h-11 rounded-xl bg-background">
          <InputGroupAddon align="inline-start"><Search aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput id="workroom-search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search conversations" />
        </InputGroup>
      </header>

      <Tabs value={filter} onValueChange={onFilterChange} className="shrink-0 border-b border-border px-3 sm:px-4">
        <TabsList className="w-full overflow-x-auto">
          {workroomConversationFilters.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="min-w-20 whitespace-nowrap sm:min-w-24">{item.label}</TabsTrigger>
          ))}
          <TabsIndicator className="hidden sm:block" />
        </TabsList>
      </Tabs>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4" aria-live="polite">
        {isPending ? (
          <div className="flex min-h-40 items-center justify-center px-5 text-center" role="status">Loading your workrooms…</div>
        ) : error ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 px-5 text-center" role="alert">
            <p className="text-sm font-medium">Workrooms could not be loaded.</p>
            <p className="text-sm leading-6 text-muted-foreground">{error.message}</p>
          </div>
        ) : orders.length > 0 ? (
          <ul className="flex flex-col gap-1" aria-label="Workroom conversations">
            {orders.map((order) => {
              const selected = order.id === selectedOrderId;
              const participantName = getParticipantName(order);
              return (
                <li key={order.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelectOrder(order.id)}
                    className={cn(
                      "flex min-h-20 w-full items-start gap-3 rounded-xl px-3 py-3 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      selected && "bg-secondary shadow-sm",
                    )}
                  >
                    <Avatar size="lg" className="mt-0.5">
                      <AvatarImage src={order.other_party.avatar_url ?? undefined} alt={`${participantName} avatar`} />
                      <AvatarFallback>{getInitials(participantName)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-foreground">{participantName}</span>
                        <time className="shrink-0 text-xs text-muted-foreground" dateTime={order.updated_at}>{formatTimestamp(order.updated_at)}</time>
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">{getPreview(order)}</span>
                      <Badge className="mt-2 px-2 py-0.5 text-xs">{getConversationStatusLabel(order.status)}</Badge>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-5 text-center">
            <p className="text-sm font-medium">{search.trim() ? "No conversations found" : "No workrooms yet"}</p>
            <p className="text-sm leading-6 text-muted-foreground">{search.trim() ? "Try a different name, project, or status." : "Your project conversations will appear here."}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
