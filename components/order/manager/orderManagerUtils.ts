import { Order, OrderStatus, OrderDraft, BuyerType } from '../../../types';

export type FilterMode = '单选' | '多选' | '时间段' | '时间点' | '金额范围';

export interface OrderViewFilters {
  filterStatus: string;
  advancedFilters: FilterCondition[];
}

export interface OrderView {
  id: string;
  name: string;
  columns: string[];
  isDefault?: boolean;
  filters?: OrderViewFilters;
}

export interface FilterCondition {
  id: string;
  fieldId: string;
  mode: FilterMode;
  value: string | number | boolean | { start: string; end: string } | { min: string; max: string } | string[];
}

export const VIEWS_STORAGE_KEY = 'order_list_views';
export const ACTIVE_VIEW_STORAGE_KEY = 'order_list_active_view';

export function loadViews(defaultColumns: string[]): OrderView[] {
  try {
    const raw = localStorage.getItem(VIEWS_STORAGE_KEY);
    if (raw) {
      const views = JSON.parse(raw) as OrderView[];
      if (Array.isArray(views) && views.length > 0) {
        return views.map(v => v.isDefault && v.name === '默认视图' ? { ...v, name: '全部订单' } : v);
      }
    }
  } catch {}
  return [{ id: 'default', name: '全部订单', columns: defaultColumns, isDefault: true }];
}

export function saveViews(views: OrderView[]) {
  localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(views));
}

export function loadActiveViewId(): string {
  return localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY) || 'default';
}

export const DEFAULT_COLS = ['id', 'customer', 'buyer', 'products', 'sales', 'businessManager', 'department', 'source', 'buyerType', 'date', 'status', 'paymentStatus', 'stockStatus', 'total', 'action'];

export const DEFAULT_VISIBLE = ['id', 'customer', 'buyer', 'products', 'sales', 'businessManager', 'department', 'source', 'buyerType', 'date', 'status', 'paymentStatus', 'stockStatus', 'total', 'action'];

export function orderToDraft(order: Order): OrderDraft {
  return {
    id: order.id,
    savedAt: order.date || new Date().toISOString(),
    currentStep: 0,
    buyerType: (order.buyerType as BuyerType) || '',
    orderSource: order.source || 'Sales',
    creatorId: order.creatorId || '',
    originalOrderId: order.originalOrderId,
    hasOpportunity: order.opportunityId ? 'yes' : '',
    linkedOpportunityId: order.opportunityId || '',
    newOrderCustomer: order.customerId || '',
    orderEnterpriseId: '',
    selectedChannelId: order.buyerType === 'Channel' ? (order.buyerId || '') : '',
    directChannel: order.directChannel || '',
    terminalChannel: order.terminalChannel || '',
    salesRepId: order.salesRepId || '',
    businessManagerId: order.businessManagerId || '',
    newOrderItems: order.items || [],
    tempCategory: '',
    enableConversion: false,
    selectedConversionIds: [],
    sellerProductCategory: '',
    sellerName: order.sellerName || '',
    sellerContact: order.sellerContact || '',
    invoiceForm: order.invoiceInfo || { type: 'VAT_Special', title: '', taxId: '', content: '' },
    paymentMethod: order.paymentMethod,
    paymentTerms: order.paymentTerms,
    deliveryMethod: order.deliveryMethod || 'Online',
    receivingParty: order.receivingParty || '',
    receivingCompany: order.receivingCompany || '',
    receivingMethod: order.receivingMethod || '',
    shippingAddress: order.shippingAddress || '',
    shippingPhone: order.shippingPhone || '',
    shippingEmail: order.shippingEmail || '',
    acceptanceForm: order.acceptanceInfo || { contactName: '', contactPhone: '', method: 'Remote' },
    acceptanceType: order.acceptanceConfig?.type || 'OneTime',
    phaseDrafts: [],
    orderRemark: order.orderRemark || '',
    linkedContractIds: order.linkedContractIds || [],
    purchasingContactId: order.purchasingContactId || '',
    itContactId: order.itContactId || '',
    isAgentOrder: order.isAgentOrder,
    agentCode: order.agentCode,
    buyerNameId: order.buyerId,
    settlementMethod: (order.settlementMethod as 'cash' | 'credit' | '') || '',
    expectedPaymentDate: order.expectedPaymentDate || '',
  };
}

export const availableFilterFields = [
  { id: 'orderSource', label: '订单来源', defaultMode: '多选' as FilterMode },
  { id: 'orderType', label: '订单类型', defaultMode: '多选' as FilterMode },
  { id: 'businessManager', label: '商务', defaultMode: '单选' as FilterMode },
  { id: 'orderStatus', label: '订单状态', defaultMode: '多选' as FilterMode },
  { id: 'paymentStatus', label: '付款状态', defaultMode: '多选' as FilterMode },
  { id: 'stockStatus', label: '备货状态', defaultMode: '多选' as FilterMode },
  { id: 'subUnitAuth', label: '下级单位授权', defaultMode: '多选' as FilterMode },
  { id: 'orderDate', label: '提单时间', defaultMode: '时间段' as FilterMode },
  { id: 'shippedDate', label: '发货时间', defaultMode: '时间段' as FilterMode },
  { id: 'orderAmount', label: '订单应付金额', defaultMode: '金额范围' as FilterMode },
];

