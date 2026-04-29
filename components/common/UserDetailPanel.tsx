import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserType, RoleDefinition, Department, Space, SpaceRole, SpaceMember } from '../../types';
import { X, Mail, Phone, Shield, Building2, CheckCircle, Database, Columns, IdCard, Edit, Save, RotateCcw, CheckSquare, Briefcase, Globe, Box } from 'lucide-react';
import ModalPortal from './ModalPortal';
import { columnConfig, resourceConfig, permissionTree } from '../system/permissionConfig';
import { useAppContext } from '../../contexts/AppContext';
import { spaceApi } from '../../services/api';
import PermissionReadonlyTree from './PermissionReadonlyTree';
import UserBizInfoPanel from './UserBizInfoPanel';
import { RowPermResourceBlock, ColPermResourceBlock } from './RowPermReadonly';

type PermTab = 'FUNCTIONAL' | 'ROW' | 'COLUMN';
type MainTab = 'ROLE_PERM' | 'BIZ_INFO';

interface UserDetailPanelProps {
  user: User;
  isClosing: boolean;
  onClose: () => void;
  roles: RoleDefinition[];
  departments: Department[];
  users?: User[];
  readonly?: boolean;
  onSave?: (updated: Partial<User>) => void;
  onEmployeeCard?: (user: User) => void;
}

