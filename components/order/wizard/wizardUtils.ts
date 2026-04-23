import type { PurchaseNature } from '../../../types';

/** 生成 UUID（兼容旧浏览器）。 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** 根据起止日期与 pricing option 推算授权周期标签。 */
export function subscriptionLicensePeriodLabel(
  start: string,
  end: string,
  opt?: { license: { period: number; periodUnit: string } },
): string {
  if (opt?.license?.periodUnit === 'Forever') return '永久';
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const months = Math.max(1, Math.round((e.getTime() - s.getTime()) / (30.44 * 86400000)));
  const years = Math.max(1, Math.round(months / 12));
  return `${years}年`;
}

/** 订购性质徽标的 Tailwind 颜色类。 */
export function purchaseNatureBadgeClass(nature: PurchaseNature): string {
  switch (nature) {
    case 'New':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
    case 'Renewal':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case 'AddOn':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200';
    case 'Upgrade':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-200';
  }
}
