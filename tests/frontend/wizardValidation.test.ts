import { describe, it, expect } from 'vitest';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateAll,
  getStepErrors,
  hasFieldError,
} from '../../components/order/wizard/wizardValidation';
import type { WizardFormState } from '../../components/order/wizard/wizardValidation';

function baseState(overrides: Partial<WizardFormState> = {}): WizardFormState {
  return {
    buyerType: 'Customer',
    orderSource: 'Sales',
    hasOpportunity: 'yes',
    linkedOpportunityId: 'opp-1',
    newOrderCustomer: 'cust-1',
    orderEnterpriseId: '',
    selectedChannelId: '',
    purchasingContacts: [],
    selectedPurchasingContactId: '',
    itContacts: [],
    selectedItContactId: '',
    isAgentOrder: false,
    agentCode: '',
    sellerProductCategory: 'Office',
    sellerName: '金山办公',
    newOrderItems: [
      {
        productId: 'p1',
        productName: 'WPS Office',
        skuId: 's1',
        skuName: '标准版',
        quantity: 10,
        priceAtPurchase: 100,
        activationMethod: 'Account',
      },
    ],
    serialNumberRequirement: '生成新序列号',
    reuseSerialNumber: '',
    settlementMethod: 'cash',
    settlementType: 'once',
    installmentPlans: [],
    productAcceptanceRows: [],
    orderTotal: 1000,
    ...overrides,
  };
}

describe('wizardValidation', () => {
  it('validateStep1 requires buyerType', () => {
    const errors = validateStep1({ buyerType: '' });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('buyerType');
  });

  it('validateStep2 requires channel for Channel buyer', () => {
    const errors = validateStep2(
      baseState({
        buyerType: 'Channel',
        selectedChannelId: '',
        hasOpportunity: '',
        linkedOpportunityId: '',
        newOrderCustomer: 'cust-1',
      }),
    );
    expect(errors.some((e) => e.field === 'selectedChannelId')).toBe(true);
  });

  it('validateStep3 requires at least one product', () => {
    const errors = validateStep3({ newOrderItems: [] });
    expect(errors[0].message).toContain('至少添加一个产品');
  });

  it('validateStep3 flags invalid quantity', () => {
    const errors = validateStep3({
      newOrderItems: [
        {
          productId: 'p1',
          productName: 'Test',
          skuId: 's1',
          skuName: 'Spec',
          quantity: 0,
          priceAtPurchase: 100,
          activationMethod: 'Account',
        },
      ],
    });
    expect(errors.some((e) => e.field.includes('quantity'))).toBe(true);
  });

  it('validateStep4 requires 20-char serial when reusing', () => {
    const errors = validateStep4(
      baseState({
        serialNumberRequirement: '沿用正式序列号',
        reuseSerialNumber: 'short',
      }),
    );
    expect(errors.some((e) => e.field === 'reuseSerialNumber')).toBe(true);
  });

  it('validateStep4 checks installment total', () => {
    const errors = validateStep4(
      baseState({
        settlementMethod: 'credit',
        settlementType: 'installment',
        orderTotal: 1000,
        installmentPlans: [
          { amount: 300, expectedDate: '2026-01-01', actualDate: '', paidAmount: 0 },
          { amount: 300, expectedDate: '2026-02-01', actualDate: '', paidAmount: 0 },
        ],
      }),
    );
    expect(errors.some((e) => e.field === 'installmentPlansTotal')).toBe(true);
  });

  it('validateAll aggregates step errors', () => {
    const errors = validateAll(baseState({ buyerType: '', newOrderItems: [] }));
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('getStepErrors and hasFieldError work', () => {
    const errors = validateStep1({ buyerType: '' });
    expect(getStepErrors(errors, 1)).toHaveLength(1);
    expect(hasFieldError(errors, 'buyerType')).toBe(true);
  });
});
