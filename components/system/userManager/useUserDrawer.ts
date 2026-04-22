import { useCallback, useState } from 'react';
import type { User } from '../../../types';

/** 用户详情侧边抽屉与员工卡片的开关状态。 */
export function useUserDrawer() {
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [isEmployeeCardOpen, setIsEmployeeCardOpen] = useState(false);

  const handleAvatarClick = useCallback((e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setDetailsUser(user);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setDetailsUser(null);
      setIsDrawerClosing(false);
    }, 280);
  }, []);

  return {
    detailsUser,
    setDetailsUser,
    isDrawerOpen,
    setIsDrawerOpen,
    isDrawerClosing,
    setIsDrawerClosing,
    isEmployeeCardOpen,
    setIsEmployeeCardOpen,
    handleAvatarClick,
    closeDrawer,
  };
}
