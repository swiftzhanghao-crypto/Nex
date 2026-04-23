import type { AppScopedRolePermissions, RoleDefinition } from '../types';

/**
 * 合并用户身上所有平台角色的功能权限点（主应用 + 各 appPermissions 中的应用级权限），用于导航与功能入口判断。
 */
export function mergeAllPlatformPermissionIds(userRoleDefs: RoleDefinition[]): string[] {
  const set = new Set<string>();
  for (const r of userRoleDefs) {
    for (const p of r.permissions || []) set.add(p);
    const apps = r.appPermissions || {};
    for (const ap of Object.values(apps)) {
      for (const p of ap.permissions || []) set.add(p);
    }
  }
  return Array.from(set);
}

export function defaultAppScopedPermissions(): AppScopedRolePermissions {
  return {
    permissions: [],
    rowPermissions: [],
    rowLogic: {},
    columnPermissions: [],
  };
}

export function getAppScopedForPlatformRole(
  role: RoleDefinition,
  appId: string,
): AppScopedRolePermissions {
  const base = defaultAppScopedPermissions();
  if (!appId) return base;
  return { ...base, ...role.appPermissions?.[appId] };
}
