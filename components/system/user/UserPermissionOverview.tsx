import React from 'react';
import { Shield, Building2, X, CheckSquare, Database, Columns, Check, CheckCircle, Lock } from 'lucide-react';
import { permissionTree, columnConfig, resourceConfig } from '../permissionConfig';
import type { User, RoleDefinition, Department } from '../../../types';

export interface UserPermissionOverviewProps {
  selectedPermUser: User;
  selectedPermUserRole: RoleDefinition | null;
  departments: Department[];
  userPermTab: 'FUNCTIONAL' | 'ROW' | 'COLUMN';
  setUserPermTab: (tab: 'FUNCTIONAL' | 'ROW' | 'COLUMN') => void;
  onClear: () => void;
  allPermsInGroup: (group: (typeof permissionTree)[0]) => string[];
  getReadableValue: (dim: import('../../../types').PermissionDimension, val: string) => string;
}

const UserPermissionOverview: React.FC<UserPermissionOverviewProps> = ({
  selectedPermUser, selectedPermUserRole, departments, userPermTab, setUserPermTab, onClear: handleClearPermUser, allPermsInGroup, getReadableValue,
}) => (
<>
                          <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/5">
                              <div className="flex items-center gap-3">
                                  <div className="relative">
                                      <img src={selectedPermUser.avatar} alt="" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 shadow-sm" />
                                      {selectedPermUser.monthBadge && (
                                          <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[8px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{selectedPermUser.monthBadge}</span>
                                      )}
                                  </div>
                                  <div>
                                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                          {selectedPermUser.name}
                                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{selectedPermUser.email}</span>
                                      </h2>
                                      <div className="flex items-center gap-3 mt-0.5">
                                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                              <Shield className="w-3 h-3" />
                                              角色：<strong className="text-gray-700 dark:text-gray-200">{selectedPermUserRole?.name || '未分配'}</strong>
                                          </span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                              <Building2 className="w-3 h-3" />
                                              {(() => { const dept = departments.find(d => d.id === selectedPermUser.departmentId); return dept?.name || '未分配'; })()}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                              <button onClick={handleClearPermUser} className="px-3 py-1.5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-lg text-xs hover:bg-white dark:hover:bg-white/5 transition flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" /> 关闭
                              </button>
                          </div>

                          {selectedPermUserRole ? (
                          <>
                          {/* Permission Tabs */}
                          <div className="flex border-b border-gray-100 dark:border-white/10 px-6 bg-white dark:bg-[#1C1C1E]">
                              {([
                                  { id: 'FUNCTIONAL' as const, icon: <CheckSquare className="w-4 h-4"/>, label: '功能权限', badge: String((selectedPermUserRole.permissions || []).length) },
                                  { id: 'ROW' as const, icon: <Database className="w-4 h-4"/>, label: '数据行权限', badge: String((selectedPermUserRole.rowPermissions || []).length) },
                                  { id: 'COLUMN' as const, icon: <Columns className="w-4 h-4"/>, label: '数据列权限', badge: String((selectedPermUserRole.columnPermissions || []).length) },
                              ]).map(tab => (
                                  <button
                                      key={tab.id}
                                      onClick={() => setUserPermTab(tab.id)}
                                      className={`px-4 py-3 text-sm font-bold transition-colors relative whitespace-nowrap ${userPermTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                  >
                                      <div className="flex items-center gap-2">{tab.icon} {tab.label} <span className="text-xs font-normal text-gray-400">({tab.badge})</span></div>
                                      {userPermTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                                  </button>
                              ))}
                          </div>

                          <div className="flex-1 overflow-auto p-6 space-y-6">
                              {/* Functional Permissions - Read-only */}
                              {userPermTab === 'FUNCTIONAL' && (
                              <div className="animate-fade-in">
                                  {(selectedPermUserRole.permissions || []).length === 0 ? (
                                      <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                          <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                          暂未配置任何功能权限
                                      </div>
                                  ) : (
                                      <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1C1C1E]">
                                      {permissionTree.map((group, gIdx) => {
                                          const groupPerms = allPermsInGroup(group);
                                          const activePerms = groupPerms.filter(p => (selectedPermUserRole.permissions || []).includes(p));
                                          if (activePerms.length === 0) return null;
                                          return (
                                              <div key={group.id} className={gIdx > 0 ? 'border-t border-gray-100 dark:border-white/10' : ''}>
                                                  <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 flex items-center justify-between">
                                                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{group.label}</span>
                                                      <span className="text-xs text-gray-400">{activePerms.length}/{groupPerms.length}</span>
                                                  </div>
                                                  <div className="px-4 py-3">
                                                      {group.subgroups.map(sg => {
                                                          const sgPerms = sg.categories
                                                              ? sg.categories.flatMap(c => c.permissions.map(p => p.id))
                                                              : sg.permissions?.map(p => p.id) || [];
                                                          const activeSg = sgPerms.filter(p => (selectedPermUserRole.permissions || []).includes(p));
                                                          if (activeSg.length === 0) return null;
                                                          return (
                                                              <div key={sg.id} className="mb-3 last:mb-0">
                                                                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{sg.label}</div>
                                                                  <div className="flex flex-wrap gap-1.5">
                                                                      {(sg.categories
                                                                          ? sg.categories.flatMap(c => c.permissions)
                                                                          : sg.permissions || []
                                                                      ).filter(p => (selectedPermUserRole.permissions || []).includes(p.id)).map(p => (
                                                                          <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                                                                              <Check className="w-3 h-3"/> {p.label}
                                                                          </span>
                                                                      ))}
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

                              {/* Row Permissions - Read-only */}
                              {userPermTab === 'ROW' && (
                              <div className="animate-fade-in">
                                  {(() => {
                                      const baseRow = selectedPermUserRole.baseRowPermission;
                                      const rowRules = selectedPermUserRole.rowPermissions || [];
                                      if (!baseRow || baseRow === 'all') {
                                          return (
                                              <div className="mb-4">
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30">
                                                      <CheckCircle className="w-3.5 h-3.5"/> 全部数据
                                                  </span>
                                              </div>
                                          );
                                      }
                                      if (baseRow === 'custom' && rowRules.length === 0) {
                                          return (
                                              <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                                  <Database className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                                  自定义行权限（暂无规则）
                                              </div>
                                          );
                                      }
                                      return null;
                                  })()}
                                  {(selectedPermUserRole.rowPermissions || []).length > 0 && (
                                      <div className="space-y-3">
                                          {resourceConfig.map(rc => {
                                              const rcRules = (selectedPermUserRole.rowPermissions || []).filter(r => r.resource === rc.id);
                                              if (rcRules.length === 0) return null;
                                              return (
                                                  <div key={rc.id} className="border border-gray-200 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-[#1C1C1E]">
                                                      <div className="flex items-center gap-2 mb-3">
                                                          <Database className="w-4 h-4 text-amber-500"/>
                                                          <span className="font-bold text-sm text-gray-800 dark:text-white">{rc.label}</span>
                                                          <span className="text-xs text-gray-400">{rcRules.length} 条规则</span>
                                                      </div>
                                                      <div className="space-y-2">
                                                          {rcRules.map(rule => {
                                                              const dimCfg = rc.dimensions.find(d => d.id === rule.dimension);
                                                              return (
                                                                  <div key={rule.id} className="flex items-start gap-2 p-2.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/20">
                                                                      <Lock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                                                      <div className="text-xs">
                                                                          <span className="font-medium text-gray-700 dark:text-gray-200">{dimCfg?.label || rule.dimension}</span>
                                                                          <span className="mx-1.5 text-gray-400">{rule.operator === 'equals' ? '等于' : rule.operator === 'contains' ? '包含' : rule.operator}</span>
                                                                          <span className="font-medium text-amber-700 dark:text-amber-300">
                                                                              {rule.values.length > 0
                                                                                  ? rule.values.map(v => getReadableValue(rule.dimension, v)).join('、')
                                                                                  : '未指定'}
                                                                          </span>
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

                              {/* Column Permissions - Read-only */}
                              {userPermTab === 'COLUMN' && (
                              <div className="animate-fade-in">
                                  {(selectedPermUserRole.columnPermissions || []).length === 0 ? (
                                      <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                          <Columns className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                          暂未配置列权限（默认可见全部列）
                                      </div>
                                  ) : (
                                      <div className="space-y-3">
                                          {columnConfig.map(rc => {
                                              const colRule = (selectedPermUserRole.columnPermissions || []).find(r => r.resource === rc.id);
                                              if (!colRule) return null;
                                              return (
                                                  <div key={rc.id} className="border border-gray-200 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-[#1C1C1E]">
                                                      <div className="flex items-center gap-2 mb-3">
                                                          <Columns className="w-4 h-4 text-red-500"/>
                                                          <span className="font-bold text-sm text-gray-800 dark:text-white">{rc.label}</span>
                                                          <span className="text-xs text-red-400">{colRule.allowedColumns.length}/{rc.columns.length} 列已隐藏</span>
                                                      </div>
                                                      <div className="flex flex-wrap gap-1.5">
                                                          {rc.columns.map(col => {
                                                              const isHidden = colRule.allowedColumns.includes(col.id);
                                                              return (
                                                                  <span key={col.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${
                                                                      isHidden
                                                                          ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30 line-through'
                                                                          : 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30'
                                                                  }`}>
                                                                      {isHidden ? <X className="w-3 h-3"/> : <Check className="w-3 h-3"/>} {col.label}
                                                                  </span>
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
                          </div>
                          </>
                          ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                  <Shield className="w-10 h-10 mb-2 opacity-20"/>
                                  <p className="text-sm">该用户尚未分配角色</p>
                              </div>
                          )}
</>
);

export default UserPermissionOverview;
