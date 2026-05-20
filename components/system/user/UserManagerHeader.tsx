import React from 'react';
import { Search, Plus, Globe, Box, X, Eye, User as UserIcon } from 'lucide-react';
import type { User, Space } from '../../../types';
import { MAIN_SPACE_ID } from './constants';
import { spaceApi } from '../../../services/api';

export interface UserManagerHeaderProps {
  activeTab: 'USERS' | 'ROLES';
  activeSpaceId: string;
  setActiveSpaceId: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  onOpenCreateUser: () => void;
  spaces: Space[];
  setSpaces: React.Dispatch<React.SetStateAction<Space[]>>;
  refreshSpaces: () => Promise<void>;
  apiMode: boolean;
  onShowCreateSpace: () => void;
  userPermSearch: string;
  setUserPermSearch: (v: string) => void;
  showUserPermDropdown: boolean;
  setShowUserPermDropdown: (v: boolean) => void;
  selectedPermUser: User | null;
  userPermSearchRef: React.RefObject<HTMLDivElement | null>;
  userPermSearchResults: User[];
  onSelectPermUser: (user: User) => void;
  onClearPermUser: () => void;
  getRoleName: (roleId: string) => string;
}

const UserManagerHeader: React.FC<UserManagerHeaderProps> = ({ activeTab, activeSpaceId, setActiveSpaceId, searchTerm, setSearchTerm, onOpenCreateUser, spaces, setSpaces, refreshSpaces, apiMode, onShowCreateSpace, userPermSearch, setUserPermSearch, showUserPermDropdown, setShowUserPermDropdown, selectedPermUser, userPermSearchRef, userPermSearchResults, onSelectPermUser, onClearPermUser: handleClearPermUser, getRoleName }) => (
<>
{/* Header */}
      <div className="flex items-center shrink-0 gap-4 flex-wrap min-w-0">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight shrink-0">
            {activeTab === 'USERS' ? '用户管理' : '角色管理'}
        </h1>

        {/* 用户 Tab: 搜索 + 新增 放在标题同行 */}
        {activeTab === 'USERS' && (
          <div className="flex items-center gap-3 ml-auto min-w-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索用户..."
                className="w-64 pl-9 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
              />
            </div>
            <button onClick={() => onOpenCreateUser()} className="bg-[#0071E3] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#0062CC] transition shadow-sm whitespace-nowrap">
              <Plus className="w-4 h-4" /> 新增用户
            </button>
          </div>
        )}

        {activeTab === 'ROLES' && (
          <div className="flex items-center gap-1 ml-2 min-w-0 overflow-x-auto no-scrollbar">
            {[
              { id: MAIN_SPACE_ID, label: '平台角色', icon: Globe },
              ...spaces.map(s => ({ id: s.id, label: s.name, icon: Box, isApp: true })),
            ].map(item => (
              <div key={item.id} className="relative group/tab flex items-center">
                <button
                  onClick={() => { setActiveSpaceId(item.id); handleClearPermUser(); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition border ${
                    activeSpaceId === item.id
                      ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-sm'
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </button>
                {'isApp' in item && item.isApp && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm(`确定要删除应用「${item.label}」吗？\n该操作将同时删除应用下的所有角色和成员，且不可恢复。`)) return;
                      try {
                        if (apiMode) {
                          await spaceApi.delete(item.id);
                          await refreshSpaces();
                        } else {
                          setSpaces(prev => prev.filter(s => s.id !== item.id));
                          try {
                            localStorage.removeItem(`spaceMock:roles:${item.id}`);
                            localStorage.removeItem(`spaceMock:members:${item.id}`);
                          } catch {}
                        }
                        if (activeSpaceId === item.id) setActiveSpaceId(MAIN_SPACE_ID);
                      } catch (err: unknown) {
                        alert(err instanceof Error ? err.message : '删除失败');
                      }
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/tab:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10"
                    title={`删除应用 ${item.label}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => onShowCreateSpace()}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-[#0071E3] hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-dashed border-gray-300 dark:border-white/20 hover:border-[#0071E3] transition"
              title="添加应用"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* User Permission Search - right side */}
        {activeTab === 'ROLES' && activeSpaceId === MAIN_SPACE_ID && (
          <div className="ml-auto relative" ref={userPermSearchRef}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={selectedPermUser ? '' : userPermSearch}
                onChange={e => { setUserPermSearch(e.target.value); setShowUserPermDropdown(true); }}
                onFocus={() => { if (userPermSearch) setShowUserPermDropdown(true); }}
                placeholder={selectedPermUser ? `${selectedPermUser.name} 的权限` : '搜索用户查看权限...'}
                className={`w-56 pl-8 pr-8 py-1.5 bg-white dark:bg-black border rounded-lg text-xs outline-none transition-all focus:ring-2 focus:ring-blue-500/20 dark:text-white placeholder:text-gray-400 ${
                  selectedPermUser
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-gray-200 dark:border-white/10'
                }`}
                readOnly={!!selectedPermUser}
                onClick={() => { if (selectedPermUser) handleClearPermUser(); }}
              />
              {selectedPermUser ? (
                <button
                  onClick={handleClearPermUser}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Eye className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            {showUserPermDropdown && userPermSearch.trim() && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                {userPermSearchResults.length > 0 ? (
                  <div className="max-h-64 overflow-auto py-1">
                    {userPermSearchResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => onSelectPermUser(u)}
                        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
                      >
                        <img src={u.avatar} alt="" className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-full flex-shrink-0">
                          {u.roles?.map(r => getRoleName(r)).join(', ') || '-'}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    <UserIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                    未找到匹配用户
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
</>
);

export default UserManagerHeader;
