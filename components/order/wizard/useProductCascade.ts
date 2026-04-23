import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActivationMethod, PurchaseNature, SubUnitAuthMode, Product } from '../../../types';
import type { SubUnitLocal } from './subUnitCsv';

/**
 * 产品/品类/SKU/PricingOption 级联选择状态与联动 effect。
 * 将 Step 3 弹窗中的 "新增产品" 级联选择逻辑抽离。
 */
export function useProductCascade(products: Product[]) {
  const [tempCategory, setTempCategory] = useState('');
  const [tempHoverCategory, setTempHoverCategory] = useState('');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const categoryPickerRef = useRef<HTMLDivElement>(null);
  const [tempProductId, setTempProductId] = useState('');
  const [tempSkuId, setTempSkuId] = useState('');
  const [tempPricingOptionId, setTempPricingOptionId] = useState('');
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempActivationMethod, setTempActivationMethod] = useState<ActivationMethod>('Account');
  const [tempMediaCount, setTempMediaCount] = useState<number | ''>(1);

  const [tempLicensePeriod, setTempLicensePeriod] = useState('');
  const [tempLicensePeriodNum, setTempLicensePeriodNum] = useState<number | ''>('');
  const [tempLicensePeriodUnit, setTempLicensePeriodUnit] = useState<'年' | '月' | '日'>('年');
  const [negotiatedPrice, setNegotiatedPrice] = useState<number | null>(null);

  const [tempEnterpriseId, setTempEnterpriseId] = useState('');
  const [tempLicensee, setTempLicensee] = useState('');

  const [tempPkgType, setTempPkgType] = useState<'通用' | '定制' | ''>('');
  const [tempPkgCpu, setTempPkgCpu] = useState('');
  const [tempPkgOs, setTempPkgOs] = useState('');
  const [tempPkgLink, setTempPkgLink] = useState('');
  const [tempPurchaseNature, setTempPurchaseNature] = useState<PurchaseNature>('New');
  const [tempPurchaseNature365, setTempPurchaseNature365] = useState<PurchaseNature>('New');
  const [tempSubUnitMode, setTempSubUnitMode] = useState<SubUnitAuthMode>('none');

  const categoryTree = useMemo(() => {
    const onShelf = products.filter(p => p.status === 'OnShelf');
    const cats = Array.from(new Set(onShelf.map(p => p.category)));
    return cats
      .map(cat => ({
        label: cat,
        subs: Array.from(
          new Set(
            onShelf.filter(p => p.category === cat && p.subCategory).map(p => p.subCategory!),
          ),
        ),
      }))
      .filter(c => c.subs.length > 0);
  }, [products]);

  const selectedCategoryLabel = useMemo(() => {
    if (!tempCategory) return '';
    const parent = categoryTree.find(c => c.subs.includes(tempCategory));
    return parent ? `${parent.label} / ${tempCategory}` : tempCategory;
  }, [tempCategory, categoryTree]);

  const selectedProduct = products.find(p => p.id === tempProductId);
  const selectedSku = selectedProduct?.skus.find(s => s.id === tempSkuId);
  const selectedOption = selectedSku?.pricingOptions?.find(o => o.id === tempPricingOptionId);
  const selectedLicenseType = selectedOption?.title || undefined;
  const selectedLicensePeriodType = selectedOption
    ? selectedOption.license.periodUnit
    : undefined;
  const showLicensePeriod =
    selectedLicensePeriodType !== 'Forever' && selectedLicensePeriodType !== undefined;

  // Reset downstream when upstream changes
  useEffect(() => {
    setTempProductId('');
    setTempSkuId('');
    setTempPricingOptionId('');
    setNegotiatedPrice(null);
    setTempPkgType('');
    setTempPkgCpu('');
    setTempPkgOs('');
    setTempPkgLink('');
  }, [tempCategory]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryPickerRef.current && !categoryPickerRef.current.contains(e.target as Node)) {
        setIsCategoryPickerOpen(false);
      }
    };
    if (isCategoryPickerOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryPickerOpen]);

  useEffect(() => {
    setTempSkuId('');
    setTempPricingOptionId('');
    setNegotiatedPrice(null);
    setTempPkgType('');
    setTempPkgCpu('');
    setTempPkgOs('');
    setTempPkgLink('');
    if (tempProductId) {
      const prod = products.find(p => p.id === tempProductId);
      const activeSkus = prod?.skus.filter(s => s.status === 'Active') || [];
      if (activeSkus.length === 1) setTempSkuId(activeSkus[0].id);
    }
  }, [tempProductId, products]);

  useEffect(() => {
    setTempPkgCpu('');
    setTempPkgOs('');
    setTempPkgLink('');
  }, [tempPkgType]);

  useEffect(() => {
    setTempPricingOptionId('');
    setNegotiatedPrice(null);
    if (selectedSku?.pricingOptions && selectedSku.pricingOptions.length === 1) {
      setTempPricingOptionId(selectedSku.pricingOptions[0].id);
    }
  }, [tempSkuId, selectedSku]);

  useEffect(() => {
    if (selectedOption) {
      setNegotiatedPrice(selectedOption.price);
    } else if (selectedSku) {
      setNegotiatedPrice(selectedSku.price);
    }
  }, [selectedOption, selectedSku]);

  return {
    tempCategory,
    setTempCategory,
    tempHoverCategory,
    setTempHoverCategory,
    isCategoryPickerOpen,
    setIsCategoryPickerOpen,
    categoryPickerRef,
    tempProductId,
    setTempProductId,
    tempSkuId,
    setTempSkuId,
    tempPricingOptionId,
    setTempPricingOptionId,
    tempQuantity,
    setTempQuantity,
    tempActivationMethod,
    setTempActivationMethod,
    tempMediaCount,
    setTempMediaCount,
    tempLicensePeriod,
    setTempLicensePeriod,
    tempLicensePeriodNum,
    setTempLicensePeriodNum,
    tempLicensePeriodUnit,
    setTempLicensePeriodUnit,
    negotiatedPrice,
    setNegotiatedPrice,
    tempEnterpriseId,
    setTempEnterpriseId,
    tempLicensee,
    setTempLicensee,
    tempPkgType,
    setTempPkgType,
    tempPkgCpu,
    setTempPkgCpu,
    tempPkgOs,
    setTempPkgOs,
    tempPkgLink,
    setTempPkgLink,
    tempPurchaseNature,
    setTempPurchaseNature,
    tempPurchaseNature365,
    setTempPurchaseNature365,
    tempSubUnitMode,
    setTempSubUnitMode,
    categoryTree,
    selectedCategoryLabel,
    selectedProduct,
    selectedSku,
    selectedOption,
    selectedLicenseType,
    selectedLicensePeriodType,
    showLicensePeriod,
  };
}