export const orderSourceLabelMap: Record<string, string> = {
  Sales: '后台下单',
  ChannelPortal: '渠道来源',
  OnlineStore: '官网',
  APISync: '三方平台',
};

export const statusMap: Record<string, string> = {
  [OrderStatus.DRAFT]: '草稿',
  [OrderStatus.PENDING_APPROVAL]: '订单审批',
  [OrderStatus.PENDING_CONFIRM]: '订单确认',
  [OrderStatus.PROCESSING_PROD]: '备货中',
  [OrderStatus.PENDING_PAYMENT]: '订单支付',
  [OrderStatus.SHIPPED]: '已发货',
  [OrderStatus.DELIVERED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.REFUND_PENDING]: '退款中',
  [OrderStatus.REFUNDED]: '已退款',
};

export const buyerTypeMap: Record<string, string> = {
  Customer: '直签订单',
  Channel: '渠道订单',
  SelfDeal: '自成交订单',
  RedeemCode: '兑换码订单',
};

export const deliveryMethodMap: Record<string, string> = {
  Online: '线上发货',
  Offline: '线下发货',
  Hybrid: '混合发货',
};

export const paymentMethodMap: Record<string, string> = {
  WechatPay: '微信支付',
  Alipay: '支付宝支付',
  Transfer: '银行转账',
};

export const allColumns = [
  { id: 'id', label: '订单编号' },
  { id: 'customer', label: '客户名称' },
  { id: 'buyer', label: '买方名称' },
  { id: 'products', label: '产品信息' },
  { id: 'sales', label: '销售' },
  { id: 'businessManager', label: '商务' },
  { id: 'department', label: '所属部门' },
  { id: 'source', label: '订单来源' },
  { id: 'buyerType', label: '订单类型' },
  { id: 'date', label: '提单时间' },
  { id: 'status', label: '订单状态' },
  { id: 'paymentStatus', label: '付款状态' },
  { id: 'stockStatus', label: '备货状态' },
  { id: 'total', label: '订单应付金额' },
  { id: 'payment', label: '支付方式' },
  { id: 'delivery', label: '发货方式' },
  { id: 'address', label: '收货地址' },
  { id: 'invoice', label: '发票抬头' },
  { id: 'licensee', label: '被授权方' },
  { id: 'opportunity', label: '关联商机' },
  { id: 'action', label: '操作' },
];

export const multiCheckboxFields = ['orderSource', 'orderType', 'orderStatus', 'paymentStatus', 'stockStatus', 'subUnitAuth'];
export const personPickerFields = ['businessManager'];
export const dateFilterFields = ['orderDate', 'shippedDate'];
export const amountFilterFields = ['orderAmount'];

export const searchFieldOptions: { value: 'id' | 'customerName' | 'buyerName' | 'productName' | 'licensee'; label: string; placeholder: string }[] = [
  { value: 'id', label: '订单编号', placeholder: '搜索订单编号…' },
  { value: 'customerName', label: '客户名称', placeholder: '搜索客户名称…' },
  { value: 'buyerName', label: '买方名称', placeholder: '搜索买方名称…' },
  { value: 'productName', label: '产品名称', placeholder: '搜索产品名称…' },
  { value: 'licensee', label: '被授权方', placeholder: '搜索被授权方…' },
];

export const colWidthMap: Record<string, number> = {
  id: 260, customer: 175, buyer: 165, products: 285,
  sales: 120, businessManager: 120, department: 190,
  source: 100, buyerType: 100, date: 150, status: 90,
  paymentStatus: 95, stockStatus: 90, total: 125,
  payment: 100, delivery: 100, address: 160, invoice: 140,
  licensee: 200, opportunity: 140, action: 85,
};

export function getCheckboxOptions(fieldId: string, orders: Order[]): { value: string; label: string }[] {
  const sourceKeys = [...new Set([...Object.keys(orderSourceLabelMap), ...orders.map(o => o.source as string).filter(Boolean)])];
  if (fieldId === 'orderSource') return sourceKeys.map(s => ({ value: s, label: orderSourceLabelMap[s as string] || s }));
  if (fieldId === 'orderType') {
    return Object.entries(buyerTypeMap).map(([value, label]) => ({ value, label }));
  }
  if (fieldId === 'orderStatus') return Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v }));
  if (fieldId === 'paymentStatus') return [{ value: 'paid', label: '已支付' }, { value: 'unpaid', label: '待支付' }];
  if (fieldId === 'stockStatus') return [
    { value: 'pending', label: '待处理' }, { value: 'processing', label: '备货中' },
    { value: 'pendingShip', label: '待发货' }, { value: 'shipped', label: '已发货' }, { value: 'completed', label: '已完成' },
  ];
  if (fieldId === 'subUnitAuth') return [
    { value: 'no_subunit', label: '无下级单位授权' },
    { value: 'separate_auth_separate_eid', label: '授权分别呈现，企业ID分别管理' },
    { value: 'separate_auth_unified_eid', label: '授权分别呈现，企业ID统一管理' },
    { value: 'unified_auth_with_list', label: '授权和企业ID统一管理并提供下级清单' },
  ];
  return [];
}

export function initValueForField(fieldId: string, mode: string) {
  if (multiCheckboxFields.includes(fieldId)) return [] as string[];
  if (amountFilterFields.includes(fieldId)) return { min: '', max: '' };
  if (mode === '时间段') return { start: '', end: '' };
  if (mode === '时间点') return '';
  return '全部';
}
