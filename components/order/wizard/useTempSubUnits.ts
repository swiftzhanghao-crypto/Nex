import { useCallback, useRef, useState } from 'react';
import type { Customer } from '../../../types';
import { parseSubUnitsCSV, type SubUnitLocal } from './subUnitCsv';

/**
 * 「正在新增/编辑的产品行」临时下级单位状态。
 * 与 useItemSubUnits 不同：这里持有自己的 state，对应 Step 3 添加产品弹窗内的临时表单。
 */
export function useTempSubUnits(customers: Customer[]) {
  const [tempSubUnits, setTempSubUnits] = useState<SubUnitLocal[]>([]);
  const tempSubUnitImportRef = useRef<HTMLInputElement>(null);

  const addTempSubUnit = useCallback(() => {
    setTempSubUnits(prev => [
      ...prev,
      {
        id: `su_${Date.now()}`,
        unitName: '',
        enterpriseId: '',
        enterpriseName: '-',
        authCount: '',
        itContact: '',
        phone: '',
        email: '',
        customerType: '-',
        industryLine: '-',
        sellerContact: '-',
      },
    ]);
  }, []);

  const updateTempSubUnit = useCallback(
    (unitId: string, field: keyof SubUnitLocal, value: string) => {
      setTempSubUnits(prev => prev.map(u => (u.id === unitId ? { ...u, [field]: value } : u)));
    },
    [],
  );

  const removeTempSubUnit = useCallback((unitId: string) => {
    setTempSubUnits(prev => prev.filter(u => u.id !== unitId));
  }, []);

  const handleTempSubUnitImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        if (!text) return;
        const newSubs = parseSubUnitsCSV(text, customers, 'su_imp', msg => alert(msg));
        if (newSubs.length === 0) return;
        setTempSubUnits(prev => [...prev, ...newSubs]);
        alert(`成功导入 ${newSubs.length} 条下级单位数据。`);
      };
      reader.readAsText(file);
    },
    [customers],
  );

  return {
    tempSubUnits,
    setTempSubUnits,
    tempSubUnitImportRef,
    addTempSubUnit,
    updateTempSubUnit,
    removeTempSubUnit,
    handleTempSubUnitImport,
  };
}
