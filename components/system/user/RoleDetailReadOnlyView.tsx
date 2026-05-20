import React from 'react';
import { User as UserIcon, Edit, Trash2, Copy, Plus, CheckSquare, Database, Columns, Check } from 'lucide-react';
import { permissionTree, columnConfig, resourceConfig } from '../permissionConfig';
import type { User, RoleDefinition } from '../../../types';
import { GROUP_COLORS } from './constants';
import { buildFormulaDisplay } from './rowPermissionFormula';

export interface RoleDetailReadOnlyViewProps {
  roleForm: Partial<RoleDefinition>;
  selectedRoleId: string | null;
  roles: RoleDefinition[];
  users: User[];
  roleDetailTab: 'MEMBERS' | 'FUNCTIONAL' | 'ROW' | 'COLUMN';
  setRoleDetailTab: (tab: 'MEMBERS' | 'FUNCTIONAL' | 'ROW' | 'COLUMN') => void;
  onDeleteRole: (id: string) => void;
  onCopyRole: (role: RoleDefinition) => void;
  onEditRole: () => void;
  onAddMember: () => void;
  onRemoveMember: (userId: string) => void;
  allPermsInGroup: (group: (typeof permissionTree)[0]) => string[];
  allPermsInSubgroup: (sg: (typeof permissionTree)[0]['subgroups'][0]) => string[];
  allPermsInCategory: (cat: NonNullable<(typeof permissionTree)[0]['subgroups'][0]['categories']>[0]) => string[];
  getCheckState: (permIds: string[], current: string[]) => 'all' | 'some' | 'none';
  getReadableValue: (dim: import('../../../types').PermissionDimension, val: string) => string;
  getDimOperator: (resource: string, ruleId: string) => 'AND' | 'OR';
  getRuleGroupIndex: (resource: string, ruleId: string) => number;
}

