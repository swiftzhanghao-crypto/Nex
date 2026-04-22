import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Shield, Trash2, Settings, Save, X, Copy, GripVertical } from 'lucide-react';
import type { Space, SpaceMember, SpaceRole } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { spaceApi } from '../../services/api';
import SpaceRoleDetail from './space/SpaceRoleDetail';
import ModalPortal from '../common/ModalPortal';

interface Props {
  spaceId: string;
}

// 仅在 mock 模式下使用：localStorage 持久化应用角色 / 成员，避免刷新丢失
const MOCK_PREFIX = 'spaceMock';
const mockStore = {
  loadRoles(spaceId: string): SpaceRole[] | null {
    try {
      const v = localStorage.getItem(`${MOCK_PREFIX}:roles:${spaceId}`);
      return v ? (JSON.parse(v) as SpaceRole[]) : null;
    } catch { return null; }
  },
  saveRoles(spaceId: string, roles: SpaceRole[]) {
    try { localStorage.setItem(`${MOCK_PREFIX}:roles:${spaceId}`, JSON.stringify(roles)); } catch {}
  },
  loadMembers(spaceId: string): SpaceMember[] | null {
    try {
      const v = localStorage.getItem(`${MOCK_PREFIX}:members:${spaceId}`);
      return v ? (JSON.parse(v) as SpaceMember[]) : null;
    } catch { return null; }
  },
  saveMembers(spaceId: string, members: SpaceMember[]) {
    try { localStorage.setItem(`${MOCK_PREFIX}:members:${spaceId}`, JSON.stringify(members)); } catch {}
  },
};

