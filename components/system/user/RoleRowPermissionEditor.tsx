import React from 'react';
import ReactDOM from 'react-dom';
import { Building2, Check, ChevronDown, ChevronRight, Database, Globe, Lock, Plus, X } from 'lucide-react';
import { resourceConfig } from '../permissionConfig';
import type { Department, PermissionDimension, PermissionResource, RoleDefinition, RowPermissionRule } from '../../../types';
import { GROUP_COLORS } from './constants';
import { buildFormulaDisplay } from './rowPermissionFormula';

export interface RoleRowPermissionEditorProps {
  roleForm: Partial<RoleDefinition>;
  setRoleForm: React.Dispatch<React.SetStateAction<Partial<RoleDefinition>>>;
  selectedResource: PermissionResource;
  setSelectedResource: (r: PermissionResource) => void;
  openDimDropdown: string | null;
  setOpenDimDropdown: (v: string | null) => void;
  openDimPicker: string | null;
  setOpenDimPicker: (v: string | null) => void;
  dropdownPos: { top: number; left: number; width: number; openUp: boolean; type: 'dim' | 'val' } | null;
  setDropdownPos: (v: RoleRowPermissionEditorProps['dropdownPos']) => void;
  computeDropdownPos: (el: HTMLElement, type: 'dim' | 'val', h?: number) => NonNullable<RoleRowPermissionEditorProps['dropdownPos']>;
  groupSelectMode: boolean;
  setGroupSelectMode: (v: boolean) => void;
  groupSelectRules: string[];
  setGroupSelectRules: React.Dispatch<React.SetStateAction<string[]>>;
  hasResourceFunctionalPerm: (resource: string) => boolean;
  getResourcePermHint: (resource: string) => string;
  getDimOperator: (resource: string, ruleId: string) => 'AND' | 'OR';
  getDimensionOptions: (dim: PermissionDimension) => { value: string; label: string }[];
  getReadableValue: (dim: PermissionDimension, val: string) => string;
  buildDeptTree: (parentId?: string) => { dept: Department; children: ReturnType<RoleRowPermissionEditorProps['buildDeptTree']> }[];
  getRuleGroupIndex: (resource: string, ruleId: string) => number;
  getRuleGroup: (resource: string, ruleId: string) => { id: string; dims: string[] } | null | undefined;
  toggleRuleValue: (ruleId: string, val: string) => void;
  setRuleSingleValue: (ruleId: string, val: string) => void;
  clearRuleValue: (ruleId: string) => void;
  changeRuleDimension: (ruleId: string, dimId: string) => void;
  removeSingleRule: (ruleId: string) => void;
  removeDimGroup: (resource: string, groupId: string) => void;
  addCondition: () => void;
  createRuleGroup: (resource: string, ruleIds: string[]) => void;
  toggleDimOperator: (resource: string, ruleId: string) => void;
}

