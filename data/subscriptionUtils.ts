import type {
  Order, Customer, Product,
  Subscription, SubscriptionOrderRef, PurchaseNature,
} from '../types';

const PRODUCT_LINE_BY_PRODUCT_ID: Record<string, 'WPS365公有云' | 'WPS365私有云' | '端'> = {
  AB0002807: 'WPS365私有云', AB0001880: 'WPS365私有云', AB0002790: 'WPS365私有云', AB0002630: 'WPS365私有云',
  AB0001841: 'WPS365私有云', AB0002622: 'WPS365私有云',
  AB0000841: 'WPS365公有云', AB0002815: 'WPS365公有云', AB0002901: 'WPS365公有云', AB0000636: 'WPS365公有云', AB0002009: 'WPS365公有云',
  AB0000765: '端', AB0000772: '端', AB0001879: '端', AB0001927: '端', AB0001721: '端', AB0002003: '端',
};

function productLineForSubscription(productId: string): 'WPS365公有云' | 'WPS365私有云' | '端' {
  return PRODUCT_LINE_BY_PRODUCT_ID[productId] || 'WPS365公有云';
}

function fmtYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function licensePeriodAddToDate(from: Date, licensePeriod: string | undefined): Date {
  const out = new Date(from.getTime());
  if (!licensePeriod || licensePeriod === '永久') {
    out.setFullYear(out.getFullYear() + 3);
    return out;
  }
  const m = licensePeriod.trim().match(/^(\d+)(年|月|日)$/);
  if (!m) {
    out.setFullYear(out.getFullYear() + 1);
    return out;
  }
  const n = parseInt(m[1], 10);
  const u = m[2];
  if (u === '年') out.setFullYear(out.getFullYear() + n);
  else if (u === '月') out.setMonth(out.getMonth() + n);
  else out.setDate(out.getDate() + n);
  return out;
}

function orderDateYmd(iso: string): string {
  return iso.slice(0, 10);
}

export const SUBSCRIPTION_CHAIN_ORDER_REMARK = '【订阅链】与续费管理订阅同源，勿删';

export function buildSubscriptionsFromOrders(orders: Order[], customers: Customer[], products: Product[]): Subscription[] {
  const chainOrders = orders.filter(
    o => o.orderRemark === SUBSCRIPTION_CHAIN_ORDER_REMARK && o.buyerType === 'Customer' && Boolean(o.customerId),
  );

  type FlatEv = {
    customerId: string;
    customerName: string;
    orderId: string;
    orderDate: string;
    productId: string;
    productName: string;
    skuName: string;
    licenseType: string;
    purchaseNature: PurchaseNature;
    quantity: number;
    amount: number;
    licensePeriod?: string;
  };

  const flat: FlatEv[] = [];
  for (const o of chainOrders) {
    if (o.buyerType !== 'Customer' || !o.customerId) continue;
    const ymd = orderDateYmd(o.date);
    for (const it of o.items) {
      flat.push({
        customerId: o.customerId,
        customerName: o.customerName || '',
        orderId: o.id,
        orderDate: ymd,
        productId: it.productId,
        productName: it.productName,
        skuName: it.skuName,
        licenseType: it.licenseType || '',
        purchaseNature: (it.purchaseNature || 'New') as PurchaseNature,
        quantity: it.quantity,
        amount: Math.round(it.priceAtPurchase * it.quantity * 100) / 100,
        licensePeriod: it.licensePeriod,
      });
    }
  }

  const byPortfolio = new Map<string, FlatEv[]>();
  for (const ev of flat) {
    const line = productLineForSubscription(ev.productId);
    const k = `${ev.customerId}::${line}`;
    const arr = byPortfolio.get(k) || [];
    arr.push(ev);
    byPortfolio.set(k, arr);
  }

  const subs: Subscription[] = [];
  let subIdx = 201000;

  for (const [, evs] of byPortfolio) {
    if (evs.length === 0) continue;
    evs.sort((a, b) =>
      a.orderDate !== b.orderDate
        ? a.orderDate.localeCompare(b.orderDate)
        : a.orderId !== b.orderId
          ? a.orderId.localeCompare(b.orderId)
          : a.productId.localeCompare(b.productId),
    );

    let lastSpineOrderId: string | undefined;
    const relatedOrders: SubscriptionOrderRef[] = evs.map(e => {
      let relatesToOrderId: string | undefined;
      if (e.purchaseNature === 'AddOn') {
        relatesToOrderId = lastSpineOrderId;
      } else if (e.purchaseNature === 'New') {
        relatesToOrderId = undefined;
        lastSpineOrderId = e.orderId;
      } else {
        relatesToOrderId = lastSpineOrderId;
        lastSpineOrderId = e.orderId;
      }
      const licStart = e.orderDate;
      const licEnd = fmtYmd(licensePeriodAddToDate(new Date(e.orderDate + 'T00:00:00'), e.licensePeriod));
      return {
        orderId: e.orderId,
        orderDate: e.orderDate,
        purchaseNature: e.purchaseNature,
        quantity: e.quantity,
        amount: e.amount,
        relatesToOrderId,
        licenseStartDate: licStart,
        licenseEndDate: licEnd,
        productId: e.productId,
        productName: e.productName,
        skuName: e.skuName,
        licenseType: e.licenseType,
      };
    });

    const firstEv = evs[0]!;
    const lastEv = evs[evs.length - 1]!;
    const firstOrder = chainOrders.find(c => c.id === firstEv.orderId);
    const lastOrder = chainOrders.find(c => c.id === lastEv.orderId);
    const customerObj = customers.find(c => c.id === firstEv.customerId);

    subs.push({
      id: `SUB-GRP-${subIdx++}`,
      customerId: firstEv.customerId,
      customerName: firstOrder?.customerName || customerObj?.companyName || firstEv.customerName,
      productLine: productLineForSubscription(lastEv.productId),
      relatedOrders,
      salesRepName: lastOrder?.salesRepName,
      region: customerObj?.region,
    });
  }

  subs.sort((a, b) => a.customerId.localeCompare(b.customerId) || a.productLine.localeCompare(b.productLine));
  return subs;
}
