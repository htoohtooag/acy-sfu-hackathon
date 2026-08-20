import type { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { orderListReadSelect, type OrderListReadRecord } from './order.types.js';

type DashboardRole = 'client' | 'freelancer';
type DashboardStatus = 'AWAITING_ESCROW' | 'ACTIVE' | 'IN_REVIEW';

function ownerWhere(userId: string, role: DashboardRole): Prisma.OrderWhereInput {
  return { deleted_at: null, ...(role === 'client' ? { client_id: userId } : { freelancer_id: userId }) };
}

export async function countOrdersForDashboard(userId: string, role: DashboardRole, status: DashboardStatus): Promise<number> {
  return prisma.order.count({ where: { ...ownerWhere(userId, role), status } });
}

export async function listDashboardOrders(userId: string, role: DashboardRole, status: DashboardStatus): Promise<OrderListReadRecord[]> {
  return prisma.order.findMany({
    where: { ...ownerWhere(userId, role), status },
    orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
    take: 5,
    select: orderListReadSelect,
  });
}
