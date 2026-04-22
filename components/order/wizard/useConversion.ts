import { useMemo, useState } from 'react';
import type { ConversionOrder } from '../../../types';
import { initialConversionOrders } from '../../../data/staticData';

/**
 * 折算（Conversion）相关状态：是否启用、选中、Picker、搜索、可选/筛选/合计金额。
 */
export function useConversion() {
  const [enableConversion, setEnableConversion] = useState(false);
  const [selectedConversionIds, setSelectedConversionIds] = useState<string[]>([]);
  const [isConversionPickerOpen, setIsConversionPickerOpen] = useState(false);
  const [conversionSearchField, setConversionSearchField] = useState<'enterpriseName' | 'id'>(
    'enterpriseName',
  );
  const [conversionSearch, setConversionSearch] = useState('');

  const availableConversionOrders = useMemo<ConversionOrder[]>(
    () => initialConversionOrders.filter(c => c.status === 'Available'),
    [],
  );

  const filteredConversionOrders = useMemo(() => {
    if (!conversionSearch) return availableConversionOrders;
    const q = conversionSearch.toLowerCase();
    return availableConversionOrders.filter(c =>
      conversionSearchField === 'enterpriseName'
        ? c.enterpriseName.toLowerCase().includes(q)
        : c.id.toLowerCase().includes(q),
    );
  }, [availableConversionOrders, conversionSearch, conversionSearchField]);

  const conversionTotalAmount = useMemo(
    () =>
      selectedConversionIds.reduce((sum, id) => {
        const co = availableConversionOrders.find(c => c.id === id);
        return sum + (co?.amount ?? 0);
      }, 0),
    [selectedConversionIds, availableConversionOrders],
  );

  return {
    enableConversion,
    setEnableConversion,
    selectedConversionIds,
    setSelectedConversionIds,
    isConversionPickerOpen,
    setIsConversionPickerOpen,
    conversionSearchField,
    setConversionSearchField,
    conversionSearch,
    setConversionSearch,
    availableConversionOrders,
    filteredConversionOrders,
    conversionTotalAmount,
  };
}
