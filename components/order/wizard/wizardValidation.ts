import type { BuyerType, OrderSource, OrderItem } from '../../../types';

export interface ValidationError {
  field: string;
  message: string;
  step: number;
}

export interface WizardFormState {
  // Step 1
  buyerType: BuyerType | '';
  orderSource: OrderSource;
  // Step 2
  hasOpportunity: 'yes' | 'no' | '';
  linkedOpportunityId: string;
  newOrderCustomer: string;
  orderEnterpriseId: string;
  selectedChannelId: string;
  purchasingContacts: any[];
  selectedPurchasingContactId: string;
  itContacts: any[];
  selectedItContactId: string;
  isAgentOrder: boolean;
  agentCode: string;
  sellerProductCategory: string;
  sellerName: string;
  // Step 3
  newOrderItems: OrderItem[];
  // Step 4
  serialNumberRequirement: '生成新序列号' | '沿用正式序列号' | '沿用测试序列号';
  reuseSerialNumber: string;
  settlementMethod: 'cash' | 'credit' | '';
  settlementType: 'once' | 'installment';
  installmentPlans: { amount: number; expectedDate: string; actualDate: string; paidAmount: number }[];
  productAcceptanceRows: { productIdx: number; method: string; percentage: number }[];
  orderTotal: number;
}

export function validateStep1(state: Pick<WizardFormState, 'buyerType'>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!state.buyerType) {
    errors.push({ field: 'buyerType', message: '请选择订单类型', step: 1 });
  }
  return errors;
}

export function validateStep2(state: WizardFormState): ValidationError[] {
  const errors: ValidationError[] = [];
  const { buyerType } = state;

  if (buyerType === 'SelfDeal') {
    if (!state.orderEnterpriseId) {
      errors.push({ field: 'orderEnterpriseId', message: '请选择企业', step: 2 });
    }
    if (state.isAgentOrder && !state.agentCode) {
      errors.push({ field: 'agentCode', message: '代理商订单需填写代理商编号', step: 2 });
    }
  } else if (buyerType === 'Customer') {
    if (!state.linkedOpportunityId) {
      errors.push({ field: 'linkedOpportunityId', message: '请关联商机', step: 2 });
    }
    if (!state.newOrderCustomer) {
      errors.push({ field: 'newOrderCustomer', message: '请选择客户', step: 2 });
    }
  } else {
    if (!state.hasOpportunity) {
      errors.push({ field: 'hasOpportunity', message: '请选择是否关联商机', step: 2 });
    }
    if (state.hasOpportunity === 'yes') {
      if (!state.linkedOpportunityId) {
        errors.push({ field: 'linkedOpportunityId', message: '请关联商机', step: 2 });
      }
      if (!state.newOrderCustomer) {
        errors.push({ field: 'newOrderCustomer', message: '请选择客户', step: 2 });
      }
    } else if (state.hasOpportunity === 'no') {
      if (!state.newOrderCustomer) {
        errors.push({ field: 'newOrderCustomer', message: '请选择客户', step: 2 });
      }
    }
    if (buyerType === 'Channel' && !state.selectedChannelId) {
      errors.push({ field: 'selectedChannelId', message: '请选择渠道商', step: 2 });
    }
  }

  if (!state.linkedOpportunityId && !state.sellerProductCategory) {
    errors.push({ field: 'sellerProductCategory', message: '请选择产品类型', step: 2 });
  }

  if (!state.sellerName) {
    errors.push({ field: 'sellerName', message: '请选择卖方名称', step: 2 });
  }

  if (state.purchasingContacts.length > 0 && !state.selectedPurchasingContactId) {
    errors.push({ field: 'selectedPurchasingContactId', message: '请选择采购联系人', step: 2 });
  }
  if (state.itContacts.length > 0 && !state.selectedItContactId) {
    errors.push({ field: 'selectedItContactId', message: '请选择 IT 联系人', step: 2 });
  }

  return errors;
}

export function validateStep3(state: Pick<WizardFormState, 'newOrderItems'>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (state.newOrderItems.length === 0) {
    errors.push({ field: 'newOrderItems', message: '请至少添加一个产品', step: 3 });
  }
  state.newOrderItems.forEach((item, idx) => {
    if (!item.quantity || item.quantity <= 0) {
      errors.push({ field: `item_${idx}_quantity`, message: `产品"${item.productName}"的数量必须大于 0`, step: 3 });
    }
    if (item.priceAtPurchase < 0) {
      errors.push({ field: `item_${idx}_price`, message: `产品"${item.productName}"的价格不能为负数`, step: 3 });
    }
    if (item.subUnitAuthMode && item.subUnitAuthMode !== 'none' && item.subUnits && item.subUnits.length > 0) {
      const subs = item.subUnits as any[];
      const subTotal = subs.reduce((s: number, u: any) => s + (parseInt(u.authCount) || 0), 0);
      if (subTotal !== item.quantity) {
        errors.push({ field: `item_${idx}_subUnits`, message: `产品"${item.productName}"的下级单位授权合计(${subTotal})与数量(${item.quantity})不一致`, step: 3 });
      }
      const emptyUnit = subs.find((u: any) => !u.unitName || !u.enterpriseId || !u.authCount || !u.itContact || !u.phone);
      if (emptyUnit) {
        errors.push({ field: `item_${idx}_subUnitFields`, message: `产品"${item.productName}"的下级单位存在未填写的必填字段`, step: 3 });
      }
    }
  });
  return errors;
}

export function validateStep4(state: WizardFormState): ValidationError[] {
  const errors: ValidationError[] = [];

  if (state.serialNumberRequirement !== '生成新序列号') {
    if (state.reuseSerialNumber.length !== 20) {
      errors.push({
        field: 'reuseSerialNumber',
        message: `序列号需要 20 位（当前 ${state.reuseSerialNumber.length} 位）`,
        step: 4,
      });
    }
  }

  if (!state.settlementMethod) {
    errors.push({ field: 'settlementMethod', message: '请选择结算方式', step: 4 });
  }

  if (state.settlementMethod === 'credit' && state.settlementType === 'installment') {
    if (state.installmentPlans.length < 2) {
      errors.push({ field: 'installmentPlans', message: '分期付款至少需要 2 期', step: 4 });
    }
    const planTotal = state.installmentPlans.reduce((s, p) => s + p.amount, 0);
    if (state.orderTotal > 0 && Math.abs(planTotal - state.orderTotal) > 0.01) {
      errors.push({ field: 'installmentPlansTotal', message: `分期金额合计(¥${planTotal.toLocaleString()})与订单总额(¥${state.orderTotal.toLocaleString()})不一致`, step: 4 });
    }
  }

  for (let pi = 0; pi < state.newOrderItems.length; pi++) {
    const rows = state.productAcceptanceRows.filter(r => r.productIdx === pi);
    if (rows.some(r => r.method === '分期验收')) {
      const totalPct = rows.reduce((s, r) => s + r.percentage, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        errors.push({
          field: `acceptance_${pi}`,
          message: `产品"${state.newOrderItems[pi].productName}"的分期验收比例合计 ${totalPct}%，需等于 100%`,
          step: 4,
        });
      }
    }
  }

  return errors;
}

export function validateAll(state: WizardFormState): ValidationError[] {
  return [
    ...validateStep1(state),
    ...validateStep2(state),
    ...validateStep3(state),
    ...validateStep4(state),
  ];
}

export function getStepErrors(errors: ValidationError[], step: number): ValidationError[] {
  return errors.filter(e => e.step === step);
}

export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some(e => e.field === field);
}

export function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find(e => e.field === field)?.message;
}
