import type { Subscription, SubscriptionStatus } from '../types';

/** 该产品线下各订单授权结束日的最小值（用于倒计时与状态筛选） */
export function subscriptionRollupEndDate(s: Subscription): string {
  if (!s.relatedOrders?.length) return '2099-12-31';
  return s.relatedOrders.reduce((min, r) => {
    const end = r.licenseEndDate || r.orderDate;
    return end < min ? end : min;
  }, s.relatedOrders[0].licenseEndDate || s.relatedOrders[0].orderDate);
}

/** 该产品线下各订单授权开始日的最小值 */
export function subscriptionRollupStartDate(s: Subscription): string {
  if (!s.relatedOrders?.length) return '';
  return s.relatedOrders.reduce((min, r) => {
    const st = r.licenseStartDate || r.orderDate;
    return st < min ? st : min;
  }, s.relatedOrders[0].licenseStartDate || s.relatedOrders[0].orderDate);
}

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

/** 按「最近到期」推导整批订阅状态 */
export function subscriptionRollupStatus(s: Subscription): SubscriptionStatus {
  return statusFromEndDate(subscriptionRollupEndDate(s));
}

export function subscriptionTotalOrderCount(s: Subscription): number {
  return s.relatedOrders?.length ?? 0;
}
