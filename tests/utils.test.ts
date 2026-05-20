import { describe, it, expect, beforeAll } from 'vitest';

let utils: typeof import('../server/utils');

beforeAll(async () => {
  utils = await import('../server/utils');
});

describe('safeJsonParse', () => {
  it('returns fallback for null', () => {
    expect(utils.safeJsonParse(null, [])).toEqual([]);
  });

  it('returns fallback for invalid JSON', () => {
    expect(utils.safeJsonParse('{bad', { x: 1 })).toEqual({ x: 1 });
  });

  it('parses valid JSON', () => {
    expect(utils.safeJsonParse('["a"]', [])).toEqual(['a']);
  });
});

describe('parseRoles', () => {
  it('returns empty for null', () => {
    expect(utils.parseRoles(null)).toEqual([]);
  });

  it('parses JSON array', () => {
    expect(utils.parseRoles('["Admin","Sales"]')).toEqual(['Admin', 'Sales']);
  });

  it('returns single role for plain string', () => {
    expect(utils.parseRoles('Admin')).toEqual(['Admin']);
  });

  it('falls back on invalid JSON array', () => {
    expect(utils.parseRoles('[bad')).toEqual(['[bad']);
  });
});

describe('safePagination', () => {
  it('defaults page and size', () => {
    expect(utils.safePagination(undefined, undefined)).toEqual({ limit: 50, offset: 0, pageNum: 1 });
  });

  it('caps size at maxSize', () => {
    expect(utils.safePagination('2', '99999', 200).limit).toBe(200);
  });

  it('computes offset for page 2', () => {
    expect(utils.safePagination('2', '10')).toEqual({ limit: 10, offset: 10, pageNum: 2 });
  });
});

describe('sanitizeOrderItemsSubUnits', () => {
  it('returns empty for non-array', () => {
    expect(utils.sanitizeOrderItemsSubUnits(null)).toEqual([]);
  });

  it('strips subUnits when multiple items', () => {
    const items = [
      { productName: 'A', subUnitAuthMode: 'x', subUnits: [] },
      { productName: 'B' },
    ];
    const result = utils.sanitizeOrderItemsSubUnits(items) as Record<string, unknown>[];
    expect(result[0].subUnits).toBeUndefined();
    expect(result[0].subUnitAuthMode).toBeUndefined();
  });

  it('strips subUnits for SelfDeal buyer', () => {
    const items = [{ productName: 'A', subUnitAuthMode: 'x', subUnits: [] }];
    const result = utils.sanitizeOrderItemsSubUnits(items, 'SelfDeal') as Record<string, unknown>[];
    expect(result[0].subUnits).toBeUndefined();
  });
});
