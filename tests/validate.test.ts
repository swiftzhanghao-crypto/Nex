import { describe, it, expect, beforeAll } from 'vitest';

let validate: typeof import('../server/validate');

beforeAll(async () => {
  validate = await import('../server/validate');
});

describe('orderCreateSchema', () => {
  it('accepts minimal valid input', () => {
    const result = validate.orderCreateSchema.safeParse({
      customerId: 'cust-001',
      customerName: '测试客户',
    });
    expect(result.success).toBe(true);
  });

  it('fails when customerId is missing', () => {
    const result = validate.orderCreateSchema.safeParse({
      customerName: '测试客户',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('customerId');
    }
  });
});

describe('customerCreateSchema', () => {
  it('accepts valid input', () => {
    const result = validate.customerCreateSchema.safeParse({
      companyName: '金山办公',
      industry: '软件',
      customerType: 'Enterprise',
      level: 'A',
      region: '北京',
    });
    expect(result.success).toBe(true);
  });

  it('fails when companyName is missing', () => {
    const result = validate.customerCreateSchema.safeParse({
      industry: '软件',
      customerType: 'Enterprise',
      level: 'A',
      region: '北京',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('companyName');
    }
  });
});

describe('validateSubUnits', () => {
  it('returns null when items is undefined', () => {
    expect(validate.validateSubUnits(undefined)).toBeNull();
  });

  it('returns null when authCount sum matches quantity', () => {
    const items = [
      {
        productName: 'WPS 企业版',
        quantity: 10,
        subUnitAuthMode: 'separate_auth_separate_eid' as const,
        subUnits: [
          { unitName: '单位A', enterpriseId: 'e1', authCount: 6, itContact: '张三', phone: '13800000001' },
          { unitName: '单位B', enterpriseId: 'e2', authCount: 4, itContact: '李四', phone: '13800000002' },
        ],
      },
    ];
    expect(validate.validateSubUnits(items as Parameters<typeof validate.validateSubUnits>[0])).toBeNull();
  });

  it('returns error when authCount sum does not match quantity', () => {
    const items = [
      {
        productName: 'WPS 企业版',
        quantity: 10,
        subUnitAuthMode: 'separate_auth_separate_eid' as const,
        subUnits: [
          { unitName: '单位A', enterpriseId: 'e1', authCount: 3, itContact: '张三', phone: '13800000001' },
          { unitName: '单位B', enterpriseId: 'e2', authCount: 4, itContact: '李四', phone: '13800000002' },
        ],
      },
    ];
    const err = validate.validateSubUnits(items as Parameters<typeof validate.validateSubUnits>[0]);
    expect(err).toBeTypeOf('string');
    expect(err).toContain('不一致');
  });
});
