/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductCascade } from '../../components/order/wizard/useProductCascade';
import type { Product } from '../../types';

const products: Product[] = [
  {
    id: 'p1',
    name: 'WPS Office 专业版',
    category: '办公软件',
    subCategory: '文档',
    status: 'OnShelf',
    skus: [
      {
        id: 'sku1',
        code: 'SKU-001',
        name: '标准版',
        price: 199,
        stock: 100,
        status: 'Active',
        pricingOptions: [
          {
            id: 'opt1',
            title: '按年订阅',
            name: '按年订阅',
            price: 199,
            license: { periodUnit: 'Year' },
          },
        ],
      },
    ],
    salesScope: [{ salesOrg: '金山办公', materialType: '', authMaterialName: '', mediaMaterialName: '', supplyOrg: '', status: 'listed', billingStatus: 'maintained' }],
  },
  {
    id: 'p2',
    name: 'WPS 365',
    category: '办公软件',
    subCategory: '协作',
    status: 'OnShelf',
    skus: [
      {
        id: 'sku2',
        code: 'SKU-002',
        name: '企业版',
        price: 399,
        stock: 50,
        status: 'Active',
        pricingOptions: [],
      },
    ],
    salesOrgName: '金山办公',
  },
];

describe('useProductCascade', () => {
  it('builds categoryTree from on-shelf products', () => {
    const { result } = renderHook(() => useProductCascade(products));
    expect(result.current.categoryTree.length).toBeGreaterThan(0);
    expect(result.current.categoryTree[0].subs).toContain('文档');
  });

  it('resets product selection when category changes', () => {
    const { result } = renderHook(() => useProductCascade(products));

    act(() => {
      result.current.setTempCategory('文档');
    });
    act(() => {
      result.current.setTempProductId('p1');
    });
    expect(result.current.tempProductId).toBe('p1');

    act(() => {
      result.current.setTempCategory('协作');
    });
    expect(result.current.tempProductId).toBe('');
    expect(result.current.tempSkuId).toBe('');
  });

  it('auto-selects sku when product has single active sku', () => {
    const { result } = renderHook(() => useProductCascade(products));

    act(() => {
      result.current.setTempCategory('文档');
    });
    act(() => {
      result.current.setTempProductId('p1');
    });

    expect(result.current.tempSkuId).toBe('sku1');
    expect(result.current.tempPricingOptionId).toBe('opt1');
    expect(result.current.negotiatedPrice).toBe(199);
  });

  it('setTempProductWithSku applies pending sku after product change', () => {
    const { result } = renderHook(() => useProductCascade(products));

    act(() => {
      result.current.setTempCategory('文档');
    });
    act(() => {
      result.current.setTempProductWithSku('p1', 'sku1');
    });

    expect(result.current.tempProductId).toBe('p1');
    expect(result.current.tempSkuId).toBe('sku1');
  });
});
