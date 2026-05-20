import React from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { permissionTree, getSubgroupPermIds } from '../permissionConfig';
import type { RoleDefinition } from '../../../types';
import type { usePermissionTreeExpansion } from '../userManager/usePermissionTreeExpansion';

export interface RoleFunctionalPermissionTreeProps {
  roleForm: Partial<RoleDefinition>;
  setRoleForm: React.Dispatch<React.SetStateAction<Partial<RoleDefinition>>>;
  expandedGroups: string[];
  setExpandedGroups: React.Dispatch<React.SetStateAction<string[]>>;
  expandedSubgroups: string[];
  setExpandedSubgroups: React.Dispatch<React.SetStateAction<string[]>>;
  expandedCategories: string[];
  setExpandedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  toggleGroupExpand: (id: string) => void;
  toggleSubgroupExpand: (id: string) => void;
  toggleCategoryExpand: (id: string) => void;
  allPermsInGroup: (group: (typeof permissionTree)[0]) => string[];
  allPermsInSubgroup: (sg: (typeof permissionTree)[0]['subgroups'][0]) => string[];
  allPermsInCategory: (cat: NonNullable<(typeof permissionTree)[0]['subgroups'][0]['categories']>[0]) => string[];
  getCheckState: (permIds: string[], current: string[]) => 'all' | 'some' | 'none';
  togglePermission: (permId: string) => void;
  toggleModule: (groupId: string) => void;
  toggleSubgroupPerms: (sg: (typeof permissionTree)[0]['subgroups'][0]) => void;
  toggleCategoryPerms: (cat: NonNullable<(typeof permissionTree)[0]['subgroups'][0]['categories']>[0]) => void;
}

