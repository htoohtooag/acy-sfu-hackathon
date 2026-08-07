import type { OrderListItem, OrderStatus, WorkroomMessage } from "shared/schemas";

export type WorkroomConversationFilter = "all" | "active" | "in-review" | "completed";

export type WorkroomRole = "CLIENT" | "FREELANCER";

export const workroomConversationFilters: Array<{ value: WorkroomConversationFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "in-review", label: "In Review" },
  { value: "completed", label: "Completed" },
];

export function isWorkroomConversationFilter(value: unknown): value is WorkroomConversationFilter {
  return value === "all" || value === "active" || value === "in-review" || value === "completed";
}

export function getConversationStatusLabel(status: OrderStatus): string {
  if (status === "AWAITING_ESCROW") return "Awaiting escrow";
  if (status === "IN_REVIEW") return "In review";
  if (status === "COMPLETED") return "Completed";
  if (status === "DISPUTED") return "Disputed";
  if (status === "CANCELED") return "Canceled";
  return "Active";
}

export function conversationMatchesFilter(order: OrderListItem, filter: WorkroomConversationFilter): boolean {
  if (filter === "all") return true;
  if (filter === "active") return order.status === "ACTIVE" || order.status === "AWAITING_ESCROW";
  if (filter === "in-review") return order.status === "IN_REVIEW";
  return order.status === "COMPLETED";
}

export function isConversationLocked(status: OrderStatus): boolean {
  return status !== "ACTIVE";
}

export function getParticipantName(order: OrderListItem): string {
  return order.other_party.full_name?.trim() || "Your collaborator";
}

export function getProjectTitle(order: OrderListItem): string {
  return order.source?.title || "Workroom conversation";
}

export function getMessagePreview(message: WorkroomMessage | undefined, order: OrderListItem): string {
  const content = message?.content?.trim();
  if (content) return content;
  if (message?.type === "SYSTEM") return "A workroom update is available.";
  return getProjectTitle(order);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
