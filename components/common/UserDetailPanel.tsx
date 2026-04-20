import React, { useState, useEffect } from 'react';
import { User, UserType, RoleDefinition, Department } from '../../types';
import { X, Mail, Phone, Shield, Briefcase, Building2, User as UserIcon, CheckCircle, Database, Columns, IdCard, Edit, Save, RotateCcw } from 'lucide-react';
import ModalPortal from './ModalPortal';
import { columnConfig, permissionModules, resourceConfig } from '../system/permissionConfig';

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
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    departmentId: user.departmentId || '',
    userType: user.userType as UserType,
    status: user.status as 'Active' | 'Inactive',
  });

  useEffect(() => {
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      departmentId: user.departmentId || '',
      userType: user.userType as UserType,
      status: user.status as 'Active' | 'Inactive',
    });
    setIsEditing(false);
  }, [user.id]);

  const roleDef = roles.find(r => r.id === (isEditing ? form.role : user.role));

  const getDeptPath = (deptId?: string): string => {
    if (!deptId) return '未分配部门';
    const parts: string[] = [];
    let cur = deptId;
    while (cur) {
      const d = departments.find(dd => dd.id === cur);
      if (!d) break;
      parts.unshift(d.name);
      cur = d.parentId || '';
    }
    return parts.join(' / ') || '未分配部门';
  };

  const getDimOperator = (resource: string, dimId: string): 'AND' | 'OR' => {
    return roleDef?.rowLogic?.[resource]?.dimOperators?.[dimId] || 'AND';
  };

  const getReadableValue = (dim: string, val: string) => {
    if (dim === 'salesRepId' || dim === 'businessManagerId' || dim === 'creatorId') {
      const u = users.find(uu => uu.id === val);
      return u ? u.name : val;
    }
    if (dim === 'departmentId') {
      const d = departments.find(dd => dd.id === val);
      return d ? d.name : val;
    }
    return val;
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    onSave?.({ ...form });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      departmentId: user.departmentId || '',
      userType: user.userType as UserType,
      status: user.status as 'Active' | 'Inactive',
    });
    setIsEditing(false);
  };

  const inputCls = "w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3] dark:text-white transition";
  const selectCls = inputCls;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[500] flex justify-end">
        <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={onClose} />
        <div className={`relative w-full max-w-3xl h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col border-l border-gray-200 dark:border-white/10 ${isClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>

          {/* Header */}
          <div className="shrink-0 border-b border-gray-100 dark:border-white/10">
            <div className="px-6 pt-5 pb-5 bg-gradient-to-r from-blue-50/50 to-white dark:from-[#0071E3]/[0.04] dark:to-[#1C1C1E]">
              <div className="flex items-start gap-5">
                {/* Avatar */}
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
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1C1C1E] ${(isEditing ? form.status : user.status) === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {user.monthBadge && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-2 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                  )}
                </div>

                {/* Name & meta */}
                <div className="flex-1 min-w-0 pt-1">
                  {isEditing ? (
                    <>
                      <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-[#0071E3] outline-none w-full pb-0.5 mb-1" placeholder="姓名" />
                      <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-gray-200 dark:border-white/10 outline-none w-full pb-0.5 focus:border-[#0071E3] transition" placeholder="邮箱" />
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{user.name}</h2>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 shrink-0" />{user.email}</span>
                        {user.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" />{user.phone}</span>}
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${(isEditing ? form.status : user.status) === 'Active' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/10'}`}>
                      {(isEditing ? form.status : user.status) === 'Active' ? '在职' : '离线'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                      {(isEditing ? form.userType : user.userType) === 'Internal' ? '内部员工' : '外部协作'}
                    </span>
                    {roleDef && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                        {roleDef.name}
                      </span>
                    )}
                    {isEditing && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-[#0071E3]/30 bg-[#0071E3]/10 text-[#0071E3]">编辑中</span>}
                  </div>
                </div>

                {/* Close */}
                <button onClick={onClose} className="p-2 -mr-2 -mt-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition text-gray-400 shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">

              {/* Basic Info */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> 基础信息
                </h3>
                {isEditing ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase mb-1.5">账号 ID</div>
                      <div className="text-sm font-mono font-bold text-gray-700 dark:text-gray-200">{user.accountId}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase mb-1.5">手机号</div>
                      <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="请输入手机号" className={inputCls} />
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase mb-1.5">角色</div>
                      <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={selectCls}>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase mb-1.5">部门</div>
                      <select value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))} className={selectCls}>
                        <option value="">-- 未分配 --</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase mb-1.5">人员类型</div>
                      <select value={form.userType} onChange={e => setForm(p => ({ ...p, userType: e.target.value as UserType }))} className={selectCls}>
                        <option value="Internal">内部员工</option>
                        <option value="External">外部协作者</option>
                      </select>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase mb-1.5">状态</div>
                      <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'Active' | 'Inactive' }))} className={selectCls}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="col-span-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      <div className="text-[10px] text-gray-400 uppercase mb-1">所属部门路径</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        {getDeptPath(form.departmentId)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <InfoCell label="账号 ID" value={user.accountId} mono />
                    <InfoCell label="人员类型" value={user.userType === 'Internal' ? '内部员工' : '外部协作'} />
                    <InfoCell label="手机号" value={user.phone || '未填写'} icon={<Phone className="w-3.5 h-3.5 text-green-500" />} muted={!user.phone} />
                    <InfoCell label="当前状态" value={user.status} color={user.status === 'Active' ? 'text-green-600' : 'text-gray-400'} />
                    <div className="col-span-2 lg:col-span-4">
                      <InfoCell label="所属部门" value={getDeptPath(user.departmentId)} icon={<Building2 className="w-4 h-4 text-indigo-500" />} />
                    </div>
                  </div>
                )}
              </section>

              {/* Role & Permissions */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> 角色权限
                </h3>
                <div className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">当前角色</div>
                    <div className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#0071E3]" />
                      {roleDef?.name || user.role}
                    </div>
                    {roleDef?.description && <div className="text-xs text-gray-400 mt-1">{roleDef.description}</div>}
                  </div>

                  <div className="p-4 bg-white dark:bg-transparent">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-3">功能权限</div>
                    <div className="flex flex-wrap gap-1.5">
                      {roleDef?.permissions.map(permId => {
                        const permLabel = permissionModules.flatMap(m => m.permissions).find(p => p.id === permId)?.label || permId;
                        return (
                          <span key={permId} className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-900/30 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {permLabel}
                          </span>
                        );
                      })}
                      {!roleDef?.permissions.length && <span className="text-gray-400 text-xs italic">无特殊功能权限</span>}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/10">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-3 flex items-center gap-1"><Database className="w-3 h-3" /> 数据行权限</div>
                    {(() => {
                      const allRules = roleDef?.rowPermissions || [];
                      const hasRules = allRules.length > 0;
                      return (
                        <>
                          <div className="mb-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${hasRules ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                              {hasRules ? '自定义' : '全部'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {allRules.length === 0
                              ? <span className="text-xs text-gray-400 italic">默认可见所有数据行</span>
                              : resourceConfig.map(res => {
                                  const resRules = allRules.filter(r => r.resource === res.id);
                                  if (resRules.length === 0) return null;
                                  return (
                                    <div key={res.id} className="p-2 bg-white dark:bg-[#2C2C2E] rounded border border-gray-200 dark:border-white/10 text-xs">
                                      <div className="font-bold text-gray-700 dark:text-gray-300 mb-1.5">{res.label}</div>
                                      <div className="space-y-1">
                                        {resRules.map((rule, ri) => {
                                          const dimLabel = res.dimensions.find(d => d.id === rule.dimension)?.label || rule.dimension;
                                          return (
                                            <div key={rule.id} className="flex items-center gap-1.5 flex-wrap">
                                              {ri > 0 && (
                                                <span className={`text-[9px] font-extrabold ${getDimOperator(res.id, rule.id) === 'OR' ? 'text-amber-500' : 'text-blue-500'}`}>
                                                  {getDimOperator(res.id, rule.id)}
                                                </span>
                                              )}
                                              <span className="font-medium text-gray-500 dark:text-gray-400">{dimLabel}</span>
                                              <span className="font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">等于</span>
                                              {rule.values.map(v => (
                                                <span key={v} className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-600 dark:text-gray-400">{getReadableValue(rule.dimension, v)}</span>
                                              ))}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })
                            }
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="p-4 bg-white dark:bg-transparent border-t border-gray-100 dark:border-white/10">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-3 flex items-center gap-1"><Columns className="w-3 h-3" /> 数据列权限</div>
                    <div className="space-y-2">
                      {roleDef?.columnPermissions?.map((rule, idx) => {
                        const resConfig = columnConfig.find(res => res.id === rule.resource);
                        const resLabel = resConfig?.label || rule.resource;
                        return (
                          <div key={idx} className="p-2 bg-gray-50 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 text-xs">
                            <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">{resLabel}</div>
                            <div className="flex flex-wrap gap-1">
                              {rule.allowedColumns.map(colId => {
                                const colLabel = resConfig?.columns.find(c => c.id === colId)?.label || colId;
                                return <span key={colId} className="px-1.5 py-0.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded text-gray-600 dark:text-gray-400">{colLabel}</span>;
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {(!roleDef?.columnPermissions || roleDef.columnPermissions.length === 0) && (
                        <span className="text-xs text-gray-400 italic">默认可见所有基础列</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          {isReadonly ? (
            <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 shrink-0">
              <button onClick={onClose} className="w-full py-2.5 bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition">
                关闭
              </button>
            </div>
          ) : isEditing ? (
            <div className="p-4 border-t border-[#0071E3]/20 dark:border-[#0071E3]/30 bg-blue-50/50 dark:bg-[#0071E3]/[0.06] flex gap-3 shrink-0">
              <button onClick={handleCancel} className="flex-1 py-2.5 bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> 取消
              </button>
              <button onClick={handleSave} disabled={!form.name || !form.email} className="flex-1 py-2.5 bg-[#0071E3] text-white rounded-xl font-bold text-sm hover:bg-[#0062CC] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-sm">
                <Save className="w-4 h-4" /> 保存修改
              </button>
            </div>
          ) : (
            <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex gap-3 shrink-0">
              <button
                onClick={() => onEmployeeCard?.(user)}
                className="flex-1 py-2.5 bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition flex items-center justify-center gap-2"
              >
                <IdCard className="w-4 h-4" /> 员工卡片
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 bg-[#0071E3] text-white rounded-xl font-bold text-sm hover:bg-[#0062CC] transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Edit className="w-4 h-4" /> 编辑用户
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

const InfoCell: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
  color?: string;
  muted?: boolean;
}> = ({ label, value, mono, icon, color, muted }) => (
  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
    <div className="text-[10px] text-gray-400 uppercase mb-1">{label}</div>
    <div className={`text-sm font-bold flex items-center gap-1.5 ${color || (muted ? 'text-gray-400 font-normal italic' : 'text-gray-700 dark:text-gray-200')} ${mono ? 'font-mono' : ''}`}>
      {icon}{value}
    </div>
  </div>
);

export default React.memo(UserDetailPanel);
