import React from 'react';
import { Search, Plus, Shield, Copy, Trash2, GripVertical, X } from 'lucide-react';
import type { RoleDefinition } from '../../../types';

export interface RoleListSidebarProps {
  roles: RoleDefinition[];
  selectedRoleId: string | null;
  roleSearchTerm: string;
  setRoleSearchTerm: (v: string) => void;
  isRoleSearchOpen: boolean;
  setIsRoleSearchOpen: (v: boolean) => void;
  roleSearchInputRef: React.RefObject<HTMLInputElement | null>;
  dragRoleId: string | null;
  dragOverRoleId: string | null;
  onDragStart: (e: React.DragEvent, roleId: string) => void;
  onDragOver: (e: React.DragEvent, roleId: string) => void;
  onDrop: (e: React.DragEvent, roleId: string) => void;
  onDragEnd: () => void;
  onSelectRole: (role: RoleDefinition) => void;
  onCreateRole: () => void;
  onCopyRole: (role: RoleDefinition) => void;
  onDeleteRole: (id: string) => void;
}

const RoleListSidebar: React.FC<RoleListSidebarProps> = ({ roles, selectedRoleId, roleSearchTerm, setRoleSearchTerm, isRoleSearchOpen, setIsRoleSearchOpen, roleSearchInputRef, dragRoleId, dragOverRoleId, onDragStart: handleRoleDragStart, onDragOver: handleRoleDragOver, onDrop: handleRoleDrop, onDragEnd: handleRoleDragEnd, onSelectRole: handleSelectRole, onCreateRole: handleCreateRole, onCopyRole: handleCopyRole, onDeleteRole: handleDeleteRole }) => (
<>
{/* Role List */}
              <div className="unified-card w-1/4 min-w-[250px] dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col">
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
                      {isRoleSearchOpen ? (
                        <div className="relative flex-1 animate-fade-in">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            ref={roleSearchInputRef}
                            value={roleSearchTerm}
                            onChange={e => setRoleSearchTerm(e.target.value)}
                            onBlur={() => { if (!roleSearchTerm) setIsRoleSearchOpen(false); }}
                            onKeyDown={e => { if (e.key === 'Escape') { setRoleSearchTerm(''); setIsRoleSearchOpen(false); } }}
                            placeholder="搜索角色..."
                            autoFocus
                            className="w-full pl-8 pr-7 py-1 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white placeholder:text-gray-400 transition-all"
                          />
                          <button onClick={() => { setRoleSearchTerm(''); setIsRoleSearchOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-gray-800 dark:text-white flex-1">角色列表</h3>
                      )}
                      {!isRoleSearchOpen && (
                        <button onClick={() => { setIsRoleSearchOpen(true); setTimeout(() => roleSearchInputRef.current?.focus(), 0); }} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400" title="搜索角色">
                          <Search className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={handleCreateRole} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400 shrink-0"><Plus className="w-4 h-4"/></button>
                  </div>
                  <div className="flex-1 overflow-auto p-2 space-y-0.5">
                      {roles.filter(r => !roleSearchTerm || r.name.toLowerCase().includes(roleSearchTerm.toLowerCase())).map(role => (
                          <div 
                              key={role.id}
                              draggable={!roleSearchTerm}
                              onDragStart={(e) => handleRoleDragStart(e, role.id)}
                              onDragOver={(e) => handleRoleDragOver(e, role.id)}
                              onDrop={(e) => handleRoleDrop(e, role.id)}
                              onDragEnd={handleRoleDragEnd}
                              onClick={() => handleSelectRole(role)}
                              className={`p-2.5 pl-1 rounded-lg cursor-pointer transition-all flex items-center group
                                  ${selectedRoleId === role.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}
                                  ${dragRoleId === role.id ? 'opacity-40' : ''}
                                  ${dragOverRoleId === role.id && dragRoleId !== role.id ? 'ring-2 ring-blue-400 dark:ring-blue-500 ring-dashed bg-blue-50/50 dark:bg-blue-900/10' : ''}
                              `}
                          >
                              {!roleSearchTerm && (
                                  <div className="flex-shrink-0 cursor-grab active:cursor-grabbing px-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                                       onMouseDown={e => e.stopPropagation()}>
                                      <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                              )}
                              <div className="flex-1 flex justify-between items-center min-w-0">
                                  <div className="font-medium text-sm truncate">{role.name}</div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                      {role.id === 'Admin' && <Shield className="w-3 h-3 opacity-50"/>}
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); handleCopyRole(role); }}
                                          className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="复制角色"
                                      >
                                          <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      {role.id !== 'Admin' && (
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                                              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
</>
);

export default RoleListSidebar;
