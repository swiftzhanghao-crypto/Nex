import { useCallback, useState } from 'react';
import type { RoleDefinition } from '../../../types';
import { userApi } from '../../../services/api';

/**
 * 角色拖拽重排序：内部维护拖拽源/目标，落地时调用后端持久化并在失败时回滚。
 * apiMode 为 false 时仅做本地重排，不调后端。
 */
export function useRoleDrag(
  roles: RoleDefinition[],
  setRoles: React.Dispatch<React.SetStateAction<RoleDefinition[]>>,
  apiMode = false,
) {
  const [dragRoleId, setDragRoleId] = useState<string | null>(null);
  const [dragOverRoleId, setDragOverRoleId] = useState<string | null>(null);

  const handleRoleDragStart = useCallback((e: React.DragEvent, roleId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', roleId);
    setDragRoleId(roleId);
  }, []);

  const handleRoleDragOver = useCallback(
    (e: React.DragEvent, roleId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (roleId !== dragOverRoleId) setDragOverRoleId(roleId);
    },
    [dragOverRoleId],
  );

  const handleRoleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (!sourceId || sourceId === targetId) {
        setDragRoleId(null);
        setDragOverRoleId(null);
        return;
      }
      const currentRoles = [...roles];
      const prevRoles = [...roles];
      const srcIdx = currentRoles.findIndex(r => r.id === sourceId);
      const tgtIdx = currentRoles.findIndex(r => r.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return;
      const [moved] = currentRoles.splice(srcIdx, 1);
      currentRoles.splice(tgtIdx, 0, moved);
      setRoles(currentRoles);
      setDragRoleId(null);
      setDragOverRoleId(null);
      if (apiMode) {
        userApi.reorderRoles(currentRoles.map(r => r.id)).catch((err: any) => {
          setRoles(prevRoles);
          alert(err?.message || '角色排序保存失败，已恢复原顺序。');
        });
      }
    },
    [roles, setRoles, apiMode],
  );

  const handleRoleDragEnd = useCallback(() => {
    setDragRoleId(null);
    setDragOverRoleId(null);
  }, []);

  return {
    dragRoleId,
    dragOverRoleId,
    handleRoleDragStart,
    handleRoleDragOver,
    handleRoleDrop,
    handleRoleDragEnd,
  };
}
