import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Shield, Save, Columns, Database, CheckSquare, ChevronDown, ChevronRight,
  Check, Plus, Trash2, User as UserIcon, Edit, Copy, X, Search,
} from 'lucide-react';
import type { Space, SpaceRole, SpaceMember, User } from '../../../types';
import { spaceApi } from '../../../services/api';
import { usePermissionTreeExpansion } from '../userManager/usePermissionTreeExpansion';
import { useFunctionalPermissions } from '../userManager/useFunctionalPermissions';
import type { PermGroup } from '../permissionConfig';
import { getSubgroupPermIds } from '../permissionConfig';
import ModalPortal from '../../common/ModalPortal';

/* ── 维度值多选下拉 ── */
const DimensionDropdown: React.FC<{
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (val: string) => void;
}> = ({ options, selected, onToggle }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const unselectedCount = options.length - selected.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-dashed border-gray-300 dark:border-white/20 transition-colors"
      >
        <Plus className="w-3 h-3" />
        {unselectedCount > 0 ? `选择 (${unselectedCount})` : '已全选'}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 w-56 max-h-[280px] flex flex-col overflow-hidden animate-modal-enter">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-white/5 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索..."
                className="flex-1 text-xs bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-400">无匹配项</div>
            ) : (
              filtered.map(opt => {
                const isSelected = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => onToggle(opt.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

type ConfigTab = 'FUNCTIONAL' | 'ROW' | 'COLUMN';
type DetailTab = 'MEMBERS' | 'FUNCTIONAL' | 'ROW' | 'COLUMN';

interface Props {
  space: Space;
  role: SpaceRole | null;
  canEdit: boolean;
  apiMode: boolean;
  onSaved: (savedRole?: SpaceRole) => void;
  members?: SpaceMember[];
  allUsers?: User[];
  onMembersChange?: () => void;
  /** Mock 模式下添加成员到角色（API 模式由组件内部直接调接口） */
  onMockAddMember?: (userId: string, roleId: string) => void;
  /** Mock 模式下从角色移除成员 */
  onMockRemoveMember?: (memberId: string) => void;
  initialEditing?: boolean;
  onCancelNew?: () => void;
}

const EMPTY_ROLE: Partial<SpaceRole> = {
  name: '',
  description: '',
  permissions: [],
  rowPermissions: [],
  rowLogic: {},
  columnPermissions: [],
};

const SpaceRoleDetail: React.FC<Props> = ({
  space, role, canEdit, apiMode, onSaved,
  members = [], allUsers = [], onMembersChange,
  onMockAddMember, onMockRemoveMember,
  initialEditing = false, onCancelNew,
}) => {
  const isNew = role === null;
  const [isEditing, setIsEditing] = useState(isNew || initialEditing);
  const [configTab, setConfigTab] = useState<ConfigTab>('FUNCTIONAL');
  const [detailTab, setDetailTab] = useState<DetailTab>('MEMBERS');
  const [form, setForm] = useState<Partial<SpaceRole>>(() => isNew ? { ...EMPTY_ROLE } : { ...role });
  const [saving, setSaving] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  useEffect(() => {
    if (isNew) {
      setForm({ ...EMPTY_ROLE });
      setIsEditing(true);
    } else {
      setForm({ ...role });
      setIsEditing(initialEditing);
    }
  }, [role, isNew, initialEditing]);

  const safeEditing = isEditing || isNew;

  const setFormPatch: React.Dispatch<React.SetStateAction<Partial<SpaceRole>>> = (v) => {
    setForm(prev => (typeof v === 'function' ? (v as any)(prev) : v));
  };

  const treeAsPermGroup = useMemo(() => {
    return space.permTree.map<PermGroup>(g => ({
      id: g.id,
      label: g.label,
      subgroups: g.subgroups.map(sg => ({
        id: sg.id,
        label: sg.label,
        permissions: sg.permissions?.map(p => ({ id: p.id, label: p.label, desc: p.desc || '' })),
        categories: sg.categories?.map(c => ({
          id: c.id,
          label: c.label,
          permissions: c.permissions.map(p => ({ id: p.id, label: p.label, desc: p.desc || '' })),
        })),
      })),
    }));
  }, [space.permTree]);

  const {
    expandedGroups, setExpandedGroups,
    expandedSubgroups, setExpandedSubgroups,
    expandedCategories, setExpandedCategories,
    toggleGroupExpand, toggleSubgroupExpand, toggleCategoryExpand,
    allPermsInSubgroup, allPermsInGroup, allPermsInCategory, getCheckState,
  } = usePermissionTreeExpansion(treeAsPermGroup);

  const { togglePermission, toggleModule, toggleSubgroupPerms, toggleCategoryPerms } =
    useFunctionalPermissions(form, setFormPatch, getCheckState, allPermsInSubgroup, allPermsInCategory, treeAsPermGroup);

  const selectedPerms: string[] = form.permissions || [];

  const roleMembers = useMemo(
    () => role ? members.filter(m => m.roleId === role.id) : [],
    [members, role],
  );
  const userMap = useMemo(() => {
    const m = new Map<string, User>();
    allUsers.forEach(u => m.set(u.id, u));
    return m;
  }, [allUsers]);

  const [selectedResource, setSelectedResource] = useState<string>(
    () => space.resourceConfig[0]?.id || '',
  );
  useEffect(() => {
    if (space.resourceConfig.length > 0 && !space.resourceConfig.find(r => r.id === selectedResource)) {
      setSelectedResource(space.resourceConfig[0].id);
    }
  }, [space.resourceConfig, selectedResource]);

  const [selectedColResource, setSelectedColResource] = useState<string>(
    () => space.columnConfig[0]?.id || '',
  );

  const handleSave = async () => {
    if (!form.name?.trim()) { alert('请输入角色名称'); return; }
    setSaving(true);
    try {
      if (apiMode) {
        const payload = {
          name: form.name,
          description: form.description ?? '',
          permissions: form.permissions ?? [],
          rowPermissions: form.rowPermissions ?? [],
          rowLogic: form.rowLogic ?? {},
          columnPermissions: form.columnPermissions ?? [],
        };
        if (isNew) {
          const created = await spaceApi.createRole(space.id, payload);
          onSaved(created as SpaceRole);
        } else {
          await spaceApi.updateRole(space.id, role!.id, payload);
          onSaved({ ...(role as SpaceRole), ...payload });
        }
      } else {
        // Mock 模式：构造完整 SpaceRole 回传给父组件由其负责持久化（localStorage）
        const builtRole: SpaceRole = isNew
          ? {
              id: `srole_mock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
              spaceId: space.id,
              name: form.name!.trim(),
              description: form.description ?? '',
              permissions: form.permissions ?? [],
              rowPermissions: form.rowPermissions ?? [],
              rowLogic: form.rowLogic ?? {},
              columnPermissions: form.columnPermissions ?? [],
              sortOrder: 999,
            }
          : {
              ...(role as SpaceRole),
              name: form.name!.trim(),
              description: form.description ?? '',
              permissions: form.permissions ?? [],
              rowPermissions: form.rowPermissions ?? [],
              rowLogic: form.rowLogic ?? {},
              columnPermissions: form.columnPermissions ?? [],
            };
        setIsEditing(false);
        onSaved(builtRole);
      }
    } catch (e: any) {
      alert(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isNew) {
      onCancelNew?.();
    } else {
      setForm({ ...role! });
      setIsEditing(false);
    }
  };

  const handleAddMemberToRole = async (userId: string) => {
    if (!role) return;
    if (!apiMode) {
      onMockAddMember?.(userId, role.id);
      return;
    }
    try {
      await spaceApi.addMember(space.id, { userId, roleId: role.id, isAdmin: false });
      onMembersChange?.();
    } catch (e: any) {
      alert(e?.message || '添加失败');
    }
  };

  const handleRemoveMemberFromRole = async (member: SpaceMember) => {
    if (!apiMode) {
      onMockRemoveMember?.(member.id);
      return;
    }
    try {
      await spaceApi.removeMember(space.id, member.id);
      onMembersChange?.();
    } catch (e: any) {
      alert(e?.message || '移除失败');
    }
  };

  // Available users for adding to this role
  const existingMemberUserIds = useMemo(() => members.map(m => m.userId), [members]);

  return (
    <div className="h-full flex flex-col">
      {safeEditing ? (
        /* ========== 编辑模式 ========== */
        <>
          <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
            <div>
              <input
                value={form.name || ''}
                onChange={e => setFormPatch(prev => ({ ...prev, name: e.target.value }))}
                className="text-xl font-bold text-gray-900 dark:text-white bg-transparent outline-none placeholder-gray-300"
                placeholder="角色名称"
                autoFocus={isNew}
              />
              <input
                value={form.description || ''}
                onChange={e => setFormPatch(prev => ({ ...prev, description: e.target.value }))}
                className="text-sm text-gray-500 dark:text-gray-400 bg-transparent outline-none w-full mt-1 placeholder-gray-300"
                placeholder="角色描述..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-1.5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >取消</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm hover:opacity-80 transition flex items-center gap-1"
              ><Save className="w-4 h-4" /> {saving ? '保存中…' : '保存配置'}</button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {/* Sticky tabs */}
            <div className="sticky top-0 z-20 bg-white dark:bg-[#1C1C1E] px-6 pt-4 pb-0 border-b border-gray-100 dark:border-white/10">
              <div className="flex gap-6">
                {([
                  { id: 'FUNCTIONAL' as ConfigTab, icon: CheckSquare, label: '功能权限' },
                  { id: 'ROW' as ConfigTab, icon: Database, label: '数据行权限' },
                  { id: 'COLUMN' as ConfigTab, icon: Columns, label: '数据列权限' },
                ]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setConfigTab(t.id)}
                    className={`pb-3 text-sm font-bold transition-colors relative ${configTab === t.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  >
                    <div className="flex items-center gap-2"><t.icon className="w-4 h-4" /> {t.label}</div>
                    {configTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 功能权限编辑 */}
              {configTab === 'FUNCTIONAL' && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs text-gray-400">已选 <strong className="text-[#0071E3]">{selectedPerms.length}</strong> 个权限点</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setExpandedGroups(treeAsPermGroup.map(g => g.id)); setExpandedSubgroups(treeAsPermGroup.flatMap(g => g.subgroups.map(sg => sg.id))); setExpandedCategories(treeAsPermGroup.flatMap(g => g.subgroups.flatMap(sg => (sg.categories || []).map(c => c.id)))); }} className="text-xs text-gray-400 hover:text-gray-600 hover:underline">展开全部</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => { setExpandedGroups([]); setExpandedSubgroups([]); setExpandedCategories([]); }} className="text-xs text-gray-400 hover:text-gray-600 hover:underline">折叠全部</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => setFormPatch(prev => ({ ...prev, permissions: treeAsPermGroup.flatMap(g => g.subgroups.flatMap(sg => getSubgroupPermIds(sg))) }))} className="text-xs text-[#0071E3] hover:underline">全选</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => setFormPatch(prev => ({ ...prev, permissions: [] }))} className="text-xs text-gray-400 hover:text-gray-600 hover:underline">清空</button>
                    </div>
                  </div>
                  {treeAsPermGroup.length === 0 && (
                    <div className="text-center text-xs text-gray-400 py-10 border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                      该应用尚未配置权限树，请先到「应用设置」中定义
                    </div>
                  )}
                  <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1C1C1E]">
                    {treeAsPermGroup.map((group, gIdx) => {
                      const current = form.permissions || [];
                      const groupPerms = allPermsInGroup(group);
                      const groupState = getCheckState(groupPerms, current);
                      const isGroupOpen = expandedGroups.includes(group.id);
                      return (
                        <div key={group.id} className={gIdx > 0 ? 'border-t border-gray-100 dark:border-white/10' : ''}>
                          <div className={`flex items-center gap-2.5 px-4 py-2.5 select-none transition-colors ${groupState !== 'none' ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50/50'}`}>
                            <button onClick={() => toggleGroupExpand(group.id)} className="text-gray-400 hover:text-gray-600 shrink-0">
                              {isGroupOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <div onClick={() => toggleModule(group.id)} className="flex items-center gap-2 flex-1 cursor-pointer group">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${groupState === 'all' ? 'bg-blue-600 border-blue-600' : groupState === 'some' ? 'bg-blue-400/60 border-blue-400' : 'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600 group-hover:border-blue-400'}`}>
                                {groupState !== 'none' && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{group.label}</span>
                              <span className="text-[11px] text-gray-400 font-mono">{groupPerms.filter(id => current.includes(id)).length}/{groupPerms.length}</span>
                            </div>
                          </div>
                          {isGroupOpen && group.subgroups.map(sg => {
                            const sgPerms = allPermsInSubgroup(sg);
                            const sgState = getCheckState(sgPerms, current);
                            const isSgOpen = expandedSubgroups.includes(sg.id);
                            return (
                              <div key={sg.id}>
                                <div className={`flex items-center gap-2.5 py-2 pr-4 select-none ${sgState !== 'none' ? 'bg-blue-50/30 dark:bg-blue-900/5' : 'hover:bg-gray-50/50'}`} style={{ paddingLeft: 44 }}>
                                  <div className="w-px h-4 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0" />
                                  <button onClick={() => toggleSubgroupExpand(sg.id)} className="text-gray-400 hover:text-gray-600 shrink-0">
                                    {isSgOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  </button>
                                  <div onClick={() => toggleSubgroupPerms(sg)} className="flex items-center gap-2 flex-1 cursor-pointer group">
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${sgState === 'all' ? 'bg-blue-600 border-blue-600' : sgState === 'some' ? 'bg-blue-400/60 border-blue-400' : 'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600 group-hover:border-blue-400'}`}>
                                      {sgState !== 'none' && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{sg.label}</span>
                                    <span className="text-[11px] text-gray-400 font-mono">{sgPerms.filter(id => current.includes(id)).length}/{sgPerms.length}</span>
                                  </div>
                                </div>
                                {isSgOpen && sg.categories && sg.categories.map(cat => {
                                  const catPerms = allPermsInCategory(cat);
                                  const catState = getCheckState(catPerms, current);
                                  const isCatOpen = expandedCategories.includes(cat.id);
                                  return (
                                    <div key={cat.id}>
                                      <div className={`flex items-center gap-2 py-1.5 pr-4 select-none ${catState !== 'none' ? 'bg-blue-50/20 dark:bg-blue-900/5' : 'hover:bg-gray-50/50'}`} style={{ paddingLeft: 68 }}>
                                        <div className="w-px h-3.5 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-0.5 shrink-0" />
                                        <button onClick={() => toggleCategoryExpand(cat.id)} className="text-gray-400 hover:text-gray-600 shrink-0">
                                          {isCatOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </button>
                                        <div onClick={() => toggleCategoryPerms(cat)} className="flex items-center gap-1.5 flex-1 cursor-pointer group">
                                          <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${catState === 'all' ? 'bg-blue-600 border-blue-600' : catState === 'some' ? 'bg-blue-400/60 border-blue-400' : 'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600 group-hover:border-blue-400'}`}>
                                            {catState !== 'none' && <Check className="w-2 h-2 text-white" />}
                                          </div>
                                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{cat.label}</span>
                                          <span className="text-[10px] text-gray-400 font-mono">{catPerms.filter(id => current.includes(id)).length}/{catPerms.length}</span>
                                        </div>
                                      </div>
                                      {isCatOpen && cat.permissions.map(perm => {
                                        const isChecked = current.includes(perm.id);
                                        return (
                                          <div key={perm.id} onClick={() => togglePermission(perm.id)} className={`flex items-center gap-2.5 py-1.5 pr-4 cursor-pointer select-none ${isChecked ? 'bg-blue-50/20 dark:bg-blue-900/5' : 'hover:bg-gray-50/50'}`} style={{ paddingLeft: 96 }}>
                                            <div className="w-px h-3.5 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0" />
                                            <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600'}`}>
                                              {isChecked && <Check className="w-2 h-2 text-white" />}
                                            </div>
                                            <span className={`text-xs flex-1 ${isChecked ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{perm.label}</span>
                                            {perm.desc && <span className="text-[10px] text-gray-400 truncate max-w-[180px]">{perm.desc}</span>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                                {isSgOpen && !sg.categories && sg.permissions && sg.permissions.map(perm => {
                                  const isChecked = current.includes(perm.id);
                                  return (
                                    <div key={perm.id} onClick={() => togglePermission(perm.id)} className={`flex items-center gap-2.5 py-1.5 pr-4 cursor-pointer select-none ${isChecked ? 'bg-blue-50/20 dark:bg-blue-900/5' : 'hover:bg-gray-50/50'}`} style={{ paddingLeft: 72 }}>
                                      <div className="w-px h-4 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0" />
                                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600'}`}>
                                        {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                                      </div>
                                      <span className={`text-sm flex-1 ${isChecked ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{perm.label}</span>
                                      {perm.desc && <span className="text-[10px] text-gray-400 truncate max-w-[180px]">{perm.desc}</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 行权限编辑 */}
              {configTab === 'ROW' && (
                <div className="animate-fade-in" style={{ height: 'calc(100vh - 240px)', minHeight: '420px' }}>
                  {space.resourceConfig.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">该应用未配置行权限资源</div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 flex h-full">
                      <div className="w-[180px] min-w-[180px] border-r border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] flex flex-col">
                        <div className="px-4 pt-4 pb-2 shrink-0">
                          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">数据资源</div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                          {space.resourceConfig.map(res => {
                            const rulesCount = (form.rowPermissions ?? []).filter(r => r.resource === res.id).length;
                            const isActive = selectedResource === res.id;
                            return (
                              <button key={res.id} onClick={() => setSelectedResource(res.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{res.label}</div>
                                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                    {rulesCount > 0 ? `${rulesCount} 条维度规则` : `${res.dimensions.length} 个可选维度`}
                                  </div>
                                </div>
                                {rulesCount > 0 && <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{rulesCount}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                        {(() => {
                          const resCfg = space.resourceConfig.find(r => r.id === selectedResource);
                          if (!resCfg) return null;
                          const resourceRules = (form.rowPermissions ?? []).filter(r => r.resource === selectedResource);
                          return (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">{resCfg.label} — 行权限配置</h4>
                              </div>
                              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">维度规则</div>
                              <div className="space-y-0">
                                {resourceRules.length > 0 ? (
                                  <div className="space-y-0">
                                    {resourceRules.map((rule, ruleIdx) => (
                                      <React.Fragment key={rule.id}>
                                        {ruleIdx > 0 && (
                                          <div className="flex items-center justify-center py-1">
                                            <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10" />
                                            <span className="mx-2.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wider bg-blue-500 dark:bg-blue-600 text-white shadow-sm">AND</span>
                                            <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10" />
                                          </div>
                                        )}
                                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] flex items-stretch gap-0">
                                          <div className="flex items-center justify-center w-10 min-w-[40px] border-r border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] text-xs font-bold text-gray-400 dark:text-gray-500 rounded-l-xl shrink-0">{ruleIdx + 1}</div>
                                          <div className="shrink-0">
                                            <div className="flex items-center gap-1.5 min-w-[80px] h-full px-3 py-2 border-r border-gray-200 dark:border-white/10 text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-900/15">
                                              <select
                                                value={rule.dimension}
                                                onChange={e => setFormPatch(prev => ({
                                                  ...prev,
                                                  rowPermissions: (prev.rowPermissions || []).map(r => r.id === rule.id ? { ...r, dimension: e.target.value, values: [] } : r),
                                                }))}
                                                className="bg-transparent text-sm font-bold text-blue-700 dark:text-blue-300 outline-none cursor-pointer"
                                              >
                                                {resCfg.dimensions.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                              </select>
                                            </div>
                                          </div>
                                          <div className="flex items-center px-3 border-r border-gray-200 dark:border-white/10 shrink-0">
                                            <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">等于</span>
                                          </div>
                                          <div className="flex-1 px-3 py-2 min-h-[40px] flex items-center flex-wrap gap-1.5 relative" data-dim-dropdown>
                                            {(() => {
                                              const dimCfg = resCfg.dimensions.find(d => d.id === rule.dimension);
                                              const hasOptions = dimCfg?.options && dimCfg.options.length > 0;
                                              if (!hasOptions) {
                                                return (
                                                  <input
                                                    value={(rule.values || []).join(', ')}
                                                    onChange={e => setFormPatch(prev => ({
                                                      ...prev,
                                                      rowPermissions: (prev.rowPermissions || []).map(r => r.id === rule.id ? { ...r, values: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) } : r),
                                                    }))}
                                                    placeholder="输入值，以逗号分隔"
                                                    className="w-full text-sm bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                                                  />
                                                );
                                              }
                                              const opts = dimCfg!.options!;
                                              const selected = rule.values || [];
                                              return (
                                                <>
                                                  {selected.map(val => {
                                                    const optLabel = opts.find(o => o.value === val)?.label || val;
                                                    return (
                                                      <span key={val} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/40">
                                                        {optLabel}
                                                        <button
                                                          onClick={(e) => { e.stopPropagation(); setFormPatch(prev => ({
                                                            ...prev,
                                                            rowPermissions: (prev.rowPermissions || []).map(r => r.id === rule.id ? { ...r, values: (r.values || []).filter(v => v !== val) } : r),
                                                          })); }}
                                                          className="hover:text-red-500 transition-colors"
                                                        ><X className="w-3 h-3" /></button>
                                                      </span>
                                                    );
                                                  })}
                                                  <DimensionDropdown
                                                    options={opts}
                                                    selected={selected}
                                                    onToggle={(val) => setFormPatch(prev => ({
                                                      ...prev,
                                                      rowPermissions: (prev.rowPermissions || []).map(r => {
                                                        if (r.id !== rule.id) return r;
                                                        const cur = r.values || [];
                                                        return { ...r, values: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
                                                      }),
                                                    }))}
                                                  />
                                                </>
                                              );
                                            })()}
                                          </div>
                                          <div className="flex items-center px-1.5 shrink-0">
                                            <button
                                              onClick={() => setFormPatch(prev => ({
                                                ...prev,
                                                rowPermissions: (prev.rowPermissions || []).filter(r => r.id !== rule.id),
                                              }))}
                                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                              title="删除此条件"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                    <Database className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm italic">尚未添加过滤条件，点击下方按钮添加。</p>
                                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">未添加条件时，默认可见所有{resCfg.label}。</p>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 pt-3">
                                  <button
                                    onClick={() => {
                                      const dim = resCfg.dimensions[0]?.id || '';
                                      setFormPatch(prev => ({
                                        ...prev,
                                        rowPermissions: [...(prev.rowPermissions || []), {
                                          id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                          resource: selectedResource, dimension: dim, operator: 'equals' as const, values: [],
                                        }],
                                      }));
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-600 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex-1 justify-center"
                                  >
                                    <Plus className="w-4 h-4" /> 添加条件
                                  </button>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 列权限编辑 */}
              {configTab === 'COLUMN' && (
                <div className="animate-fade-in">
                  {space.columnConfig.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">该应用未配置列权限</div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 flex overflow-hidden min-h-[420px]">
                      <div className="w-[180px] min-w-[180px] border-r border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] flex flex-col">
                        <div className="px-4 pt-4 pb-2">
                          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">数据资源</div>
                        </div>
                        <div className="flex-1 px-2 pb-2 space-y-0.5">
                          {space.columnConfig.map(res => {
                            const rule = (form.columnPermissions ?? []).find(r => r.resource === res.id);
                            const checkedCount = rule ? (rule.allowedColumns || []).length : 0;
                            const isActive = selectedColResource === res.id;
                            return (
                              <button key={res.id} onClick={() => setSelectedColResource(res.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? 'bg-purple-50 dark:bg-purple-900/20 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${isActive ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-semibold truncate ${isActive ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>{res.label}</div>
                                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                    {checkedCount > 0 ? `${checkedCount}/${res.columns.length} 列可见` : `${res.columns.length} 个数据列`}
                                  </div>
                                </div>
                                {checkedCount > 0 && <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{checkedCount}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                        {(() => {
                          const colCfg = space.columnConfig.find(c => c.id === selectedColResource);
                          if (!colCfg) return null;
                          const rule = (form.columnPermissions ?? []).find(r => r.resource === selectedColResource);
                          const checkedCount = rule ? (rule.allowedColumns || []).length : 0;
                          const toggleCol = (colId: string) => {
                            setFormPatch(prev => {
                              const rules = prev.columnPermissions || [];
                              const existing = rules.find(r => r.resource === selectedColResource);
                              if (!existing) return { ...prev, columnPermissions: [...rules, { id: `col-${Date.now()}`, resource: selectedColResource, allowedColumns: [colId] }] };
                              const list: string[] = existing.allowedColumns || [];
                              const next = list.includes(colId) ? list.filter(x => x !== colId) : [...list, colId];
                              return { ...prev, columnPermissions: rules.map(r => r.resource === selectedColResource ? { ...r, allowedColumns: next } : r) };
                            });
                          };
                          const selectAllCols = (all: boolean) => {
                            const newCols = all ? colCfg.columns.map(c => c.id) : [];
                            setFormPatch(prev => {
                              const rules = prev.columnPermissions || [];
                              const existing = rules.find(r => r.resource === selectedColResource);
                              if (!existing) {
                                if (!all) return { ...prev, columnPermissions: rules.filter(r => r.resource !== selectedColResource) };
                                return { ...prev, columnPermissions: [...rules, { id: `col-${Date.now()}`, resource: selectedColResource, allowedColumns: newCols }] };
                              }
                              if (!all) return { ...prev, columnPermissions: rules.filter(r => r.resource !== selectedColResource) };
                              return { ...prev, columnPermissions: rules.map(r => r.resource === selectedColResource ? { ...r, allowedColumns: newCols } : r) };
                            });
                          };
                          return (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{colCfg.label} — 列权限配置</h4>
                                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">勾选代表该角色可以查看对应的数据列</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => selectAllCols(true)} className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">全选</button>
                                  <span className="text-gray-300 dark:text-gray-600">|</span>
                                  <button onClick={() => selectAllCols(false)} className="text-xs text-gray-500 dark:text-gray-400 hover:underline font-medium">全不选</button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {colCfg.columns.map(col => {
                                  const isChecked = rule ? (rule.allowedColumns || []).includes(col.id) : false;
                                  return (
                                    <label key={col.id} onClick={() => toggleCol(col.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-purple-50 dark:bg-purple-900/15 border-purple-200 dark:border-purple-800/40' : 'bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/10 hover:border-purple-200 dark:hover:border-purple-800/30'}`}>
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-purple-500 border-purple-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {isChecked && <Check className="w-3 h-3 text-white" />}
                                      </div>
                                      <span className={`text-sm font-medium ${isChecked ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>{col.label}</span>
                                      {isChecked && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 font-bold">可见</span>}
                                    </label>
                                  );
                                })}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 italic pt-2 border-t border-gray-200/60 dark:border-white/10">
                                已选 <strong className="text-purple-600 dark:text-purple-400">{checkedCount}</strong> / {colCfg.columns.length} 列可见{checkedCount === 0 && '，默认可见所有列'}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ========== 查看模式 ========== */
        <>
          <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{role?.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{role?.description || '暂无描述'}</p>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-1"><Edit className="w-4 h-4" /> 编辑角色</button>
              </div>
            )}
          </div>

          {/* Tab 切换 */}
          <div className="flex border-b border-gray-100 dark:border-white/10 px-6 overflow-x-auto">
            {([
              { id: 'MEMBERS' as DetailTab, icon: <UserIcon className="w-4 h-4" />, label: '角色成员', badge: String(roleMembers.length) },
              { id: 'FUNCTIONAL' as DetailTab, icon: <CheckSquare className="w-4 h-4" />, label: '功能权限', badge: String((role?.permissions || []).length) },
              { id: 'ROW' as DetailTab, icon: <Database className="w-4 h-4" />, label: '数据行权限', badge: String((role?.rowPermissions || []).length) },
              { id: 'COLUMN' as DetailTab, icon: <Columns className="w-4 h-4" />, label: '数据列权限', badge: String((role?.columnPermissions || []).length) },
            ]).map(t => (
              <button key={t.id} onClick={() => setDetailTab(t.id)} className={`px-4 py-3 text-sm font-bold transition-colors relative whitespace-nowrap ${detailTab === t.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                <div className="flex items-center gap-2">{t.icon} {t.label} <span className="text-xs font-normal text-gray-400">({t.badge})</span></div>
                {detailTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* 角色成员 */}
            {detailTab === 'MEMBERS' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><UserIcon className="w-4 h-4" /> 角色成员</h3>
                  {canEdit && (
                    <button
                      onClick={() => { setIsAddMemberModalOpen(true); setMemberSearchTerm(''); }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> 添加成员
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {roleMembers.length > 0 ? (
                    roleMembers.map(m => {
                      const user = userMap.get(m.userId);
                      return (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <img src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.userName || '?')}`} alt="" className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                              {user?.monthBadge && (
                                <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[8px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-gray-900 dark:text-white">{m.userName || m.userId}</div>
                              <div className="text-xs text-gray-500">{m.userEmail || user?.email || ''}</div>
                            </div>
                          </div>
                          {canEdit && (
                            <button onClick={() => handleRemoveMemberFromRole(m)} className="text-gray-400 hover:text-red-500 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition">移除</button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">该角色下暂无成员</div>
                  )}
                </div>
              </div>
            )}

            {/* 功能权限只读 */}
            {detailTab === 'FUNCTIONAL' && (
              <ViewFunctionalPerms tree={treeAsPermGroup} perms={role?.permissions || []} allPermsInSubgroup={allPermsInSubgroup} allPermsInGroup={allPermsInGroup} allPermsInCategory={allPermsInCategory} getCheckState={getCheckState} />
            )}

            {/* 行权限只读 */}
            {detailTab === 'ROW' && (
              <div className="animate-fade-in">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">基础范围：</span>
                  {(role?.rowPermissions && role.rowPermissions.length > 0) ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30">自定义维度规则</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30">全部数据</span>
                  )}
                </div>
                {(role?.rowPermissions && role.rowPermissions.length > 0) && (
                  <div className="space-y-3">
                    {space.resourceConfig.map(res => {
                      const rules = role?.rowPermissions?.filter(r => r.resource === res.id) || [];
                      if (rules.length === 0) return null;
                      return (
                        <div key={res.id} className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/60 dark:bg-amber-900/10">
                            <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{res.label}</span>
                            <span className="text-xs text-amber-500 ml-auto">{rules.length} 条规则</span>
                          </div>
                          <div className="bg-white dark:bg-[#1C1C1E]">
                            {rules.map(rule => {
                              const dimCfg = res.dimensions.find(d => d.id === rule.dimension);
                              const getValLabel = (v: string) => dimCfg?.options?.find(o => o.value === v)?.label || v;
                              return (
                                <div key={rule.id} className="flex items-center gap-3 px-4 py-2.5">
                                  <span className="text-xs font-bold text-gray-500 min-w-[64px]">{dimCfg?.label || rule.dimension}</span>
                                  <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">{rule.operator === 'contains' ? '包含' : '等于'}</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {rule.values.length > 0 ? rule.values.map(v => (
                                      <span key={v} className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-100 dark:border-amber-800/30">{getValLabel(v)}</span>
                                    )) : (
                                      <span className="text-xs text-gray-400 italic">未指定值</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 列权限只读 */}
            {detailTab === 'COLUMN' && (
              <div className="animate-fade-in">
                {(role?.columnPermissions && role.columnPermissions.length > 0) ? (
                  <div className="space-y-3">
                    {space.columnConfig.map(res => {
                      const rule = role?.columnPermissions?.find(r => r.resource === res.id);
                      if (!rule) return null;
                      return (
                        <div key={res.id} className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50/50 dark:bg-purple-900/10">
                            <Columns className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{res.label}</span>
                            <span className="text-xs text-purple-500 ml-auto">{rule.allowedColumns?.length || 0}/{res.columns.length} 列可见</span>
                          </div>
                          <div className="p-3 space-y-2">
                            {res.columns.map(col => {
                              const allowed = rule.allowedColumns?.includes(col.id);
                              return (
                                <div key={col.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${allowed ? 'bg-purple-50 dark:bg-purple-900/15 border-purple-200 dark:border-purple-800/40' : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/10'}`}>
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${allowed ? 'bg-purple-500 border-purple-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {allowed && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <span className={`text-sm font-medium ${allowed ? 'text-purple-700 dark:text-purple-300' : 'text-gray-400 dark:text-gray-500 line-through'}`}>{col.label}</span>
                                  {allowed && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 font-bold">可见</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                    <Columns className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    未配置数据列权限，默认可见所有列
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Member Modal */}
          {isAddMemberModalOpen && (
            <ModalPortal>
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
                <div className="unified-card dark:bg-[#1C1C1E] w-full max-w-2xl flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">添加用户到角色</h2>
                    <button onClick={() => setIsAddMemberModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-4 border-b border-gray-100 dark:border-white/10">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={memberSearchTerm}
                        onChange={e => setMemberSearchTerm(e.target.value)}
                        placeholder="搜索用户..."
                        autoFocus
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-2">
                    {(() => {
                      const available = allUsers.filter(u =>
                        !existingMemberUserIds.includes(u.id) &&
                        (u.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                      );
                      return available.length > 0 ? available.map(user => (
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
                            onClick={() => handleAddMemberToRole(user.id)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                          >
                            添加
                          </button>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                          没有找到可添加的用户
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </ModalPortal>
          )}
        </>
      )}
    </div>
  );
};

export default SpaceRoleDetail;

// =========================================================================
// 功能权限只读视图
// =========================================================================
const ViewFunctionalPerms: React.FC<{
  tree: PermGroup[]; perms: string[];
  allPermsInSubgroup: (sg: any) => string[];
  allPermsInGroup: (g: any) => string[];
  allPermsInCategory: (cat: any) => string[];
  getCheckState: (ids: string[], current: string[]) => 'all' | 'some' | 'none';
}> = ({ tree, perms, allPermsInSubgroup, allPermsInGroup, allPermsInCategory, getCheckState }) => {
  if (perms.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg animate-fade-in">
        <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
        暂未配置任何功能权限
      </div>
    );
  }
  return (
    <div className="animate-fade-in border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1C1C1E]">
      {tree.map((group, gIdx) => {
        const groupPerms = allPermsInGroup(group);
        const groupState = getCheckState(groupPerms, perms);
        if (groupState === 'none') return null;
        return (
          <div key={group.id} className={gIdx > 0 ? 'border-t border-gray-100 dark:border-white/10' : ''}>
            <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10">
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${groupState === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}><Check className="w-2.5 h-2.5 text-white" /></div>
              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{group.label}</span>
              <span className="text-[11px] text-blue-500 ml-auto font-mono">{groupPerms.filter(id => perms.includes(id)).length}/{groupPerms.length}</span>
            </div>
            {group.subgroups.map(sg => {
              const sgPerms = allPermsInSubgroup(sg);
              const sgState = getCheckState(sgPerms, perms);
              if (sgState === 'none') return null;
              return (
                <div key={sg.id}>
                  <div className="flex items-center gap-2.5 py-1.5 pr-4" style={{ paddingLeft: 36 }}>
                    <div className="w-px h-4 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0" />
                    <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${sgState === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}><Check className="w-2 h-2 text-white" /></div>
                    <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{sg.label}</span>
                    <span className="text-[11px] text-gray-400 font-mono">{sgPerms.filter(id => perms.includes(id)).length}/{sgPerms.length}</span>
                  </div>
                  {sg.categories && sg.categories.map(cat => {
                    const catIds = allPermsInCategory(cat);
                    const catState = getCheckState(catIds, perms);
                    if (catState === 'none') return null;
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center gap-2 py-1 pr-4" style={{ paddingLeft: 56 }}>
                          <div className="w-px h-3 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-0.5 shrink-0" />
                          <div className={`w-2.5 h-2.5 rounded border flex items-center justify-center shrink-0 ${catState === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}><Check className="w-1.5 h-1.5 text-white" /></div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{cat.label}</span>
                        </div>
                        {cat.permissions.filter(p => perms.includes(p.id)).map(perm => (
                          <div key={perm.id} className="flex items-center gap-2.5 py-0.5 pr-4" style={{ paddingLeft: 76 }}>
                            <div className="w-px h-3 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-0.5 shrink-0" />
                            <div className="w-3 h-3 rounded border bg-blue-600 border-blue-600 flex items-center justify-center shrink-0"><Check className="w-2 h-2 text-white" /></div>
                            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{perm.label}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {!sg.categories && sg.permissions && sg.permissions.filter(p => perms.includes(p.id)).map(perm => (
                    <div key={perm.id} className="flex items-center gap-2.5 py-1 pr-4" style={{ paddingLeft: 64 }}>
                      <div className="w-px h-3.5 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0" />
                      <div className="w-3 h-3 rounded border bg-blue-600 border-blue-600 flex items-center justify-center shrink-0"><Check className="w-2 h-2 text-white" /></div>
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{perm.label}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