const RoleFunctionalPermissionTree: React.FC<RoleFunctionalPermissionTreeProps> = ({ roleForm, setRoleForm, expandedGroups, setExpandedGroups, expandedSubgroups, setExpandedSubgroups, expandedCategories, setExpandedCategories, toggleGroupExpand, toggleSubgroupExpand, toggleCategoryExpand, allPermsInGroup, allPermsInSubgroup, allPermsInCategory, getCheckState, togglePermission, toggleModule, toggleSubgroupPerms, toggleCategoryPerms }) => (
<div className="animate-fade-in">
                                  {/* 全选 / 全不选 快捷操作 */}
                                  <div className="flex items-center justify-between mb-3 px-1">
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                          已选 <strong className="text-[#0071E3]">{(roleForm.permissions || []).length}</strong> 个权限点
                                      </span>
                                      <div className="flex gap-2">
                                          <button
                                              onClick={() => {
                                                  setExpandedGroups(permissionTree.map(g => g.id));
                                                  setExpandedSubgroups(permissionTree.flatMap(g => g.subgroups.map(sg => sg.id)));
                                                  setExpandedCategories(permissionTree.flatMap(g => g.subgroups.flatMap(sg => (sg.categories || []).map(c => c.id))));
                                              }}
                                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:underline"
                                          >展开全部</button>
                                          <span className="text-gray-300 dark:text-gray-600">|</span>
                                          <button
                                              onClick={() => { setExpandedGroups([]); setExpandedSubgroups([]); setExpandedCategories([]); }}
                                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:underline"
                                          >折叠全部</button>
                                          <span className="text-gray-300 dark:text-gray-600">|</span>
                                          <button
                                              onClick={() => setRoleForm({ ...roleForm, permissions: permissionTree.flatMap(g => g.subgroups.flatMap(sg => getSubgroupPermIds(sg))) })}
                                              className="text-xs text-[#0071E3] hover:underline"
                                          >全选</button>
                                          <span className="text-gray-300 dark:text-gray-600">|</span>
                                          <button
                                              onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:underline"
                                          >清空</button>
                                      </div>
                                  </div>

                                  <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1C1C1E]">
                                  {permissionTree.map((group, gIdx) => {
                                      const current      = roleForm.permissions || [];
                                      const groupPerms   = allPermsInGroup(group);
                                      const groupState   = getCheckState(groupPerms, current);
                                      const isGroupOpen  = expandedGroups.includes(group.id);

                                      return (
                                          <div key={group.id} className={gIdx > 0 ? 'border-t border-gray-100 dark:border-white/10' : ''}>
                                              {/* ── 一级：模块组 ── */}
                                              <div
                                                  className={`flex items-center gap-2.5 px-4 py-2.5 select-none transition-colors ${groupState !== 'none' ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}`}
                                              >
                                                  <button
                                                      onClick={() => toggleGroupExpand(group.id)}
                                                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                                                  >
                                                      {isGroupOpen
                                                          ? <ChevronDown className="w-4 h-4"/>
                                                          : <ChevronRight className="w-4 h-4"/>
                                                      }
                                                  </button>
                                                  <div
                                                      onClick={() => toggleModule(group.id)}
                                                      className="flex items-center gap-2 flex-1 cursor-pointer group"
                                                  >
                                                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0
                                                          ${groupState === 'all'  ? 'bg-blue-600 border-blue-600' :
                                                            groupState === 'some' ? 'bg-blue-400/60 border-blue-400' :
                                                            'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600 group-hover:border-blue-400'}`}>
                                                          {groupState !== 'none' && <Check className="w-3 h-3 text-white"/>}
                                                      </div>
                                                      <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{group.label}</span>
                                                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                                                          {groupPerms.filter(id => current.includes(id)).length}/{groupPerms.length}
                                                      </span>
                                                  </div>
                                              </div>

                                              {/* ── 二级：子模块 ── */}
                                              {isGroupOpen && group.subgroups.map(sg => {
                                                  if (sg.dependsOn && !current.includes(sg.dependsOn)) return null;
                                                  const sgPerms   = allPermsInSubgroup(sg);
                                                  const sgState   = getCheckState(sgPerms, current);
                                                  const isSgOpen  = expandedSubgroups.includes(sg.id);

                                                  return (
                                                      <div key={sg.id}>
                                                          <div
                                                              className={`flex items-center gap-2.5 py-2 pr-4 select-none transition-colors ${sgState !== 'none' ? 'bg-blue-50/30 dark:bg-blue-900/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}`}
                                                              style={{ paddingLeft: 44 }}
                                                          >
                                                              <div className="w-px h-4 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0"/>
                                                              <button
                                                                  onClick={() => toggleSubgroupExpand(sg.id)}
                                                                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                                                              >
                                                                  {isSgOpen
                                                                      ? <ChevronDown className="w-3.5 h-3.5"/>
                                                                      : <ChevronRight className="w-3.5 h-3.5"/>
                                                                  }
                                                              </button>
                                                              <div
                                                                  onClick={() => toggleSubgroupPerms(sg)}
                                                                  className="flex items-center gap-2 flex-1 cursor-pointer group"
                                                              >
                                                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0
                                                                      ${sgState === 'all'  ? 'bg-blue-600 border-blue-600' :
                                                                        sgState === 'some' ? 'bg-blue-400/60 border-blue-400' :
                                                                        'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600 group-hover:border-blue-400'}`}>
                                                                      {sgState !== 'none' && <Check className="w-2.5 h-2.5 text-white"/>}
                                                                  </div>
                                                                  <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{sg.label}</span>
                                                                  <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                                                                      {sgPerms.filter(id => current.includes(id)).length}/{sgPerms.length}
                                                                  </span>
                                                              </div>
                                                          </div>

                                                          {/* ── 三级/四级：功能分类 + 权限点 ── */}
                                                          {isSgOpen && sg.categories && sg.categories.map(cat => {
                                                              const catPerms  = allPermsInCategory(cat);
                                                              const catState  = getCheckState(catPerms, current);
                                                              const isCatOpen = expandedCategories.includes(cat.id);
                                                              return (
                                                                  <div key={cat.id}>
                                                                      <div
                                                                          className={`flex items-center gap-2 py-1.5 pr-4 select-none transition-colors ${catState !== 'none' ? 'bg-blue-50/20 dark:bg-blue-900/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}`}
                                                                          style={{ paddingLeft: 68 }}
                                                                      >
                                                                          <div className="w-px h-3.5 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-0.5 shrink-0"/>
                                                                          <button
                                                                              onClick={() => toggleCategoryExpand(cat.id)}
                                                                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                                                                          >
                                                                              {isCatOpen
                                                                                  ? <ChevronDown className="w-3 h-3"/>
                                                                                  : <ChevronRight className="w-3 h-3"/>
                                                                              }
                                                                          </button>
                                                                          <div
                                                                              onClick={() => toggleCategoryPerms(cat)}
                                                                              className="flex items-center gap-1.5 flex-1 cursor-pointer group"
                                                                          >
                                                                              <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors shrink-0
                                                                                  ${catState === 'all'  ? 'bg-blue-600 border-blue-600' :
                                                                                    catState === 'some' ? 'bg-blue-400/60 border-blue-400' :
                                                                                    'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600 group-hover:border-blue-400'}`}>
                                                                                  {catState !== 'none' && <Check className="w-2 h-2 text-white"/>}
                                                                              </div>
                                                                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{cat.label}</span>
                                                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                                                                  {catPerms.filter(id => current.includes(id)).length}/{catPerms.length}
                                                                              </span>
                                                                          </div>
                                                                      </div>
                                                                      {isCatOpen && cat.permissions.map(perm => {
                                                                          const isChecked = current.includes(perm.id);
                                                                          return (
                                                                              <div
                                                                                  key={perm.id}
                                                                                  onClick={() => togglePermission(perm.id)}
                                                                                  className={`flex items-center gap-2.5 py-1.5 pr-4 cursor-pointer select-none transition-colors ${isChecked ? 'bg-blue-50/20 dark:bg-blue-900/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}`}
                                                                                  style={{ paddingLeft: 96 }}
                                                                              >
                                                                                  <div className="w-px h-3.5 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0"/>
                                                                                  <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors shrink-0
                                                                                      ${isChecked
                                                                                          ? 'bg-blue-600 border-blue-600'
                                                                                          : 'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600'
                                                                                      }`}>
                                                                                      {isChecked && <Check className="w-2 h-2 text-white"/>}
                                                                                  </div>
                                                                                  <span className={`text-xs flex-1 ${isChecked ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                                      {perm.label}
                                                                                  </span>
                                                                                  {perm.desc && (
                                                                                      <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[180px]">{perm.desc}</span>
                                                                                  )}
                                                                              </div>
                                                                          );
                                                                      })}
                                                                  </div>
                                                              );
                                                          })}
                                                          {/* 无分类的扁平权限点（兼容旧结构） */}
                                                          {isSgOpen && !sg.categories && sg.permissions && sg.permissions.map(perm => {
                                                              const isChecked = current.includes(perm.id);
                                                              return (
                                                                  <div
                                                                      key={perm.id}
                                                                      onClick={() => togglePermission(perm.id)}
                                                                      className={`flex items-center gap-2.5 py-1.5 pr-4 cursor-pointer select-none transition-colors ${isChecked ? 'bg-blue-50/20 dark:bg-blue-900/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}`}
                                                                      style={{ paddingLeft: 72 }}
                                                                  >
                                                                      <div className="w-px h-4 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0"/>
                                                                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0
                                                                          ${isChecked
                                                                              ? 'bg-blue-600 border-blue-600'
                                                                              : 'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600'
                                                                          }`}>
                                                                          {isChecked && <Check className="w-2.5 h-2.5 text-white"/>}
                                                                      </div>
                                                                      <span className={`text-sm flex-1 ${isChecked ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                          {perm.label}
                                                                      </span>
                                                                      {perm.desc && (
                                                                          <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[200px]">{perm.desc}</span>
                                                                      )}
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
);

export default RoleFunctionalPermissionTree;