const RoleRowPermissionEditor: React.FC<RoleRowPermissionEditorProps> = ({ roleForm, setRoleForm, selectedResource, setSelectedResource, openDimDropdown, setOpenDimDropdown, openDimPicker, setOpenDimPicker, dropdownPos, setDropdownPos, computeDropdownPos, groupSelectMode, setGroupSelectMode, groupSelectRules, setGroupSelectRules, hasResourceFunctionalPerm, getResourcePermHint, getDimOperator, getDimensionOptions, getReadableValue, buildDeptTree, getRuleGroupIndex, getRuleGroup, toggleRuleValue, setRuleSingleValue, clearRuleValue, changeRuleDimension, removeSingleRule, removeDimGroup, addCondition, createRuleGroup, toggleDimOperator }) => (
<div className="animate-fade-in" style={{ height: 'calc(100vh - 240px)', minHeight: '420px' }}>
                                  <div className="bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 flex h-full">
                                      {/* Left: Resource List */}
                                      <div className="w-[180px] min-w-[180px] border-r border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] flex flex-col">
                                          <div className="px-4 pt-4 pb-2 shrink-0">
                                              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">数据资源</div>
                                          </div>
                                          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                                              {resourceConfig.map(res => {
                                                  const rulesCount = roleForm.rowPermissions?.filter(r => r.resource === res.id).length || 0;
                                                  const isActive = selectedResource === res.id;
                                                  const hasFuncPerm = hasResourceFunctionalPerm(res.id);
                                                  return (
                                                      <button
                                                          key={res.id}
                                                          onClick={() => hasFuncPerm && setSelectedResource(res.id)}
                                                          disabled={!hasFuncPerm}
                                                          title={!hasFuncPerm ? getResourcePermHint(res.id) : undefined}
                                                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${!hasFuncPerm ? 'opacity-40 cursor-not-allowed' : isActive ? 'bg-blue-50 dark:bg-blue-900/20 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                      >
                                                          <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${!hasFuncPerm ? 'bg-gray-300 dark:bg-gray-600' : isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}/>
                                                          <div className="flex-1 min-w-0">
                                                              <div className={`text-sm font-semibold truncate ${!hasFuncPerm ? 'text-gray-400 dark:text-gray-500' : isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{res.label}</div>
                                                              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                                  {!hasFuncPerm ? '未开启功能权限' : rulesCount > 0 ? `${rulesCount} 条维度规则` : `${res.dimensions.length} 个可选维度`}
                                                              </div>
                                                          </div>
                                                          {hasFuncPerm && rulesCount > 0 && (
                                                              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{rulesCount}</span>
                                                          )}
                                                      </button>
                                                  );
                                              })}
                                          </div>
                                      </div>

                                      {/* Right: Permission Config */}
                                      <div className="flex-1 p-5 space-y-5 overflow-y-auto relative">
                                          {!hasResourceFunctionalPerm(selectedResource) ? (
                                              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                                  <Lock className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-4"/>
                                                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">功能权限未开启</p>
                                                  <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[280px]">{getResourcePermHint(selectedResource)}</p>
                                              </div>
                                          ) : null}
                                          {hasResourceFunctionalPerm(selectedResource) && (() => {
                                              const hasRulesForResource = (roleForm.rowPermissions || []).some(r => r.resource === selectedResource);
                                              const isAllData = (roleForm.baseRowPermission || 'all') === 'all' && !hasRulesForResource;
                                              return (
                                                  <>
                                                      <div className="flex items-start justify-between gap-3">
                                                          <div>
                                                              <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">{resourceConfig.find(r => r.id === selectedResource)?.label} — 行权限配置</h4>
                                                              {resourceConfig.find(r => r.id === selectedResource)?.description && (
                                                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{resourceConfig.find(r => r.id === selectedResource)?.description}</p>
                                                              )}
                                                          </div>
                                                          <button
                                                              onClick={() => {
                                                                  if (isAllData) {
                                                                      setRoleForm(prev => ({ ...prev, baseRowPermission: 'custom' }));
                                                                  } else if (!hasRulesForResource) {
                                                                      setRoleForm(prev => ({ ...prev, baseRowPermission: 'all' }));
                                                                  }
                                                              }}
                                                              disabled={hasRulesForResource && !isAllData}
                                                              title={hasRulesForResource && !isAllData ? '已配置维度规则，需先清除' : isAllData ? '点击切换为自定义维度' : '点击切换为全部数据'}
                                                              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                                                                  isAllData
                                                                      ? 'bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600 shadow-sm'
                                                                      : hasRulesForResource
                                                                          ? 'bg-gray-50 text-gray-400 border border-gray-200 dark:bg-white/5 dark:text-gray-500 dark:border-white/10 cursor-not-allowed opacity-50'
                                                                          : 'bg-gray-50 text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 cursor-pointer'
                                                              }`}
                                                          >
                                                              <Globe className="w-4 h-4"/>
                                                              <span>全部数据</span>
                                                              {isAllData && <Check className="w-3.5 h-3.5"/>}
                                                          </button>
                                                      </div>

                                                      <div className={isAllData ? 'opacity-40 pointer-events-none select-none' : ''}>
                                                          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">维度规则{isAllData && <span className="ml-2 text-gray-300 dark:text-gray-600 normal-case">（请先取消"全部数据"以启用）</span>}</div>
                                                      </div>

                                                      {/* Formula Preview Bar */}
                                                      {!isAllData && ((roleForm.rowPermissions || []).filter(r => r.resource === selectedResource).length >= 2) && (
                                                          <div className="mt-2 mb-1">
                                                                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/15 dark:via-indigo-900/15 dark:to-purple-900/15 border border-blue-200/60 dark:border-blue-700/30">
                                                                                  <span className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider shrink-0">公式</span>
                                                                                  <div className="w-px h-4 bg-blue-200 dark:bg-blue-700/50 shrink-0"/>
                                                                  <div className="text-xs font-mono font-semibold break-all leading-relaxed flex flex-wrap items-center gap-x-1 gap-y-0.5">
                                                                      {buildFormulaDisplay(selectedResource, roleForm, getDimOperator).split(/(\(|\)|AND|OR)/).filter(Boolean).map((token, ti) => {
                                                                          const trimmed = token.trim();
                                                                          if (!trimmed) return null;
                                                                          if (trimmed === '(' || trimmed === ')') {
                                                                              return <span key={ti} className="text-base font-extrabold text-indigo-500 dark:text-indigo-400 mx-0.5 leading-none">{trimmed}</span>;
                                                                          }
                                                                          if (trimmed === 'AND') {
                                                                              return <span key={ti} className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold tracking-wider">{trimmed}</span>;
                                                                          }
                                                                          if (trimmed === 'OR') {
                                                                              return <span key={ti} className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold tracking-wider">{trimmed}</span>;
                                                                          }
                                                                          return <span key={ti} className="text-indigo-700 dark:text-indigo-300">{trimmed}</span>;
                                                                      })}
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      )}
                                                  </>
                                              );
                                          })()}
                                          {hasResourceFunctionalPerm(selectedResource) && resourceConfig.find(r => r.id === selectedResource) && (() => {
                                              const isAllData = (roleForm.baseRowPermission || 'all') === 'all' && !(roleForm.rowPermissions || []).some(r => r.resource === selectedResource);
                                              const resourceRules = (roleForm.rowPermissions || []).filter(r => r.resource === selectedResource);
                                              const resDims = resourceConfig.find(r => r.id === selectedResource)?.dimensions || [];

                                              const renderValueSelector = (rule: RowPermissionRule, ruleIndex?: number, totalRules?: number) => {
                                                  const dimId = rule.dimension;
                                                  const isMulti = (['departmentId', 'industryLine', 'directChannelId', 'province', 'orderType', 'orderSource', 'orderStatus'] as string[]).includes(dimId);
                                                  const allOptions = getDimensionOptions(dimId as PermissionDimension);
                                                  const shouldOpenUp = (totalRules || 0) > 3 && (ruleIndex || 0) >= (totalRules || 0) - 2;

                                                  return (
                                                      <div className="relative flex-1" data-dim-dropdown>
                                                          <button
                                                              onClick={(e) => {
                                                                  if (openDimDropdown === rule.id) { setOpenDimDropdown(null); setDropdownPos(null); }
                                                                  else { setOpenDimDropdown(rule.id); setOpenDimPicker(null); setDropdownPos(computeDropdownPos(e.currentTarget, 'val', 280)); }
                                                              }}
                                                              className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-left text-sm transition-all ${
                                                                  openDimDropdown === rule.id
                                                                      ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/40 bg-white dark:bg-[#2C2C2E]'
                                                                      : rule.values.length > 0
                                                                          ? 'border-blue-200 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/10 hover:border-blue-300'
                                                                          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-[#2C2C2E]'
                                                              }`}
                                                          >
                                                              {rule.values.length > 0 ? (
                                                                  isMulti && rule.values.length > 1 ? (
                                                                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate">已选 {rule.values.length} 项</span>
                                                                  ) : (
                                                                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{getReadableValue(dimId as PermissionDimension, rule.values[0])}</span>
                                                                  )
                                                              ) : (
                                                                  <span className="text-gray-400 dark:text-gray-500 italic">请选择</span>
                                                              )}
                                                              <div className="flex items-center gap-1 flex-shrink-0">
                                                                  {rule.values.length > 0 && (
                                                                      <span onClick={(e) => { e.stopPropagation(); clearRuleValue(rule.id); }} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"><X className="w-3 h-3"/></span>
                                                                  )}
                                                                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${openDimDropdown === rule.id ? 'rotate-180' : ''}`}/>
                                                              </div>
                                                          </button>

                                                          {openDimDropdown === rule.id && dropdownPos && dropdownPos.type === 'val' && ReactDOM.createPortal(
                                                              <div
                                                                  className="fixed z-[9999] bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-white/15 shadow-2xl max-h-[280px] overflow-y-auto"
                                                                  style={{
                                                                      left: dropdownPos.left,
                                                                      width: dropdownPos.width,
                                                                      ...(dropdownPos.openUp ? { bottom: window.innerHeight - dropdownPos.top + 4 } : { top: dropdownPos.top }),
                                                                  }}
                                                                  data-dim-dropdown
                                                              >
                                                                  {dimId === 'departmentId' ? (
                                                                      (() => {
                                                                          const specialOpts = [
                                                                              { value: '__self_dept__', label: '本部门', icon: '🏢' },
                                                                              { value: '__self_dept_children__', label: '本部门及下属部门', icon: '🏗️' },
                                                                          ];
                                                                          const tree = buildDeptTree(undefined);
                                                                          type DeptTreeNode = { dept: Department; children: DeptTreeNode[] };
                                                                          const renderDeptNode = (node: DeptTreeNode, depth: number): React.ReactNode => {
                                                                              const isSelected = rule.values.includes(node.dept.id);
                                                                              return (
                                                                                  <React.Fragment key={node.dept.id}>
                                                                                      <button
                                                                                          onClick={() => toggleRuleValue(rule.id, node.dept.id)}
                                                                                          className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                                                                          style={{ paddingLeft: `${14 + depth * 20}px` }}
                                                                                      >
                                                                                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                                                                              {isSelected && <Check className="w-2.5 h-2.5 text-white"/>}
                                                                                          </div>
                                                                                          {node.children.length > 0 ? (
                                                                                              <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0"/>
                                                                                          ) : (
                                                                                              <span className="w-3 h-3 flex-shrink-0"/>
                                                                                          )}
                                                                                          <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0"/>
                                                                                          <span className="truncate">{node.dept.name}</span>
                                                                                      </button>
                                                                                      {node.children.map(child => renderDeptNode(child, depth + 1))}
                                                                                  </React.Fragment>
                                                                              );
                                                                          };
                                                                          return (
                                                                              <>
                                                                                  {specialOpts.map(opt => {
                                                                                      const isSelected = rule.values.includes(opt.value);
                                                                                      return (
                                                                                          <button key={opt.value} onClick={() => toggleRuleValue(rule.id, opt.value)}
                                                                                              className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                                                                          >
                                                                                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                                                                                  {isSelected && <Check className="w-2.5 h-2.5 text-white"/>}
                                                                                              </div>
                                                                                              <span className="text-sm flex-shrink-0">{opt.icon}</span>
                                                                                              <span className="truncate font-medium">{opt.label}</span>
                                                                                          </button>
                                                                                      );
                                                                                  })}
                                                                                  <div className="border-t border-gray-100 dark:border-white/10 my-0.5"/>
                                                                                  {tree.length > 0 ? tree.map(n => renderDeptNode(n, 0)) : <div className="px-3 py-4 text-center text-xs text-gray-400">暂无部门</div>}
                                                                              </>
                                                                          );
                                                                      })()
                                                                  ) : isMulti ? (
                                                                      allOptions.map(opt => {
                                                                          const isSelected = rule.values.includes(opt.value);
                                                                          return (
                                                                              <button key={opt.value} onClick={() => toggleRuleValue(rule.id, opt.value)}
                                                                                  className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                                                              >
                                                                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                                                                      {isSelected && <Check className="w-2.5 h-2.5 text-white"/>}
                                                                                  </div>
                                                                                  <span className="truncate">{opt.label}</span>
                                                                              </button>
                                                                          );
                                                                      })
                                                                  ) : (
                                                                      allOptions.map(opt => {
                                                                          const isSelected = rule.values[0] === opt.value;
                                                                          return (
                                                                              <button key={opt.value} onClick={() => setRuleSingleValue(rule.id, opt.value)}
                                                                                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                                                              >
                                                                                  <span className="truncate">{opt.label}</span>
                                                                                  {isSelected && <Check className="w-3 h-3 text-blue-600 flex-shrink-0"/>}
                                                                              </button>
                                                                          );
                                                                      })
                                                                  )}
                                                              </div>,
                                                              document.body
                                                          )}
                                                          {isMulti && rule.values.length > 0 && openDimDropdown !== rule.id && (
                                                              <div className="flex flex-wrap gap-1 mt-1.5">
                                                                  {rule.values.map(v => (
                                                                      <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 rounded text-xs font-medium text-blue-700 dark:text-blue-300">
                                                                          {getReadableValue(dimId as PermissionDimension, v)}
                                                                          <button onClick={(e) => { e.stopPropagation(); toggleRuleValue(rule.id, v); }} className="text-blue-400 hover:text-red-500 transition-colors"><X className="w-3 h-3"/></button>
                                                                      </span>
                                                                  ))}
                                                              </div>
                                                          )}
                                                      </div>
                                                  );
                                              };

                                              const existingGroups = roleForm.rowLogic?.[selectedResource]?.dimGroups || [];

                                              return (
                                              <div className={`space-y-0 ${isAllData ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                                                  {resourceRules.length > 0 ? (
                                                      <div className="space-y-0">
                                                          {resourceRules.map((rule, ruleIdx) => {
                                                              const dimCfg = resDims.find(d => d.id === rule.dimension);
                                                              const grpIdx = getRuleGroupIndex(selectedResource, rule.id);
                                                              const grpColor = grpIdx >= 0 ? GROUP_COLORS[grpIdx % GROUP_COLORS.length] : null;
                                                              const grp = grpIdx >= 0 ? existingGroups[grpIdx] : null;
                                                              const isFirstInGroup = grp ? grp.dims[0] === rule.id : false;
                                                              return (
                                                                  <React.Fragment key={rule.id}>
                                                                      {ruleIdx > 0 && (
                                                                          <div className="flex items-center justify-center py-1">
                                                                              <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10"/>
                                                                              <div className="mx-2.5 flex bg-gray-100 dark:bg-[#2C2C2E] rounded-full p-0.5 border border-gray-200 dark:border-white/10">
                                                                                  <button
                                                                                      onClick={() => { if (getDimOperator(selectedResource, rule.id) !== 'AND') toggleDimOperator(selectedResource, rule.id); }}
                                                                                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wider transition-all select-none ${
                                                                                          getDimOperator(selectedResource, rule.id) === 'AND'
                                                                                              ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-sm'
                                                                                              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                                                                      }`}
                                                                                  >AND</button>
                                                                                  <button
                                                                                      onClick={() => { if (getDimOperator(selectedResource, rule.id) !== 'OR') toggleDimOperator(selectedResource, rule.id); }}
                                                                                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wider transition-all select-none ${
                                                                                          getDimOperator(selectedResource, rule.id) === 'OR'
                                                                                              ? 'bg-amber-500 dark:bg-amber-600 text-white shadow-sm'
                                                                                              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                                                                      }`}
                                                                                  >OR</button>
                                                                              </div>
                                                                              <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10"/>
                                                                          </div>
                                                                      )}
                                                                      <div className={`rounded-xl border bg-white dark:bg-[#1C1C1E] flex items-stretch gap-0 ${
                                                                          grpColor
                                                                              ? `border-l-[3px] ${grpColor.border} ${grpColor.bg}`
                                                                              : 'border-gray-200 dark:border-white/10'
                                                                      }`}>
                                                                          {groupSelectMode && (
                                                                              <div
                                                                                  onClick={() => setGroupSelectRules(prev => prev.includes(rule.id) ? prev.filter(r => r !== rule.id) : [...prev, rule.id])}
                                                                                  className={`flex items-center justify-center w-9 min-w-[36px] cursor-pointer border-r border-gray-200 dark:border-white/10 transition-colors ${
                                                                                      groupSelectRules.includes(rule.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                                                  }`}
                                                                              >
                                                                                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                                      groupSelectRules.includes(rule.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600'
                                                                                  }`}>
                                                                                      {groupSelectRules.includes(rule.id) && <Check className="w-3 h-3 text-white"/>}
                                                                                  </div>
                                                                              </div>
                                                                          )}
                                                                          <div className={`flex items-center justify-center w-10 min-w-[40px] border-r border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] text-xs font-bold select-none shrink-0 ${!groupSelectMode ? 'rounded-l-xl' : ''} ${grpColor ? grpColor.text : 'text-gray-400 dark:text-gray-500'}`}>
                                                                              {grpColor && isFirstInGroup && <span className="text-[10px] font-extrabold">{grpColor.label}</span>}
                                                                              {grpColor && !isFirstInGroup && <span className="text-[10px]">{grpColor.label}</span>}
                                                                              {!grpColor && (ruleIdx + 1)}
                                                                          </div>

                                                                          <div className="relative shrink-0" data-dim-dropdown>
                                                                              <button
                                                                                  onClick={(e) => {
                                                                                      if (openDimPicker === rule.id) { setOpenDimPicker(null); setDropdownPos(null); }
                                                                                      else { setOpenDimPicker(rule.id); setOpenDimDropdown(null); setDropdownPos(computeDropdownPos(e.currentTarget, 'dim')); }
                                                                                  }}
                                                                                  className="flex items-center gap-1.5 min-w-[80px] h-full px-3 py-2 border-r border-gray-200 dark:border-white/10 text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-900/15 hover:bg-blue-100/80 dark:hover:bg-blue-900/25 transition-colors cursor-pointer select-none whitespace-nowrap"
                                                                              >
                                                                                  <span className="truncate">{dimCfg?.label || rule.dimension}</span>
                                                                                  <ChevronDown className={`w-3 h-3 text-blue-400 shrink-0 transition-transform ${openDimPicker === rule.id ? 'rotate-180' : ''}`}/>
                                                                              </button>
                                                                              {openDimPicker === rule.id && dropdownPos && dropdownPos.type === 'dim' && ReactDOM.createPortal(
                                                                                  <div
                                                                                      className="fixed z-[9999] bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-white/15 shadow-2xl overflow-hidden"
                                                                                      style={{
                                                                                          left: dropdownPos.left,
                                                                                          ...(dropdownPos.openUp ? { bottom: window.innerHeight - dropdownPos.top + 4 } : { top: dropdownPos.top }),
                                                                                          minWidth: dropdownPos.width,
                                                                                      }}
                                                                                      data-dim-dropdown
                                                                                  >
                                                                                      {resDims.map(d => (
                                                                                          <button
                                                                                              key={d.id}
                                                                                              onClick={() => { changeRuleDimension(rule.id, d.id); setOpenDimPicker(null); setDropdownPos(null); }}
                                                                                              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors ${
                                                                                                  rule.dimension === d.id
                                                                                                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold'
                                                                                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                                                              }`}
                                                                                          >
                                                                                              <span>{d.label}</span>
                                                                                              {rule.dimension === d.id && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0"/>}
                                                                                          </button>
                                                                                      ))}
                                                                                  </div>,
                                                                                  document.body
                                                                              )}
                                                                          </div>

                                                                          <div className="flex items-center px-3 border-r border-gray-200 dark:border-white/10 shrink-0">
                                                                              <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">等于</span>
                                                                          </div>

                                                                          <div className="flex-1 px-3 py-2 min-h-[40px] flex items-center">
                                                                              {renderValueSelector(rule, ruleIdx, resourceRules.length)}
                                                                          </div>

                                                                          <div className="flex items-center gap-0.5 px-1.5 shrink-0">
                                                                              {grpColor && isFirstInGroup && (
                                                                                  <button
                                                                                      onClick={() => removeDimGroup(selectedResource, grp!.id)}
                                                                                      className="p-1 rounded-md text-gray-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                                                                      title="解除此分组"
                                                                                  >
                                                                                      <span className="text-xs font-extrabold leading-none">( )</span>
                                                                                  </button>
                                                                              )}
                                                                              <button
                                                                                  onClick={() => removeSingleRule(rule.id)}
                                                                                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                                  title="删除此条件"
                                                                              >
                                                                                  <X className="w-4 h-4"/>
                                                                              </button>
                                                                          </div>
                                                                      </div>
                                                                  </React.Fragment>
                                                              );
                                                          })}
                                                      </div>
                                                  ) : (
                                                      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                                          <Database className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600"/>
                                                          <p className="text-sm italic">尚未添加过滤条件，点击下方按钮添加。</p>
                                                          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">未添加条件时，默认可见所有{resourceConfig.find(r => r.id === selectedResource)?.label}。</p>
                                                      </div>
                                                  )}

                                                  <div className="flex items-center gap-2 pt-3">
                                                                      <button
                                                                          onClick={() => addCondition()}
                                                                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-600 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex-1 justify-center"
                                                                      >
                                                                          <Plus className="w-4 h-4"/>
                                                                          添加条件
                                                                      </button>
                                                                      {resourceRules.length >= 2 && !groupSelectMode && (
                                                                          <button
                                                                              onClick={() => { setGroupSelectMode(true); setGroupSelectRules([]); }}
                                                                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-600 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shrink-0"
                                                                          >
                                                                              <span className="text-base leading-none font-mono">(</span>
                                                                              添加分组
                                                                              <span className="text-base leading-none font-mono">)</span>
                                                                          </button>
                                                                      )}
                                                  </div>
                                                  {groupSelectMode && (
                                                      <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-700/40">
                                                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex-1">勾选要分组的条件（至少2个），分组内条件将用括号包裹优先运算</span>
                                                          <button
                                                              onClick={() => createRuleGroup(selectedResource, groupSelectRules)}
                                                              disabled={groupSelectRules.length < 2}
                                                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                                                                  groupSelectRules.length >= 2
                                                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                                                      : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'
                                                              }`}
                                                          >
                                                              确认分组 ({groupSelectRules.length})
                                                          </button>
                                                          <button
                                                              onClick={() => { setGroupSelectMode(false); setGroupSelectRules([]); }}
                                                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                          >
                                                              取消
                                                          </button>
                                                      </div>
                                                  )}
                                                  {existingGroups.length > 0 && !groupSelectMode && (
                                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                                          {existingGroups.map((grp, gi) => {
                                                              const color = GROUP_COLORS[gi % GROUP_COLORS.length];
                                                              const ruleLabels = grp.dims.map(rid => {
                                                                  const r = resourceRules.find(rr => rr.id === rid);
                                                                  if (!r) return '?';
                                                                  return resDims.find(d => d.id === r.dimension)?.label || r.dimension;
                                                              });
                                                              return (
                                                                  <span key={grp.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${color.border} ${color.bg} ${color.text}`}>
                                                                      <span className="font-mono text-sm leading-none">(</span>
                                                                      {ruleLabels.join(', ')}
                                                                      <span className="font-mono text-sm leading-none">)</span>
                                                                      <button onClick={() => removeDimGroup(selectedResource, grp.id)} className="hover:text-red-500 transition-colors ml-0.5"><X className="w-3 h-3"/></button>
                                                                  </span>
                                                              );
                                                          })}
                                                      </div>
                                                  )}
                                                  {(() => {
                                                      if (groupSelectMode || resourceRules.length < 3) return null;
                                                      const ops = resourceRules.slice(1).map(r => getDimOperator(selectedResource, r.id));
                                                      const hasAnd = ops.includes('AND');
                                                      const hasOr = ops.includes('OR');
                                                      if (!hasAnd || !hasOr) return null;
                                                      const allGrouped = resourceRules.every(r => getRuleGroup(selectedResource, r.id) !== null);
                                                      if (allGrouped) return null;
                                                      return (
                                                          <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40">
                                                              <span className="text-amber-500 text-sm mt-px shrink-0">⚠</span>
                                                              <div className="flex-1">
                                                                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                                                      检测到同时存在 AND 和 OR 运算符，建议使用括号分组明确运算优先级
                                                                  </p>
                                                                  <p className="text-[10px] text-amber-500 dark:text-amber-500/80 mt-0.5">
                                                                      例如：<code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">( A AND B ) OR C</code> 与 <code className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">A AND ( B OR C )</code> 的结果不同。点击「添加分组」按钮选择需要优先运算的条件。
                                                                  </p>
                                                              </div>
                                                          </div>
                                                      );
                                                  })()}
                                              </div>
                                              );
                                          })()}
                                      </div>
                                  </div>
                              </div>
);

export default RoleRowPermissionEditor;
