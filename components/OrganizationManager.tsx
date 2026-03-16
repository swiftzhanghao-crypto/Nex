
import React, { useState, useMemo, useEffect } from 'react';
import { Department, User } from '../types';
import { Plus, Edit, Trash2, Users, Building2, ChevronRight, ChevronDown, FolderOpen, Folder, Briefcase, Mail, Search, X } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface OrganizationManagerProps {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  users: User[];
}

interface TreeNode extends Department {
  children: TreeNode[];
}

const OrganizationManager: React.FC<OrganizationManagerProps> = ({ departments, setDepartments, users }) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Department>({
    id: '',
    name: '',
    description: '',
    parentId: ''
  });

  // --- Tree Logic (Keep Same) ---
  const { treeNodes, expandedIdsFromSearch } = useMemo(() => {
    const buildTree = (depts: Department[]): TreeNode[] => {
        const deptMap = new Map<string, TreeNode>();
        depts.forEach(d => deptMap.set(d.id, { ...d, children: [] }));
        const roots: TreeNode[] = [];
        depts.forEach(d => {
            const node = deptMap.get(d.id)!;
            if (d.parentId && deptMap.has(d.parentId)) {
                deptMap.get(d.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });
        return roots;
    };

    if (!searchTerm.trim()) {
        return { treeNodes: buildTree(departments), expandedIdsFromSearch: new Set<string>() };
    }

    const lowerTerm = searchTerm.toLowerCase();
    const matchedNodeIds = new Set<string>();
    const idsToExpand = new Set<string>();
    const findParent = (id: string) => departments.find(d => d.id === id);

    departments.forEach(dept => {
        if (dept.name.toLowerCase().includes(lowerTerm)) {
            matchedNodeIds.add(dept.id);
            let curr = dept;
            while (curr.parentId) {
                const parent = findParent(curr.parentId);
                if (parent) {
                    matchedNodeIds.add(parent.id);
                    idsToExpand.add(parent.id);
                    curr = parent;
                } else break;
            }
        }
    });

    const filteredDepts = departments.filter(d => matchedNodeIds.has(d.id));
    return { treeNodes: buildTree(filteredDepts), expandedIdsFromSearch: idsToExpand };

  }, [departments, searchTerm]);

  useEffect(() => {
      if (searchTerm.trim()) {
          setExpandedIds(prev => {
              const next = new Set(prev);
              expandedIdsFromSearch.forEach(id => next.add(id));
              return next;
          });
      }
  }, [expandedIdsFromSearch, searchTerm]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedIds(newSet);
  };

  const handleSelect = (id: string) => setSelectedDeptId(id);

  const handleOpenModal = (department?: Department) => {
    if (department) { setEditingId(department.id); setFormData(department); } 
    else { setEditingId(null); setFormData({ id: `dept-${Date.now()}`, name: '', description: '', parentId: selectedDeptId || '' }); }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    if (formData.parentId === formData.id) return alert("上级部门不能是自己");
    if (editingId) setDepartments(prev => prev.map(d => d.id === editingId ? formData : d));
    else setDepartments(prev => [...prev, formData]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const hasChildren = departments.some(d => d.parentId === id);
    if (hasChildren) return alert('无法删除：该部门下仍有子部门。');
    const hasUsers = users.some(u => u.departmentId === id);
    if (hasUsers) return alert('无法删除：仍有用户归属于该部门。');
    if (confirm('确定要删除这个部门吗？')) {
      setDepartments(prev => prev.filter(d => d.id !== id));
      if (selectedDeptId === id) setSelectedDeptId(null);
    }
  };

  const getUserCount = (deptId: string) => users.filter(u => u.departmentId === deptId).length;

  // --- Tree Node ---
  const TreeNodeItem: React.FC<{ node: TreeNode; level: number }> = ({ node, level }) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedIds.has(node.id);
      const isSelected = selectedDeptId === node.id;
      const isSearchMatch = searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase());

      return (
          <div className="min-w-fit">
              <div 
                  className={`flex items-center gap-2 py-2 px-2 cursor-pointer rounded-lg transition-colors text-sm whitespace-nowrap ${
                      isSelected 
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium' 
                      : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                  }`}
                  style={{ paddingLeft: `${level * 16 + 8}px` }}
                  onClick={() => handleSelect(node.id)}
              >
                  <button 
                      onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                      className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0 ${!hasChildren ? 'invisible' : ''}`}
                  >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                  
                  {isExpanded ? (
                       <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-yellow-500'}`} />
                  ) : (
                       <Folder className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-yellow-500'}`} />
                  )}
                  
                  <span className={isSearchMatch ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 px-1 rounded" : ""}>{node.name}</span>
              </div>
              {hasChildren && isExpanded && (
                  <div>
                      {node.children.map(child => <TreeNodeItem key={child.id} node={child} level={level + 1} />)}
                  </div>
              )}
          </div>
      );
  };

  const selectedDept = departments.find(d => d.id === selectedDeptId);
  const deptUsers = selectedDeptId ? users.filter(u => u.departmentId === selectedDeptId) : [];
  const childDepts = selectedDeptId ? departments.filter(d => d.parentId === selectedDeptId) : [];
  const parentDept = selectedDept && selectedDept.parentId ? departments.find(d => d.id === selectedDept.parentId) : null;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col animate-fade-in">
      <div className="flex justify-between items-center shrink-0 mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">组织架构管理</h1>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="unified-button-primary bg-[#0071E3] dark:bg-[#FF2D55] hover: shadow-apple"
        >
          <Plus className="w-4 h-4" /> 新增部门
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
          <div className="unified-card w-1/3 min-w-[300px] dark:bg-[#1C1C1E] -gray-200 dark:-white/10 flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 shrink-0">
                  <Building2 className="w-4 h-4" /> 组织树
              </div>
              
              <div className="p-3 border-b border-gray-100 dark:border-white/10 shrink-0">
                  <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="搜索部门..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition"
                      />
                      {searchTerm && (
                          <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                              <X className="w-3.5 h-3.5" />
                          </button>
                      )}
                  </div>
              </div>

              <div className="flex-1 overflow-auto p-2 custom-scrollbar">
                  {treeNodes.length > 0 ? (
                      treeNodes.map(node => <TreeNodeItem key={node.id} node={node} level={0} />)
                  ) : (
                      <div className="text-center py-10 text-gray-400 text-sm">
                          {searchTerm ? '未找到匹配的部门' : '暂无部门数据'}
                      </div>
                  )}
              </div>
          </div>

          <div className="unified-card flex-1 dark:bg-[#1C1C1E] -gray-200 dark:-white/10 flex flex-col">
              {selectedDept ? (
                  <>
                    <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-start bg-gray-50/50 dark:bg-white/5 shrink-0">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedDept.name}</h3>
                                {parentDept && (
                                    <span className="text-xs bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded flex items-center gap-1">
                                        <ChevronRight className="w-3 h-3 text-gray-400" /> 
                                        隶属于: {parentDept.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedDept.description || "暂无描述"}</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => handleOpenModal(selectedDept)} className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition text-sm font-medium"><Edit className="w-4 h-4" /> 编辑</button>
                             <button onClick={() => handleDelete(selectedDept.id)} className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition text-sm font-medium"><Trash2 className="w-4 h-4" /> 删除</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 下级部门 ({childDepts.length})
                            </h4>
                            {childDepts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {childDepts.map(child => (
                                        <div 
                                            key={child.id} 
                                            onClick={() => handleSelect(child.id)}
                                            className="p-4 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-indigo-200 transition cursor-pointer group"
                                        >
                                            <div className="font-medium text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{child.name}</div>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Users className="w-3 h-3" /> {getUserCount(child.id)} 人
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">暂无下级部门。</p>
                            )}
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 部门成员 ({deptUsers.length})
                            </h4>
                            {deptUsers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {deptUsers.map(user => (
                                        <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/10 hover:border-indigo-100 dark:hover:border-indigo-900 transition">
                                            <div className="relative flex-shrink-0">
                                                <img src={user.avatar} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" alt={user.name} />
                                                {user.monthBadge && (
                                                    <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[8px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-800 dark:text-white text-sm">{user.name}</div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    <Briefcase className="w-3 h-3" /> {user.role}
                                                    <span className="text-gray-300 dark:text-gray-600">|</span>
                                                    <Mail className="w-3 h-3" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">该部门暂无直属成员。</p>
                            )}
                        </div>
                    </div>
                  </>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                      <Building2 className="w-16 h-16 text-gray-200 dark:text-white/10 mb-4" />
                      <p>请在左侧选择一个部门查看详情</p>
                  </div>
              )}
          </div>
      </div>

      {isModalOpen && (

        <ModalPortal>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
          <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-md flex flex-col animate-modal-enter -white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editingId ? '编辑部门' : '新增部门'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">&times;</button>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">部门名称</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2.5 outline-none text-gray-900 dark:text-white" />
                </div>
                {/* ... other inputs ... */}
            </div>
            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition font-medium">取消</button>
              <button onClick={handleSave} className="unified-button-primary bg-[#0071E3] dark:bg-[#FF2D55] hover: shadow-apple">保存</button>
            </div>
          </div>
        </div>
        </ModalPortal>

      )}
    </div>
  );
};

export default OrganizationManager;
