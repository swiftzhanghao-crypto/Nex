import type Database from 'better-sqlite3';

const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_APPROVAL: '待审批',
  PENDING_CONFIRM: '待确认',
  PROCESSING_PROD: '生产中',
  PENDING_PAYMENT: '待付款',
  SHIPPED: '已发货',
  DELIVERED: '已交付',
  REFUND_PENDING: '退款中',
  REFUNDED: '已退款',
  CANCELLED: '已取消',
};

export function createNotification(
  db: Database.Database,
  userId: string | null | undefined,
  title: string,
  body?: string | null,
  link?: string | null,
): void {
  if (!userId) return;
  const id = `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(
    `INSERT INTO notifications (id, user_id, title, body, link) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, userId, title, body ?? null, link ?? null);
}

export function notifyOrderStatusChange(
  db: Database.Database,
  params: {
    orderId: string;
    customerName?: string | null;
    salesRepId: string | null | undefined;
    oldStatus: string;
    newStatus: string;
  },
): void {
  const { orderId, customerName, salesRepId, oldStatus, newStatus } = params;
  if (!salesRepId || oldStatus === newStatus) return;

  const fromLabel = ORDER_STATUS_LABELS[oldStatus] || oldStatus;
  const toLabel = ORDER_STATUS_LABELS[newStatus] || newStatus;
  const customerPart = customerName ? `（${customerName}）` : '';

  createNotification(
    db,
    salesRepId,
    `订单状态已更新`,
    `订单 ${orderId}${customerPart}：${fromLabel} → ${toLabel}`,
    `#/orders/${orderId}`,
  );
}
