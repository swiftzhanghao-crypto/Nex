
import React, { useState } from 'react';
import { User, UserRole, Department } from '../types';
import { Search, Plus, Shield, User as UserIcon, Briefcase, Truck, Monitor, Edit, Building2, X, Mail, CheckCircle, Calendar, Hash } from 'lucide-react';

interface UserManagerProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  departments: Department[];
}

const UserManager: React.FC<UserManagerProps> = ({ users, setUsers, departments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState<Partial<User>>({
      name: '',
      email: '',
      role: 'Sales',
      departmentId: '',
      status: 'Active',
      avatar: ''
  });

  const getRoleIcon = (role: UserRole) => {
      switch(role) {
          case 'Admin': return <Shield className="w-4 h-4 text-red-500" />;
          case 'Sales': return <UserIcon className="w-4 h-4 text-blue-500" />;
          case 'Business': return <Briefcase className="w-4 h-4 text-orange-500" />;
          case 'Technical': return <Monitor className="w-4 h-4 text-purple-500" />;
          case 'Logistics': return <Truck className="w-4 h-4 text-green-500" />;
          default: return <UserIcon className="w-4 h-4 text-gray-500" />;
      }
  };

  const getRoleBadgeColor = (role: UserRole) => {
      switch(role) {
          case 'Admin': return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
          case 'Sales': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
          case 'Business': return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
          case 'Technical': return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
          case 'Logistics': return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
          default: return 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
      }
  };

  const getDepartmentName = (deptId?: string) => {
      if (!deptId) return <span className="text-gray-400 italic">未分配</span>;
      const dept = departments.find(d => d.id === deptId);
      return dept ? dept.name : <span className="text-gray-400 italic">未知部门</span>;
  };

  const getPermissionsList = (role: UserRole) => {
     // ... keep permissions logic ...
      switch(role) {
          case 'Admin': return ['所有模块的完全访问权限', '系统配置与参数设置', '用户与角色管理', '全量数据统计与分析'];
          case 'Sales': return ['创建与管理销售订单', '查看客户档案', '发起销售审批流程', '查看个人销售报表'];
          case 'Business': return ['查看所有销售订单', '执行商务审批流程', '录入财务收款信息', '客户信用额度管理'];
          case 'Technical': return ['查看待生产订单', '安装包与授权码管理', '确认生产完成状态', '产品技术参数维护'];
          case 'Logistics': return ['查看待发货订单', '录入物流发货信息', '库存出入库管理', '物流状态追踪'];
          default: return ['基础系统访问权限'];
      }
  };

  const handleOpenModal = (user?: User) => {
      if (user) { setEditingId(user.id); setFormData(user); } else { setEditingId(null); setFormData({ name: '', email: '', role: 'Sales', departmentId: '', status: 'Active', avatar: `https://ui-avatars.com/api/?name=User&background=random&color=fff` }); }
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!formData.name || !formData.email) return;
      if (editingId) setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...formData } as User : u));
      else { const newUser: User = { id: `u-${Date.now()}`, ...formData as User, avatar: formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random&color=fff` }; setUsers(prev => [...prev, newUser]); }
      setIsModalOpen(false);
  };

  const handleCloseDrawer = () => { setIsDrawerClosing(true); setTimeout(() => { setViewUser(null); setIsDrawerClosing(false); }, 280); };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理系统用户、分配角色及所属部门。</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#0071E3] dark:bg-[#FF2D55] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> 新增用户
        </button>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索用户姓名、邮箱或角色..." 
            className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase">
              <tr>
                <th className="p-4">用户</th>
                <th className="p-4">所属部门</th>
                <th className="p-4">角色</th>
                <th className="p-4">权限范围</th>
                <th className="p-4">状态</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {currentUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition">
                  <td className="p-4">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewUser(user)}>
                          <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10 group-hover:ring-2 group-hover:ring-indigo-100 transition" alt={user.name} />
                          <div>
                              <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-[#FF2D55] text-sm transition">{user.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                      </div>
                  </td>
                  <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/10 px-2 py-1 rounded w-fit">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {getDepartmentName(user.departmentId)}
                      </div>
                  </td>
                  <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)} {user.role}
                      </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                      {getPermissionsList(user.role)[0]}...
                  </td>
                  <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${user.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {user.status === 'Active' ? '正常' : '停用'}
                      </span>
                  </td>
                  <td className="p-4 text-right">
                      <button onClick={() => handleOpenModal(user)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-[#FF2D55] p-2 hover:bg-indigo-50 dark:hover:bg-white/10 rounded-full transition">
                          <Edit className="w-4 h-4" />
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
         {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-sm">上一页</button>
                <div className="text-sm text-gray-600 dark:text-gray-400">第 {currentPage} 页 / 共 {totalPages} 页</div>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-sm">下一页</button>
            </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-modal-enter border border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editingId ? '编辑用户' : '新增用户'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">姓名</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2.5 outline-none text-gray-900 dark:text-white" /></div>
                {/* ... other inputs ... */}
                <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所属部门</label>
                     <select value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2.5 outline-none text-gray-900 dark:text-white">
                        <option value="">-- 选择部门 --</option>
                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition font-medium">取消</button>
              <button onClick={handleSave} disabled={!formData.name} className="px-4 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-lg hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition font-medium shadow-md disabled:opacity-50">保存用户</button>
            </div>
          </div>
        </div>
      )}

      {/* View User Details Drawer */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${isDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleCloseDrawer}></div>
            <div className={`relative w-full max-w-md h-full bg-white dark:bg-[#1C1C1E] shadow-2xl overflow-y-auto flex flex-col ${isDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`} onClick={(e) => e.stopPropagation()}>
                {/* ... Drawer Content with dark mode styles ... */}
                 <div className="h-40 bg-gradient-to-br from-[#0071E3] to-purple-600 dark:from-[#FF2D55] dark:to-orange-500 shrink-0 relative"></div>
                 <div className="px-6 pb-8 -mt-16 flex-1 relative z-10">
                     <div className="flex flex-col items-center text-center mb-8">
                         <img src={viewUser.avatar} className="w-32 h-32 rounded-full border-4 border-white dark:border-[#1C1C1E] shadow-lg bg-white object-cover" alt={viewUser.name} />
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">{viewUser.name}</h2>
                         {/* ... */}
                     </div>
                     <div className="space-y-6">
                        <div className="bg-white dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                             <div className="bg-gray-50 dark:bg-white/5 px-4 py-3 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                 <Hash className="w-4 h-4 text-indigo-500" />
                                 <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">基础信息</span>
                             </div>
                             <div className="p-4 space-y-3">
                                 {/* ... fields ... */}
                                  <div className="flex justify-between items-center text-sm">
                                     <span className="text-gray-500 dark:text-gray-400">用户 ID</span>
                                     <span className="font-mono text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-white/10 px-2 py-0.5 rounded text-xs">{viewUser.id}</span>
                                 </div>
                             </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
