import { useCallback } from 'react';
import type {
  PermissionDimension,
  PermissionResource,
  RoleDefinition,
  RowPermissionRule,
} from '../../../types';
import { resourceConfig as defaultResourceConfig } from '../permissionConfig';

type RoleLike = Pick<RoleDefinition, 'rowPermissions' | 'rowLogic'> & Record<string, any>;
type ResourceCfgLike = { id: string; dimensions: { id: string; label: string }[] };

/**
 * 行权限规则操作集合（增删改 + 维度逻辑分组）。
 *
 * 该 hook 仅负责更新 roleForm.rowPermissions / rowLogic，不处理任何 UI 副作用。
 * 调用方在需要的位置自行关闭弹层（如 setOpenDimDropdown(null)）。
 *
 * @param overrideResourceConfig 可选：使用外部资源配置（Space 场景）
 */
export function useRowPermissionRules<T extends RoleLike = RoleDefinition>(
  selectedResource: PermissionResource | string,
  setRoleForm: React.Dispatch<React.SetStateAction<Partial<T>>>,
  overrideResourceConfig?: ResourceCfgLike[],
) {
  const resCfgList: ResourceCfgLike[] = overrideResourceConfig ?? (defaultResourceConfig as any);

  const addCondition = useCallback(
    (dim?: PermissionDimension | string) => {
      const resCfg = resCfgList.find(r => r.id === selectedResource);
      const defaultDim = (dim as string) || resCfg?.dimensions[0]?.id || 'salesRep';
      const newRule: RowPermissionRule = {
        id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resource: selectedResource as PermissionResource,
        dimension: defaultDim as PermissionDimension,
        operator: 'equals',
        values: [],
      };
      setRoleForm(prev => ({
        ...prev,
        rowPermissions: [...(prev.rowPermissions || []), newRule],
      }));
    },
    [selectedResource, setRoleForm, resCfgList],
  );

  const changeRuleDimension = useCallback(
    (ruleId: string, newDim: PermissionDimension | string) => {
      setRoleForm(prev => ({
        ...prev,
        rowPermissions: prev.rowPermissions?.map(r =>
          r.id === ruleId ? { ...r, dimension: newDim as PermissionDimension, values: [] } : r,
        ),
      }));
    },
    [setRoleForm],
  );

  const removeSingleRule = useCallback(
    (ruleId: string) => {
      setRoleForm(prev => ({
        ...prev,
        rowPermissions: prev.rowPermissions?.filter(r => r.id !== ruleId),
      }));
    },
    [setRoleForm],
  );

  const handleDeleteRowRule = removeSingleRule;

  const updateRuleValues = useCallback(
    (ruleId: string, val: string) => {
      setRoleForm(prev => {
        const rules = prev.rowPermissions || [];
        return {
          ...prev,
          rowPermissions: rules.map(r => {
            if (r.id === ruleId) {
              const newValues = r.values.includes(val)
                ? r.values.filter(v => v !== val)
                : [...r.values, val];
              return { ...r, values: newValues };
            }
            return r;
          }),
        };
      });
    },
    [setRoleForm],
  );

  const setRuleSingleValue = useCallback(
    (ruleId: string, val: string) => {
      setRoleForm(prev => ({
        ...prev,
        rowPermissions: (prev.rowPermissions || []).map(r =>
          r.id === ruleId ? { ...r, values: [val] } : r,
        ),
      }));
    },
    [setRoleForm],
  );

  const clearRuleValue = useCallback(
    (ruleId: string) => {
      setRoleForm(prev => ({
        ...prev,
        rowPermissions: (prev.rowPermissions || []).map(r =>
          r.id === ruleId ? { ...r, values: [] } : r,
        ),
      }));
    },
    [setRoleForm],
  );

  const toggleRuleValue = useCallback(
    (ruleId: string, val: string) => {
      setRoleForm(prev => ({
        ...prev,
        rowPermissions: (prev.rowPermissions || []).map(r => {
          if (r.id !== ruleId) return r;
          const has = r.values.includes(val);
          return {
            ...r,
            values: has ? r.values.filter(v => v !== val) : [...r.values, val],
          };
        }),
      }));
    },
    [setRoleForm],
  );

  const updateRuleOperator = useCallback(
    (ruleId: string, operator: 'equals' | 'contains') => {
      setRoleForm(prev => ({
        ...prev,
        rowPermissions: (prev.rowPermissions || []).map(r =>
          r.id === ruleId ? { ...r, operator } : r,
        ),
      }));
    },
    [setRoleForm],
  );

  const toggleDimOperator = useCallback(
    (resource: string, dimId: string) => {
      setRoleForm(prev => {
        const logic = prev.rowLogic?.[resource] || { dimOperators: {}, dimGroups: [] };
        const current = logic.dimOperators[dimId] || 'AND';
        return {
          ...prev,
          rowLogic: {
            ...prev.rowLogic,
            [resource]: {
              ...logic,
              dimOperators: {
                ...logic.dimOperators,
                [dimId]: current === 'AND' ? 'OR' : 'AND',
              },
            },
          },
        };
      });
    },
    [setRoleForm],
  );

  const createRuleGroup = useCallback(
    (resource: string, ruleIds: string[]) => {
      if (ruleIds.length < 2) return;
      setRoleForm(prev => {
        const logic = prev.rowLogic?.[resource] || { dimOperators: {}, dimGroups: [] };
        const cleanedGroups = logic.dimGroups
          .map(g => ({ ...g, dims: g.dims.filter(d => !ruleIds.includes(d)) }))
          .filter(g => g.dims.length >= 2);
        return {
          ...prev,
          rowLogic: {
            ...prev.rowLogic,
            [resource]: {
              ...logic,
              dimGroups: [...cleanedGroups, { id: `grp-${Date.now()}`, dims: ruleIds }],
            },
          },
        };
      });
    },
    [setRoleForm],
  );

  const removeDimGroup = useCallback(
    (resource: string, groupId: string) => {
      setRoleForm(prev => {
        const logic = prev.rowLogic?.[resource] || { dimOperators: {}, dimGroups: [] };
        return {
          ...prev,
          rowLogic: {
            ...prev.rowLogic,
            [resource]: {
              ...logic,
              dimGroups: logic.dimGroups.filter(g => g.id !== groupId),
            },
          },
        };
      });
    },
    [setRoleForm],
  );

  return {
    addCondition,
    changeRuleDimension,
    removeSingleRule,
    handleDeleteRowRule,
    updateRuleValues,
    setRuleSingleValue,
    clearRuleValue,
    toggleRuleValue,
    updateRuleOperator,
    toggleDimOperator,
    createRuleGroup,
    removeDimGroup,
  };
}
