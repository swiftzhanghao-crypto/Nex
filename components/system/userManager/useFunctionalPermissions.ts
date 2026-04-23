import { useCallback, useMemo } from 'react';
import type { RoleDefinition } from '../../../types';
import {
  permissionTree as defaultPermTree,
  permissionModules as defaultPermModules,
  type PermGroup,
  type PermSubgroup,
  type PermCategory,
  getSubgroupPermIds,
  getSubgroupPermItems,
} from '../permissionConfig';

/**
 * 功能权限勾选 / 切换模块 / 计算依赖项。
 * 仅维护 roleForm.permissions 字段，不处理 expand state（由 usePermissionTreeExpansion 管理）。
 *
 * @param overrideTree 可选：使用外部提供的权限树（Space 场景）
 */
export function useFunctionalPermissions<T extends { permissions?: string[] } = RoleDefinition>(
  roleForm: Partial<T>,
  setRoleForm: React.Dispatch<React.SetStateAction<Partial<T>>>,
  getCheckState: (permIds: string[], current: string[]) => 'all' | 'some' | 'none',
  allPermsInSubgroup: (sg: PermSubgroup) => string[],
  allPermsInCategory: (cat: PermCategory) => string[],
  overrideTree?: PermGroup[],
) {
  const tree = overrideTree ?? defaultPermTree;
  const modules = useMemo(
    () => (overrideTree
      ? overrideTree.map(g => ({
          id: g.id,
          label: g.label,
          permissions: g.subgroups.flatMap(sg => getSubgroupPermItems(sg).map(p => ({ id: p.id, label: p.label }))),
        }))
      : defaultPermModules),
    [overrideTree],
  );

  const getDependentPermIds = useCallback((parentPermId: string): string[] => {
    return tree.flatMap(g =>
      g.subgroups
        .filter(sg => sg.dependsOn === parentPermId)
        .flatMap(sg => getSubgroupPermIds(sg)),
    );
  }, [tree]);

  const togglePermission = useCallback(
    (permId: string) => {
      const current: string[] = roleForm.permissions || [];
      if (current.includes(permId)) {
        const cascadeRemove = getDependentPermIds(permId);
        setRoleForm({
          ...roleForm,
          permissions: current.filter(p => p !== permId && !cascadeRemove.includes(p)),
        });
      } else {
        setRoleForm({ ...roleForm, permissions: [...current, permId] });
      }
    },
    [roleForm, setRoleForm, getDependentPermIds],
  );

  const toggleModule = useCallback(
    (moduleId: string) => {
      const module = modules.find(m => m.id === moduleId);
      if (!module) return;
      const modulePerms = module.permissions.map(p => p.id);
      const current: string[] = roleForm.permissions || [];
      const allChecked = modulePerms.every(p => current.includes(p));
      if (allChecked) {
        setRoleForm({
          ...roleForm,
          permissions: current.filter(p => !modulePerms.includes(p)),
        });
      } else {
        const newPerms = new Set([...current, ...modulePerms]);
        setRoleForm({ ...roleForm, permissions: Array.from(newPerms) });
      }
    },
    [roleForm, setRoleForm, modules],
  );

  const toggleSubgroupPerms = useCallback(
    (sg: PermSubgroup) => {
      const ids = allPermsInSubgroup(sg);
      const current: string[] = roleForm.permissions || [];
      const state = getCheckState(ids, current);
      if (state === 'all') {
        setRoleForm({ ...roleForm, permissions: current.filter(p => !ids.includes(p)) });
      } else {
        setRoleForm({ ...roleForm, permissions: Array.from(new Set([...current, ...ids])) });
      }
    },
    [allPermsInSubgroup, getCheckState, roleForm, setRoleForm],
  );

  const toggleCategoryPerms = useCallback(
    (cat: PermCategory) => {
      const ids = allPermsInCategory(cat);
      const current: string[] = roleForm.permissions || [];
      const state = getCheckState(ids, current);
      if (state === 'all') {
        setRoleForm({ ...roleForm, permissions: current.filter(p => !ids.includes(p)) });
      } else {
        setRoleForm({ ...roleForm, permissions: Array.from(new Set([...current, ...ids])) });
      }
    },
    [allPermsInCategory, getCheckState, roleForm, setRoleForm],
  );

  return {
    getDependentPermIds,
    togglePermission,
    toggleModule,
    toggleSubgroupPerms,
    toggleCategoryPerms,
  };
}
