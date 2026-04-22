import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { X, Shield, Settings } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

interface UserDetailsDrawerProps {
  user: User;
  isClosing: boolean;
  getDepartmentPath: (deptId?: string) => string;
  onClose: () => void;
}

const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({ user, isClosing, getDepartmentPath, onClose }) => {
  const navigate = useNavigate();

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[500] flex justify-end">
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${isClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={onClose} />
        <div className={`relative w-full max-w-md bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col h-full border-l border-white/10 ${isClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
          <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">用户详情</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-400 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <img
                  src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
                  className="w-24 h-24 rounded-full object-cover bg-gray-100 border-4 border-white dark:border-[#2C2C2E] shadow-xl"
                  alt={user.name}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-[#2C2C2E] shadow-xl" style={{ display: 'none' }}>
                  {user.name.replace(/\s*\(.*\)\s*$/, '').slice(0, 1)}
                </div>
                {user.monthBadge && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-2 ring-white dark:ring-[#2C2C2E]">{user.monthBadge}</span>
                )}
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#1C1C1E] ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h4>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full text-xs font-bold border border-gray-200 dark:border-white/20">{user.userType}</span>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-white/10">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">账号 ID</div>
                  <div className="text-sm font-mono text-gray-900 dark:text-white">{user.accountId}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">当前状态</div>
                  <div className={`text-sm font-bold ${user.status === 'Active' ? 'text-green-600' : 'text-gray-400'}`}>{user.status}</div>
                </div>
                <div className="space-y-1 col-span-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">所属部门</div>
                  <div className="text-sm text-gray-900 dark:text-white">{getDepartmentPath(user.departmentId)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/10">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> 权限概览
              </h5>
              <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-xs text-gray-500 leading-relaxed">
                  该用户拥有 <span className="text-blue-600 font-bold">{user.roles?.join(', ')}</span> 角色对应的功能权限。
                  数据权限受限于所属部门 <span className="text-gray-900 dark:text-white font-medium">{getDepartmentPath(user.departmentId)}</span> 及其下属机构。
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 transition">关闭</button>
            <button
              onClick={() => { onClose(); navigate('/users', { state: { search: user.accountId } }); }}
              className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-80 transition flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" /> 管理账号
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default React.memo(UserDetailsDrawer);
