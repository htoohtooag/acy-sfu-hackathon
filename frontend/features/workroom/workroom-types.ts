import type { OrderListItem, OrderStatus, WorkroomMessage } from "shared/schemas";

export type WorkroomConversationFilter = "all" | "active" | "in-review" | "completed";

export type WorkroomRole = "CLIENT" | "FREELANCER";

export type WorkroomStatusPresentation = {
  locked: boolean;
  bannerTone: "warning" | "success" | "destructive" | "neutral" | null;
  bannerMessage: string | null;
  roleNote: string | null;
  showSubmitFinalWork: boolean;
  showReviewPanel: boolean;
  showReviewPrompt: boolean;
};

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

export function getWorkroomStatusPresentation(status: OrderStatus, role: WorkroomRole): WorkroomStatusPresentation {
  if (status === "AWAITING_ESCROW") {
    return {
      locked: true,
      bannerTone: "warning",
      bannerMessage: "Chat is locked until escrow is verified.",
      roleNote: role === "FREELANCER" ? "Waiting for client to fund escrow." : null,
      showSubmitFinalWork: false,
      showReviewPanel: false,
      showReviewPrompt: false,
    };
  }

  if (status === "ACTIVE") {
    return {
      locked: false,
      bannerTone: null,
      bannerMessage: null,
      roleNote: null,
      showSubmitFinalWork: role === "FREELANCER",
      showReviewPanel: false,
      showReviewPrompt: false,
    };
  }

  if (status === "IN_REVIEW") {
    return {
      locked: true,
      bannerTone: "neutral",
      bannerMessage: role === "CLIENT" ? "Review the submitted work below to release payment." : "Final work is waiting for client review.",
      roleNote: null,
      showSubmitFinalWork: false,
      showReviewPanel: role === "CLIENT",
      showReviewPrompt: false,
    };
  }

  if (status === "COMPLETED") {
    return {
      locked: true,
      bannerTone: "success",
      bannerMessage: "Project completed. Funds released to freelancer.",
      roleNote: null,
      showSubmitFinalWork: false,
      showReviewPanel: false,
      showReviewPrompt: role === "CLIENT",
    };
  }

  return {
    locked: true,
    bannerTone: status === "DISPUTED" ? "destructive" : "neutral",
    bannerMessage: "This order is under dispute/canceled. Please contact support.",
    roleNote: null,
    showSubmitFinalWork: false,
    showReviewPanel: false,
    showReviewPrompt: false,
  };
}

export function getFreelancerName(order: OrderListItem, role: WorkroomRole, currentUserId: string | null, currentUserName: string | null): string {
  const backendName = order.freelancer.full_name?.trim();
  if (backendName) return backendName;
  if (role === "FREELANCER" && order.freelancer_id === currentUserId) {
    const authenticatedName = currentUserName?.trim();
    if (authenticatedName) return authenticatedName;
  }
  return "Freelancer";
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

export function sortWorkroomMessages(messages: WorkroomMessage[]): WorkroomMessage[] {
  return [...messages].sort((left, right) => {
    const timestampDifference = Date.parse(left.created_at) - Date.parse(right.created_at);
    if (timestampDifference !== 0) return timestampDifference;
    return left.id.localeCompare(right.id);
  });
}

export function getLatestWorkroomMessage(messages: WorkroomMessage[] | undefined): WorkroomMessage | undefined {
  return sortWorkroomMessages(messages ?? []).at(-1);
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
