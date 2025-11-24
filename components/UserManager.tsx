
import React, { useState } from 'react';
import { User, UserRole, Department } from '../types';
import { Search, Plus, MoreVertical, Shield, User as UserIcon, Briefcase, Settings, Truck, Monitor, Edit, Building2 } from 'lucide-react';

interface UserManagerProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  departments: Department[];
}

const UserManager: React.FC<UserManagerProps> = ({ users, setUsers, departments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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
          case 'Admin': return 'bg-red-50 text-red-700 border-red-100';
          case 'Sales': return 'bg-blue-50 text-blue-700 border-blue-100';
          case 'Business': return 'bg-orange-50 text-orange-700 border-orange-100';
          case 'Technical': return 'bg-purple-50 text-purple-700 border-purple-100';
          case 'Logistics': return 'bg-green-50 text-green-700 border-green-100';
          default: return 'bg-gray-50 text-gray-700 border-gray-100';
      }
  };

  const getDepartmentName = (deptId?: string) => {
      if (!deptId) return <span className="text-gray-400 italic">未分配</span>;
      const dept = departments.find(d => d.id === deptId);
      return dept ? dept.name : <span className="text-gray-400 italic">未知部门</span>;
  };

  const handleOpenModal = (user?: User) => {
      if (user) {
          setEditingId(user.id);
          setFormData(user);
      } else {
          setEditingId(null);
          setFormData({
            name: '',
            email: '',
            role: 'Sales',
            departmentId: '',
            status: 'Active',
            avatar: `https://ui-avatars.com/api/?name=User&background=random&color=fff`
          });
      }
      setIsModalOpen(true);
  };

  const handleSave = () => {
      if (!formData.name || !formData.email) return;

      if (editingId) {
          setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...formData } as User : u));
      } else {
          const newUser: User = {
              id: `u-${Date.now()}`,
              ...formData as User,
              avatar: formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random&color=fff`
          };
          setUsers(prev => [...prev, newUser]);
      }
      setIsModalOpen(false);
  };

  const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">用户与权限管理</h2>
            <p className="text-gray-500 text-sm mt-1">管理系统用户、分配角色及所属部门。</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> 新增用户
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索用户姓名、邮箱或角色..." 
            className="bg-transparent border-none outline-none flex-1 text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium text-sm">
              <tr>
                <th className="p-4">用户</th>
                <th className="p-4">所属部门</th>
                <th className="p-4">角色</th>
                <th className="p-4">权限范围</th>
                <th className="p-4">状态</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                      <div className="flex items-center gap-3">
                          <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-200" alt={user.name} />
                          <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                      </div>
                  </td>
                  <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded w-fit">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {getDepartmentName(user.departmentId)}
                      </div>
                  </td>
                  <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role === 'Admin' ? '系统管理员' : 
                           user.role === 'Sales' ? '销售经理' :
                           user.role === 'Business' ? '商务/财务' :
                           user.role === 'Technical' ? '技术/生产' : '物流/仓储'}
                      </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                      {user.role === 'Admin' && '全系统访问权限'}
                      {user.role === 'Sales' && '订单创建, 销售审批, 客户管理'}
                      {user.role === 'Business' && '财务录入, 商务审批, 客户信控'}
                      {user.role === 'Technical' && '生产单确认, 校验, 授权管理'}
                      {user.role === 'Logistics' && '发货单管理, 物流追踪'}
                  </td>
                  <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {user.status === 'Active' ? '正常' : '停用'}
                      </span>
                  </td>
                  <td className="p-4 text-right">
                      <button onClick={() => handleOpenModal(user)} className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition">
                          <Edit className="w-4 h-4" />
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? '编辑用户' : '新增用户'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                    <input 
                        type="email" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">系统角色</label>
                        <select 
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="Admin">系统管理员</option>
                            <option value="Sales">销售经理</option>
                            <option value="Business">商务/财务</option>
                            <option value="Technical">技术/生产</option>
                            <option value="Logistics">物流/仓储</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">所属部门</label>
                        <select 
                            value={formData.departmentId}
                            onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="">-- 选择部门 --</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">账号状态</label>
                     <div className="flex gap-4 mt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                checked={formData.status === 'Active'} 
                                onChange={() => setFormData({...formData, status: 'Active'})}
                                className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">正常启用</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                checked={formData.status === 'Inactive'} 
                                onChange={() => setFormData({...formData, status: 'Inactive'})}
                                className="text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">停用/冻结</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition font-medium">取消</button>
              <button 
                onClick={handleSave} 
                disabled={!formData.name || !formData.email}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md disabled:opacity-50"
              >
                  保存用户
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
