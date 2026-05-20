import React from 'react';
import { Columns, Lock, X } from 'lucide-react';
import { columnConfig } from '../permissionConfig';
import type { PermissionResource, RoleDefinition } from '../../../types';

export interface RoleColumnPermissionEditorProps {
  roleForm: Partial<RoleDefinition>;
  setRoleForm: React.Dispatch<React.SetStateAction<Partial<RoleDefinition>>>;
  selectedColumnResource: PermissionResource;
  setSelectedColumnResource: (r: PermissionResource) => void;
  hasResourceFunctionalPerm: (resource: string) => boolean;
  getResourcePermHint: (resource: string) => string;
  toggleColumn: (colId: string) => void;
}

const RoleColumnPermissionEditor: React.FC<RoleColumnPermissionEditorProps> = ({ roleForm, setRoleForm, selectedColumnResource, setSelectedColumnResource, hasResourceFunctionalPerm, getResourcePermHint, toggleColumn }) => (
<div className="animate-fade-in">
                                  <div className="bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 flex overflow-hidden min-h-[420px]">
                                      {/* Left: Resource List */}
                                      <div className="w-[180px] min-w-[180px] border-r border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] flex flex-col">
                                          <div className="px-4 pt-4 pb-2">
                                              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">数据资源</div>
                                          </div>
                                          <div className="flex-1 px-2 pb-2 space-y-0.5">
                                              {columnConfig.map(res => {
                                                  const rule = roleForm.columnPermissions?.find(r => r.resource === res.id);
                                                  const hiddenCnt = rule ? rule.allowedColumns.length : 0;
                                                  const isActive = selectedColumnResource === res.id;
                                                  const hasFuncPerm = hasResourceFunctionalPerm(res.id);
                                                  return (
                                                      <button
                                                          key={res.id}
                                                          onClick={() => hasFuncPerm && setSelectedColumnResource(res.id)}
                                                          disabled={!hasFuncPerm}
                                                          title={!hasFuncPerm ? getResourcePermHint(res.id) : undefined}
                                                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${!hasFuncPerm ? 'opacity-40 cursor-not-allowed' : isActive ? 'bg-purple-50 dark:bg-purple-900/20 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                      >
                                                          <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${!hasFuncPerm ? 'bg-gray-300 dark:bg-gray-600' : isActive ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`}/>
                                                          <div className="flex-1 min-w-0">
                                                              <div className={`text-sm font-semibold truncate ${!hasFuncPerm ? 'text-gray-400 dark:text-gray-500' : isActive ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>{res.label}</div>
                                                              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                                  {!hasFuncPerm ? '未开启功能权限' : hiddenCnt > 0 ? `${hiddenCnt}/${res.columns.length} 列已隐藏` : `${res.columns.length} 个数据列`}
                                                              </div>
                                                          </div>
                                                          {hasFuncPerm && hiddenCnt > 0 && (
                                                              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{hiddenCnt}</span>
                                                          )}
                                                      </button>
                                                  );
                                              })}
                                          </div>
                                      </div>

                                      {/* Right: Column Permission Config */}
                                      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                                          {!hasResourceFunctionalPerm(selectedColumnResource) ? (
                                              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                                  <Lock className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-4"/>
                                                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">功能权限未开启</p>
                                                  <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[280px]">{getResourcePermHint(selectedColumnResource)}</p>
                                              </div>
                                          ) : null}
                                          {hasResourceFunctionalPerm(selectedColumnResource) && (() => {
                                              const resConfig = columnConfig.find(r => r.id === selectedColumnResource);
                                              if (!resConfig) return null;
                                              const rule = roleForm.columnPermissions?.find(r => r.resource === selectedColumnResource);
                                              const hiddenColumns = rule ? rule.allowedColumns : [];
                                              const hiddenCount = hiddenColumns.length;
                                              return (
                                                  <>
                                                      <div className="flex items-start justify-between gap-3">
                                                          <div>
                                                              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{resConfig.label} — 列权限配置</h4>
                                                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">勾选代表该角色<strong>不可见</strong>对应的数据列，不勾选默认可见</p>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                              <button
                                                                  onClick={() => {
                                                                      const allColIds = resConfig.columns.map(c => c.id);
                                                                      const currentRules = roleForm.columnPermissions || [];
                                                                      const existingRule = currentRules.find(r => r.resource === selectedColumnResource);
                                                                      if (existingRule) {
                                                                          setRoleForm(prev => ({
                                                                              ...prev,
                                                                              columnPermissions: prev.columnPermissions?.map(r =>
                                                                                  r.resource === selectedColumnResource ? { ...r, allowedColumns: allColIds } : r
                                                                              )
                                                                          }));
                                                                      } else {
                                                                          setRoleForm(prev => ({
                                                                              ...prev,
                                                                              columnPermissions: [...currentRules, { id: `colperm-${Date.now()}`, resource: selectedColumnResource, allowedColumns: allColIds }]
                                                                          }));
                                                                      }
                                                                  }}
                                                                  className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                                                              >全部隐藏</button>
                                                              <span className="text-gray-300 dark:text-gray-600">|</span>
                                                              <button
                                                                  onClick={() => {
                                                                      setRoleForm(prev => ({
                                                                          ...prev,
                                                                          columnPermissions: (prev.columnPermissions || []).filter(r => r.resource !== selectedColumnResource)
                                                                      }));
                                                                  }}
                                                                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline font-medium"
                                                              >全部可见</button>
                                                          </div>
                                                      </div>

                                                      <div className="space-y-2">
                                                          {resConfig.columns.map(col => {
                                                              const isHidden = hiddenColumns.includes(col.id);
                                                              return (
                                                                  <label
                                                                      key={col.id}
                                                                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                                                          isHidden
                                                                              ? 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800/40'
                                                                              : 'bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/10 hover:border-red-200 dark:hover:border-red-800/30'
                                                                      }`}
                                                                  >
                                                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${isHidden ? 'bg-red-500 border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                                          {isHidden && <X className="w-3 h-3 text-white"/>}
                                                                      </div>
                                                                      <input type="checkbox" className="hidden" checked={isHidden} onChange={() => toggleColumn(col.id)} />
                                                                      <span className={`text-sm font-medium ${isHidden ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}`}>{col.label}</span>
                                                                      {isHidden ? <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 font-bold">不可见</span> : <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold">可见</span>}
                                                                  </label>
                                                              );
                                                          })}
                                                      </div>

                                                      <div className="text-xs text-gray-400 dark:text-gray-500 italic pt-2 border-t border-gray-200/60 dark:border-white/10">
                                                          已隐藏 <strong className="text-red-600 dark:text-red-400">{hiddenCount}</strong> / {resConfig.columns.length} 列{hiddenCount === 0 && '，全部列默认可见'}
                                                      </div>
                                                  </>
                                              );
                                          })()}
                                      </div>
                                  </div>
                              </div>
);

export default RoleColumnPermissionEditor;
