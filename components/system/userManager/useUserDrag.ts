import { useCallback, useState } from 'react';
import type { User } from '../../../types';
import { userApi } from '../../../services/api';

/**
 * 用户列表拖拽重排序，模式与 useRoleDrag 一致：
 * 拖拽落地后乐观更新本地列表，API 模式下后台持久化，失败时回滚。
 */
export function useUserDrag(
  users: User[],
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  apiMode = false,
) {
  const [dragUserId, setDragUserId] = useState<string | null>(null);
  const [dragOverUserId, setDragOverUserId] = useState<string | null>(null);

  const handleUserDragStart = useCallback((e: React.DragEvent, userId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', userId);
    setDragUserId(userId);
  }, []);

  const handleUserDragOver = useCallback(
    (e: React.DragEvent, userId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (userId !== dragOverUserId) setDragOverUserId(userId);
    },
    [dragOverUserId],
  );

  const handleUserDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (!sourceId || sourceId === targetId) {
        setDragUserId(null);
        setDragOverUserId(null);
        return;
      }
      const current = [...users];
      const prev = [...users];
      const srcIdx = current.findIndex(u => u.id === sourceId);
      const tgtIdx = current.findIndex(u => u.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return;
      const [moved] = current.splice(srcIdx, 1);
      current.splice(tgtIdx, 0, moved);
      setUsers(current);
      setDragUserId(null);
      setDragOverUserId(null);
      if (apiMode) {
        userApi.reorderUsers(current.map(u => u.id)).catch((err: any) => {
          setUsers(prev);
          alert(err?.message || '用户排序保存失败，已恢复原顺序。');
        });
      }
    },
    [users, setUsers, apiMode],
  );

  const handleUserDragEnd = useCallback(() => {
    setDragUserId(null);
    setDragOverUserId(null);
  }, []);

  return {
    dragUserId,
    dragOverUserId,
    handleUserDragStart,
    handleUserDragOver,
    handleUserDrop,
    handleUserDragEnd,
  };
}
