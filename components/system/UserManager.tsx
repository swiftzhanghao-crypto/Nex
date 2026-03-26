
import React, { useState, useEffect } from 'react';
import { User, UserType, RoleDefinition, PermissionDimension, RowPermissionRule, ColumnPermissionRule, PermissionResource, BaseRowPermission } from '../../types';
import { Search, Plus, Shield, User as UserIcon, Briefcase, Truck, Edit, Building2, X, Mail, Phone, CheckCircle, Calendar, Hash, Lock, CheckSquare, Settings, Save, Trash2, Database, Check, ChevronDown, ChevronRight, Columns, Copy } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';
import { columnConfig, permissionTree, permissionModules, resourceConfig, PermSubgroup, PermGroup } from './permissionConfig';

interface UserManagerProps {
  defaultTab?: 'USERS' | 'ROLES';
}

const UserManager: React.FC<UserManagerProps> = ({ defaultTab = 'USERS' }) => {
  const { users, setUsers, departments, roles, setRoles, channels } = useAppContext();
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // User Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Role Master-Detail State
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // User Details Drawer State
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  
  // Row Permission Editor State
  const [selectedResource, setSelectedResource] = useState<PermissionResource>('Order');
  const [roleConfigTab, setRoleConfigTab] = useState<'FUNCTIONAL' | 'ROW' | 'COLUMN'>('FUNCTIONAL');
  const [selectedColumnResource, setSelectedColumnResource] = useState<PermissionResource>('Order');
  const [roleDetailTab, setRoleDetailTab] = useState<'MEMBERS' | 'PERMISSIONS'>('MEMBERS');
  const [openDimDropdown, setOpenDimDropdown] = useState<string | null>(null);

  const toggleColumn = (colId: string) => {
      const currentRules = roleForm.columnPermissions || [];
      const rule = currentRules.find(r => r.resource === selectedColumnResource);
      
      if (rule) {
          const newAllowed = rule.allowedColumns.includes(colId)
              ? rule.allowedColumns.filter(c => c !== colId)
              : [...rule.allowedColumns, colId];
              
          setRoleForm(prev => ({
              ...prev,
              columnPermissions: prev.columnPermissions?.map(r => 
                  r.resource === selectedColumnResource ? { ...r, allowedColumns: newAllowed } : r
              )
          }));
      } else {
          const newRule: ColumnPermissionRule = {
              id: `col-rule-${Date.now()}`,
              resource: selectedColumnResource,
              allowedColumns: [colId]
          };
          setRoleForm(prev => ({
              ...prev,
              columnPermissions: [...currentRules, newRule]
          }));
      }
  };

  const toggleDimension = (dim: PermissionDimension) => {
      const currentRules = roleForm.rowPermissions || [];
      const ruleExists = currentRules.some(r => r.resource === selectedResource && r.dimension === dim);
      
      if (ruleExists) {
          setRoleForm(prev => ({
              ...prev,
              rowPermissions: prev.rowPermissions?.filter(r => !(r.resource === selectedResource && r.dimension === dim))
          }));
      } else {
          const newRule: RowPermissionRule = {
              id: `rule-${Date.now()}`,
              resource: selectedResource,
              dimension: dim,
              operator: 'equals',
              values: []
          };
          setRoleForm(prev => ({
              ...prev,
              rowPermissions: [...currentRules, newRule]
          }));
      }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [expandedGroups,    setExpandedGroups]    = useState<string[]>(permissionTree.map(g => g.id));
  const [expandedSubgroups, setExpandedSubgroups] = useState<string[]>(permissionTree.flatMap(g => g.subgroups.map(sg => sg.id)));
  const [expandedModules, setExpandedModules] = useState<string[]>(permissionModules.map(m => m.id));

  const toggleGroupExpand    = (id: string) => setExpandedGroups(prev    => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSubgroupExpand = (id: string) => setExpandedSubgroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const allPermsInSubgroup = (sg: PermSubgroup) => sg.permissions.map(p => p.id);
  const allPermsInGroup    = (g:  PermGroup)    => g.subgroups.flatMap(sg => sg.permissions.map(p => p.id));

  const getCheckState = (permIds: string[], current: string[]): 'all' | 'some' | 'none' => {
      const checked = permIds.filter(id => current.includes(id)).length;
      if (checked === 0) return 'none';
      if (checked === permIds.length) return 'all';
      return 'some';
  };

  const toggleSubgroupPerms = (sg: PermSubgroup) => {
      const ids = allPermsInSubgroup(sg);
      const current = roleForm.permissions || [];
      const state = getCheckState(ids, current);
      if (state === 'all') setRoleForm({ ...roleForm, permissions: current.filter(p => !ids.includes(p)) });
      else                 setRoleForm({ ...roleForm, permissions: Array.from(new Set([...current, ...ids])) });
  };

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
      permissions: [],
      rowPermissions: []
  });

  // Auto-select first role when switching to ROLES tab
  useEffect(() => {
      if (activeTab === 'ROLES' && !selectedRoleId && roles.length > 0) {
          handleSelectRole(roles[0]);
      }
  }, [activeTab]);

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
      let id = '';
      do {
          id = Math.floor(10000000 + Math.random() * 90000000).toString();
      } while (users.some(u => u.accountId === id));
      return id;
  };

  // --- User Handlers ---
  const handleOpenModal = (user?: User) => {
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
              accountId: generateAccountId(), 
              ...userForm as User, 
              avatar: userForm.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userForm.name}` 
          }; 
          setUsers(prev => [...prev, newUser]); 
      }
      setIsModalOpen(false);
  };

  const handleAvatarClick = (e: React.MouseEvent, user: User) => {
      e.stopPropagation();
      setDetailsUser(user);
      setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
      setIsDrawerClosing(true);
      setTimeout(() => {
          setIsDrawerOpen(false);
          setDetailsUser(null);
          setIsDrawerClosing(false);
      }, 280);
  };

  // --- Role Handlers ---
  const handleSelectRole = (role: RoleDefinition) => {
      setSelectedRoleId(role.id);
      setRoleForm({ ...role });
      setIsEditingRole(false);
  };

  const handleCreateRole = () => {
      setSelectedRoleId('new');
      setRoleForm({ name: '', description: '', permissions: [], rowPermissions: [] });
      setIsEditingRole(true);
  };

  const handleSaveRole = () => {
      if (!roleForm.name) return;
      if (selectedRoleId && selectedRoleId !== 'new') {
          setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, ...roleForm } as RoleDefinition : r));
      } else {
          const newId = `role-${Date.now()}`;
          const newRole: RoleDefinition = {
              id: newId,
              isSystem: false,
              ...roleForm as RoleDefinition
          };
          setRoles(prev => [...prev, newRole]);
          setSelectedRoleId(newId);
      }
      setIsEditingRole(false);
  };

  const handleDeleteRole = (id: string) => {
      const role = roles.find(r => r.id === id);
      if (role?.isSystem) return alert("系统内置角色不可删除。");
      if (users.some(u => u.role === id)) return alert("该角色下仍有用户，无法删除。");
      if (confirm("确定要删除此角色吗？")) {
          setRoles(prev => prev.filter(r => r.id !== id));
          if (selectedRoleId === id) {
              setSelectedRoleId(null);
              setRoleForm({ name: '', description: '', permissions: [] });
          }
      }
  };

  const handleCopyRole = (role: RoleDefinition) => {
      const newId = `role-${Date.now()}`;
      const copiedRole: RoleDefinition = {
          id: newId,
          name: `${role.name} (副本)`,
          description: role.description,
          permissions: [...role.permissions],
          isSystem: false,
          rowPermissions: role.rowPermissions?.map(r => ({ ...r, id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })) || [],
          columnPermissions: role.columnPermissions?.map(r => ({ ...r })) || [],
      };
      setRoles(prev => [...prev, copiedRole]);
      setSelectedRoleId(newId);
      setRoleForm({ ...copiedRole });
      setIsEditingRole(true);
  };

  const getDependentPermIds = (parentPermId: string): string[] => {
      return permissionTree.flatMap(g =>
          g.subgroups
              .filter(sg => sg.dependsOn === parentPermId)
              .flatMap(sg => sg.permissions.map(p => p.id))
      );
  };

  const togglePermission = (permId: string) => {
      const current = roleForm.permissions || [];
      if (current.includes(permId)) {
          const cascadeRemove = getDependentPermIds(permId);
          setRoleForm({ ...roleForm, permissions: current.filter(p => p !== permId && !cascadeRemove.includes(p)) });
      } else {
          setRoleForm({ ...roleForm, permissions: [...current, permId] });
      }
  };

  const toggleModule = (moduleId: string) => {
      const module = permissionModules.find(m => m.id === moduleId);
      if (!module) return;
      const modulePerms = module.permissions.map(p => p.id);
      const current = roleForm.permissions || [];
      const allChecked = modulePerms.every(p => current.includes(p));
      
      if (allChecked) {
          setRoleForm({ ...roleForm, permissions: current.filter(p => !modulePerms.includes(p)) });
      } else {
          const newPerms = new Set([...current, ...modulePerms]);
          setRoleForm({ ...roleForm, permissions: Array.from(newPerms) });
      }
  };

  const toggleModuleExpand = (moduleId: string) => {
      if (expandedModules.includes(moduleId)) {
          setExpandedModules(expandedModules.filter(id => id !== moduleId));
      } else {
          setExpandedModules([...expandedModules, moduleId]);
      }
  };

  const handleRemoveUserFromRole = (userId: string) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: '' } as User : u));
  };

  const handleAddUserToRole = (userId: string) => {
      if (selectedRoleId) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: selectedRoleId } as User : u));
      }
  };

  // --- Row Permissions Handlers ---
  const handleDeleteRowRule = (ruleId: string) => {
      setRoleForm(prev => ({
          ...prev,
          rowPermissions: prev.rowPermissions?.filter(r => r.id !== ruleId)
      }));
  };

  const updateRuleValues = (ruleId: string, val: string) => {
      setRoleForm(prev => {
          const rules = prev.rowPermissions || [];
          return {
              ...prev,
              rowPermissions: rules.map(r => {
                  if (r.id === ruleId) {
                      const newValues = r.values.includes(val) 
                          ? r.values.filter(v => v !== val)
                          : [...r.values, val];
                      return { ...r, values: newValues };
                  }
                  return r;
              })
          };
      });
  };

  const updateRuleOperator = (ruleId: string, operator: 'equals' | 'contains') => {
      setRoleForm(prev => ({
          ...prev,
          rowPermissions: (prev.rowPermissions || []).map(r =>
              r.id === ruleId ? { ...r, operator } : r
          )
      }));
  };

  const getDepartmentPath = (deptId: string): string => {
      const dept = departments.find(d => d.id === deptId);
      if (!dept) return deptId;
      if (dept.parentId) {
          const parentPath = getDepartmentPath(dept.parentId);
          return `${parentPath} / ${dept.name}`;
      }
      return dept.name;
  };

  const getDimensionOptions = (dim: PermissionDimension) => {
      if (dim === 'departmentId') {
          return departments.map(d => ({ value: d.id, label: getDepartmentPath(d.id) }));
      }
      if (dim === 'industryLine') {
          const lines = [
              '政务特种', '大客民企', '政务区域党政', '企业区域金融', '企业区域民企',
              '区域新闻出版传媒', '部委党政', '部委医疗', '部委新闻出版传媒', '其他',
              '大客央国企', '大客特种', '渠道和生态', '国内SaaS', '大客金融',
              '教育业务', '企业区域国企', '医疗行业',
          ];
          return lines.map(l => ({ value: l, label: l }));
      }
      if (dim === 'directChannelId') {
          return channels.map(c => ({ value: c.id, label: c.name }));
      }
      if (dim === 'province') {
          const provinces = [
              '北京市', '天津市', '上海市', '重庆市',
              '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
              '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
              '河南省', '湖北省', '湖南省', '广东省', '海南省',
              '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
              '台湾省', '内蒙古自治区', '广西壮族自治区', '西藏自治区',
              '宁夏回族自治区', '新疆维吾尔自治区',
              '香港特别行政区', '澳门特别行政区',
          ];
          return provinces.map(p => ({ value: p, label: p }));
      }
      if (dim === 'orderType') {
          return ['新购订单', '续费订单', '增购订单', '降配订单', '退款订单'].map(t => ({ value: t, label: t }));
      }
      if (dim === 'buyerType') return [
          { value: 'Customer', label: '客户直签' },
          { value: 'Channel', label: '渠道代理' },
          { value: 'SelfDeal', label: '自主成交' },
      ];
      if (dim === 'channelId') return channels.map(c => ({ value: c.id, label: c.name }));
      if (dim === 'customerIndustry') return ['互联网', '金融', '教育', '制造', '政府', '医疗', '零售'].map(i => ({ value: i, label: i }));
      if (dim === 'productId') return [
          { value: 'wps-office', label: 'WPS Office' },
          { value: 'wps-365', label: 'WPS 365' },
          { value: 'wps-ai', label: 'WPS AI' },
      ];
      if (dim === 'customerLevel') return ['KA', 'SMB', 'Enterprise'].map(l => ({ value: l, label: l }));
      return [];
  };

  const getReadableValue = (dim: PermissionDimension, val: string) => {
      const options = getDimensionOptions(dim);
      return options.find(o => o.value === val)?.label || val;
  };

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
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-page-enter relative h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
                {activeTab === 'USERS' ? '用户管理' : '角色管理'}
            </h1>
        </div>
      </div>

      {/* --- USERS TAB --- */}
      {activeTab === 'USERS' && (
          <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col animate-fade-in flex-1">
              <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                  <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input 
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          placeholder="搜索用户..."
                          className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                      />
                  </div>
                  <button onClick={() => handleOpenModal()} className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-80 transition"><Plus className="w-4 h-4"/> 新增用户</button>
              </div>
              <div className="flex-1 overflow-auto">
                  <table className="w-full text-left">
                      <thead className="unified-table-header dark: sticky top-0 backdrop-blur">
                          <tr>
                              <th className="p-4 pl-6">用户</th>
                              <th className="p-4">账号ID</th>
                              <th className="p-4">部门</th>
                              <th className="p-4">类型</th>
                              <th className="p-4">状态</th>
                              <th className="p-4 text-right pr-6">操作</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                          {currentUsers.map(user => (
                              <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition">
                                   <td className="p-4 pl-6">
                                      <div className="flex items-center gap-3">
                                          <div className="relative flex-shrink-0">
                                              <img 
                                                  src={user.avatar} 
                                                  className="w-9 h-9 rounded-full bg-gray-100 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 dark:hover:ring-offset-black transition-all" 
                                                  alt=""
                                                  onClick={(e) => handleAvatarClick(e, user)}
                                              />
                                              {user.monthBadge && (
                                                  <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[8px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                                              )}
                                          </div>
                                          <div>
                                              <div className="font-bold text-gray-900 dark:text-white">{user.name}</div>
                                              <div className="text-xs text-gray-500">{user.email}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4 font-mono text-gray-600 dark:text-gray-300">{user.accountId}</td>
                                  <td className="p-4 text-gray-600 dark:text-gray-300">{getDepartmentName(user.departmentId)}</td>
                                  <td className="p-4"><span className={`px-2 py-0.5 text-[10px] rounded border ${user.userType === 'Internal' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400'}`}>{user.userType}</span></td>
                                  <td className="p-4"><span className={`flex items-center gap-1.5 text-xs font-medium ${user.status === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}><div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></div> {user.status}</span></td>
                                  <td className="p-4 text-right pr-6"><button onClick={() => handleOpenModal(user)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition"><Edit className="w-4 h-4"/></button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                          共 {filteredUsers.length} 条数据
                      </div>
                      <div className="flex items-center gap-4">
                          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm disabled:opacity-50">上一页</button>
                          <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
                          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm disabled:opacity-50">下一页</button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* --- ROLES TAB --- */}
      {activeTab === 'ROLES' && (
          <div className="flex gap-6 flex-1 min-h-0 animate-fade-in">
              {/* Role List */}
              <div className="unified-card w-1/4 min-w-[250px] dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col">
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                      <h3 className="font-bold text-gray-800 dark:text-white">角色列表</h3>
                      <button onClick={handleCreateRole} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400"><Plus className="w-4 h-4"/></button>
                  </div>
                  <div className="flex-1 overflow-auto p-2 space-y-1">
                      {roles.map(role => (
                          <div 
                              key={role.id} 
                              onClick={() => handleSelectRole(role)}
                              className={`p-3 rounded-lg cursor-pointer transition flex justify-between items-center group ${selectedRoleId === role.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                          >
                              <div className="font-medium text-sm">{role.name}</div>
                              <div className="flex items-center gap-1">
                                  {role.isSystem && <Shield className="w-3 h-3 opacity-50"/>}
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); handleCopyRole(role); }}
                                      className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="复制角色"
                                  >
                                      <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  {!role.isSystem && (
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                                          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                          <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Role Config */}
              <div className="unified-card flex-1 dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col">
                  {selectedRoleId ? (
                      isEditingRole ? (
                          <>
                              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                                  <div>
                                      <input 
                                          value={roleForm.name} 
                                          onChange={e => setRoleForm({...roleForm, name: e.target.value})}
                                          className="text-xl font-bold text-gray-900 dark:text-white bg-transparent outline-none placeholder-gray-300"
                                          placeholder="角色名称"
                                      />
                                      <input 
                                          value={roleForm.description} 
                                          onChange={e => setRoleForm({...roleForm, description: e.target.value})}
                                          className="text-sm text-gray-500 dark:text-gray-400 bg-transparent outline-none w-full mt-1 placeholder-gray-300"
                                          placeholder="角色描述..."
                                      />
                                  </div>
                                  <div className="flex gap-2">
                                      {selectedRoleId !== 'new' && (
                                          <button onClick={() => setIsEditingRole(false)} className="px-4 py-1.5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition">取消</button>
                                      )}
                                      <button onClick={handleSaveRole} className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm hover:opacity-80 transition flex items-center gap-1"><Save className="w-4 h-4"/> 保存配置</button>
                                  </div>
                              </div>
                              
                              <div className="flex-1 overflow-auto p-6 space-y-6">
                              {/* Tabs */}
                              <div className="flex gap-6 border-b border-gray-100 dark:border-white/10">
                                  <button 
                                      onClick={() => setRoleConfigTab('FUNCTIONAL')}
                                      className={`pb-3 text-sm font-bold transition-colors relative ${roleConfigTab === 'FUNCTIONAL' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                  >
                                      <div className="flex items-center gap-2"><CheckSquare className="w-4 h-4"/> 功能权限</div>
                                      {roleConfigTab === 'FUNCTIONAL' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
                                  </button>
                                  <button 
                                      onClick={() => setRoleConfigTab('ROW')}
                                      className={`pb-3 text-sm font-bold transition-colors relative ${roleConfigTab === 'ROW' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                  >
                                      <div className="flex items-center gap-2"><Database className="w-4 h-4"/> 数据行权限</div>
                                      {roleConfigTab === 'ROW' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
                                  </button>
                                  <button 
                                      onClick={() => setRoleConfigTab('COLUMN')}
                                      className={`pb-3 text-sm font-bold transition-colors relative ${roleConfigTab === 'COLUMN' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                  >
                                      <div className="flex items-center gap-2"><Columns className="w-4 h-4"/> 数据列权限</div>
                                      {roleConfigTab === 'COLUMN' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
                                  </button>
                              </div>

                              {/* Functional Permissions - 三级树 */}
                              {roleConfigTab === 'FUNCTIONAL' && (
                              <div className="animate-fade-in space-y-1">
                                  {/* 全选 / 全不选 快捷操作 */}
                                  <div className="flex items-center justify-between mb-3 px-1">
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                          已选 <strong className="text-[#0071E3]">{(roleForm.permissions || []).length}</strong> 个权限点
                                      </span>
                                      <div className="flex gap-2">
                                          <button
                                              onClick={() => setRoleForm({ ...roleForm, permissions: permissionTree.flatMap(g => g.subgroups.flatMap(sg => sg.permissions.map(p => p.id))) })}
                                              className="text-xs text-[#0071E3] hover:underline"
                                          >全选</button>
                                          <span className="text-gray-300 dark:text-gray-600">|</span>
                                          <button
                                              onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:underline"
                                          >清空</button>
                                      </div>
                                  </div>

                                  {permissionTree.map(group => {
                                      const current      = roleForm.permissions || [];
                                      const groupPerms   = allPermsInGroup(group);
                                      const groupState   = getCheckState(groupPerms, current);
                                      const isGroupOpen  = expandedGroups.includes(group.id);

                                      return (
                                          <div key={group.id} className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                                              {/* ── 一级：模块组 ── */}
                                              <div
                                                  className={`flex items-center gap-2 px-4 py-3 cursor-pointer select-none transition-colors
                                                      ${groupState !== 'none'
                                                          ? 'bg-blue-50/60 dark:bg-blue-900/10'
                                                          : 'bg-gray-50 dark:bg-white/5'
                                                      }`}
                                              >
                                                  <button
                                                      onClick={() => toggleGroupExpand(group.id)}
                                                      className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                                                  >
                                                      {isGroupOpen
                                                          ? <ChevronDown className="w-4 h-4"/>
                                                          : <ChevronRight className="w-4 h-4"/>
                                                      }
                                                  </button>
                                                  <div
                                                      onClick={() => toggleModule(group.id)}
                                                      className="flex items-center gap-2.5 flex-1 cursor-pointer group"
                                                  >
                                                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0
                                                          ${groupState === 'all'  ? 'bg-blue-600 border-blue-600' :
                                                            groupState === 'some' ? 'bg-blue-400/60 border-blue-400' :
                                                            'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600 group-hover:border-blue-400'}`}>
                                                          {groupState !== 'none' && <Check className="w-3 h-3 text-white"/>}
                                                      </div>
                                                      <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{group.label}</span>
                                                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                                                          ({groupPerms.filter(id => current.includes(id)).length}/{groupPerms.length})
                                                      </span>
                                                  </div>
                                              </div>

                                              {/* ── 二级：子模块 ── */}
                                              {isGroupOpen && (
                                                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                                                      {group.subgroups.map(sg => {
                                                          if (sg.dependsOn && !current.includes(sg.dependsOn)) return null;
                                                          const sgPerms   = allPermsInSubgroup(sg);
                                                          const sgState   = getCheckState(sgPerms, current);
                                                          const isSgOpen  = expandedSubgroups.includes(sg.id);

                                                          return (
                                                              <div key={sg.id} className="bg-white dark:bg-[#1C1C1E]">
                                                                  <div
                                                                      className={`flex items-center gap-2 pl-10 pr-4 py-2.5 cursor-pointer select-none transition-colors
                                                                          ${sgState !== 'none'
                                                                              ? 'bg-blue-50/40 dark:bg-blue-900/5'
                                                                              : 'hover:bg-gray-50 dark:hover:bg-white/3'
                                                                          }`}
                                                                  >
                                                                      <button
                                                                          onClick={() => toggleSubgroupExpand(sg.id)}
                                                                          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
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
                                                                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{sg.label}</span>
                                                                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                                                                              ({sgPerms.filter(id => current.includes(id)).length}/{sgPerms.length})
                                                                          </span>
                                                                      </div>
                                                                  </div>

                                                                  {/* ── 三级：权限点 ── */}
                                                                  {isSgOpen && (
                                                                      <div className="pl-16 pr-4 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                                                          {sg.permissions.map(perm => {
                                                                              const isChecked = current.includes(perm.id);
                                                                              return (
                                                                                  <div
                                                                                      key={perm.id}
                                                                                      onClick={() => togglePermission(perm.id)}
                                                                                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all
                                                                                          ${isChecked
                                                                                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/50'
                                                                                              : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/10'
                                                                                          }`}
                                                                                  >
                                                                                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 mt-0.5
                                                                                          ${isChecked
                                                                                              ? 'bg-blue-600 border-blue-600'
                                                                                              : 'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600'
                                                                                          }`}>
                                                                                          {isChecked && <Check className="w-2.5 h-2.5 text-white"/>}
                                                                                      </div>
                                                                                      <div>
                                                                                          <div className={`text-sm leading-tight ${isChecked ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                                              {perm.label}
                                                                                          </div>
                                                                                          {perm.desc && (
                                                                                              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">{perm.desc}</div>
                                                                                          )}
                                                                                      </div>
                                                                                  </div>
                                                                              );
                                                                          })}
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          );
                                                      })}
                                                  </div>
                                              )}
                                          </div>
                                      );
                                  })}
                              </div>
                              )}

                              {/* Row Data Permissions */}
                              {roleConfigTab === 'ROW' && (
                              <div className="animate-fade-in">
                                  <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-2xl border border-gray-100 dark:border-white/5 space-y-6">
                                      {/* Resource Selection */}
                                      <div className="flex gap-4 border-b border-gray-200 dark:border-white/10 pb-4">
                                          {resourceConfig.map(res => (
                                              <button
                                                  key={res.id}
                                                  onClick={() => setSelectedResource(res.id)}
                                                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedResource === res.id ? 'bg-blue-600 text-white shadow-apple' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                              >
                                                  {res.label}
                                              </button>
                                          ))}
                                      </div>

                                      {/* Base Row Permission */}
                                      <div>
                                          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">基础行权限</div>
                                          <div className="flex gap-3">
                                              {([
                                                  { value: 'self' as BaseRowPermission, label: '本人', desc: '仅可见与本人关联的数据', icon: '👤' },
                                                  { value: 'department' as BaseRowPermission, label: '本部门', desc: '可见本部门所有成员的数据', icon: '🏢' },
                                                  { value: 'all' as BaseRowPermission, label: '全部数据', desc: '可见所有数据，无范围限制', icon: '🌐' },
                                              ]).map(opt => {
                                                  const isSelected = (roleForm.baseRowPermission || 'all') === opt.value;
                                                  return (
                                                      <button
                                                          key={opt.value}
                                                          onClick={() => setRoleForm(prev => ({ ...prev, baseRowPermission: opt.value }))}
                                                          className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-sm' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}
                                                      >
                                                          <div className="flex items-center gap-2 mb-1">
                                                              <span className="text-base">{opt.icon}</span>
                                                              <span className={`text-sm font-bold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{opt.label}</span>
                                                              {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-auto"/>}
                                                          </div>
                                                          <div className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</div>
                                                      </button>
                                                  );
                                              })}
                                          </div>
                                      </div>

                                      {/* OR divider */}
                                      <div className="flex items-center gap-3">
                                          <div className="flex-1 border-t border-dashed border-gray-300 dark:border-white/15"></div>
                                          <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-700/30">或 OR</span>
                                          <div className="flex-1 border-t border-dashed border-gray-300 dark:border-white/15"></div>
                                      </div>

                                      {/* Dimension Rows: Left(dim) - Middle(operator) - Right(values) */}
                                      <div>
                                          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">自定义维度过滤</div>
                                      </div>
                                      {resourceConfig.find(r => r.id === selectedResource) && (
                                          <div className="space-y-3">
                                              {resourceConfig.find(r => r.id === selectedResource)?.dimensions.map(dim => {
                                                  const rule = roleForm.rowPermissions?.find(r => r.resource === selectedResource && r.dimension === dim.id);
                                                  const isEnabled = !!rule;
                                                  const allOptions = getDimensionOptions(dim.id);
                                                  const availableOptions = allOptions.filter(opt => !rule?.values.includes(opt.value));

                                                  return (
                                                      <div key={dim.id} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E]">
                                                          <div className="flex items-stretch gap-0">
                                                              {/* Left: Dimension toggle + label */}
                                                              <div
                                                                  onClick={() => toggleDimension(dim.id)}
                                                                  className={`flex items-center gap-2.5 w-[160px] min-w-[160px] px-4 py-3 cursor-pointer select-none border-r border-gray-200 dark:border-white/10 transition-colors rounded-l-xl ${isEnabled ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                                              >
                                                                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isEnabled ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                                                      {isEnabled && <Check className="w-3 h-3 text-white"/>}
                                                                  </div>
                                                                  <span className={`text-sm font-bold whitespace-nowrap ${isEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>{dim.label}</span>
                                                              </div>

                                                              {/* Middle: Operator selector */}
                                                              <div className="flex items-center px-3 border-r border-gray-200 dark:border-white/10 min-w-[90px]">
                                                                  {isEnabled ? (
                                                                      <select
                                                                          value={rule?.operator || 'equals'}
                                                                          onChange={e => updateRuleOperator(rule!.id, e.target.value as 'equals' | 'contains')}
                                                                          className="text-xs font-bold text-center bg-transparent border-none outline-none cursor-pointer text-blue-600 dark:text-blue-400 py-1"
                                                                      >
                                                                          <option value="equals">等于</option>
                                                                          <option value="contains">包含</option>
                                                                      </select>
                                                                  ) : (
                                                                      <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">—</span>
                                                                  )}
                                                              </div>

                                                              {/* Right: Value chips + add button */}
                                                              <div className="flex-1 px-4 py-2.5 min-h-[44px] flex items-center">
                                                                  {isEnabled ? (
                                                                      <div className="flex flex-wrap gap-1.5 items-center">
                                                                          {rule!.values.map(v => (
                                                                              <span key={v} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 rounded-md text-xs font-medium text-blue-700 dark:text-blue-300">
                                                                                  {getReadableValue(dim.id, v)}
                                                                                  <button onClick={() => updateRuleValues(rule!.id, v)} className="text-blue-400 hover:text-red-500 transition-colors"><X className="w-3 h-3"/></button>
                                                                              </span>
                                                                          ))}
                                                                          {availableOptions.length > 0 && (
                                                                              <button
                                                                                  onClick={() => setOpenDimDropdown(openDimDropdown === dim.id ? null : dim.id)}
                                                                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border border-dashed transition-colors ${openDimDropdown === dim.id ? 'border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:border-blue-400 dark:hover:text-blue-400'}`}
                                                                              >
                                                                                  <Plus className="w-3 h-3"/> 添加
                                                                              </button>
                                                                          )}
                                                                          {rule!.values.length === 0 && availableOptions.length > 0 && openDimDropdown !== dim.id && (
                                                                              <span className="text-xs text-gray-400 italic">点击添加以选择值</span>
                                                                          )}
                                                                          {availableOptions.length === 0 && rule!.values.length > 0 && (
                                                                              <span className="text-xs text-gray-400 italic ml-1">已全选</span>
                                                                          )}
                                                                      </div>
                                                                  ) : (
                                                                      <span className="text-xs text-gray-300 dark:text-gray-600 italic">未启用</span>
                                                                  )}
                                                              </div>
                                                          </div>

                                                          {/* Expandable options panel */}
                                                          {isEnabled && openDimDropdown === dim.id && availableOptions.length > 0 && (
                                                              <div className="border-t border-gray-200 dark:border-white/10 px-4 py-3 bg-gray-50/80 dark:bg-black/20 rounded-b-xl">
                                                                  <div className="flex flex-wrap gap-1.5">
                                                                      {availableOptions.map(opt => (
                                                                          <button
                                                                              key={opt.value}
                                                                              onClick={() => {
                                                                                  updateRuleValues(rule!.id, opt.value);
                                                                                  const remaining = availableOptions.filter(o => o.value !== opt.value);
                                                                                  if (remaining.length === 0) setOpenDimDropdown(null);
                                                                              }}
                                                                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                                                                          >
                                                                              {opt.label}
                                                                          </button>
                                                                      ))}
                                                                  </div>
                                                              </div>
                                                          )}
                                                      </div>
                                                  );
                                              })}

                                              {/* Empty state */}
                                              {(!roleForm.rowPermissions || !roleForm.rowPermissions.some(r => r.resource === selectedResource)) && (
                                                  <div className="text-center py-6 text-gray-400 text-sm italic mt-2">
                                                      请勾选左侧维度以配置数据访问范围。未勾选维度默认可见所有{resourceConfig.find(r => r.id === selectedResource)?.label}。
                                                  </div>
                                              )}
                                          </div>
                                      )}
                                  </div>
                              </div>
                              )}

                              {/* Column Data Permissions */}
                              {roleConfigTab === 'COLUMN' && (
                              <div className="animate-fade-in">
                                  <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-2xl border border-gray-100 dark:border-white/5 space-y-6">
                                      {/* Resource Selection */}
                                      <div className="flex gap-4 border-b border-gray-200 dark:border-white/10 pb-4">
                                          {columnConfig.map(res => (
                                              <button
                                                  key={res.id}
                                                  onClick={() => setSelectedColumnResource(res.id)}
                                                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedColumnResource === res.id ? 'bg-blue-600 text-white shadow-apple' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                              >
                                                  {res.label}
                                              </button>
                                          ))}
                                      </div>

                                      {/* Columns Selection */}
                                      {columnConfig.find(r => r.id === selectedColumnResource) && (
                                          <div className="space-y-6">
                                              <div className="flex items-center gap-4">
                                                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-20">可见列</span>
                                                  <div className="flex gap-4 flex-wrap">
                                                      {columnConfig.find(r => r.id === selectedColumnResource)?.columns.map(col => {
                                                          const rule = roleForm.columnPermissions?.find(r => r.resource === selectedColumnResource);
                                                          const isChecked = rule ? rule.allowedColumns.includes(col.id) : false;
                                                          return (
                                                              <label key={col.id} className="flex items-center gap-2 cursor-pointer group">
                                                                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white dark:bg-transparent dark:border-gray-600 group-hover:border-blue-400'}`}>
                                                                      {isChecked && <Check className="w-3 h-3 text-white"/>}
                                                                  </div>
                                                                  <input 
                                                                      type="checkbox" 
                                                                      className="hidden" 
                                                                      checked={isChecked} 
                                                                      onChange={() => toggleColumn(col.id)} 
                                                                  />
                                                                  <span className="text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                                                              </label>
                                                          );
                                                      })}
                                                  </div>
                                              </div>
                                              <div className="text-center py-4 text-gray-400 text-sm italic border-t border-gray-200 dark:border-white/10">
                                                  勾选代表该角色可以查看对应的数据列。如果不勾选任何列，则默认可见所有基础列。
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              </div>
                              )}
                          </div>
                          </>
                      ) : (
                          <>
                              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                                  <div>
                                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                          {roleForm.name}
                                          {roleForm.isSystem && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full font-normal">内置</span>}
                                      </h2>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{roleForm.description || '暂无描述'}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      {!roleForm.isSystem && (
                                          <button onClick={() => handleDeleteRole(selectedRoleId)} className="px-3 py-1.5 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-1"><Trash2 className="w-4 h-4"/> 删除</button>
                                      )}
                                      <button onClick={() => { const r = roles.find(r => r.id === selectedRoleId); if (r) handleCopyRole(r); }} className="px-3 py-1.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-1"><Copy className="w-4 h-4"/> 复制</button>
                                      <button onClick={() => setIsEditingRole(true)} className="px-4 py-1.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-1"><Edit className="w-4 h-4"/> 编辑角色</button>
                                  </div>
                              </div>
                              
                              {/* Tab 切换 */}
                              <div className="flex border-b border-gray-100 dark:border-white/10 px-6">
                                  <button
                                      onClick={() => setRoleDetailTab('MEMBERS')}
                                      className={`px-4 py-3 text-sm font-bold transition-colors relative ${roleDetailTab === 'MEMBERS' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                  >
                                      <div className="flex items-center gap-2"><UserIcon className="w-4 h-4"/> 角色成员 <span className="text-xs font-normal text-gray-400">({users.filter(u => u.role === selectedRoleId).length})</span></div>
                                      {roleDetailTab === 'MEMBERS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                                  </button>
                                  <button
                                      onClick={() => setRoleDetailTab('PERMISSIONS')}
                                      className={`px-4 py-3 text-sm font-bold transition-colors relative ${roleDetailTab === 'PERMISSIONS' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                  >
                                      <div className="flex items-center gap-2"><Shield className="w-4 h-4"/> 权限配置 <span className="text-xs font-normal text-gray-400">({(roleForm.permissions || []).length})</span></div>
                                      {roleDetailTab === 'PERMISSIONS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                                  </button>
                              </div>

                              <div className="flex-1 overflow-auto p-6 space-y-6">
                                  {/* ===== 角色成员 Tab ===== */}
                                  {roleDetailTab === 'MEMBERS' && (
                                  <div className="animate-fade-in">
                                      <div className="flex justify-between items-center mb-3">
                                          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><UserIcon className="w-4 h-4"/> 角色成员</h3>
                                          <button onClick={() => setIsAddUserModalOpen(true)} className="px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition flex items-center gap-1"><Plus className="w-4 h-4"/> 添加成员</button>
                                      </div>
                                      <div className="space-y-2">
                                          {users.filter(u => u.role === selectedRoleId).length > 0 ? (
                                              users.filter(u => u.role === selectedRoleId).map(user => (
                                                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                                                      <div className="flex items-center gap-3">
                                                          <div className="relative flex-shrink-0">
                                                              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                                                              {user.monthBadge && (
                                                                  <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[8px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                                                              )}
                                                          </div>
                                                          <div>
                                                              <div className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</div>
                                                              <div className="text-xs text-gray-500">{user.email}</div>
                                                          </div>
                                                      </div>
                                                      <button onClick={() => handleRemoveUserFromRole(user.id)} className="text-gray-400 hover:text-red-500 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition">移除</button>
                                                  </div>
                                              ))
                                          ) : (
                                              <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                                  该角色下暂无成员
                                              </div>
                                          )}
                                      </div>
                                  </div>
                                  )}

                                  {/* ===== 权限配置 Tab ===== */}
                                  {roleDetailTab === 'PERMISSIONS' && (
                                  <div className="animate-fade-in space-y-6">
                                      {/* 功能权限 */}
                                      <div>
                                          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                                              <CheckSquare className="w-4 h-4"/> 功能权限
                                              <span className="text-xs font-normal text-gray-400 ml-1">
                                                  ({(roleForm.permissions || []).length} 个权限点)
                                              </span>
                                          </h3>
                                          <div className="space-y-1">
                                              {permissionTree.map(group => {
                                                  const current    = roleForm.permissions || [];
                                                  const groupPerms = allPermsInGroup(group);
                                                  const groupState = getCheckState(groupPerms, current);
                                                  if (groupState === 'none') return null;
                                                  return (
                                                      <div key={group.id} className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                                                          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50/60 dark:bg-blue-900/10">
                                                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${groupState === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}>
                                                                  <Check className="w-2.5 h-2.5 text-white"/>
                                                              </div>
                                                              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{group.label}</span>
                                                              <span className="text-xs text-blue-500 dark:text-blue-400 ml-auto">
                                                                  {groupPerms.filter(id => current.includes(id)).length}/{groupPerms.length}
                                                              </span>
                                                          </div>
                                                          <div className="px-4 py-2.5 bg-white dark:bg-[#1C1C1E] flex flex-wrap gap-2">
                                                              {group.subgroups.flatMap(sg => sg.permissions).filter(p => current.includes(p.id)).map(p => (
                                                                  <span key={p.id} className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800/30">
                                                                      {p.label}
                                                                  </span>
                                                              ))}
                                                          </div>
                                                      </div>
                                                  );
                                              })}
                                              {(roleForm.permissions || []).length === 0 && (
                                                  <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">暂未配置任何功能权限</div>
                                              )}
                                          </div>
                                      </div>

                                      {/* 数据行权限 */}
                                      <div>
                                          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                                              <Database className="w-4 h-4"/> 数据行权限
                                          </h3>
                                          {/* 基础行权限展示 */}
                                          <div className="mb-3 flex items-center gap-2">
                                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">基础范围：</span>
                                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                  roleForm.baseRowPermission === 'self' ? 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700/30' :
                                                  roleForm.baseRowPermission === 'department' ? 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-700/30' :
                                                  'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30'
                                              }`}>
                                                  {roleForm.baseRowPermission === 'self' ? '👤 本人' : roleForm.baseRowPermission === 'department' ? '🏢 本部门' : '🌐 全部数据'}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                  {roleForm.baseRowPermission === 'self' ? '仅可见与本人关联的数据' : roleForm.baseRowPermission === 'department' ? '可见本部门所有成员的数据' : '可见所有数据'}
                                              </span>
                                          </div>
                                          {(roleForm.rowPermissions && roleForm.rowPermissions.length > 0) ? (
                                              <div className="space-y-2">
                                                  <div className="flex items-center gap-2 py-1">
                                                      <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10"></div>
                                                      <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400">或 OR</span>
                                                      <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10"></div>
                                                  </div>
                                                  {resourceConfig.map(res => {
                                                      const rules = roleForm.rowPermissions?.filter(r => r.resource === res.id) || [];
                                                      if (rules.length === 0) return null;
                                                      return (
                                                          <div key={res.id} className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                                                              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/60 dark:bg-amber-900/10">
                                                                  <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"/>
                                                                  <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{res.label}</span>
                                                                  <span className="text-xs text-amber-500 dark:text-amber-400 ml-auto">{rules.length} 条规则</span>
                                                              </div>
                                                              <div className="px-4 py-3 bg-white dark:bg-[#1C1C1E] space-y-2">
                                                                  {rules.map((rule, idx) => {
                                                                      const dimLabel = res.dimensions.find(d => d.id === rule.dimension)?.label || rule.dimension;
                                                                      const opLabel = rule.operator === 'contains' ? '包含' : '等于';
                                                                      return (
                                                                          <div key={idx} className="flex items-center gap-3">
                                                                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 min-w-[64px]">{dimLabel}</span>
                                                                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">{opLabel}</span>
                                                                              <div className="flex flex-wrap gap-1.5">
                                                                                  {rule.values.length > 0 ? rule.values.map(v => (
                                                                                      <span key={v} className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-100 dark:border-amber-800/30">
                                                                                          {getReadableValue(rule.dimension, v)}
                                                                                      </span>
                                                                                  )) : (
                                                                                      <span className="text-xs text-gray-400 italic">未指定具体值</span>
                                                                                  )}
                                                                              </div>
                                                                          </div>
                                                                      );
                                                                  })}
                                                              </div>
                                                          </div>
                                                      );
                                                  })}
                                              </div>
                                          ) : (
                                              <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                                  未配置数据行权限，默认可见所有数据行
                                              </div>
                                          )}
                                      </div>

                                      {/* 数据列权限 */}
                                      <div>
                                          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                                              <Columns className="w-4 h-4"/> 数据列权限
                                          </h3>
                                          {(roleForm.columnPermissions && roleForm.columnPermissions.length > 0) ? (
                                              <div className="space-y-2">
                                                  {roleForm.columnPermissions.map((rule, idx) => {
                                                      const resConfig = columnConfig.find(r => r.id === rule.resource);
                                                      if (!resConfig) return null;
                                                      return (
                                                          <div key={idx} className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                                                              <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50/60 dark:bg-purple-900/10">
                                                                  <Columns className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400"/>
                                                                  <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{resConfig.label}</span>
                                                                  <span className="text-xs text-purple-500 dark:text-purple-400 ml-auto">{rule.allowedColumns.length}/{resConfig.columns.length} 列可见</span>
                                                              </div>
                                                              <div className="px-4 py-3 bg-white dark:bg-[#1C1C1E] flex flex-wrap gap-1.5">
                                                                  {resConfig.columns.map(col => {
                                                                      const allowed = rule.allowedColumns.includes(col.id);
                                                                      return (
                                                                          <span key={col.id} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${allowed
                                                                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/30'
                                                                              : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-white/10 line-through'
                                                                          }`}>
                                                                              {col.label}
                                                                          </span>
                                                                      );
                                                                  })}
                                                              </div>
                                                          </div>
                                                      );
                                                  })}
                                              </div>
                                          ) : (
                                              <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                                  未配置数据列权限，默认可见所有基础列
                                              </div>
                                          )}
                                      </div>
                                  </div>
                                  )}
                              </div>
                          </>
                      )
                  ) : (
                      <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                          <Settings className="w-12 h-12 mb-2 opacity-20"/>
                          <p>请选择一个角色进行配置</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* User Modal */}
      {isModalOpen && (

          <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-lg flex flex-col animate-modal-enter border-white/10">
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? '编辑用户' : '新增用户'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">姓名</label>
                          <input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white" />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">邮箱</label>
                          <input value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white" />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">手机号</label>
                          <input value={userForm.phone || ''} onChange={e => setUserForm({...userForm, phone: e.target.value})} placeholder="请输入手机号" className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white placeholder-gray-300 dark:placeholder-gray-600" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">角色</label>
                              <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white">
                                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">部门</label>
                              <select value={userForm.departmentId} onChange={e => setUserForm({...userForm, departmentId: e.target.value})} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white">
                                  <option value="">-- 未分配 --</option>
                                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">人员类型</label>
                              <select value={userForm.userType} onChange={e => setUserForm({...userForm, userType: e.target.value as UserType})} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white">
                                  <option value="Internal">内部员工</option>
                                  <option value="External">外部协作者</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">状态</label>
                              <select value={userForm.status} onChange={e => setUserForm({...userForm, status: e.target.value as 'Active' | 'Inactive'})} className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white">
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                              </select>
                          </div>
                      </div>
                  </div>
                  <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-sm font-medium">取消</button>
                      <button onClick={handleSaveUser} className="unified-button-primary bg-[#0071E3] dark:bg-[#FF2D55] hover: shadow-apple">保存</button>
                  </div>
              </div>
          </div>
          </ModalPortal>

      )}

      {/* User Details Drawer */}
      {isDrawerOpen && detailsUser && (

        <ModalPortal>
        <div className="fixed inset-0 z-[500] flex justify-end">
            <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm ${isDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={closeDrawer}></div>
            <div className={`relative w-full max-w-md h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col border-l border-white/10 ${isDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                 <div className="flex-1 overflow-y-auto">
                    {/* Header */}
                    <div className="p-6 pb-8 bg-gradient-to-b from-gray-50 to-white dark:from-white/5 dark:to-[#1C1C1E] border-b border-gray-100 dark:border-white/10">
                        <div className="flex justify-between items-start mb-6">
                            <button onClick={closeDrawer} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition text-gray-500 dark:text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${detailsUser.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/10'}`}>
                                {detailsUser.status}
                            </span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="relative w-24 h-24 rounded-full p-1 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 shadow-lg mb-4">
                                <img src={detailsUser.avatar} className="w-full h-full rounded-full object-cover" alt={detailsUser.name} />
                                {detailsUser.monthBadge && (
                                    <span className="absolute bottom-0 right-0 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-2 ring-white dark:ring-[#2C2C2E]">{detailsUser.monthBadge}</span>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{detailsUser.name}</h2>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" /> {detailsUser.email}
                            </div>
                            {detailsUser.phone && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                                    <Phone className="w-3.5 h-3.5" /> {detailsUser.phone}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-8">
                        {/* Basic Info */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <UserIcon className="w-4 h-4" /> 基础信息
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div className="text-[10px] text-gray-400 uppercase mb-1">账号 ID</div>
                                    <div className="font-mono text-sm font-bold text-gray-700 dark:text-gray-200">{detailsUser.accountId}</div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div className="text-[10px] text-gray-400 uppercase mb-1">人员类型</div>
                                    <div className="text-sm font-bold text-gray-700 dark:text-gray-200">{detailsUser.userType === 'Internal' ? '内部员工' : '外部协作'}</div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 col-span-2">
                                    <div className="text-[10px] text-gray-400 uppercase mb-1">手机号</div>
                                    <div className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-green-500" />
                                        {detailsUser.phone || <span className="text-gray-400 font-normal italic">未填写</span>}
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 col-span-2">
                                    <div className="text-[10px] text-gray-400 uppercase mb-1">所属部门</div>
                                    <div className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-indigo-500" />
                                        {departments.find(d => d.id === detailsUser.departmentId)?.name || '未分配部门'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Permissions */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> 角色权限
                            </h3>
                            <div className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">当前角色</div>
                                    <div className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-blue-500" />
                                        {roles.find(r => r.id === detailsUser.role)?.name || detailsUser.role}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {roles.find(r => r.id === detailsUser.role)?.description}
                                    </div>
                                </div>
                                <div className="p-4 bg-white dark:bg-transparent">
                                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-3">拥有的功能权限</div>
                                    <div className="flex flex-wrap gap-2">
                                        {roles.find(r => r.id === detailsUser.role)?.permissions.map(permId => {
                                            const permLabel = permissionModules.flatMap(m => m.permissions).find(p => p.id === permId)?.label || permId;
                                            return (
                                                <span key={permId} className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-900/30 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> {permLabel}
                                                </span>
                                            );
                                        })}
                                        {(!roles.find(r => r.id === detailsUser.role)?.permissions.length) && (
                                            <span className="text-gray-400 text-xs italic">无特殊功能权限</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/10">
                                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-3 flex items-center gap-1"><Database className="w-3 h-3"/> 数据行权限</div>
                                    {(() => {
                                        const userRole = roles.find(r => r.id === detailsUser.role);
                                        const base = userRole?.baseRowPermission || 'all';
                                        return (
                                            <div className="mb-2 flex items-center gap-1.5">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${base === 'self' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : base === 'department' ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                                                    {base === 'self' ? '本人' : base === 'department' ? '本部门' : '全部'}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                    {(roles.find(r => r.id === detailsUser.role)?.rowPermissions?.length ?? 0) > 0 && (
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10"></div>
                                            <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400">或</span>
                                            <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10"></div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        {roles.find(r => r.id === detailsUser.role)?.rowPermissions?.map((rule, idx) => {
                                            const resLabel = resourceConfig.find(res => res.id === rule.resource)?.label || rule.resource;
                                            const dimLabel = resourceConfig.find(res => res.id === rule.resource)?.dimensions.find(d => d.id === rule.dimension)?.label || rule.dimension;
                                            const opLabel = rule.operator === 'contains' ? '包含' : '等于';
                                            return (
                                                <div key={idx} className="p-2 bg-white dark:bg-[#2C2C2E] rounded border border-gray-200 dark:border-white/10 text-xs">
                                                    <div className="font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                                        {resLabel} - {dimLabel}
                                                        <span className="font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{opLabel}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {rule.values.map(v => (
                                                            <span key={v} className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-600 dark:text-gray-400">{getReadableValue(rule.dimension, v)}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!roles.find(r => r.id === detailsUser.role)?.rowPermissions || roles.find(r => r.id === detailsUser.role)?.rowPermissions?.length === 0) && (
                                            <span className="text-xs text-gray-400 italic">默认可见所有数据行</span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-white dark:bg-transparent border-t border-gray-100 dark:border-white/10">
                                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-3 flex items-center gap-1"><Columns className="w-3 h-3"/> 数据列权限</div>
                                    <div className="space-y-2">
                                        {roles.find(r => r.id === detailsUser.role)?.columnPermissions?.map((rule, idx) => {
                                            const resConfig = columnConfig.find(res => res.id === rule.resource);
                                            const resLabel = resConfig?.label || rule.resource;
                                            return (
                                                <div key={idx} className="p-2 bg-gray-50 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 text-xs">
                                                    <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">{resLabel}</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {rule.allowedColumns.map(colId => {
                                                            const colLabel = resConfig?.columns.find(c => c.id === colId)?.label || colId;
                                                            return (
                                                                <span key={colId} className="px-1.5 py-0.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded text-gray-600 dark:text-gray-400">{colLabel}</span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!roles.find(r => r.id === detailsUser.role)?.columnPermissions || roles.find(r => r.id === detailsUser.role)?.columnPermissions?.length === 0) && (
                                            <span className="text-xs text-gray-400 italic">默认可见所有基础列</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
                 
                 {/* Footer Actions */}
                 <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex gap-3">
                    <button onClick={() => { closeDrawer(); handleOpenModal(detailsUser); }} className="flex-1 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:opacity-80 transition flex items-center justify-center gap-2">
                        <Edit className="w-4 h-4" /> 编辑用户
                    </button>
                 </div>
            </div>
        </div>
        </ModalPortal>

      )}
      {/* Add User to Role Modal */}
      {isAddUserModalOpen && (

          <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
              <div className="unified-card dark:bg-[#1C1C1E] w-full max-w-2xl flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">添加用户到角色</h2>
                      <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-4 border-b border-gray-100 dark:border-white/10">
                      <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                          <input 
                              value={userSearchTerm}
                              onChange={e => setUserSearchTerm(e.target.value)}
                              placeholder="搜索用户..."
                              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                          />
                      </div>
                  </div>
                  <div className="flex-1 overflow-auto p-2">
                      {users.filter(u => u.role !== selectedRoleId && (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))).map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="relative flex-shrink-0">
                                      <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                                      {user.monthBadge && (
                                          <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[8px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                                      )}
                                  </div>
                                  <div>
                                      <div className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</div>
                                      <div className="text-xs text-gray-500">{user.email}</div>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => handleAddUserToRole(user.id)}
                                  className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                              >
                                  添加
                              </button>
                          </div>
                      ))}
                      {users.filter(u => u.role !== selectedRoleId && (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))).length === 0 && (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                              没有找到可添加的用户
                          </div>
                      )}
                  </div>
              </div>
          </div>
          </ModalPortal>

      )}

    </div>
  );
};

export default UserManager;
