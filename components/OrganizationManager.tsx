
import React, { useState, useMemo, useEffect } from 'react';
import { Department, User } from '../types';
import { Plus, Edit, Trash2, Users, Building2, ChevronRight, ChevronDown, FolderOpen, Folder, Briefcase, Mail, Search, X } from 'lucide-react';

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
  
  // Form State
  const [formData, setFormData] = useState<Department>({
    id: '',
    name: '',
    description: '',
    parentId: ''
  });

  // --- Tree Building and Search Logic ---
  const { treeNodes, expandedIdsFromSearch } = useMemo(() => {
    // Helper to build tree from a flat list
    const buildTree = (depts: Department[]): TreeNode[] => {
        const deptMap = new Map<string, TreeNode>();
        // Initialize map with empty children
        depts.forEach(d => deptMap.set(d.id, { ...d, children: [] }));
        
        const roots: TreeNode[] = [];
        depts.forEach(d => {
            const node = deptMap.get(d.id)!;
            // If parent exists in the *provided list* (filtered or full), attach it
            if (d.parentId && deptMap.has(d.parentId)) {
                deptMap.get(d.parentId)!.children.push(node);
            } else {
                // Otherwise it acts as a root in this context
                roots.push(node);
            }
        });
        return roots;
    };

    // If no search, return full tree
    if (!searchTerm.trim()) {
        return { 
            treeNodes: buildTree(departments), 
            expandedIdsFromSearch: new Set<string>() 
        };
    }

    // --- Search Logic ---
    const lowerTerm = searchTerm.toLowerCase();
    const matchedNodeIds = new Set<string>();
    const idsToExpand = new Set<string>();

    // Helper to find parent in full list
    const findParent = (id: string) => departments.find(d => d.id === id);

    departments.forEach(dept => {
        if (dept.name.toLowerCase().includes(lowerTerm)) {
            matchedNodeIds.add(dept.id);
            
            // Walk up to root to ensure all ancestors are included
            let curr = dept;
            while (curr.parentId) {
                const parent = findParent(curr.parentId);
                if (parent) {
                    matchedNodeIds.add(parent.id);
                    idsToExpand.add(parent.id); // Expand all parents
                    curr = parent;
                } else {
                    break;
                }
            }
        }
    });

    const filteredDepts = departments.filter(d => matchedNodeIds.has(d.id));
    return { 
        treeNodes: buildTree(filteredDepts), 
        expandedIdsFromSearch: idsToExpand 
    };

  }, [departments, searchTerm]);

  // Sync expansion state when search results change
  useEffect(() => {
      if (searchTerm.trim()) {
          setExpandedIds(prev => {
              const next = new Set(prev);
              expandedIdsFromSearch.forEach(id => next.add(id));
              return next;
          });
      }
  }, [expandedIdsFromSearch, searchTerm]);

  // --- Handlers ---
  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const handleSelect = (id: string) => {
    setSelectedDeptId(id);
  };

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingId(department.id);
      setFormData(department);
    } else {
      setEditingId(null);
      // Default to adding under currently selected department, if any
      setFormData({ 
          id: `dept-${Date.now()}`, 
          name: '', 
          description: '',
          parentId: selectedDeptId || ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    // Cycle Check: Cannot set parent to self
    if (formData.parentId === formData.id) {
        alert("上级部门不能是自己");
        return;
    }

    if (editingId) {
      setDepartments(prev => prev.map(d => d.id === editingId ? formData : d));
    } else {
      setDepartments(prev => [...prev, formData]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    // Check if has sub-departments
    const hasChildren = departments.some(d => d.parentId === id);
    if (hasChildren) {
        alert('无法删除：该部门下仍有子部门，请先处理子部门。');
        return;
    }
    
    // Check if users are assigned
    const hasUsers = users.some(u => u.departmentId === id);
    if (hasUsers) {
        alert('无法删除：仍有用户归属于该部门，请先转移用户。');
        return;
    }

    if (confirm('确定要删除这个部门吗？')) {
      setDepartments(prev => prev.filter(d => d.id !== id));
      if (selectedDeptId === id) setSelectedDeptId(null);
    }
  };

  const getUserCount = (deptId: string) => {
      return users.filter(u => u.departmentId === deptId).length;
  };

  // --- Recursive Tree Component ---
  const TreeNodeItem: React.FC<{ node: TreeNode; level: number }> = ({ node, level }) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedIds.has(node.id);
      const isSelected = selectedDeptId === node.id;
      
      // Determine if this specific node matches the search term directly (highlighting)
      const isSearchMatch = searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase());

      return (
          <div className="min-w-fit">
              <div 
                  className={`flex items-center gap-2 py-2 px-2 cursor-pointer rounded-lg transition-colors text-sm whitespace-nowrap ${
                      isSelected ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  style={{ paddingLeft: `${level * 16 + 8}px` }}
                  onClick={() => handleSelect(node.id)}
              >
                  <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(node.id);
                      }}
                      className={`p-1 rounded hover:bg-black/5 flex-shrink-0 ${!hasChildren ? 'invisible' : ''}`}
                  >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                  
                  {isExpanded ? (
                       <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-600' : 'text-yellow-500'}`} />
                  ) : (
                       <Folder className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-600' : 'text-yellow-500'}`} />
                  )}
                  
                  <span className={isSearchMatch ? "bg-yellow-100 text-yellow-800 px-1 rounded" : ""}>{node.name}</span>
              </div>
              {hasChildren && isExpanded && (
                  <div>
                      {node.children.map(child => (
                          <TreeNodeItem key={child.id} node={child} level={level + 1} />
                      ))}
                  </div>
              )}
          </div>
      );
  };

  // --- Right Panel Content Helpers ---
  const selectedDept = departments.find(d => d.id === selectedDeptId);
  const deptUsers = selectedDeptId ? users.filter(u => u.departmentId === selectedDeptId) : [];
  const childDepts = selectedDeptId ? departments.filter(d => d.parentId === selectedDeptId) : [];
  const parentDept = selectedDept && selectedDept.parentId ? departments.find(d => d.id === selectedDept.parentId) : null;

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">组织架构管理</h2>
            <p className="text-gray-500 text-sm mt-1">查看和管理公司的多级部门结构。</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> 新增部门
        </button>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
          
          {/* Left Sidebar: Tree View */}
          <div className="w-1/3 min-w-[300px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50 font-medium text-gray-700 flex items-center gap-2 shrink-0">
                  <Building2 className="w-4 h-4" /> 组织树
              </div>
              
              {/* Tree Search Input */}
              <div className="p-3 border-b border-gray-100 shrink-0">
                  <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="搜索部门..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
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

              {/* Tree Content */}
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

          {/* Right Content: Details */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              {selectedDept ? (
                  <>
                    {/* Dept Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 shrink-0">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-2xl font-bold text-gray-800">{selectedDept.name}</h3>
                                {parentDept && (
                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                                        <ChevronRight className="w-3 h-3 text-gray-400" /> 
                                        隶属于: {parentDept.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm">{selectedDept.description || "暂无描述"}</p>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => handleOpenModal(selectedDept)}
                                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition flex items-center gap-2 text-sm font-medium"
                             >
                                <Edit className="w-4 h-4" /> 编辑
                             </button>
                             <button 
                                onClick={() => handleDelete(selectedDept.id)}
                                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition flex items-center gap-2 text-sm font-medium"
                             >
                                <Trash2 className="w-4 h-4" /> 删除
                             </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Sub Departments */}
                        <div>
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Folder className="w-4 h-4 text-indigo-600" /> 下级部门 ({childDepts.length})
                            </h4>
                            {childDepts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {childDepts.map(child => (
                                        <div 
                                            key={child.id} 
                                            onClick={() => handleSelect(child.id)}
                                            className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white hover:border-indigo-200 hover:shadow-sm cursor-pointer transition group"
                                        >
                                            <div className="font-medium text-gray-800 group-hover:text-indigo-600">{child.name}</div>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                <Users className="w-3 h-3" /> {getUserCount(child.id)} 人
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">暂无下级部门。</p>
                            )}
                        </div>

                        {/* Members */}
                        <div>
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-600" /> 部门成员 ({deptUsers.length})
                            </h4>
                            {deptUsers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {deptUsers.map(user => (
                                        <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-100 transition">
                                            <img src={user.avatar} className="w-10 h-10 rounded-full bg-gray-200" alt={user.name} />
                                            <div>
                                                <div className="font-medium text-gray-800 text-sm">{user.name}</div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                    <Briefcase className="w-3 h-3" /> {user.role}
                                                    <span className="text-gray-300">|</span>
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
                      <Building2 className="w-16 h-16 text-gray-200 mb-4" />
                      <p>请在左侧选择一个部门查看详情</p>
                  </div>
              )}
          </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? '编辑部门' : '新增部门'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">部门名称</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="例如：人力资源部"
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">上级部门</label>
                    <select 
                        value={formData.parentId || ''}
                        onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        <option value="">-- 无 (作为顶级部门) --</option>
                        {departments
                            .filter(d => d.id !== formData.id) // Cannot select self as parent
                            .map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))
                        }
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">职能描述</label>
                    <textarea 
                        rows={3}
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="描述该部门的主要职责..."
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition font-medium">取消</button>
              <button 
                onClick={handleSave} 
                disabled={!formData.name}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md disabled:opacity-50"
              >
                  保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManager;
