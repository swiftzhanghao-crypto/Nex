import type { OrderItem, PurchaseNature, Subscription, SubscriptionLineProductSnapshot, SubscriptionStatus } from '../../types';
import { subscriptionProductSnapshot } from '../../utils/subscriptionLineProduct';

function parseYmd(ymd: string): Date {
  return new Date(ymd + 'T00:00:00');
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 解析「1年」「6月」等行上授权期限，用于推算结束日 */
export function addLicensePeriodFrom(from: Date, licensePeriod: string | undefined): Date | null {
  if (!licensePeriod || licensePeriod === '永久') return null;
  const m = licensePeriod.trim().match(/^(\d+)(年|月|日)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const u = m[2];
  const out = new Date(from.getTime());
  if (u === '年') out.setFullYear(out.getFullYear() + n);
  else if (u === '月') out.setMonth(out.getMonth() + n);
  else out.setDate(out.getDate() + n);
  return out;
}

export function subscriptionStatusLabel(st: SubscriptionStatus): string {
  switch (st) {
    case 'Active': return '活跃';
    case 'ExpiringSoon': return '即将到期';
    case 'GracePeriod': return '宽限期';
    case 'Expired': return '已过期';
    default: return st;
  }
}

export type SubscriptionNatureInference = {
  purchaseNature: PurchaseNature | null;
  matchedSubscription: Subscription | null;
  /** 与订单行产品对应的链上产品快照；无匹配时为 null */
  matchedProduct: SubscriptionLineProductSnapshot | null;
  headline: string;
  bullets: string[];
};

type MatchPair = { sub: Subscription; prod: SubscriptionLineProductSnapshot };

function pickLatestMatch(matches: MatchPair[]): MatchPair {
  return [...matches].sort((a, b) => (a.prod.endDate < b.prod.endDate ? 1 : a.prod.endDate > b.prod.endDate ? -1 : 0))[0];
}

/**
 * 根据「续费管理」订阅 + 当前订单行上的客户/产品/授权时间，推断新购 / 续费 / 增购。
 */
export function inferOrderLinePurchaseNatureFromSubscription(
  item: OrderItem,
  endCustomerId: string | undefined,
  subscriptions: Subscription[],
): SubscriptionNatureInference {
  if (!endCustomerId || !item.productId) {
    return {
      purchaseNature: null,
      matchedSubscription: null,
      matchedProduct: null,
      headline: '',
      bullets: [],
    };
  }

  const matches: MatchPair[] = [];
  for (const sub of subscriptions) {
    if (sub.customerId !== endCustomerId) continue;
    let prod = subscriptionProductSnapshot(sub, item.productId);
    if (!prod && item.productName) {
      const pid = sub.relatedOrders.find(r => r.productName === item.productName)?.productId;
      if (pid) prod = subscriptionProductSnapshot(sub, pid);
    }
    if (prod) matches.push({ sub, prod });
  }

  if (matches.length === 0) {
    return {
      purchaseNature: 'New',
      matchedSubscription: null,
      matchedProduct: null,
      headline: '未找到该客户在本产品上的历史订阅，已按「新购」识别。',
      bullets: [
        '说明：「续费管理」中无相同客户 + 产品的订阅记录。',
        '若实际为续费或增购，请在下方明细中将「订购性质」改为续费或增购。',
      ],
    };
  }

  const { sub, prod } = pickLatestMatch(matches);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const subStart = parseYmd(prod.startDate);
  const subEnd = parseYmd(prod.endDate);

  const lineStart = item.licenseStartDate ? parseYmd(item.licenseStartDate) : null;
  const lineEnd = item.licenseEndDate ? parseYmd(item.licenseEndDate) : null;

  const baseBullets = [
    `参考订阅批：${sub.id}（产品线 ${sub.productLine}）`,
    `匹配产品：${prod.productName}（${prod.productCode}）`,
    `该产品在链上当前周期：${prod.startDate} ~ ${prod.endDate}，状态：${subscriptionStatusLabel(prod.status)}`,
    `当前生效数量：${prod.currentQuantity}`,
  ];

  if (lineStart && lineEnd) {
    if (lineEnd.getTime() <= subEnd.getTime() && lineStart.getTime() >= subStart.getTime()) {
      return {
        purchaseNature: 'AddOn',
        matchedSubscription: sub,
        matchedProduct: prod,
        headline: '您填写的授权起止日落在该订阅有效期内，已按「增购」识别。',
        bullets: [
          ...baseBullets,
          `本行授权：${item.licenseStartDate} ~ ${item.licenseEndDate}，未超出上述产品当前周期，视为在约增购。`,
        ],
      };
    }
    if (lineEnd.getTime() > subEnd.getTime() || lineStart.getTime() > subEnd.getTime()) {
      return {
        purchaseNature: 'Renewal',
        matchedSubscription: sub,
        matchedProduct: prod,
        headline: '授权结束日晚于当前订阅到期日，或起始日在订阅到期日之后，已按「续费」识别。',
        bullets: [
          ...baseBullets,
          `本行授权：${item.licenseStartDate} ~ ${item.licenseEndDate}，与产品到期 ${prod.endDate} 对比后判断为续费/展期场景。`,
        ],
      };
    }
    return {
      purchaseNature: 'Renewal',
      matchedSubscription: sub,
      matchedProduct: prod,
      headline: '授权时间与已有订阅存在交叉或起始较早，已按「续费」识别；若不符请手工调整。',
      bullets: [...baseBullets, `本行授权：${item.licenseStartDate} ~ ${item.licenseEndDate}`],
    };
  }

  if (item.licensePeriod && item.licensePeriod !== '永久') {
    const projectedEnd = addLicensePeriodFrom(today, item.licensePeriod);
    if (!projectedEnd) {
      return {
        purchaseNature: null,
        matchedSubscription: sub,
        matchedProduct: prod,
        headline: '',
        bullets: [
          ...baseBullets,
          `无法解析授权期限「${item.licensePeriod}」，请使用如「1年」「6月」格式，或填写起止日期。`,
        ],
      };
    }

    if (today.getTime() <= subEnd.getTime()) {
      if (projectedEnd.getTime() <= subEnd.getTime()) {
        return {
          purchaseNature: 'AddOn',
          matchedSubscription: sub,
          matchedProduct: prod,
          headline: '订阅仍在有效期内，按您选择的授权期限推算结束日仍在当前周期内，已按「增购」识别。',
          bullets: [
            ...baseBullets,
            `推算方式：以今日为起点 +「${item.licensePeriod}」≈ 授权至 ${formatYmd(projectedEnd)}，不晚于产品到期 ${prod.endDate}。`,
          ],
        };
      }
      return {
        purchaseNature: 'Renewal',
        matchedSubscription: sub,
        matchedProduct: prod,
        headline: '按所选授权期限推算，新的结束日晚于当前订阅到期日，已按「续费」识别。',
        bullets: [
          ...baseBullets,
          `推算方式：以今日为起点 +「${item.licensePeriod}」≈ 授权至 ${formatYmd(projectedEnd)}，晚于产品到期 ${prod.endDate}。`,
        ],
      };
    }

    return {
      purchaseNature: 'Renewal',
      matchedSubscription: sub,
      matchedProduct: prod,
      headline: '该客户在本产品上的订阅已到期，新的订购已按「续费」识别。',
      bullets: [...baseBullets, `产品已于 ${prod.endDate} 到期，适合走续费/重新开通后续周期。`],
    };
  }

  if (item.licensePeriod === '永久') {
    if (today.getTime() <= subEnd.getTime()) {
      return {
        purchaseNature: 'AddOn',
        matchedSubscription: sub,
        matchedProduct: prod,
        headline: '选择「永久」且当前仍有未到期订阅，已按「增购」识别（例如加购永久席位）。',
        bullets: [...baseBullets],
      };
    }
    return {
      purchaseNature: 'Renewal',
      matchedSubscription: sub,
      matchedProduct: prod,
      headline: '选择「永久」且原订阅已到期，已按「续费」识别。',
      bullets: [...baseBullets],
    };
  }

  return {
    purchaseNature: null,
    matchedSubscription: sub,
    matchedProduct: prod,
    headline: '',
    bullets: [
      ...baseBullets,
      '请在本行填写「授权/服务期限」（添加产品时选择年/月/日，或填写起止日期），以便自动区分新购、续费或增购。',
    ],
  };
}

export function purchaseNatureDisplay(n: PurchaseNature): string {
  switch (n) {
    case 'New': return '新购';
    case 'Renewal': return '续费';
    case 'AddOn': return '增购';
    case 'Upgrade': return '升级';
    default: return n;
  }
}
