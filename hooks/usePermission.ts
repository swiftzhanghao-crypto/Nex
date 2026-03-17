import { useMemo } from 'react';
import { User, RoleDefinition } from '../types';

export function usePermission(currentUser: User, roles: RoleDefinition[]) {
    const currentRole = useMemo(() => roles.find(r => r.id === currentUser.role), [currentUser.role, roles]);
    const permissions = useMemo(() => currentRole?.permissions || [], [currentRole]);
    
    const hasPermission = (perm: string) => permissions.includes('all') || permissions.includes(perm);
    const hasAnyPermission = (perms: string[]) => perms.some(p => hasPermission(p));
    
    return { permissions, hasPermission, hasAnyPermission, currentRole };
}
