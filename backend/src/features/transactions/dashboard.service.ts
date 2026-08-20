import type { DashboardAction, DashboardAttentionItem, DashboardMetric, DashboardRole, DashboardSummary } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { countOrdersForDashboard, listDashboardOrders } from './dashboard.repository.js';
import type { OrderListReadRecord } from './order.types.js';

type DashboardStatus = 'AWAITING_ESCROW' | 'ACTIVE' | 'IN_REVIEW';

function dashboardStatus(status: OrderListReadRecord['status']): DashboardStatus {
  if (status === 'AWAITING_ESCROW' || status === 'ACTIVE' || status === 'IN_REVIEW') return status;
  throw new Error('Unexpected dashboard order status.');
}

function actionFor(role: DashboardRole, status: DashboardStatus): DashboardAction {
  if (status === 'AWAITING_ESCROW') return 'VIEW_ESCROW_STATUS';
  if (status === 'IN_REVIEW') return role === 'client' ? 'REVIEW_DELIVERABLE' : 'VIEW_REVIEW_STATUS';
  return 'OPEN_WORKROOM';
}

function metricLabel(role: DashboardRole, status: DashboardStatus): string {
  if (status === 'AWAITING_ESCROW') return role === 'client' ? 'Awaiting payment' : 'Waiting for escrow';
  if (status === 'IN_REVIEW') return role === 'client' ? 'Ready for review' : 'Submitted for review';
  return 'Active work';
}

function urgency(status: DashboardStatus): number {
  if (status === 'IN_REVIEW') return 0;
  if (status === 'AWAITING_ESCROW') return 1;
  return 2;
}

function sourceTitle(record: OrderListReadRecord): string {
  if (record.source_type === 'PACKAGE' && record.package?.deleted_at === null) return record.package.title;
  if (record.source_type === 'CUSTOM_OFFER' && record.job_post?.deleted_at === null) return record.job_post.title;
  return 'Workroom conversation';
}

function toAttentionItem(record: OrderListReadRecord, role: DashboardRole): DashboardAttentionItem {
  return {
    order_id: record.id,
    title: sourceTitle(record),
    source_type: record.source_type,
    participant: role === 'client' ? record.freelancer : record.client,
    status: dashboardStatus(record.status),
    amount_mmk: record.agreed_price_mmk.toString(),
    updated_at: record.updated_at.toISOString(),
    action: actionFor(role, dashboardStatus(record.status)),
  };
}

export async function getDashboardSummary(userId: string, role: DashboardRole, roles: readonly string[]): Promise<DashboardSummary> {
  const requiredRole = role === 'client' ? 'CLIENT' : 'FREELANCER';
  if (!roles.includes(requiredRole)) throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this dashboard view.');

  const [awaitingCount, activeCount, reviewCount, awaitingOrders, reviewOrders, activeOrders] = await Promise.all([
    countOrdersForDashboard(userId, role, 'AWAITING_ESCROW'),
    countOrdersForDashboard(userId, role, 'ACTIVE'),
    countOrdersForDashboard(userId, role, 'IN_REVIEW'),
    listDashboardOrders(userId, role, 'AWAITING_ESCROW'),
    listDashboardOrders(userId, role, 'IN_REVIEW'),
    listDashboardOrders(userId, role, 'ACTIVE'),
  ]);

  const attentionRecords = [...reviewOrders, ...awaitingOrders, ...activeOrders]
    .sort((left, right) => {
      const urgencyDifference = urgency(dashboardStatus(left.status)) - urgency(dashboardStatus(right.status));
      if (urgencyDifference !== 0) return urgencyDifference;
      const updatedDifference = right.updated_at.getTime() - left.updated_at.getTime();
      return updatedDifference === 0 ? left.id.localeCompare(right.id) : updatedDifference;
    })
    .slice(0, 5);

  const metrics: DashboardMetric[] = [
    { key: 'AWAITING_ESCROW', label: metricLabel(role, 'AWAITING_ESCROW'), count: awaitingCount },
    { key: 'ACTIVE_WORK', label: metricLabel(role, 'ACTIVE'), count: activeCount },
    { key: 'IN_REVIEW', label: metricLabel(role, 'IN_REVIEW'), count: reviewCount },
  ];

  return { role, metrics, attention_items: attentionRecords.map((record) => toAttentionItem(record, role)) };
}
