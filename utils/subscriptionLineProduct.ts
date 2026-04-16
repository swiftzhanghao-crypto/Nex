import type { PurchaseNature, Subscription, SubscriptionLineProductSnapshot, SubscriptionStatus } from '../types';

function statusFromEndDate(endDateStr: string): SubscriptionStatus {
  const end = new Date(endDateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Expired';
  if (days === 0) return 'GracePeriod';
  if (days <= 30) return 'ExpiringSoon';
  return 'Active';
}

/** 链上出现过的不同产品（用于续费/增购入口） */
export function subscriptionDistinctProducts(sub: Subscription): { productId: string; productName: string }[] {
  const map = new Map<string, string>();
  for (const r of sub.relatedOrders) {
    if (r.productId && !map.has(r.productId)) map.set(r.productId, r.productName || r.productId);
  }
  return [...map.entries()].map(([productId, productName]) => ({ productId, productName }));
}

/**
 * 从该产品在订阅订单序列中的节点，重放数量规则，得到当前授权窗口。
 */
export function subscriptionProductSnapshot(sub: Subscription, productId: string): SubscriptionLineProductSnapshot | null {
  const refs = sub.relatedOrders.filter(r => r.productId === productId);
  if (refs.length === 0) return null;
  const sorted = [...refs].sort((a, b) =>
    a.orderDate !== b.orderDate ? a.orderDate.localeCompare(b.orderDate) : a.orderId.localeCompare(b.orderId),
  );
  let currentQuantity = 0;
  for (const r of sorted) {
    const nature = r.purchaseNature as PurchaseNature;
    switch (nature) {
      case 'New':
        currentQuantity = r.quantity;
        break;
      case 'AddOn':
        currentQuantity += r.quantity;
        break;
      case 'Upgrade':
        currentQuantity = Math.max(currentQuantity, r.quantity);
        break;
      case 'Renewal':
        currentQuantity = r.quantity;
        break;
      default:
        break;
    }
  }
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const startDate = first.licenseStartDate || first.orderDate;
  const endDate = last.licenseEndDate || last.orderDate;
  return {
    productCode: productId,
    productName: first.productName || productId,
    skuName: last.skuName || '',
    licenseType: last.licenseType || '',
    currentQuantity: currentQuantity || last.quantity,
    startDate,
    endDate,
    status: statusFromEndDate(endDate),
    lastOrderId: last.orderId,
  };
}

/** 用于批量续费：在订阅批内选「当前到期最早」的产品快照 */
export function subscriptionMostUrgentProductSnapshot(sub: Subscription): SubscriptionLineProductSnapshot | null {
  const ids = subscriptionDistinctProducts(sub).map(p => p.productId);
  if (ids.length === 0) return null;
  let best: SubscriptionLineProductSnapshot | null = null;
  for (const id of ids) {
    const snap = subscriptionProductSnapshot(sub, id);
    if (!snap) continue;
    if (!best || snap.endDate < best.endDate) best = snap;
  }
  return best;
}