const genId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const SpaceRoleManager: React.FC<Props> = ({ spaceId }) => {
  const { spaces, setSpaces, users, apiMode, currentUser } = useAppContext();
  const [spaceRoles, setSpaceRoles] = useState<SpaceRole[]>([]);
  const [spaceMembers, setSpaceMembers] = useState<SpaceMember[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);

  // Drag & drop
  const [dragRoleId, setDragRoleId] = useState<string | null>(null);
  const [dragOverRoleId, setDragOverRoleId] = useState<string | null>(null);

  const space = useMemo(
    () => spaces.find(s => s.id === spaceId) || null,
    [spaces, spaceId],
  );

  const canManage = useMemo(() => {
    if (!space) return false;
    if (currentUser.roles?.includes('Admin')) return true;
    return spaceMembers.some(m => m.userId === currentUser.id && m.isAdmin);
  }, [space, currentUser, spaceMembers]);

  const fetchData = useCallback(async () => {
    if (!apiMode) {
      // Mock 模式：优先从 localStorage 读取；首次访问则用 seed 数据初始化
      const cachedRoles = mockStore.loadRoles(spaceId);
      if (cachedRoles) {
        setSpaceRoles(cachedRoles);
      } else {
        const { initialSpaceRoles } = await import('../../data/spaceSeedData');
        const seeded = initialSpaceRoles.filter(r => r.spaceId === spaceId);
        setSpaceRoles(seeded);
        mockStore.saveRoles(spaceId, seeded);
      }
      setSpaceMembers(mockStore.loadMembers(spaceId) || []);
      return;
    }
    setLoadingDetail(true);
    try {
      const [roles, members] = await Promise.all([
        spaceApi.listRoles(spaceId),
        spaceApi.listMembers(spaceId),
      ]);
      setSpaceRoles(roles as SpaceRole[]);
      setSpaceMembers(members as SpaceMember[]);
    } catch (e: any) {
      console.error('加载应用数据失败', e);
    } finally {
      setLoadingDetail(false);
    }
  }, [apiMode, spaceId]);

  useEffect(() => {
    fetchData();
    setSelectedRoleId(null);
    setIsEditingRole(false);
  }, [fetchData]);

  useEffect(() => {
    if (!selectedRoleId && spaceRoles.length > 0 && !isEditingRole) {
      setSelectedRoleId(spaceRoles[0].id);
    }
  }, [spaceRoles, selectedRoleId, isEditingRole]);

  const selectedRole = spaceRoles.find(r => r.id === selectedRoleId) || null;

  const handleCreateRole = () => {
    setSelectedRoleId('new');
    setIsEditingRole(true);
  };

  const handleSelectRole = (role: SpaceRole) => {
    setSelectedRoleId(role.id);
    setIsEditingRole(false);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('确定删除此角色？')) return;
    if (!apiMode) {
      // Mock：本地删除并联动清理该角色下的成员
      const nextRoles = spaceRoles.filter(r => r.id !== roleId);
      const nextMembers = spaceMembers.filter(m => m.roleId !== roleId);
      setSpaceRoles(nextRoles);
      setSpaceMembers(nextMembers);
      mockStore.saveRoles(spaceId, nextRoles);
      mockStore.saveMembers(spaceId, nextMembers);
      if (selectedRoleId === roleId) {
        setSelectedRoleId(null);
        setIsEditingRole(false);
      }
      return;
    }
    try {
      await spaceApi.deleteRole(spaceId, roleId);
      if (selectedRoleId === roleId) {
        setSelectedRoleId(null);
        setIsEditingRole(false);
      }
      fetchData();
    } catch (e: any) {
      alert(e?.message || '删除失败');
    }
  };

  const handleCopyRole = async (role: SpaceRole) => {
    if (!apiMode) {
      // Mock：本地复制
      const newId = genId('srole_mock');
      const copied: SpaceRole = {
        ...role,
        id: newId,
        name: `${role.name} (副本)`,
        permissions: [...(role.permissions || [])],
        rowPermissions: (role.rowPermissions || []).map(r => ({
          ...r,
          id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        })),
        rowLogic: role.rowLogic ? JSON.parse(JSON.stringify(role.rowLogic)) : {},
        columnPermissions: (role.columnPermissions || []).map(r => ({ ...r })),
        sortOrder: spaceRoles.length,
      };
      const next = [...spaceRoles, copied];
      setSpaceRoles(next);
      mockStore.saveRoles(spaceId, next);
      setSelectedRoleId(newId);
      setIsEditingRole(true);
      return;
    }
    try {
      const created = await spaceApi.createRole(spaceId, {
        name: `${role.name} (副本)`,
        description: role.description,
        permissions: [...(role.permissions || [])],
        rowPermissions: (role.rowPermissions || []).map(r => ({ ...r, id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
        rowLogic: role.rowLogic ? JSON.parse(JSON.stringify(role.rowLogic)) : {},
        columnPermissions: (role.columnPermissions || []).map(r => ({ ...r })),
      });
      setSelectedRoleId((created as SpaceRole).id);
      setIsEditingRole(true);
      await fetchData();
    } catch (e: any) {
      alert(e?.message || '复制失败');
    }
  };

  // Mock 模式下的成员增/减回调
  const handleMockAddMember = useCallback((userId: string, roleId: string) => {
    const user = users.find(u => u.id === userId);
    const role = spaceRoles.find(r => r.id === roleId);
    const newMember: SpaceMember = {
      id: genId('smem_mock'),
      spaceId,
      userId,
      userName: user?.name || userId,
      userEmail: user?.email || '',
      userAvatar: user?.avatar,
      departmentId: user?.departmentId,
      roleId,
      roleName: role?.name || '',
      isAdmin: false,
    };
    setSpaceMembers(prev => {
      const next = [...prev, newMember];
      mockStore.saveMembers(spaceId, next);
      return next;
    });
  }, [users, spaceRoles, spaceId]);

  const handleMockRemoveMember = useCallback((memberId: string) => {
    setSpaceMembers(prev => {
      const next = prev.filter(m => m.id !== memberId);
      mockStore.saveMembers(spaceId, next);
      return next;
    });
  }, [spaceId]);

  const handleRoleSaved = async (savedRole?: SpaceRole) => {
    if (!apiMode) {
      // Mock：upsert 本地 state 并持久化
      if (savedRole) {
        setSpaceRoles(prev => {
          const exists = prev.some(r => r.id === savedRole.id);
          const next = exists
            ? prev.map(r => (r.id === savedRole.id ? savedRole : r))
            : [...prev, { ...savedRole, sortOrder: savedRole.sortOrder ?? prev.length }];
          mockStore.saveRoles(spaceId, next);
          return next;
        });
        setSelectedRoleId(savedRole.id);
      }
      setIsEditingRole(false);
      return;
    }
    if (savedRole) {
      setSelectedRoleId(savedRole.id);
    }
    setIsEditingRole(false);
    setLoadingDetail(true);
    try {
      const [roles, members] = await Promise.all([
        spaceApi.listRoles(spaceId),
        spaceApi.listMembers(spaceId),
      ]);
      setSpaceRoles(roles as SpaceRole[]);
      setSpaceMembers(members as SpaceMember[]);
    } catch (e: any) {
      console.error('加载应用数据失败', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, roleId: string) => {
    setDragRoleId(roleId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, roleId: string) => {
    e.preventDefault();
    if (roleId !== dragRoleId) setDragOverRoleId(roleId);
  };
  const handleDrop = async (e: React.DragEvent, targetRoleId: string) => {
    e.preventDefault();
    if (!dragRoleId || dragRoleId === targetRoleId) { setDragRoleId(null); setDragOverRoleId(null); return; }
    const fromIdx = spaceRoles.findIndex(r => r.id === dragRoleId);
    const toIdx = spaceRoles.findIndex(r => r.id === targetRoleId);
    if (fromIdx < 0 || toIdx < 0) { setDragRoleId(null); setDragOverRoleId(null); return; }
    const reordered = [...spaceRoles];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    // 重排时同步刷新 sortOrder，保持序号一致
    const withOrder = reordered.map((r, idx) => ({ ...r, sortOrder: idx }));
    setSpaceRoles(withOrder);
    setDragRoleId(null);
    setDragOverRoleId(null);
    if (!apiMode) {
      mockStore.saveRoles(spaceId, withOrder);
    } else {
      // API 模式：批量持久化排序（如后端有专门接口可替换为更轻量调用）
      try {
        await Promise.all(
          withOrder.map(r => spaceApi.updateRole(spaceId, r.id, { sortOrder: r.sortOrder })),
        );
      } catch (e: any) {
        console.error('排序持久化失败', e);
      }
    }
  };
  const handleDragEnd = () => { setDragRoleId(null); setDragOverRoleId(null); };

  if (!space) {
    return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">应用不存在</div>;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-fade-in gap-3">
      {loadingDetail ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">加载中…</div>
      ) : (
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Role List */}
          <div className="unified-card w-1/4 min-w-[250px] dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
              <h3 className="font-bold text-gray-800 dark:text-white flex-1">应用角色</h3>
              {canManage && (
                <>
                  <button onClick={handleCreateRole} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400" title="新建角色">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowSettings(true)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400" title="应用设置">
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="px-3 pt-3 pb-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={roleSearchTerm}
                  onChange={e => setRoleSearchTerm(e.target.value)}
                  placeholder="搜索角色..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-0.5">
              {spaceRoles
                .filter(r => !roleSearchTerm || r.name.toLowerCase().includes(roleSearchTerm.toLowerCase()))
                .map(role => (
                  <div
                    key={role.id}
                    draggable={!roleSearchTerm && canManage}
                    onDragStart={(e) => handleDragStart(e, role.id)}
                    onDragOver={(e) => handleDragOver(e, role.id)}
                    onDrop={(e) => handleDrop(e, role.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleSelectRole(role)}
                    className={`p-2.5 pl-1 rounded-lg cursor-pointer transition-all flex items-center group
                      ${selectedRoleId === role.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}
                      ${dragRoleId === role.id ? 'opacity-40' : ''}
                      ${dragOverRoleId === role.id && dragRoleId !== role.id ? 'ring-2 ring-blue-400 dark:ring-blue-500 ring-dashed bg-blue-50/50 dark:bg-blue-900/10' : ''}
                    `}
                  >
                    {!roleSearchTerm && canManage && (
                      <div className="flex-shrink-0 cursor-grab active:cursor-grabbing px-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                           onMouseDown={e => e.stopPropagation()}>
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="flex-1 flex justify-between items-center min-w-0">
                      <div className="font-medium text-sm truncate">{role.name}</div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {canManage && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyRole(role); }}
                              className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="复制角色"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {spaceRoles.length === 0 && !isEditingRole && (
                <div className="px-3 py-8 text-center text-xs text-gray-400">暂无角色，点击 + 创建</div>
              )}
            </div>
          </div>

          {/* Role Detail */}
          <div className="unified-card flex-1 dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col overflow-hidden">
            {(selectedRole || selectedRoleId === 'new') ? (
              <SpaceRoleDetail
                key={selectedRoleId === 'new' ? 'new' : selectedRole!.id}
                space={space}
                role={selectedRoleId === 'new' ? null : selectedRole!}
                canEdit={canManage}
                apiMode={apiMode}
                onSaved={handleRoleSaved}
                members={spaceMembers}
                allUsers={users}
                onMembersChange={fetchData}
                onMockAddMember={handleMockAddMember}
                onMockRemoveMember={handleMockRemoveMember}
                initialEditing={isEditingRole}
                onCancelNew={() => {
                  if (selectedRoleId === 'new') {
                    setSelectedRoleId(spaceRoles.length > 0 ? spaceRoles[0].id : null);
                  }
                  setIsEditingRole(false);
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Shield className="w-12 h-12 mb-2 opacity-20" />
                <p>请选择或创建一个应用角色</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 应用设置弹窗 */}
      {showSettings && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl flex flex-col animate-modal-enter border-white/10 max-h-[80vh]">
              <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5 shrink-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5" /> 应用设置</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <SettingsPanel
                  space={space}
                  canManage={canManage}
                  apiMode={apiMode}
                  onUpdated={(updated) => {
                    setSpaces(prev => prev.map(s => (s.id === updated.id ? updated : s)));
                  }}
                />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default SpaceRoleManager;

// =========================================================================
// SettingsPanel
// =========================================================================
const SettingsPanel: React.FC<{
  space: Space;
  canManage: boolean;
  apiMode: boolean;
  onUpdated: (space: Space) => void;
}> = ({ space, canManage, apiMode, onUpdated }) => {
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description);
  const [permTreeText, setPermTreeText] = useState(() => JSON.stringify(space.permTree, null, 2));
  const [resourceText, setResourceText] = useState(() => JSON.stringify(space.resourceConfig, null, 2));
  const [columnText, setColumnText] = useState(() => JSON.stringify(space.columnConfig, null, 2));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(space.name);
    setDescription(space.description);
    setPermTreeText(JSON.stringify(space.permTree, null, 2));
    setResourceText(JSON.stringify(space.resourceConfig, null, 2));
    setColumnText(JSON.stringify(space.columnConfig, null, 2));
  }, [space]);

  const handleSave = async () => {
    let permTree: any, resourceConfig: any, columnConfig: any;
    try {
      permTree = JSON.parse(permTreeText);
      resourceConfig = JSON.parse(resourceText);
      columnConfig = JSON.parse(columnText);
    } catch {
      alert('权限树/资源/列配置 JSON 格式错误');
      return;
    }
    setSaving(true);
    try {
      if (apiMode) {
        const updated = await spaceApi.update(space.id, { name, description, permTree, resourceConfig, columnConfig });
        onUpdated(updated as Space);
      } else {
        onUpdated({ ...space, name, description, permTree, resourceConfig, columnConfig });
      }
      alert('保存成功');
    } catch (e: any) {
      alert(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const disabled = !canManage;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">应用名称</label>
          <input disabled={disabled} value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-md disabled:opacity-60" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">应用 ID</label>
          <input value={space.id} disabled className="w-full px-3 py-1.5 text-sm bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md text-gray-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">描述</label>
          <textarea disabled={disabled} value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-md disabled:opacity-60" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">权限树（JSON）</label>
        <textarea disabled={disabled} value={permTreeText} onChange={e => setPermTreeText(e.target.value)} rows={10}
          className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-md disabled:opacity-60" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">行权限资源配置（JSON）</label>
          <textarea disabled={disabled} value={resourceText} onChange={e => setResourceText(e.target.value)} rows={8}
            className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-md disabled:opacity-60" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">列权限配置（JSON）</label>
          <textarea disabled={disabled} value={columnText} onChange={e => setColumnText(e.target.value)} rows={8}
            className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-md disabled:opacity-60" />
        </div>
      </div>
      {canManage && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="bg-[#0071E3] text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-[#0062CC] transition disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? '保存中…' : '保存设置'}
          </button>
        </div>
      )}
    </div>
  );
};
