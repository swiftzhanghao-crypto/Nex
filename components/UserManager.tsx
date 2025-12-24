
import React, { useState } from 'react';
import { User, UserRole, Department, RoleDefinition, UserType } from '../types';
import { Search, Plus, Shield, User as UserIcon, Briefcase, Truck, Monitor, Edit, Building2, X, Mail, CheckCircle, Calendar, Hash, Lock, CheckSquare, Settings } from 'lucide-react';

interface UserManagerProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  departments: Department[];
  roles: RoleDefinition[];
  setRoles: React.Dispatch<React.SetStateAction<RoleDefinition[]>>;
}

const UserManager: React.FC<UserManagerProps> = ({ users, setUsers, departments, roles, setRoles }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  
  // User Drawer State
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Available Permissions List (System Capabilities)
  const availablePermissions = [
      { id: 'all', label: '超级管理员权限 (All)' },
      { id: 'order_create', label: '创建订单' },
      { id: 'order_approve', label: '审批订单' },
      { id: 'order_view_all', label: '查看所有订单' },
      { id: 'customer_view', label: '查看客户档案' },
      { id: 'customer_edit', label: '编辑客户档案' },
      { id: 'payment_manage', label: '财务收款管理' },
      { id: 'stock_prep', label: '生产备货操作' },
      { id: 'license_gen', label: '授权码生成' },
      { id: 'shipping_manage', label: '物流发货管理' },
      { id: 'opportunity_manage', label: '商机管理' },
      { id: 'system_config', label: '系统参数配置' },
  ];

  // Forms
  const [userForm, setUserForm] = useState<Partial<User>>({
      name: '',
      email: '',
      role: 'Sales',
      departmentId: '',
      status: 'Active',
      avatar: '',
      userType: 'Internal'
  });

  const [roleForm, setRoleForm] = useState<Partial<RoleDefinition>>({
      name: '',
      description: '',
      permissions: []
  });

  const getRoleBadgeColor = (roleId: string) => {
      const role = roles.find(r => r.id === roleId);
      if (!role) return 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
      
      if (role.id === 'Admin') return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      if (role.id === 'Sales') return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      if (role.id === 'Business') return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      if (role.id === 'Technical') return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';
  };

  const getRoleName = (roleId: string) => {
      const role = roles.find(r => r.id === roleId);
      return role ? role.name : roleId;
  };

  const getDepartmentName = (deptId?: string) => {
      if (!deptId) return <span className="text-gray-400 italic">未分配</span>;
      const dept = departments.find(d => d.id === deptId);
      return dept ? dept.name : <span className="text-gray-400 italic">未知部门</span>;
  };

  const generateAccountId = () => {
      // Generate 8-digit unique ID
      let id = '';
      do {
          id = Math.floor(10000000 + Math.random() * 90000000).toString();
      } while (users.some(u => u.accountId === id));
      return id;
  };

  // --- User Handlers ---
  const handleOpenUserModal = (user?: User) => {
      if (user) { 
          setEditingId(user.id); 
          setUserForm(user); 
      } else { 
          setEditingId(null); 
          setUserForm({ 
              name: '', 
              email: '', 
              role: roles[0]?.id || '', 
              departmentId: '', 
              status: 'Active', 
              userType: 'Internal',
              avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${Date.now()}` 
          }); 
      }
      setIsModalOpen(true);
  };

  const handleSaveUser = () => {
      if (!userForm.name || !userForm.email) return;
      if (editingId) {
          setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...userForm } as User : u));
      } else { 
          const newUser: User = { 
              id: `u-${Date.now()}`,
              accountId: generateAccountId(), // Generate ID on creation
              ...userForm as User, 
              avatar: userForm.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userForm.name}` 
          }; 
          setUsers(prev => [...prev, newUser]); 
      }
      setIsModalOpen(false);
  };

  // --- Role Handlers ---
  const handleOpenRoleModal = (role?: RoleDefinition) => {
      if (role) {
          setEditingRoleId(role.id);
          setRoleForm({ ...role });
      } else {
          setEditingRoleId(null);
          setRoleForm({ name: '', description: '', permissions: [] });
      }
      setIsRoleModalOpen(true);
  };

  const handleSaveRole = () => {
      if (!roleForm.name) return;
      if (editingRoleId) {
          setRoles(prev => prev.map(r => r.id === editingRoleId ? { ...r, ...roleForm } as RoleDefinition : r));
      } else {
          const newRole: RoleDefinition = {
              id: `role-${Date.now()}`,
              isSystem: false,
              ...roleForm as RoleDefinition
          };
          setRoles(prev => [...prev, newRole]);
      }
      setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (id: string) => {
      const role = roles.find(r => r.id === id);
      if (role?.isSystem) return alert("系统内置角色不可删除。");
      if (users.some(u => u.role === id)) return alert("该角色下仍有用户，无法删除。");
      if (confirm("确定要删除此角色吗？")) {
          setRoles(prev => prev.filter(r => r.id !== id));
      }
  };

  const togglePermission = (permId: string) => {
      const current = roleForm.permissions || [];
      if (current.includes(permId)) {
          setRoleForm({ ...roleForm, permissions: current.filter(p => p !== permId) });
      } else {
          setRoleForm({ ...roleForm, permissions: [...current, permId] });
      }
  };

  const handleCloseDrawer = () => { setIsDrawerClosing(true); setTimeout(() => { setViewUser(null); setIsDrawerClosing(false); }, 280); };

  // Pagination & Filtering
  const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.accountId.includes(searchTerm)
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">用户与权限管理</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理系统账号、人员类型及角色权限配置。</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-md">
            <button 
                onClick={() => setActiveTab('USERS')} 
                className={`px-4 py-2 rounded-sm text-sm font-medium transition ${activeTab === 'USERS' ? 'bg-white dark:bg-[#1C1C1E] shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
            >
                用户列表
            </button>
            <button 
                onClick={() => setActiveTab('ROLES')} 
                className={`px-4 py-2 rounded-sm text-sm font-medium transition ${activeTab === 'ROLES' ? 'bg-white dark:bg-[#1C1C1E] shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
            >
                角色配置
            </button>
        </div>
      </div>

      {/* --- USERS TAB --- */}
      {activeTab === 'USERS' && (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col animate-fade-in">
            <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="搜索姓名、邮箱、账号ID..." 
                    className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <button 
                  onClick={() => handleOpenUserModal()}
                  className="bg-[#0071E3] dark:bg-[#FF2D55] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-sm text-sm font-medium"
              >
                  <Plus className="w-4 h-4" /> 新增用户
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80 dark:bg-white/5 backdrop-blur border-b border-gray-200/50 dark:border-white/10 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase">
                  <tr>
                    <th className="p-4 pl-6">用户 / 账号ID</th>
                    <th className="p-4">类型</th>
                    <th className="p-4">所属部门</th>
                    <th className="p-4">角色</th>
                    <th className="p-4">状态</th>
                    <th className="p-4 text-right pr-6">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {currentUsers.map(user => (
                    <tr key={user.id} className="group hover:bg-gray-100/80 dark:hover:bg-white/[0.08] even:bg-gray-50/50 dark:even:bg-white/[0.02] transition-colors">
                      <td className="p-4 pl-6">
                          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewUser(user)}>
                              <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10 group-hover:ring-2 group-hover:ring-indigo-100 transition bg-gray-100 dark:bg-gray-800" alt={user.name} />
                              <div>
                                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-[#FF2D55] text-sm transition">{user.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                                      <Hash className="w-3 h-3"/> {user.accountId}
                                  </div>
                              </div>
                          </div>
                      </td>
                      <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${
                              user.userType === 'Internal' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                              : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
                          }`}>
                              {user.userType === 'Internal' ? '内部人员' : '外部人员'}
                          </span>
                      </td>
                      <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/10 px-2 py-1 rounded-sm w-fit">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              {getDepartmentName(user.departmentId)}
                          </div>
                      </td>
                      <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold border ${getRoleBadgeColor(user.role)}`}>
                              <Shield className="w-3.5 h-3.5" /> {getRoleName(user.role)}
                          </span>
                      </td>
                      <td className="p-4">
                          <span className={`px-2 py-1 rounded-sm text-[10px] font-bold ${user.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                              {user.status === 'Active' ? '正常' : '停用'}
                          </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                          <button onClick={() => handleOpenUserModal(user)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-[#FF2D55] p-2 hover:bg-indigo-50 dark:hover:bg-white/10 rounded-md transition">
                              <Edit className="w-4 h-4" />
                          </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-sm border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-sm">上一页</button>
                    <div className="text-sm text-gray-600 dark:text-gray-400">第 {currentPage} 页 / 共 {totalPages} 页</div>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-sm border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-sm">下一页</button>
                </div>
            )}
          </div>
      )}

      {/* --- ROLES TAB --- */}
      {activeTab === 'ROLES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {roles.map(role => (
                  <div key={role.id} className="bg-white dark:bg-[#1C1C1E] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-white/10 hover:shadow-md transition relative group">
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-md flex items-center justify-center ${getRoleBadgeColor(role.id).replace('border', '')} bg-opacity-20`}>
                                  <Shield className="w-5 h-5"/>
                              </div>
                              <div>
                                  <h3 className="font-bold text-gray-900 dark:text-white">{role.name}</h3>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{role.permissions.length} 项权限</div>
                              </div>
                          </div>
                          <button onClick={() => handleOpenRoleModal(role)} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-[#FF2D55] hover:bg-gray-50 dark:hover:bg-white/10 rounded-md transition">
                              <Settings className="w-4 h-4"/>
                          </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 h-10 line-clamp-2">{role.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                          {role.permissions.slice(0, 3).map(p => {
                              const label = availablePermissions.find(ap => ap.id === p)?.label || p;
                              return (
                                  <span key={p} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-sm border border-gray-200 dark:border-white/5 truncate max-w-[100px]">
                                      {label}
                                  </span>
                              )
                          })}
                          {role.permissions.length > 3 && <span className="text-[10px] text-gray-400">+{(role.permissions.length - 3)}</span>}
                      </div>
                      {role.isSystem && (
                          <div className="absolute top-4 right-12 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[9px] font-bold rounded-sm border border-yellow-200 dark:border-yellow-800">
                              系统内置
                          </div>
                      )}
                  </div>
              ))}
              
              {/* Add Role Card */}
              <button 
                  onClick={() => handleOpenRoleModal()}
                  className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-[#FF2D55] hover:bg-blue-50/50 dark:hover:bg-white/5 transition text-gray-400 hover:text-blue-600 dark:hover:text-[#FF2D55] min-h-[200px]"
              >
                  <Plus className="w-8 h-8 mb-2"/>
                  <span className="text-sm font-bold">新增角色配置</span>
              </button>
          </div>
      )}

      {/* --- User Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-modal-enter border border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editingId ? '编辑用户' : '新增用户'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-4">
                {!editingId && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <Lock className="w-3 h-3"/> 账号 ID 将在保存后自动生成 (8位数字)。
                    </div>
                )}
                {editingId && (
                    <div><label className="block text-sm font-medium text-gray-500 mb-1">账号 ID</label><div className="font-mono text-gray-900 dark:text-white font-bold text-lg">{userForm.accountId}</div></div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">姓名</label>
                        <input type="text" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">人员类型</label>
                        <select value={userForm.userType} onChange={(e) => setUserForm({...userForm, userType: e.target.value as UserType})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white">
                            <option value="Internal">内部员工</option>
                            <option value="External">外部人员</option>
                        </select>
                    </div>
                </div>

                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱</label><input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white" /></div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">系统角色</label>
                        <select value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white">
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
                        <select value={userForm.status} onChange={(e) => setUserForm({...userForm, status: e.target.value as any})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white">
                            <option value="Active">正常</option>
                            <option value="Inactive">停用</option>
                        </select>
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所属部门</label>
                     <select value={userForm.departmentId} onChange={(e) => setUserForm({...userForm, departmentId: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white">
                        <option value="">-- 选择部门 --</option>
                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition font-medium">取消</button>
              <button onClick={handleSaveUser} disabled={!userForm.name} className="px-4 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-md hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition font-medium shadow-md disabled:opacity-50">保存用户</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Role Modal --- */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-modal-enter border border-white/10 max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editingRoleId ? '编辑角色配置' : '新增角色配置'}</h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">角色名称</label>
                    <input type="text" value={roleForm.name} onChange={(e) => setRoleForm({...roleForm, name: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white" placeholder="如：高级销售经理" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述说明</label>
                    <textarea value={roleForm.description} onChange={(e) => setRoleForm({...roleForm, description: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white resize-none h-20" placeholder="该角色的职责范围说明..." />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">权限配置 (Permissions)</label>
                    <div className="grid grid-cols-2 gap-3">
                        {availablePermissions.map(perm => {
                            const isChecked = roleForm.permissions?.includes(perm.id);
                            return (
                                <div 
                                    key={perm.id} 
                                    onClick={() => togglePermission(perm.id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${isChecked ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white dark:bg-black border-gray-200 dark:border-white/10 hover:border-blue-300'}`}
                                >
                                    <div className={`w-5 h-5 rounded-sm border flex items-center justify-center ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                        {isChecked && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className={`text-sm ${isChecked ? 'text-blue-900 dark:text-blue-100 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{perm.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-between items-center gap-3">
              {editingRoleId && !roleForm.isSystem ? (
                  <button onClick={() => { setIsRoleModalOpen(false); handleDeleteRole(editingRoleId); }} className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition font-medium text-sm">删除角色</button>
              ) : <div></div>}
              <div className="flex gap-3">
                  <button onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition font-medium">取消</button>
                  <button onClick={handleSaveRole} disabled={!roleForm.name} className="px-4 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-md hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition font-medium shadow-md disabled:opacity-50">保存配置</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Details Drawer */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${isDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleCloseDrawer}></div>
            <div className={`relative w-full max-w-md h-full bg-white dark:bg-[#1C1C1E] shadow-2xl overflow-y-auto flex flex-col ${isDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`} onClick={(e) => e.stopPropagation()}>
                 
                 {/* Header Gradient */}
                 <div className="h-40 bg-gradient-to-br from-[#0071E3] to-purple-600 dark:from-[#FF2D55] dark:to-orange-500 shrink-0 relative flex justify-end p-4">
                     <button onClick={handleCloseDrawer} className="text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition"><X className="w-5 h-5"/></button>
                 </div>
                 
                 <div className="px-6 pb-8 -mt-16 flex-1 relative z-10">
                     {/* Avatar & Name */}
                     <div className="flex flex-col items-center text-center mb-8">
                         <img src={viewUser.avatar} className="w-32 h-32 rounded-full border-4 border-white dark:border-[#1C1C1E] shadow-lg bg-white dark:bg-gray-800 object-cover" alt={viewUser.name} />
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">{viewUser.name}</h2>
                         <p className="text-gray-500 dark:text-gray-400 text-sm">{viewUser.email}</p>
                         <div className="flex gap-2 mt-3">
                             <span className="bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-sm text-xs font-bold text-gray-600 dark:text-gray-300 font-mono">
                                 ID: {viewUser.accountId}
                             </span>
                             <span className={`px-3 py-1 rounded-sm text-xs font-bold ${
                                 viewUser.userType === 'Internal' 
                                 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                 : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                             }`}>
                                 {viewUser.userType === 'Internal' ? '内部人员' : '外部人员'}
                             </span>
                         </div>
                     </div>

                     {/* Details List */}
                     <div className="space-y-4">
                         <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                             <div className="text-xs font-bold text-gray-400 uppercase mb-2">所属部门</div>
                             <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                 <Building2 className="w-4 h-4 text-gray-400"/>
                                 {getDepartmentName(viewUser.departmentId)}
                             </div>
                         </div>

                         <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                             <div className="text-xs font-bold text-gray-400 uppercase mb-2">角色权限</div>
                             <div className="flex items-center gap-2 mb-2">
                                 <Shield className="w-4 h-4 text-indigo-500"/>
                                 <span className="font-bold text-gray-900 dark:text-white">{getRoleName(viewUser.role)}</span>
                             </div>
                             {/* Show permissions associated with role */}
                             <div className="flex flex-wrap gap-1">
                                 {roles.find(r => r.id === viewUser.role)?.permissions.map(p => {
                                     const label = availablePermissions.find(ap => ap.id === p)?.label || p;
                                     return (
                                         <span key={p} className="text-[10px] bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 px-2 py-1 rounded text-gray-500 dark:text-gray-400">
                                             {label}
                                         </span>
                                     )
                                 })}
                             </div>
                         </div>
                     </div>
                 </div>
                 
                 <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex gap-3">
                     <button onClick={() => { handleOpenUserModal(viewUser); handleCloseDrawer(); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-md font-medium text-sm hover:bg-indigo-700 transition">编辑资料</button>
                     <button className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-md text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition">重置密码</button>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
