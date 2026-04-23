import { useCallback, useMemo, useState } from 'react';
import {
  permissionTree as defaultPermTree,
  permissionModules as defaultPermModules,
  type PermSubgroup,
  type PermGroup,
  type PermCategory,
  getSubgroupPermIds,
} from '../permissionConfig';

/**
 * 权限树展开/折叠状态。维护四类节点的展开 ID 集合，并提供
 * 切换函数以及若干 helper（求子集 / 判断 all|some|none 状态）。
 *
 * @param overrideTree 可选：使用外部提供的权限树（用于 Space 场景）
 */
export function usePermissionTreeExpansion(overrideTree?: PermGroup[]) {
  const tree = overrideTree ?? defaultPermTree;
  const modules = useMemo(
    () => (overrideTree
      ? overrideTree.map(g => ({ id: g.id, label: g.label }))
      : defaultPermModules),
    [overrideTree],
  );
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    tree.map(g => g.id),
  );
  const [expandedSubgroups, setExpandedSubgroups] = useState<string[]>(
    tree.flatMap(g => g.subgroups.map(sg => sg.id)),
  );
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    tree.flatMap(g =>
      g.subgroups.flatMap(sg => (sg.categories || []).map(c => c.id)),
    ),
  );
  const [expandedModules, setExpandedModules] = useState<string[]>(
    modules.map(m => m.id),
  );

  const toggleGroupExpand = useCallback(
    (id: string) =>
      setExpandedGroups(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])),
    [],
  );
  const toggleSubgroupExpand = useCallback(
    (id: string) =>
      setExpandedSubgroups(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
      ),
    [],
  );
  const toggleCategoryExpand = useCallback(
    (id: string) =>
      setExpandedCategories(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
      ),
    [],
  );

  const allPermsInSubgroup = useCallback((sg: PermSubgroup) => getSubgroupPermIds(sg), []);
  const allPermsInGroup = useCallback(
    (g: PermGroup) => g.subgroups.flatMap(sg => getSubgroupPermIds(sg)),
    [],
  );
  const allPermsInCategory = useCallback(
    (cat: PermCategory) => cat.permissions.map(p => p.id),
    [],
  );

  const getCheckState = useCallback(
    (permIds: string[], current: string[]): 'all' | 'some' | 'none' => {
      const checked = permIds.filter(id => current.includes(id)).length;
      if (checked === 0) return 'none';
      if (checked === permIds.length) return 'all';
      return 'some';
    },
    [],
  );

  return {
    expandedGroups,
    setExpandedGroups,
    expandedSubgroups,
    setExpandedSubgroups,
    expandedCategories,
    setExpandedCategories,
    expandedModules,
    setExpandedModules,
    toggleGroupExpand,
    toggleSubgroupExpand,
    toggleCategoryExpand,
    allPermsInSubgroup,
    allPermsInGroup,
    allPermsInCategory,
    getCheckState,
  };
}
