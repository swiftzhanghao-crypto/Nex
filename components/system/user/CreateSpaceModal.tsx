import React from 'react';
import { Box, Search, X } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import type { Space, SpaceRole, SpaceMember, User } from '../../../types';
import { spaceApi } from '../../../services/api';

export interface CreateSpaceModalProps {
  newSpaceName: string;
  setNewSpaceName: (v: string) => void;
  newSpaceDesc: string;
  setNewSpaceDesc: (v: string) => void;
  newSpaceAdminId: string;
  setNewSpaceAdminId: (v: string) => void;
  newSpaceAdminSearch: string;
  setNewSpaceAdminSearch: (v: string) => void;
  showAdminDropdown: boolean;
  setShowAdminDropdown: (v: boolean) => void;
  creatingSpace: boolean;
  setCreatingSpace: (v: boolean) => void;
  users: User[];
  spaces: Space[];
  setSpaces: React.Dispatch<React.SetStateAction<Space[]>>;
  refreshSpaces: () => Promise<void>;
  apiMode: boolean;
  onClose: () => void;
  onCreated: (spaceId: string) => void;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({
  newSpaceName, setNewSpaceName, newSpaceDesc, setNewSpaceDesc, newSpaceAdminId, setNewSpaceAdminId,
  newSpaceAdminSearch, setNewSpaceAdminSearch, showAdminDropdown, setShowAdminDropdown,
  creatingSpace, setCreatingSpace, users, spaces, setSpaces, refreshSpaces, apiMode, onClose, onCreated,
}) => {
  const resetCreateSpace = () => { onClose(); setNewSpaceName(''); setNewSpaceDesc(''); setNewSpaceAdminId(''); setNewSpaceAdminSearch(''); setShowAdminDropdown(false); };
  const selectedAdmin = users.find(u => u.id === newSpaceAdminId);
  const adminCandidates = users
    .filter(u => u.status === 'Active')
    .filter(u => !newSpaceAdminSearch || u.name.toLowerCase().includes(newSpaceAdminSearch.toLowerCase()) || u.email.toLowerCase().includes(newSpaceAdminSearch.toLowerCase()));
  return (
<ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-md flex flex-col animate-modal-enter border-white/10">
              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Box className="w-5 h-5" /> 添加应用</h3>
                <button onClick={resetCreateSpace} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">应用名称 <span className="text-red-500">*</span></label>
                  <input
                    value={newSpaceName}
                    onChange={e => setNewSpaceName(e.target.value)}
                    placeholder="例如：SAB 客户洞察"
                    className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white placeholder-gray-300"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">描述</label>
                  <textarea
                    value={newSpaceDesc}
                    onChange={e => setNewSpaceDesc(e.target.value)}
                    placeholder="应用用途说明（选填）"
                    rows={2}
                    className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white placeholder-gray-300 resize-none"
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">应用管理员 <span className="text-red-500">*</span></label>
                  {selectedAdmin ? (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {selectedAdmin.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedAdmin.name}</div>
                        <div className="text-xs text-gray-400 truncate">{selectedAdmin.email}</div>
                      </div>
                      <button onClick={() => { setNewSpaceAdminId(''); setNewSpaceAdminSearch(''); }} className="p-1 text-gray-400 hover:text-red-500 transition shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={newSpaceAdminSearch}
                          onChange={e => { setNewSpaceAdminSearch(e.target.value); setShowAdminDropdown(true); }}
                          onFocus={() => setShowAdminDropdown(true)}
                          placeholder="搜索并选择管理员..."
                          className="w-full pl-9 pr-3 p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      {showAdminDropdown && (
                        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-10 max-h-48 overflow-auto">
                          {adminCandidates.length === 0 ? (
                            <div className="p-3 text-xs text-gray-400 text-center">无匹配用户</div>
                          ) : adminCandidates.slice(0, 20).map(u => (
                            <button
                              key={u.id}
                              onClick={() => { setNewSpaceAdminId(u.id); setNewSpaceAdminSearch(''); setShowAdminDropdown(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left"
                            >
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {u.name.slice(0, 1)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-900 dark:text-white truncate">{u.name}</div>
                                <div className="text-xs text-gray-400 truncate">{u.email}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 pt-0 flex justify-end gap-3">
                <button
                  onClick={resetCreateSpace}
                  className="px-5 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                >取消</button>
                <button
                  onClick={async () => {
                    if (!newSpaceName.trim()) { alert('请输入应用名称'); return; }
                    if (!newSpaceAdminId) { alert('请选择应用管理员'); return; }
                    if (spaces.some(s => s.name === newSpaceName.trim())) {
                      alert('已存在同名应用');
                      return;
                    }
                    setCreatingSpace(true);
                    try {
                      let createdId: string;
                      if (apiMode) {
                        const created = await spaceApi.create({
                          name: newSpaceName.trim(),
                          description: newSpaceDesc.trim(),
                          adminUserId: newSpaceAdminId,
                          permTree: [], resourceConfig: [], columnConfig: [],
                        });
                        await refreshSpaces();
                        createdId = created.id;
                      } else {
                        const genId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
                        const newSpace: Space = {
                          id: genId('space_mock'),
                          name: newSpaceName.trim(),
                          description: newSpaceDesc.trim(),
                          icon: 'Box',
                          permTree: [],
                          resourceConfig: [],
                          columnConfig: [],
                          sortOrder: spaces.length,
                        };
                        const adminRole: SpaceRole = {
                          id: genId('sr'),
                          spaceId: newSpace.id,
                          name: '应用管理员',
                          description: '拥有该应用内所有权限，可管理角色、成员与配置',
                          permissions: [],
                          rowPermissions: [],
                          columnPermissions: [],
                          sortOrder: 0,
                        };
                        try { localStorage.setItem(`spaceMock:roles:${newSpace.id}`, JSON.stringify([adminRole])); } catch {}
                        const adminUser = users.find(u => u.id === newSpaceAdminId);
                        if (adminUser) {
                          const adminMember: SpaceMember = {
                            id: genId('sm'),
                            spaceId: newSpace.id,
                            userId: adminUser.id,
                            roleId: adminRole.id,
                            isAdmin: true,
                            userName: adminUser.name,
                            userEmail: adminUser.email,
                            roleName: adminRole.name,
                          };
                          try { localStorage.setItem(`spaceMock:members:${newSpace.id}`, JSON.stringify([adminMember])); } catch {}
                        }
                        setSpaces(prev => {
                          const next = [...prev, newSpace];
                          try { localStorage.setItem('spaceMock:list', JSON.stringify(next)); } catch {}
                          return next;
                        });
                        createdId = newSpace.id;
                      }
                      resetCreateSpace();
                      onCreated(createdId);
                    } catch (e: unknown) {
                      alert(e instanceof Error ? e.message : '创建失败');
                    } finally {
                      setCreatingSpace(false);
                    }
                  }}
                  disabled={creatingSpace || !newSpaceName.trim() || !newSpaceAdminId}
                  className="px-5 py-2.5 bg-[#0071E3] text-white rounded-full text-sm font-medium hover:bg-[#0062CC] transition shadow-sm disabled:opacity-40"
                >{creatingSpace ? '创建中...' : '创建应用'}</button>
              </div>
            </div>
          </div>
        </ModalPortal>
);
};

export default CreateSpaceModal;
