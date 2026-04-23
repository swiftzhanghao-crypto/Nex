import { useCallback } from 'react';
import type { OrderItem, SubUnitAuthMode } from '../../../types';
import type { SubUnitLocal } from './subUnitCsv';

/**
 * 管理订单行 SubUnit（下级单位授权）相关操作。
 * 不持有自身状态，所有变更都通过 setNewOrderItems 落到上层 newOrderItems。
 */
export function useItemSubUnits(
  setNewOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>,
) {
  const updateItemSubUnitMode = useCallback(
    (itemIdx: number, mode: SubUnitAuthMode) => {
      setNewOrderItems(prev =>
        prev.map((it, i) =>
          i === itemIdx
            ? {
                ...it,
                subUnitAuthMode: mode,
                subUnits: mode === 'none' ? undefined : (it.subUnits || []),
              }
            : it,
        ),
      );
    },
    [setNewOrderItems],
  );

  const addItemSubUnit = useCallback(
    (itemIdx: number) => {
      setNewOrderItems(prev =>
        prev.map((it, i) => {
          if (i !== itemIdx) return it;
          const subs: SubUnitLocal[] = (it.subUnits as SubUnitLocal[]) || [];
          return {
            ...it,
            subUnits: [
              ...subs,
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
            ],
          };
        }),
      );
    },
    [setNewOrderItems],
  );

  const updateItemSubUnit = useCallback(
    (itemIdx: number, unitId: string, field: keyof SubUnitLocal, value: string) => {
      setNewOrderItems(prev =>
        prev.map((it, i) => {
          if (i !== itemIdx) return it;
          return {
            ...it,
            subUnits: ((it.subUnits as SubUnitLocal[]) || []).map(u =>
              u.id === unitId ? { ...u, [field]: value } : u,
            ),
          };
        }),
      );
    },
    [setNewOrderItems],
  );

  const removeItemSubUnit = useCallback(
    (itemIdx: number, unitId: string) => {
      setNewOrderItems(prev =>
        prev.map((it, i) => {
          if (i !== itemIdx) return it;
          return {
            ...it,
            subUnits: ((it.subUnits as SubUnitLocal[]) || []).filter(u => u.id !== unitId),
          };
        }),
      );
    },
    [setNewOrderItems],
  );

  return {
    updateItemSubUnitMode,
    addItemSubUnit,
    updateItemSubUnit,
    removeItemSubUnit,
  };
}