const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  user,
  isClosing,
  onClose,
  roles,
  departments,
  users = [],
  readonly: isReadonly = false,
  onSave,
  onEmployeeCard,
}) => {
  const { spaces, apiMode } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>('ROLE_PERM');
  const [permTab, setPermTab] = useState<PermTab>('FUNCTIONAL');
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [roleScope, setRoleScope] = useState<string>('platform');
  const [spaceRolesMap, setSpaceRolesMap] = useState<Record<string, SpaceRole[]>>({});
  const [spaceMembersMap, setSpaceMembersMap] = useState<Record<string, SpaceMember[]>>({});
  const buildFormFromUser = useCallback((u: User) => ({
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    roles: u.roles || [],
    departmentId: u.departmentId || '',
    userType: u.userType as UserType,
    status: u.status as 'Active' | 'Inactive',
  }), []);

  const [form, setForm] = useState(() => buildFormFromUser(user));

  // 切换用户时重置抽屉本地 UI 态
  useEffect(() => {
    setIsEditing(false);
    setShowFullPhone(false);
    setRoleScope('platform');
  }, [user.id]);

  // 同步 user 字段（包括同 id 下父级更新的 name/email/status 等），保持表单与最新数据一致；
  // 编辑中不覆盖，避免吞掉用户输入。
  useEffect(() => {
    if (!isEditing) {
      setForm(buildFormFromUser(user));
    }
  }, [user, isEditing, buildFormFromUser]);

  // Load space roles & members for all spaces
  useEffect(() => {
    if (spaces.length === 0) return;
    let cancelled = false;
    const MOCK_PREFIX = 'biz_space';
    (async () => {
      const rolesMap: Record<string, SpaceRole[]> = {};
      const membersMap: Record<string, SpaceMember[]> = {};
      for (const sp of spaces) {
        if (!apiMode) {
          try {
            const rv = localStorage.getItem(`${MOCK_PREFIX}:roles:${sp.id}`);
            rolesMap[sp.id] = rv ? JSON.parse(rv) : [];
          } catch { rolesMap[sp.id] = []; }
          try {
            const mv = localStorage.getItem(`${MOCK_PREFIX}:members:${sp.id}`);
            membersMap[sp.id] = mv ? JSON.parse(mv) : [];
          } catch { membersMap[sp.id] = []; }
          if (rolesMap[sp.id].length === 0) {
            try {
              const { initialSpaceRoles } = await import('../../data/spaceSeedData');
              rolesMap[sp.id] = initialSpaceRoles.filter(r => r.spaceId === sp.id);
            } catch { /* ignore */ }
          }
        } else {
          try {
            const [r, m] = await Promise.all([spaceApi.listRoles(sp.id), spaceApi.listMembers(sp.id)]);
            rolesMap[sp.id] = r as SpaceRole[];
            membersMap[sp.id] = m as SpaceMember[];
          } catch { rolesMap[sp.id] = []; membersMap[sp.id] = []; }
        }
      }
      if (!cancelled) { setSpaceRolesMap(rolesMap); setSpaceMembersMap(membersMap); }
    })();
    return () => { cancelled = true; };
  }, [spaces, apiMode]);

  const currentStatus = isEditing ? form.status : user.status;

  // 平台多角色
  const userRoleDefs = useMemo(() => {
    const ids = (isEditing ? form.roles : user.roles) || [];
    return roles.filter(r => ids.includes(r.id));
  }, [roles, user.roles, form.roles, isEditing]);

  // 每个 Space 可有多个 member → 多个角色
  const userSpaceRolesMap = useMemo(() => {
    const map: Record<string, { space: Space; roles: SpaceRole[]; members: SpaceMember[] }> = {};
    for (const sp of spaces) {
      const members = (spaceMembersMap[sp.id] || []).filter(m => m.userId === user.id);
      if (members.length === 0) continue;
      const spRoles = spaceRolesMap[sp.id] || [];
      const matched: SpaceRole[] = [];
      for (const m of members) {
        const r = spRoles.find(sr => sr.id === m.roleId);
        if (r && !matched.some(x => x.id === r.id)) matched.push(r);
      }
      if (matched.length > 0) map[sp.id] = { space: sp, roles: matched, members };
    }
    return map;
  }, [spaces, spaceRolesMap, spaceMembersMap, user.id]);

  const joinedSpaceIds = useMemo(() => Object.keys(userSpaceRolesMap), [userSpaceRolesMap]);

  // 用 Map 索引避免在循环中反复 O(n) 查找
  const departmentMap = useMemo(() => new Map(departments.map(d => [d.id, d])), [departments]);
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const getDeptPath = useCallback((deptId?: string): string => {
    if (!deptId) return '未分配部门';
    const parts: string[] = [];
    let cur: string | undefined = deptId;
    while (cur) {
      const d = departmentMap.get(cur);
      if (!d) break;
      parts.unshift(d.name);
      cur = d.parentId || undefined;
    }
    return parts.join(' / ') || '未分配部门';
  }, [departmentMap]);

  const getReadableValue = useCallback((dim: string, val: string) => {
    if (dim === 'salesRepId' || dim === 'businessManagerId' || dim === 'creatorId') {
      const u = userMap.get(val);
      return u ? u.name : val;
    }
    if (dim === 'departmentId') {
      const d = departmentMap.get(val);
      return d ? d.name : val;
    }
    return val;
  }, [userMap, departmentMap]);

  const handleSave = () => {
    if (!form.name || !form.email) return;
    onSave?.({ ...form });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setForm(buildFormFromUser(user));
    setIsEditing(false);
  };

  const handleToggleStatus = () => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    if (isEditing) {
      setForm(p => ({ ...p, status: newStatus }));
    } else {
      onSave?.({ status: newStatus });
    }
  };

  // 聚合平台多角色的权限（OR 并集）
  const perms = useMemo(() => [...new Set(userRoleDefs.flatMap(r => r.permissions))], [userRoleDefs]);
  const rowRules = useMemo(() => userRoleDefs.flatMap(r => r.rowPermissions || []), [userRoleDefs]);
  const colRules = useMemo(() => {
    const merged: typeof userRoleDefs[0]['columnPermissions'] = [];
    for (const rd of userRoleDefs) {
      for (const cr of rd.columnPermissions || []) {
        const existing = merged!.find(m => m.resource === cr.resource);
        if (!existing) { merged!.push({ ...cr, allowedColumns: [...cr.allowedColumns] }); }
        else { for (const c of cr.allowedColumns) { if (!existing.allowedColumns.includes(c)) existing.allowedColumns.push(c); } }
      }
    }
    return merged!;
  }, [userRoleDefs]);
  // 合并 rowLogic（多角色各自的 rowLogic 合并为一份用于展示）
  const mergedRowLogic = useMemo(() => {
    const out: Record<string, import('../../types').RowLogicConfig> = {};
    for (const rd of userRoleDefs) {
      if (!rd.rowLogic) continue;
      for (const [res, cfg] of Object.entries(rd.rowLogic)) {
        if (!out[res]) { out[res] = { dimOperators: { ...cfg.dimOperators }, dimGroups: [...cfg.dimGroups] }; }
        else {
          Object.assign(out[res].dimOperators, cfg.dimOperators);
          out[res].dimGroups.push(...cfg.dimGroups);
        }
      }
    }
    return out;
  }, [userRoleDefs]);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[500] flex justify-end">
        <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={onClose} />
        <div className={`relative w-full max-w-[90rem] h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col border-l border-gray-200 dark:border-white/10 ${isClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>

          {/* Header */}
          <div className="shrink-0 border-b border-gray-100 dark:border-white/10">
            <div className="px-8 pt-6 pb-5 bg-gradient-to-r from-blue-50/50 to-white dark:from-[#0071E3]/[0.04] dark:to-[#1C1C1E]">
              <div className="flex items-start gap-6">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl p-0.5 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 shadow-lg overflow-hidden">
                    <img
                      src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
                      className="w-full h-full rounded-[14px] object-cover"
                      alt={user.name}
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.style.display = 'none';
                        const f = t.nextElementSibling as HTMLElement;
                        if (f) f.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#0071E3] to-[#34AADC] items-center justify-center text-white text-2xl font-bold" style={{ display: 'none' }}>
                      {user.name.replace(/\s*\(.*\)\s*$/, '').slice(0, 1)}
                    </div>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1C1C1E] ${currentStatus === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {user.monthBadge && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-2 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  {isEditing ? (
                    <>
                      <div className="flex items-center gap-2.5 mb-2">
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="text-[22px] font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-[#0071E3] outline-none flex-1 min-w-0 pb-0.5" placeholder="姓名" />
                        <select value={form.userType} onChange={e => setForm(p => ({ ...p, userType: e.target.value as UserType }))} className="px-2.5 py-1 rounded-md text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 outline-none cursor-pointer shrink-0">
                          <option value="Internal">内部员工</option>
                          <option value="External">外部协作</option>
                        </select>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-[#0071E3]/30 bg-[#0071E3]/10 text-[#0071E3] shrink-0">编辑中</span>
                      </div>
                      <div className="flex items-center gap-5 text-[13px] text-gray-500 dark:text-gray-400 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="text-[13px] text-gray-700 dark:text-gray-300 bg-transparent border-b border-gray-200 dark:border-white/10 outline-none w-48 pb-0.5 focus:border-[#0071E3] transition" placeholder="邮箱" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="text-[13px] text-gray-700 dark:text-gray-300 bg-transparent border-b border-gray-200 dark:border-white/10 outline-none w-36 pb-0.5 focus:border-[#0071E3] transition" placeholder="手机号" />
                        </div>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {getDeptPath(form.departmentId)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-[22px] font-bold text-gray-900 dark:text-white truncate">{user.name}</h2>
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 shrink-0">
                          {user.userType === 'Internal' ? '内部员工' : '外部协作'}
                        </span>
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded shrink-0">{user.accountId}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[13px] text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 shrink-0" />{user.email}</span>
                        {user.phone && (
                          <span
                            className="flex items-center gap-1.5 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition select-none"
                            onClick={() => setShowFullPhone(p => !p)}
                            title={showFullPhone ? '点击隐藏手机号' : '点击查看完整手机号'}
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {showFullPhone ? user.phone : user.phone.replace(/^(\d{3})\d{4}(\d+)$/, '$1****$2')}
                          </span>
                        )}
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {getDeptPath(user.departmentId)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 -mr-2 -mt-1">
                  {!isReadonly && (
                    <div className="relative group/status mr-1">
                      <button
                        onClick={handleToggleStatus}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${currentStatus === 'Active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${currentStatus === 'Active' ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-black text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/status:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                        {currentStatus === 'Active' ? '点击停用：该用户将无法登录平台' : '点击启用：恢复该用户的平台访问权限'}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900 dark:border-t-black" />
                      </div>
                    </div>
                  )}
                  {isReadonly && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold mr-1 ${currentStatus === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}>
                      {currentStatus === 'Active' ? '已启用' : '已停用'}
                    </span>
                  )}
                  {!isReadonly && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-gray-400 hover:text-[#0071E3]" title="编辑用户">
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                  )}
                  {!isReadonly && isEditing && (
                    <>
                      <button onClick={handleCancel} className="px-3 py-1.5 rounded-lg text-[13px] font-medium border border-gray-200 dark:border-white/15 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" /> 取消
                      </button>
                      <button onClick={handleSave} disabled={!form.name || !form.email} className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-[#0071E3] text-white hover:bg-[#0062CC] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 shadow-sm">
                        <Save className="w-3.5 h-3.5" /> 保存
                      </button>
                    </>
                  )}
                  {onEmployeeCard && (
                    <button onClick={() => onEmployeeCard(user)} className="p-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 transition text-gray-400 hover:text-purple-600" title="员工卡片">
                      <IdCard className="w-4.5 h-4.5" />
                    </button>
                  )}
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Tab Bar */}
            <div className="flex px-8 bg-white dark:bg-[#1C1C1E]">
              {([
                { id: 'ROLE_PERM' as const, icon: <Shield className="w-4 h-4" />, label: '角色权限' },
                { id: 'BIZ_INFO' as const, icon: <Briefcase className="w-4 h-4" />, label: '业务信息' },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  className={`px-5 py-3.5 text-[15px] font-semibold transition-colors relative whitespace-nowrap flex items-center gap-2 ${mainTab === tab.id ? 'text-[#0071E3]' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  {tab.icon} {tab.label}
                  {mainTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0071E3] rounded-t-full" />}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-8 py-6 space-y-6">

              {/* ============ TAB: 角色权限 ============ */}
              {mainTab === 'ROLE_PERM' && (() => {
                const scopeItems: { id: string; icon: React.ReactNode; label: string }[] = [
                  { id: 'platform', icon: <Globe className="w-3.5 h-3.5" />, label: '主平台' },
                  ...joinedSpaceIds.map(sid => ({
                    id: sid,
                    icon: <Box className="w-3.5 h-3.5" />,
                    label: userSpaceRolesMap[sid].space.name,
                  })),
                ];
                const isPlatform = roleScope === 'platform';
                const activeEntry = !isPlatform ? userSpaceRolesMap[roleScope] : null;
                const activeSpace = activeEntry?.space;

                // 应用多角色聚合（IIFE 内不能用 hooks，直接计算）
                const spRoles = activeEntry?.roles || [];
                const spPerms = [...new Set(spRoles.flatMap(r => r.permissions))];
                const spRow = spRoles.flatMap(r => r.rowPermissions || []);
                const spCol = (() => {
                  const m: { id: string; resource: string; allowedColumns: string[] }[] = [];
                  for (const r of spRoles) {
                    for (const cr of r.columnPermissions || []) {
                      const ex = m.find(x => x.resource === cr.resource);
                      if (!ex) m.push({ ...cr, allowedColumns: [...cr.allowedColumns] });
                      else { for (const c of cr.allowedColumns) { if (!ex.allowedColumns.includes(c)) ex.allowedColumns.push(c); } }
                    }
                  }
                  return m;
                })();
                const spLogic = (() => {
                  const out: Record<string, import('../../types').RowLogicConfig> = {};
                  for (const r of spRoles) {
                    if (!r.rowLogic) continue;
                    for (const [res, cfg] of Object.entries(r.rowLogic)) {
                      if (!out[res]) { out[res] = { dimOperators: { ...cfg.dimOperators }, dimGroups: [...cfg.dimGroups] }; }
                      else { Object.assign(out[res].dimOperators, cfg.dimOperators); out[res].dimGroups.push(...cfg.dimGroups); }
                    }
                  }
                  return out;
                })();

                const hasAdmin = activeEntry?.members.some(m => m.isAdmin) || false;

                return (
                <section className="animate-fade-in space-y-5">
                  {/* Scope selector — 不再显示角色名 */}
                  <div className="flex gap-2.5 flex-wrap">
                    {scopeItems.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setRoleScope(s.id); setPermTab('FUNCTIONAL'); }}
                        className={`px-3.5 py-2 rounded-lg text-[13px] font-semibold border flex items-center gap-1.5 transition ${roleScope === s.id ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300'}`}
                      >
                        {s.icon} {s.label}
                      </button>
                    ))}
                    {joinedSpaceIds.length === 0 && spaces.length > 0 && (
                      <span className="text-[13px] text-gray-400 self-center ml-2">未加入任何应用</span>
                    )}
                  </div>

                  {/* Platform role detail */}
                  {isPlatform && (
                    <div className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                      {/* 平台头 + 角色标签（与应用样式一致） */}
                      <div className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-bold text-sm text-gray-800 dark:text-gray-100">主平台</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">拥有角色</span>
                          {userRoleDefs.length > 0 ? userRoleDefs.map(rd => (
                            <span key={rd.id} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 flex items-center gap-1">
                              {rd.isSystem && <Shield className="w-3 h-3 text-amber-500" />}
                              {rd.name}
                            </span>
                          )) : (
                            <span className="text-xs text-gray-400 italic">未分配角色</span>
                          )}
                        </div>
                      </div>
                      <div className="flex border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#1C1C1E]">
                        {([
                          { id: 'FUNCTIONAL' as const, icon: <CheckSquare className="w-4 h-4" />, label: '功能权限', badge: String(perms.length) },
                          { id: 'ROW' as const, icon: <Database className="w-4 h-4" />, label: '数据行权限', badge: String(rowRules.length) },
                          { id: 'COLUMN' as const, icon: <Columns className="w-4 h-4" />, label: '数据列权限', badge: String(colRules.length) },
                        ]).map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setPermTab(tab.id)}
                            className={`px-5 py-3 text-[13px] font-semibold transition-colors relative whitespace-nowrap ${permTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                          >
                            <div className="flex items-center gap-2">{tab.icon} {tab.label} <span className="text-[12px] font-normal text-gray-400">({tab.badge})</span></div>
                            {permTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                          </button>
                        ))}
                      </div>
                      <div className="p-4">
                        {permTab === 'FUNCTIONAL' && (
                          <div className="animate-fade-in">
                            <PermissionReadonlyTree tree={permissionTree} grantedIds={perms} />
                          </div>
                        )}
                        {permTab === 'ROW' && (
                          <div className="animate-fade-in">
                            <div className="mb-3 flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500">基础范围：</span>
                              {rowRules.length > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30">自定义维度规则</span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30">
                                  <CheckCircle className="w-3.5 h-3.5" /> 全部数据
                                </span>
                              )}
                            </div>
                            {rowRules.length > 0 ? (
                              <div className="space-y-3">
                                {resourceConfig.map(rc => {
                                  const rcRules = rowRules.filter(r => r.resource === rc.id);
                                  if (rcRules.length === 0) return null;
                                  return <RowPermResourceBlock key={rc.id} resCfg={rc} rules={rcRules} logic={mergedRowLogic} getValLabel={(dim, v) => getReadableValue(dim, v)} />;
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-400 text-sm">默认可见所有数据行</div>
                            )}
                          </div>
                        )}
                        {permTab === 'COLUMN' && (
                          <div className="animate-fade-in">
                            {colRules.length > 0 ? (
                              <div className="space-y-3">
                                {columnConfig.map(rc => {
                                  const rule = colRules.find(r => r.resource === rc.id);
                                  if (!rule) return null;
                                  return <ColPermResourceBlock key={rc.id} colCfg={rc} rule={rule} />;
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
                    </div>
                  )}

                  {/* App (Space) role detail */}
                  {!isPlatform && activeSpace && (
                    <div className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden animate-fade-in">
                      {/* 应用头 + 角色标签 */}
                      <div className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Box className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{activeSpace.name}</span>
                          {hasAdmin && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">拥有角色</span>
                          {spRoles.map(r => (
                            <span key={r.id} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800">
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Sub-tabs: functional / row / column */}
                      <div className="flex border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#1C1C1E]">
                        {([
                          { id: 'FUNCTIONAL' as const, icon: <CheckSquare className="w-4 h-4" />, label: '功能权限', badge: String(spPerms.length) },
                          { id: 'ROW' as const, icon: <Database className="w-4 h-4" />, label: '数据行权限', badge: String(spRow.length) },
                          { id: 'COLUMN' as const, icon: <Columns className="w-4 h-4" />, label: '数据列权限', badge: String(spCol.length) },
                        ]).map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setPermTab(tab.id)}
                            className={`px-5 py-3 text-[13px] font-semibold transition-colors relative whitespace-nowrap ${permTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                          >
                            <div className="flex items-center gap-2">{tab.icon} {tab.label} <span className="text-[12px] font-normal text-gray-400">({tab.badge})</span></div>
                            {permTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                          </button>
                        ))}
                      </div>

                      <div className="p-4">
                        {permTab === 'FUNCTIONAL' && (
                          <div className="animate-fade-in">
                            <PermissionReadonlyTree tree={activeSpace.permTree} grantedIds={spPerms} />
                          </div>
                        )}

                        {permTab === 'ROW' && (
                          <div className="animate-fade-in">
                            <div className="mb-3 flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500">基础范围：</span>
                              {spRow.length > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30">自定义维度规则</span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30">
                                  <CheckCircle className="w-3.5 h-3.5" /> 全部数据
                                </span>
                              )}
                            </div>
                            {spRow.length > 0 ? (
                              <div className="space-y-3">
                                {activeSpace.resourceConfig.map(rc => {
                                  const rcRules = spRow.filter(r => r.resource === rc.id);
                                  if (rcRules.length === 0) return null;
                                  const getSpValLabel = (dim: string, v: string) => {
                                    const d = rc.dimensions.find(dd => dd.id === dim);
                                    return d?.options?.find(o => o.value === v)?.label || v;
                                  };
                                  return <RowPermResourceBlock key={rc.id} resCfg={rc} rules={rcRules} logic={spLogic} getValLabel={getSpValLabel} />;
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-400 text-sm">默认可见所有数据行</div>
                            )}
                          </div>
                        )}

                        {permTab === 'COLUMN' && (
                          <div className="animate-fade-in">
                            {spCol.length > 0 ? (
                              <div className="space-y-3">
                                {activeSpace.columnConfig.map(rc => {
                                  const rule = spCol.find(r => r.resource === rc.id);
                                  if (!rule) return null;
                                  return <ColPermResourceBlock key={rc.id} colCfg={rc} rule={rule} />;
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
                    </div>
                  )}
                </section>
                );
              })()}

              {/* ============ TAB: 业务信息 ============ */}
              {mainTab === 'BIZ_INFO' && (
                <UserBizInfoPanel user={user} />
              )}

            </div>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};

export default React.memo(UserDetailPanel);