const RoleDetailReadOnlyView: React.FC<RoleDetailReadOnlyViewProps> = ({
  roleForm, selectedRoleId, roles, users, roleDetailTab, setRoleDetailTab,
  onDeleteRole: handleDeleteRole, onCopyRole: handleCopyRole, onEditRole, onAddMember, onRemoveMember: handleRemoveUserFromRole,
  allPermsInGroup, allPermsInSubgroup, allPermsInCategory, getCheckState, getReadableValue, getDimOperator, getRuleGroupIndex,
}) => (
<>
                              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                                  <div>
                                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                          {roleForm.name}
                                          {selectedRoleId === 'Admin' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full font-normal">内置</span>}
                                      </h2>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{roleForm.description || '暂无描述'}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      {selectedRoleId !== 'Admin' && (
                                          <button onClick={() => handleDeleteRole(selectedRoleId!)} className="px-3 py-1.5 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-1"><Trash2 className="w-4 h-4"/> 删除</button>
                                      )}
                                      <button onClick={() => { const r = roles.find(r => r.id === selectedRoleId); if (r) handleCopyRole(r); }} className="px-3 py-1.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-1"><Copy className="w-4 h-4"/> 复制</button>
                                      <button onClick={() => onEditRole()} className="px-4 py-1.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-1"><Edit className="w-4 h-4"/> 编辑角色</button>
                                  </div>
                              </div>
                              
                              {/* Tab 切换 */}
                              <div className="flex border-b border-gray-100 dark:border-white/10 px-6 overflow-x-auto">
                                  {([
                                      { id: 'MEMBERS' as const, icon: <UserIcon className="w-4 h-4"/>, label: '角色成员', badge: String(users.filter(u => selectedRoleId && u.roles?.includes(selectedRoleId)).length) },
                                      { id: 'FUNCTIONAL' as const, icon: <CheckSquare className="w-4 h-4"/>, label: '功能权限', badge: String((roleForm.permissions || []).length) },
                                      { id: 'ROW' as const, icon: <Database className="w-4 h-4"/>, label: '数据行权限', badge: String((roleForm.rowPermissions || []).length) },
                                      { id: 'COLUMN' as const, icon: <Columns className="w-4 h-4"/>, label: '数据列权限', badge: String((roleForm.columnPermissions || []).length) },
                                  ]).map(tab => (
                                      <button
                                          key={tab.id}
                                          onClick={() => setRoleDetailTab(tab.id)}
                                          className={`px-4 py-3 text-sm font-bold transition-colors relative whitespace-nowrap ${roleDetailTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                      >
                                          <div className="flex items-center gap-2">{tab.icon} {tab.label} <span className="text-xs font-normal text-gray-400">({tab.badge})</span></div>
                                          {roleDetailTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                                      </button>
                                  ))}
                              </div>

                              <div className="flex-1 overflow-auto p-6 space-y-6">
                                  {/* ===== 角色成员 Tab ===== */}
                                  {roleDetailTab === 'MEMBERS' && (
                                  <div className="animate-fade-in">
                                      <div className="flex justify-between items-center mb-3">
                                          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><UserIcon className="w-4 h-4"/> 角色成员</h3>
                                          <button onClick={() => onAddMember()} className="px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition flex items-center gap-1"><Plus className="w-4 h-4"/> 添加成员</button>
                                      </div>
                                      <div className="space-y-2">
                                          {users.filter(u => selectedRoleId && u.roles?.includes(selectedRoleId)).length > 0 ? (
                                              users.filter(u => selectedRoleId && u.roles?.includes(selectedRoleId)).map(user => (
                                                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                                                      <div className="flex items-center gap-3">
                                                          <div className="relative flex-shrink-0">
                                                              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                              {user.monthBadge && (
                                                                  <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[8px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                                                              )}
                                                          </div>
                                                          <div>
                                                              <div className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</div>
                                                              <div className="text-xs text-gray-500">{user.email}</div>
                                                          </div>
                                                      </div>
                                                      <button onClick={() => handleRemoveUserFromRole(user.id)} className="text-gray-400 hover:text-red-500 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition">移除</button>
                                                  </div>
                                              ))
                                          ) : (
                                              <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                                  该角色下暂无成员
                                              </div>
                                          )}
                                      </div>
                                  </div>
                                  )}

                                  {/* ===== 功能权限 Tab ===== */}
                                  {roleDetailTab === 'FUNCTIONAL' && (
                                  <div className="animate-fade-in">
                                      {(roleForm.permissions || []).length === 0 ? (
                                          <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                              暂未配置任何功能权限
                                          </div>
                                      ) : (
                                          <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1C1C1E]">
                                          {permissionTree.map((group, gIdx) => {
                                              const current    = roleForm.permissions || [];
                                              const groupPerms = allPermsInGroup(group);
                                              const groupState = getCheckState(groupPerms, current);
                                              if (groupState === 'none') return null;
                                              return (
                                                  <div key={group.id} className={gIdx > 0 ? 'border-t border-gray-100 dark:border-white/10' : ''}>
                                                      <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10">
                                                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${groupState === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}>
                                                              <Check className="w-2.5 h-2.5 text-white"/>
                                                          </div>
                                                          <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{group.label}</span>
                                                          <span className="text-[11px] text-blue-500 dark:text-blue-400 ml-auto font-mono">
                                                              {groupPerms.filter(id => current.includes(id)).length}/{groupPerms.length}
                                                          </span>
                                                      </div>
                                                      {group.subgroups.map(sg => {
                                                          const sgPerms = allPermsInSubgroup(sg);
                                                          const sgState = getCheckState(sgPerms, current);
                                                          if (sgState === 'none') return null;
                                                          return (
                                                              <div key={sg.id}>
                                                                  <div className="flex items-center gap-2.5 py-1.5 pr-4" style={{ paddingLeft: 36 }}>
                                                                      <div className="w-px h-4 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0"/>
                                                                      <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${sgState === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}>
                                                                          <Check className="w-2 h-2 text-white"/>
                                                                      </div>
                                                                      <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{sg.label}</span>
                                                                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                                                                          {sgPerms.filter(id => current.includes(id)).length}/{sgPerms.length}
                                                                      </span>
                                                                  </div>
                                                                  {sg.categories && sg.categories.map(cat => {
                                                                      const catPermIds = allPermsInCategory(cat);
                                                                      const catState = getCheckState(catPermIds, current);
                                                                      if (catState === 'none') return null;
                                                                      return (
                                                                          <div key={cat.id}>
                                                                              <div className="flex items-center gap-2 py-1 pr-4" style={{ paddingLeft: 56 }}>
                                                                                  <div className="w-px h-3 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-0.5 shrink-0"/>
                                                                                  <div className={`w-2.5 h-2.5 rounded border flex items-center justify-center shrink-0 ${catState === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}>
                                                                                      <Check className="w-1.5 h-1.5 text-white"/>
                                                                                  </div>
                                                                                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{cat.label}</span>
                                                                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                                                                      {catPermIds.filter(id => current.includes(id)).length}/{catPermIds.length}
                                                                                  </span>
                                                                              </div>
                                                                              {cat.permissions.filter(p => current.includes(p.id)).map(perm => (
                                                                                  <div key={perm.id} className="flex items-center gap-2.5 py-0.5 pr-4" style={{ paddingLeft: 76 }}>
                                                                                      <div className="w-px h-3 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0"/>
                                                                                      <div className="w-2.5 h-2.5 rounded border bg-blue-600 border-blue-600 flex items-center justify-center shrink-0">
                                                                                          <Check className="w-1.5 h-1.5 text-white"/>
                                                                                      </div>
                                                                                      <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">{perm.label}</span>
                                                                                  </div>
                                                                              ))}
                                                                          </div>
                                                                      );
                                                                  })}
                                                                  {!sg.categories && sg.permissions && sg.permissions.filter(p => current.includes(p.id)).map(perm => (
                                                                      <div key={perm.id} className="flex items-center gap-2.5 py-1 pr-4" style={{ paddingLeft: 64 }}>
                                                                          <div className="w-px h-3.5 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0"/>
                                                                          <div className="w-3 h-3 rounded border bg-blue-600 border-blue-600 flex items-center justify-center shrink-0">
                                                                              <Check className="w-2 h-2 text-white"/>
                                                                          </div>
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
                                      )}
                                  </div>
                                  )}

                                  {/* ===== 数据行权限 Tab ===== */}
                                  {roleDetailTab === 'ROW' && (
                                  <div className="animate-fade-in">
                                      <div className="mb-3 flex items-center gap-2">
                                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">基础范围：</span>
                                          {(roleForm.rowPermissions && roleForm.rowPermissions.length > 0) ? (
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30">
                                                  自定义维度规则
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30">
                                                  全部数据
                                              </span>
                                          )}
                                          <span className="text-xs text-gray-400">
                                              {(roleForm.rowPermissions && roleForm.rowPermissions.length > 0) ? '按维度规则过滤可见数据' : '可见所有数据'}
                                          </span>
                                      </div>
                                      {(roleForm.rowPermissions && roleForm.rowPermissions.length > 0) ? (
                                          <div className="space-y-3">
                                              {resourceConfig.map(res => {
                                                  const rules = roleForm.rowPermissions?.filter(r => r.resource === res.id) || [];
                                                  if (rules.length === 0) return null;
                                                  const formula = buildFormulaDisplay(res.id, roleForm, getDimOperator);
                                                  return (
                                                      <div key={res.id} className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                                                          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/60 dark:bg-amber-900/10">
                                                              <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"/>
                                                              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{res.label}</span>
                                                              <span className="text-xs text-amber-500 dark:text-amber-400 ml-auto">{rules.length} 条规则</span>
                                                          </div>
                                                          {rules.length >= 2 && formula && (
                                                              <div className="px-4 py-2 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 border-b border-gray-100 dark:border-white/10">
                                                                  <div className="flex items-center gap-2 flex-wrap">
                                                                      <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider shrink-0">公式</span>
                                                                      <div className="text-[11px] font-mono font-semibold flex flex-wrap items-center gap-x-1 gap-y-0.5">
                                                                          {formula.split(/(\(|\)|AND|OR)/).filter(Boolean).map((token, ti) => {
                                                                              const trimmed = token.trim();
                                                                              if (!trimmed) return null;
                                                                              if (trimmed === '(' || trimmed === ')') {
                                                                                  return <span key={ti} className="text-sm font-extrabold text-indigo-500 dark:text-indigo-400 mx-0.5 leading-none">{trimmed}</span>;
                                                                              }
                                                                              if (trimmed === 'AND') {
                                                                                  return <span key={ti} className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-extrabold tracking-wider">{trimmed}</span>;
                                                                              }
                                                                              if (trimmed === 'OR') {
                                                                                  return <span key={ti} className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold tracking-wider">{trimmed}</span>;
                                                                              }
                                                                              return <span key={ti} className="text-indigo-700 dark:text-indigo-300">{trimmed}</span>;
                                                                          })}
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          )}
                                                          <div className="bg-white dark:bg-[#1C1C1E]">
                                                              {rules.map((rule, ruleIdx) => {
                                                                  const dimCfg = res.dimensions.find(d => d.id === rule.dimension);
                                                                  const op = ruleIdx > 0 ? getDimOperator(res.id, rule.id) : null;
                                                                  const detailGrpIdx = getRuleGroupIndex(res.id, rule.id);
                                                                  const detailGrpColor = detailGrpIdx >= 0 ? GROUP_COLORS[detailGrpIdx % GROUP_COLORS.length] : null;
                                                                  return (
                                                                      <React.Fragment key={rule.id}>
                                                                          {op && (
                                                                              <div className="flex items-center gap-2 px-4 py-0.5">
                                                                                  <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10"/>
                                                                                  <span className={`text-[10px] font-extrabold tracking-wider ${op === 'OR' ? 'text-amber-500 dark:text-amber-400' : 'text-blue-500 dark:text-blue-400'}`}>{op}</span>
                                                                                  <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10"/>
                                                                              </div>
                                                                          )}
                                                                          <div className={`flex items-center gap-3 px-4 py-2.5 ${detailGrpColor ? `border-l-[3px] ${detailGrpColor.border} ${detailGrpColor.bg}` : ''}`}>
                                                                              {detailGrpColor && <span className={`text-[9px] font-extrabold ${detailGrpColor.text}`}>{detailGrpColor.label}</span>}
                                                                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 min-w-[64px]">{dimCfg?.label || rule.dimension}</span>
                                                                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">等于</span>
                                                                              <div className="flex flex-wrap gap-1.5">
                                                                                  {rule.values.length > 0 ? rule.values.map(v => (
                                                                                      <span key={v} className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-100 dark:border-amber-800/30">
                                                                                          {getReadableValue(rule.dimension, v)}
                                                                                      </span>
                                                                                  )) : (
                                                                                      <span className="text-xs text-gray-400 italic">未指定具体值</span>
                                                                                  )}
                                                                              </div>
                                                                          </div>
                                                                      </React.Fragment>
                                                                  );
                                                              })}
                                                          </div>
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      ) : (
                                          <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                              <Database className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                              未配置数据行权限，默认可见所有数据行
                                          </div>
                                      )}
                                  </div>
                                  )}

                                  {/* ===== 数据列权限 Tab ===== */}
                                  {roleDetailTab === 'COLUMN' && (
                                  <div className="animate-fade-in">
                                      {(roleForm.columnPermissions && roleForm.columnPermissions.length > 0) ? (
                                          <div className="space-y-2">
                                              {roleForm.columnPermissions.map((rule, idx) => {
                                                  const resConfig = columnConfig.find(r => r.id === rule.resource);
                                                  if (!resConfig) return null;
                                                  return (
                                                      <div key={idx} className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                                                          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50/60 dark:bg-red-900/10">
                                                              <Columns className="w-3.5 h-3.5 text-red-600 dark:text-red-400"/>
                                                              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{resConfig.label}</span>
                                                              <span className="text-xs text-red-500 dark:text-red-400 ml-auto">{rule.allowedColumns.length}/{resConfig.columns.length} 列已隐藏</span>
                                                          </div>
                                                          <div className="px-4 py-3 bg-white dark:bg-[#1C1C1E] flex flex-wrap gap-1.5">
                                                              {resConfig.columns.map(col => {
                                                                  const isHidden = rule.allowedColumns.includes(col.id);
                                                                  return (
                                                                      <span key={col.id} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${isHidden
                                                                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/30 line-through'
                                                                          : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800/30'
                                                                      }`}>
                                                                          {col.label}
                                                                      </span>
                                                                  );
                                                              })}
                                                          </div>
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      ) : (
                                          <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                              <Columns className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                              未配置数据列权限，全部列默认可见
                                          </div>
                                      )}
                                  </div>
                                  )}
                              </div>
</>
);

export default RoleDetailReadOnlyView;
