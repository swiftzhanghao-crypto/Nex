import React from 'react';
import { Search, X } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import type { User } from '../../../types';

export interface AddUserToRoleModalProps {
  users: User[];
  selectedRoleId: string | null;
  userSearchTerm: string;
  setUserSearchTerm: (v: string) => void;
  onClose: () => void;
  onAddUser: (userId: string) => void;
}

const AddUserToRoleModal: React.FC<AddUserToRoleModalProps> = ({
  users,
  selectedRoleId,
  userSearchTerm,
  setUserSearchTerm,
  onClose,
  onAddUser,
}) => {
  const q = userSearchTerm.toLowerCase();
  const candidates = users.filter(
    u =>
      selectedRoleId &&
      !u.roles?.includes(selectedRoleId) &&
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
  );

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
        <div className="unified-card dark:bg-[#1C1C1E] w-full max-w-2xl flex flex-col max-h-[80vh]">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
              <div className="unified-card dark:bg-[#1C1C1E] w-full max-w-2xl flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">添加用户到角色</h2>
                      <button onClick={() => onClose()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-4 border-b border-gray-100 dark:border-white/10">
                      <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                          <input 
                              value={userSearchTerm}
                              onChange={e => setUserSearchTerm(e.target.value)}
                              placeholder="搜索用户..."
                              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                          />
                      </div>
                  </div>
                  <div className="flex-1 overflow-auto p-2">
                      {users.filter(u => selectedRoleId && !u.roles?.includes(selectedRoleId) && (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))).map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="relative flex-shrink-0">
                                      <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                                      {user.monthBadge && (
                                          <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[8px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                                      )}
                                  </div>
                                  <div>
                                      <div className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</div>
                                      <div className="text-xs text-gray-500">{user.email}</div>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => onAddUser(user.id)}
                                  className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                              >
                                  添加
                              </button>
                          </div>
                      ))}
                      {users.filter(u => selectedRoleId && !u.roles?.includes(selectedRoleId) && (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))).length === 0 && (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                              没有找到可添加的用户
                          </div>
                      )}
                  </div>
              </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default AddUserToRoleModal;
