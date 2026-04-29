
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { User, UserType, RoleDefinition, PermissionDimension, RowPermissionRule, ColumnPermissionRule, PermissionResource, Department, Space, SpaceRole, SpaceMember, AppScopedRolePermissions } from '../../types';
import { Search, Plus, Shield, User as UserIcon, Edit, Building2, X, CheckCircle, Lock, CheckSquare, Settings, Save, Trash2, Database, Check, ChevronDown, ChevronRight, Columns, Copy, Globe, GripVertical, Box, Eye } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import UserDetailPanel from '../common/UserDetailPanel';
import EmployeeCardModal from '../common/EmployeeCardModal';
import { useAppContext } from '../../contexts/AppContext';
import { columnConfig, permissionTree, resourceConfig, getSubgroupPermIds } from './permissionConfig';
import { useRoleDrag } from './userManager/useRoleDrag';
import { useUserDrag } from './userManager/useUserDrag';
import { usePermissionTreeExpansion } from './userManager/usePermissionTreeExpansion';
import { useRowPermissionRules } from './userManager/useRowPermissionRules';
import { useFunctionalPermissions } from './userManager/useFunctionalPermissions';
import { useUserDrawer } from './userManager/useUserDrawer';
import { useRowPermissionHelpers } from './userManager/useRowPermissionHelpers';
import SpaceRoleManager from './SpaceRoleManager';
import SpaceRoleDetail from './space/SpaceRoleDetail';
import { spaceApi, userApi } from '../../services/api';
import { defaultAppScopedPermissions } from '../../utils/mergeRolePermissions';
import Pagination from '../common/Pagination';

interface UserManagerProps {
  defaultTab?: 'USERS' | 'ROLES';
}

const MAIN_SPACE_ID = '__main__';

const UserManager: React.FC<UserManagerProps> = ({ defaultTab = 'USERS' }) => {
  const { users, setUsers, departments, roles, setRoles, channels, apiMode, spaces, setSpaces, refreshSpaces, currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>(defaultTab);
  const [activeSpaceId, setActiveSpaceId] = useState<string>(MAIN_SPACE_ID);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDesc, setNewSpaceDesc] = useState('');
  const [newSpaceAdminId, setNewSpaceAdminId] = useState('');
  const [newSpaceAdminSearch, setNewSpaceAdminSearch] = useState('');
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [creatingSpace, setCreatingSpace] = useState(false);
  /** 平台角色下：主业务平台 vs 各应用 的权限配置范围 */
  const [platformPermScope, setPlatformPermScope] = useState<string>('__main__');

  // User permission search state
  const [userPermSearch, setUserPermSearch] = useState('');
  const [showUserPermDropdown, setShowUserPermDropdown] = useState(false);
  const [selectedPermUser, setSelectedPermUser] = useState<User | null>(null);
  const [userPermTab, setUserPermTab] = useState<'FUNCTIONAL' | 'ROW' | 'COLUMN'>('FUNCTIONAL');
  const userPermSearchRef = useRef<HTMLDivElement>(null);

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
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [isRoleSearchOpen, setIsRoleSearchOpen] = useState(false);
  const roleSearchInputRef = useRef<HTMLInputElement>(null);

  const {
    dragRoleId,
    dragOverRoleId,
    handleRoleDragStart,
    handleRoleDragOver,
    handleRoleDrop,
    handleRoleDragEnd,
  } = useRoleDrag(roles, setRoles, apiMode);

  const {
    dragUserId,
    dragOverUserId,
    handleUserDragStart,
    handleUserDragOver,
    handleUserDrop,
    handleUserDragEnd,
  } = useUserDrag(users, setUsers, apiMode);

  const {
    detailsUser,
    setDetailsUser,
    isDrawerOpen,
    setIsDrawerOpen,
    isDrawerClosing,
    setIsDrawerClosing,
    isEmployeeCardOpen,
    setIsEmployeeCardOpen,
    handleAvatarClick,
    closeDrawer,
  } = useUserDrawer();
  
  // Row Permission Editor State
  const [selectedResource, setSelectedResource] = useState<PermissionResource>('Order');
  const [roleConfigTab, setRoleConfigTab] = useState<'FUNCTIONAL' | 'ROW' | 'COLUMN'>('FUNCTIONAL');
  const [selectedColumnResource, setSelectedColumnResource] = useState<PermissionResource>('Order');
  const [roleDetailTab, setRoleDetailTab] = useState<'MEMBERS' | 'FUNCTIONAL' | 'ROW' | 'COLUMN'>('MEMBERS');
  const [openDimDropdown, setOpenDimDropdown] = useState<string | null>(null);
  const [openDimPicker, setOpenDimPicker] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{top: number; left: number; width: number; openUp: boolean; type: 'dim' | 'val'} | null>(null);

  const computeDropdownPos = (triggerEl: HTMLElement, type: 'dim' | 'val', dropdownHeight = 320) => {
      const rect = triggerEl.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      return {
          left: rect.left,
          top: openUp ? rect.top : rect.bottom + 4,
          width: type === 'val' ? rect.width : Math.max(rect.width, 160),
          openUp,
          type,
      };
  };
  const [groupSelectMode, setGroupSelectMode] = useState(false);
  const [groupSelectRules, setGroupSelectRules] = useState<string[]>([]);

  useEffect(() => {
      if (!openDimDropdown && !openDimPicker) return;
      const handler = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (!target.closest('[data-dim-dropdown]')) {
              setOpenDimDropdown(null);
              setOpenDimPicker(null);
              setDropdownPos(null);
          }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
  }, [openDimDropdown, openDimPicker]);

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

  // Row permission rule mutators - moved to useRowPermissionRules below
  // (declared after roleForm state because hook requires setRoleForm)

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    expandedGroups,
    setExpandedGroups,
    expandedSubgroups,
    setExpandedSubgroups,
    expandedCategories,
    setExpandedCategories,
    expandedModules,
    setExpandedModules,
    toggleGroupExpand,
    toggleSubgroupExpand,
    toggleCategoryExpand,
    allPermsInSubgroup,
    allPermsInGroup,
    allPermsInCategory,
    getCheckState,
  } = usePermissionTreeExpansion();

  // toggleSubgroupPerms / toggleCategoryPerms moved into useFunctionalPermissions below

  // Forms
  const [userForm, setUserForm] = useState<Partial<User>>({
      name: '',
      email: '',
      roles: ['Sales'],
      departmentId: '',
      status: 'Active',
      avatar: '',
      userType: 'Internal'
  });

  const [roleForm, setRoleForm] = useState<Partial<RoleDefinition>>({
      name: '',
      description: '',
      permissions: [],
      rowPermissions: [],
      rowLogic: {}
  });

  const {
    addCondition,
    changeRuleDimension,
    removeSingleRule,
    handleDeleteRowRule,
    updateRuleValues,
    setRuleSingleValue: setRuleSingleValueRaw,
    clearRuleValue,
    toggleRuleValue,
    updateRuleOperator,
    toggleDimOperator,
    createRuleGroup: createRuleGroupRaw,
    removeDimGroup,
  } = useRowPermissionRules(selectedResource, setRoleForm);

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
              roles: roles[0]?.id ? [roles[0].id] : [], 
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
              ...(userForm as User), 
              id: `u-${Date.now()}`,
              accountId: generateAccountId(), 
              avatar: userForm.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userForm.name}` 
          }; 
          setUsers(prev => [...prev, newUser]); 
      }
      setIsModalOpen(false);
  };

  // handleAvatarClick / closeDrawer moved into useUserDrawer above

  // --- Role Handlers ---
  const handleSelectRole = (role: RoleDefinition) => {
      setSelectedRoleId(role.id);
      setRoleForm({ ...role, appPermissions: { ...(role.appPermissions || {}) } });
      setPlatformPermScope('__main__');
      setIsEditingRole(false);
  };

  const handleCreateRole = () => {
      setSelectedRoleId('new');
      setRoleForm({ name: '', description: '', permissions: [], rowPermissions: [], rowLogic: {}, appPermissions: {} });
      setPlatformPermScope('__main__');
      setIsEditingRole(true);
  };

  const handleSaveRole = async () => {
      if (!roleForm.name) return;
      const payload = {
        name: roleForm.name!,
        description: roleForm.description || '',
        permissions: roleForm.permissions || [],
        rowPermissions: roleForm.rowPermissions || [],
        rowLogic: roleForm.rowLogic || {},
        columnPermissions: roleForm.columnPermissions || [],
        appPermissions: roleForm.appPermissions || {},
      };
      if (selectedRoleId && selectedRoleId !== 'new') {
          setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, ...roleForm } as RoleDefinition : r));
          if (apiMode) {
            try {
              await userApi.updateRole(selectedRoleId, payload);
            } catch (e: any) {
              alert(e?.message || '保存平台角色到服务器失败');
            }
          }
      } else {
          const newId = `role-${Date.now()}`;
          const newRole: RoleDefinition = {
              ...(roleForm as RoleDefinition),
              id: newId,
              isSystem: false,
              ...payload,
          };
          if (apiMode) {
            try {
              const created = await userApi.createPlatformRole(payload);
              newRole.id = created.id;
            } catch (e: any) {
              alert(e?.message || '创建平台角色失败');
              return;
            }
          }
          setRoles(prev => [...prev, newRole]);
          setSelectedRoleId(newRole.id);
      }
      setIsEditingRole(false);
  };

  const handleDeleteRole = (id: string) => {
      if (id === 'Admin') return alert("管理员角色不可删除。");
      if (users.some(u => u.roles?.includes(id))) return alert("该角色下仍有用户，无法删除。");
      if (confirm("确定要删除此角色吗？")) {
          setRoles(prev => prev.filter(r => r.id !== id));
          if (selectedRoleId === id) {
              setSelectedRoleId(null);
              setRoleForm({ name: '', description: '', permissions: [], rowPermissions: [], rowLogic: {} });
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
          rowLogic: role.rowLogic ? JSON.parse(JSON.stringify(role.rowLogic)) : {},
          columnPermissions: role.columnPermissions?.map(r => ({ ...r })) || [],
          appPermissions: role.appPermissions ? JSON.parse(JSON.stringify(role.appPermissions)) : {},
      };
      setRoles(prev => [...prev, copiedRole]);
      setSelectedRoleId(newId);
      setRoleForm({ ...copiedRole });
      setPlatformPermScope('__main__');
      setIsEditingRole(true);
  };

  /** 平台角色在「非主应用」Tab 下嵌入 SpaceRoleDetail 的合成角色 */
  const platformEmbedRole: SpaceRole | null = useMemo(() => {
    if (platformPermScope === '__main__') return null;
    const sp = spaces.find(s => s.id === platformPermScope);
    if (!sp) return null;
    const ap: AppScopedRolePermissions = {
      ...defaultAppScopedPermissions(),
      ...(roleForm as RoleDefinition).appPermissions?.[platformPermScope],
    };
    return {
      id: `platform-embed-${platformPermScope}`,
      spaceId: platformPermScope,
      name: (roleForm.name as string) || '平台角色',
      description: (roleForm.description as string) || '',
      permissions: ap.permissions,
      rowPermissions: ap.rowPermissions,
      rowLogic: ap.rowLogic || {},
      columnPermissions: ap.columnPermissions,
      sortOrder: 0,
    };
  }, [platformPermScope, spaces, roleForm.appPermissions, roleForm.name, roleForm.description]);

  const {
    togglePermission,
    toggleModule,
    toggleSubgroupPerms,
    toggleCategoryPerms,
  } = useFunctionalPermissions(
    roleForm,
    setRoleForm,
    getCheckState,
    allPermsInSubgroup,
    allPermsInCategory,
  );

  const handleRemoveUserFromRole = (userId: string) => {
      if (!selectedRoleId) return;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: (u.roles || []).filter(r => r !== selectedRoleId) } : u));
  };

  const handleAddUserToRole = (userId: string) => {
      if (!selectedRoleId) return;
      setUsers(prev => prev.map(u => {
          if (u.id !== userId) return u;
          if (u.roles?.includes(selectedRoleId)) return u;
          return { ...u, roles: [...(u.roles || []), selectedRoleId] };
      }));
  };

  // --- Row Permissions UI wrappers (mutations live in useRowPermissionRules) ---
  const setRuleSingleValue = (ruleId: string, val: string) => {
      setRuleSingleValueRaw(ruleId, val);
      setOpenDimDropdown(null);
      setDropdownPos(null);
  };

  const createRuleGroup = (resource: string, ruleIds: string[]) => {
      if (ruleIds.length < 2) return;
      createRuleGroupRaw(resource, ruleIds);
      setGroupSelectMode(false);
      setGroupSelectRules([]);
  };

  const getDimOperator = (resource: string, dimId: string): 'AND' | 'OR' => {
      return roleForm.rowLogic?.[resource]?.dimOperators?.[dimId] || 'AND';
  };

  const {
    getDepartmentPath,
    getDimensionOptions: getDimensionOptionsBase,
    getReadableValue: getReadableValueBase,
    hasResourceFunctionalPerm,
    getResourcePermHint,
    getEnabledDimsForResource,
    getRuleGroup,
    getRuleGroupIndex,
    buildDeptTree,
  } = useRowPermissionHelpers(roleForm, departments, channels, users);

  const GROUP_COLORS = [
      { bg: 'bg-indigo-50 dark:bg-indigo-900/15', border: 'border-indigo-300 dark:border-indigo-600', text: 'text-indigo-600 dark:text-indigo-400', label: 'A' },
      { bg: 'bg-emerald-50 dark:bg-emerald-900/15', border: 'border-emerald-300 dark:border-emerald-600', text: 'text-emerald-600 dark:text-emerald-400', label: 'B' },
      { bg: 'bg-rose-50 dark:bg-rose-900/15', border: 'border-rose-300 dark:border-rose-600', text: 'text-rose-600 dark:text-rose-400', label: 'C' },
      { bg: 'bg-orange-50 dark:bg-orange-900/15', border: 'border-orange-300 dark:border-orange-600', text: 'text-orange-600 dark:text-orange-400', label: 'D' },
  ];

  const buildFormulaDisplay = (resource: string): string => {
      const rules = (roleForm.rowPermissions || []).filter(r => r.resource === resource);
      if (rules.length === 0) return '';
      if (rules.length === 1) {
          const dimCfg = resourceConfig.find(rc => rc.id === resource)?.dimensions.find(d => d.id === rules[0].dimension);
          return dimCfg?.label || rules[0].dimension;
      }
      const groups = roleForm.rowLogic?.[resource]?.dimGroups || [];
      const ruleToGroup = new Map<string, string>();
      groups.forEach(g => g.dims.forEach(rid => ruleToGroup.set(rid, g.id)));
      const groupSegments = new Map<string, string[]>();
      const topLevelParts: { type: 'rule' | 'group'; content: string; ruleId: string }[] = [];
      const processedGroups = new Set<string>();
      rules.forEach((rule) => {
          const dimCfg = resourceConfig.find(rc => rc.id === resource)?.dimensions.find(d => d.id === rule.dimension);
          const label = dimCfg?.label || rule.dimension;
          const groupId = ruleToGroup.get(rule.id) || null;
          if (groupId) {
              if (!groupSegments.has(groupId)) groupSegments.set(groupId, []);
              groupSegments.get(groupId)!.push(rule.id);
              if (!processedGroups.has(groupId)) {
                  processedGroups.add(groupId);
                  topLevelParts.push({ type: 'group', content: groupId, ruleId: rule.id });
              }
          } else {
              topLevelParts.push({ type: 'rule', content: label, ruleId: rule.id });
          }
      });
      return topLevelParts.map((part, idx) => {
          let prefix = '';
          if (idx > 0) {
              const firstRuleIdOfPart = part.type === 'group' ? groupSegments.get(part.content)![0] : part.ruleId;
              prefix = ` ${getDimOperator(resource, firstRuleIdOfPart)} `;
          }
          if (part.type === 'rule') return prefix + part.content;
          const grpRuleIds = groupSegments.get(part.content) || [];
          const innerParts = grpRuleIds.map((rid: string, i: number) => {
              const r = rules.find(rr => rr.id === rid);
              if (!r) return '?';
              const dCfg = resourceConfig.find(rc => rc.id === resource)?.dimensions.find(d => d.id === r.dimension);
              const lbl = dCfg?.label || r.dimension;
              if (i === 0) return lbl;
              return `${getDimOperator(resource, rid)} ${lbl}`;
          });
          return `${prefix}( ${innerParts.join(' ')} )`;
      }).join('');
  };

  const getDimensionOptions = (dim: PermissionDimension) => {
      if (dim === 'departmentId') {
          return [
              { value: '__self_dept__', label: '本部门' },
              { value: '__self_dept_children__', label: '本部门及下属部门' },
              ...departments.map(d => ({ value: d.id, label: getDepartmentPath(d.id) })),
          ];
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
      if (dim === 'salesRep' || dim === 'businessManager' || dim === 'creator') {
          return [
              { value: 'self', label: '本人' },
              { value: 'department', label: '本人所属部门' },
              { value: 'departmentAndChildren', label: '本人所属部门及下属部门' },
          ];
      }
      if (dim === 'orderType') {
          return [
              { value: 'Customer', label: '直签订单' },
              { value: 'Channel', label: '渠道订单' },
              { value: 'SelfDeal', label: '自成交订单' },
              { value: 'RedeemCode', label: '兑换码订单' },
          ];
      }
      if (dim === 'orderSource') {
          return [
              { value: 'Sales', label: '后台下单' },
              { value: 'ChannelPortal', label: '渠道来源' },
              { value: 'OnlineStore', label: '官网' },
              { value: 'APISync', label: '三方平台' },
          ];
      }
      if (dim === 'orderStatus') {
          return [
              { value: 'DRAFT', label: '草稿' },
              { value: 'PENDING_APPROVAL', label: '待审批' },
              { value: 'PENDING_CONFIRM', label: '待确认' },
              { value: 'PROCESSING_PROD', label: '备货中' },
              { value: 'PENDING_PAYMENT', label: '待支付' },
              { value: 'SHIPPED', label: '已发货' },
              { value: 'DELIVERED', label: '已完成' },
              { value: 'CANCELLED', label: '已取消' },
              { value: 'REFUND_PENDING', label: '退款中' },
              { value: 'REFUNDED', label: '已退款' },
          ];
      }
      if (dim === 'buyerType') return [
          { value: 'Customer', label: '直签订单' },
          { value: 'Channel', label: '渠道订单' },
          { value: 'SelfDeal', label: '自成交订单' },
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
  const filteredUsers = useMemo(() => {
      const q = searchTerm.toLowerCase();
      if (!q) return users;
      return users.filter(u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.accountId.includes(searchTerm)
      );
  }, [users, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  // 搜索条件变化或数据变化导致总页数缩减时，自动回到第一页/最后一页，避免出现空表
  useEffect(() => {
      if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = useMemo(
      () => filteredUsers.slice(indexOfFirstItem, indexOfLastItem),
      [filteredUsers, indexOfFirstItem, indexOfLastItem],
  );
  const handlePageChange = (page: number) => setCurrentPage(page);

  // User permission search
  const userPermSearchResults = useMemo(() => {
    if (!userPermSearch.trim()) return [];
    const q = userPermSearch.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.accountId.includes(q)
    ).slice(0, 8);
  }, [userPermSearch, users]);

  const selectedPermUserRole = useMemo(() => {
    if (!selectedPermUser) return null;
    return roles.find(r => selectedPermUser.roles?.includes(r.id)) || null;
  }, [selectedPermUser, roles]);

  useEffect(() => {
    if (!showUserPermDropdown) return;
    const handler = (e: MouseEvent) => {
      if (userPermSearchRef.current && !userPermSearchRef.current.contains(e.target as Node)) {
        setShowUserPermDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserPermDropdown]);

  const handleSelectPermUser = (user: User) => {
    setSelectedPermUser(user);
    setUserPermSearch('');
    setShowUserPermDropdown(false);
    setUserPermTab('FUNCTIONAL');
  };

  const handleClearPermUser = () => {
    setSelectedPermUser(null);
    setUserPermSearch('');
  };

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto space-y-4 animate-page-enter relative h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center shrink-0 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
            {activeTab === 'USERS' ? '用户管理' : '角色管理'}
        </h1>

        {/* 用户 Tab: 搜索 + 新增 放在标题同行 */}
        {activeTab === 'USERS' && (
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索用户..."
                className="w-64 pl-9 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
              />
            </div>
            <button onClick={() => handleOpenModal()} className="bg-[#0071E3] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#0062CC] transition shadow-sm whitespace-nowrap">
              <Plus className="w-4 h-4" /> 新增用户
            </button>
          </div>
        )}

        {activeTab === 'ROLES' && (
          <div className="flex items-center gap-1 ml-2">
            {[
              { id: MAIN_SPACE_ID, label: '平台角色', icon: Globe },
              ...spaces.map(s => ({ id: s.id, label: s.name, icon: Box, isApp: true })),
            ].map(item => (
              <div key={item.id} className="relative group/tab flex items-center">
                <button
                  onClick={() => { setActiveSpaceId(item.id); handleClearPermUser(); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition border ${
                    activeSpaceId === item.id
                      ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-sm'
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </button>
                {'isApp' in item && item.isApp && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm(`确定要删除应用「${item.label}」吗？\n该操作将同时删除应用下的所有角色和成员，且不可恢复。`)) return;
                      try {
                        if (apiMode) {
                          await spaceApi.delete(item.id);
                          await refreshSpaces();
                        } else {
                          setSpaces(prev => prev.filter(s => s.id !== item.id));
                          try {
                            localStorage.removeItem(`spaceMock:roles:${item.id}`);
                            localStorage.removeItem(`spaceMock:members:${item.id}`);
                          } catch {}
                        }
                        if (activeSpaceId === item.id) setActiveSpaceId(MAIN_SPACE_ID);
                      } catch (err: any) {
                        alert(err?.message || '删除失败');
                      }
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/tab:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10"
                    title={`删除应用 ${item.label}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setShowCreateSpace(true)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-[#0071E3] hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-dashed border-gray-300 dark:border-white/20 hover:border-[#0071E3] transition"
              title="添加应用"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* User Permission Search - right side */}
        {activeTab === 'ROLES' && activeSpaceId === MAIN_SPACE_ID && (
          <div className="ml-auto relative" ref={userPermSearchRef}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={selectedPermUser ? '' : userPermSearch}
                onChange={e => { setUserPermSearch(e.target.value); setShowUserPermDropdown(true); }}
                onFocus={() => { if (userPermSearch) setShowUserPermDropdown(true); }}
                placeholder={selectedPermUser ? `${selectedPermUser.name} 的权限` : '搜索用户查看权限...'}
                className={`w-56 pl-8 pr-8 py-1.5 bg-white dark:bg-black border rounded-lg text-xs outline-none transition-all focus:ring-2 focus:ring-blue-500/20 dark:text-white placeholder:text-gray-400 ${
                  selectedPermUser
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-gray-200 dark:border-white/10'
                }`}
                readOnly={!!selectedPermUser}
                onClick={() => { if (selectedPermUser) handleClearPermUser(); }}
              />
              {selectedPermUser ? (
                <button
                  onClick={handleClearPermUser}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Eye className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            {showUserPermDropdown && userPermSearch.trim() && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                {userPermSearchResults.length > 0 ? (
                  <div className="max-h-64 overflow-auto py-1">
                    {userPermSearchResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleSelectPermUser(u)}
                        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
                      >
                        <img src={u.avatar} alt="" className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-full flex-shrink-0">
                          {u.roles?.map(r => getRoleName(r)).join(', ') || '-'}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    <UserIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                    未找到匹配用户
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- USERS TAB --- */}
      {activeTab === 'USERS' && (
          <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col animate-fade-in flex-1">
              <div className="flex-1 overflow-auto">
                  <table className="w-full text-left">
                      <thead className="unified-table-header dark: sticky top-0 backdrop-blur">
                          <tr>
                              {!searchTerm && <th className="w-8 p-4 pl-3"></th>}
                              <th className="p-4 pl-6">用户</th>
                              <th className="p-4">账号ID</th>
                              <th className="p-4">部门</th>
                              <th className="p-4">类型</th>
                              <th className="p-4">状态</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                          {currentUsers.map(user => (
                              <tr
                                key={user.id}
                                draggable={!searchTerm}
                                onDragStart={e => handleUserDragStart(e, user.id)}
                                onDragOver={e => handleUserDragOver(e, user.id)}
                                onDrop={e => handleUserDrop(e, user.id)}
                                onDragEnd={handleUserDragEnd}
                                className={`group hover:bg-gray-50 dark:hover:bg-white/5 transition ${
                                  dragUserId === user.id ? 'opacity-40' : ''
                                } ${
                                  dragOverUserId === user.id && dragUserId !== user.id ? 'ring-2 ring-blue-400 dark:ring-blue-500 ring-inset bg-blue-50/50 dark:bg-blue-900/10' : ''
                                }`}
                              >
                                  {!searchTerm && (
                                    <td className="w-8 p-4 pl-3">
                                      <div className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                    </td>
                                  )}
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
                                  <td className="p-4"><span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${user.userType === 'Internal' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'}`}>{user.userType === 'Internal' ? '内部员工' : '外部协作'}</span></td>
                                  <td className="p-4"><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${user.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}><div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />{user.status === 'Active' ? '已启用' : '已停用'}</span></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <Pagination
                  page={currentPage}
                  size={itemsPerPage}
                  total={filteredUsers.length}
                  onPageChange={handlePageChange}
              />
          </div>
      )}

      {/* --- ROLES TAB --- */}
      {activeTab === 'ROLES' && (
        <>
          {/* Global role management (业务平台) */}
          {activeSpaceId === MAIN_SPACE_ID && (
          <div className="flex gap-6 flex-1 min-h-0 animate-fade-in">
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

              {/* Role Config / User Permission Overview */}
              <div className="unified-card flex-1 dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col">
                  {selectedPermUser ? (
                      /* ===== User Permission Overview ===== */
                      <>
                          <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/5">
                              <div className="flex items-center gap-3">
                                  <div className="relative">
                                      <img src={selectedPermUser.avatar} alt="" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 shadow-sm" />
                                      {selectedPermUser.monthBadge && (
                                          <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[8px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{selectedPermUser.monthBadge}</span>
                                      )}
                                  </div>
                                  <div>
                                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                          {selectedPermUser.name}
                                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{selectedPermUser.email}</span>
                                      </h2>
                                      <div className="flex items-center gap-3 mt-0.5">
                                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                              <Shield className="w-3 h-3" />
                                              角色：<strong className="text-gray-700 dark:text-gray-200">{selectedPermUserRole?.name || '未分配'}</strong>
                                          </span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                              <Building2 className="w-3 h-3" />
                                              {(() => { const dept = departments.find(d => d.id === selectedPermUser.departmentId); return dept?.name || '未分配'; })()}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                              <button onClick={handleClearPermUser} className="px-3 py-1.5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-lg text-xs hover:bg-white dark:hover:bg-white/5 transition flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" /> 关闭
                              </button>
                          </div>

                          {selectedPermUserRole ? (
                          <>
                          {/* Permission Tabs */}
                          <div className="flex border-b border-gray-100 dark:border-white/10 px-6 bg-white dark:bg-[#1C1C1E]">
                              {([
                                  { id: 'FUNCTIONAL' as const, icon: <CheckSquare className="w-4 h-4"/>, label: '功能权限', badge: String((selectedPermUserRole.permissions || []).length) },
                                  { id: 'ROW' as const, icon: <Database className="w-4 h-4"/>, label: '数据行权限', badge: String((selectedPermUserRole.rowPermissions || []).length) },
                                  { id: 'COLUMN' as const, icon: <Columns className="w-4 h-4"/>, label: '数据列权限', badge: String((selectedPermUserRole.columnPermissions || []).length) },
                              ]).map(tab => (
                                  <button
                                      key={tab.id}
                                      onClick={() => setUserPermTab(tab.id)}
                                      className={`px-4 py-3 text-sm font-bold transition-colors relative whitespace-nowrap ${userPermTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                  >
                                      <div className="flex items-center gap-2">{tab.icon} {tab.label} <span className="text-xs font-normal text-gray-400">({tab.badge})</span></div>
                                      {userPermTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                                  </button>
                              ))}
                          </div>

                          <div className="flex-1 overflow-auto p-6 space-y-6">
                              {/* Functional Permissions - Read-only */}
                              {userPermTab === 'FUNCTIONAL' && (
                              <div className="animate-fade-in">
                                  {(selectedPermUserRole.permissions || []).length === 0 ? (
                                      <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                          <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                          暂未配置任何功能权限
                                      </div>
                                  ) : (
                                      <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1C1C1E]">
                                      {permissionTree.map((group, gIdx) => {
                                          const groupPerms = allPermsInGroup(group);
                                          const activePerms = groupPerms.filter(p => (selectedPermUserRole.permissions || []).includes(p));
                                          if (activePerms.length === 0) return null;
                                          return (
                                              <div key={group.id} className={gIdx > 0 ? 'border-t border-gray-100 dark:border-white/10' : ''}>
                                                  <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 flex items-center justify-between">
                                                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{group.label}</span>
                                                      <span className="text-xs text-gray-400">{activePerms.length}/{groupPerms.length}</span>
                                                  </div>
                                                  <div className="px-4 py-3">
                                                      {group.subgroups.map(sg => {
                                                          const sgPerms = sg.categories
                                                              ? sg.categories.flatMap(c => c.permissions.map(p => p.id))
                                                              : sg.permissions?.map(p => p.id) || [];
                                                          const activeSg = sgPerms.filter(p => (selectedPermUserRole.permissions || []).includes(p));
                                                          if (activeSg.length === 0) return null;
                                                          return (
                                                              <div key={sg.id} className="mb-3 last:mb-0">
                                                                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{sg.label}</div>
                                                                  <div className="flex flex-wrap gap-1.5">
                                                                      {(sg.categories
                                                                          ? sg.categories.flatMap(c => c.permissions)
                                                                          : sg.permissions || []
                                                                      ).filter(p => (selectedPermUserRole.permissions || []).includes(p.id)).map(p => (
                                                                          <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                                                                              <Check className="w-3 h-3"/> {p.label}
                                                                          </span>
                                                                      ))}
                                                                  </div>
                                                              </div>
                                                          );
                                                      })}
                                                  </div>
                                              </div>
                                          );
                                      })}
                                      </div>
                                  )}
                              </div>
                              )}

                              {/* Row Permissions - Read-only */}
                              {userPermTab === 'ROW' && (
                              <div className="animate-fade-in">
                                  {(() => {
                                      const baseRow = selectedPermUserRole.baseRowPermission;
                                      const rowRules = selectedPermUserRole.rowPermissions || [];
                                      if (!baseRow || baseRow === 'all') {
                                          return (
                                              <div className="mb-4">
                                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30">
                                                      <CheckCircle className="w-3.5 h-3.5"/> 全部数据
                                                  </span>
                                              </div>
                                          );
                                      }
                                      if (baseRow === 'custom' && rowRules.length === 0) {
                                          return (
                                              <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                                  <Database className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                                  自定义行权限（暂无规则）
                                              </div>
                                          );
                                      }
                                      return null;
                                  })()}
                                  {(selectedPermUserRole.rowPermissions || []).length > 0 && (
                                      <div className="space-y-3">
                                          {resourceConfig.map(rc => {
                                              const rcRules = (selectedPermUserRole.rowPermissions || []).filter(r => r.resource === rc.id);
                                              if (rcRules.length === 0) return null;
                                              return (
                                                  <div key={rc.id} className="border border-gray-200 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-[#1C1C1E]">
                                                      <div className="flex items-center gap-2 mb-3">
                                                          <Database className="w-4 h-4 text-amber-500"/>
                                                          <span className="font-bold text-sm text-gray-800 dark:text-white">{rc.label}</span>
                                                          <span className="text-xs text-gray-400">{rcRules.length} 条规则</span>
                                                      </div>
                                                      <div className="space-y-2">
                                                          {rcRules.map(rule => {
                                                              const dimCfg = rc.dimensions.find(d => d.id === rule.dimension);
                                                              return (
                                                                  <div key={rule.id} className="flex items-start gap-2 p-2.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/20">
                                                                      <Lock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                                                      <div className="text-xs">
                                                                          <span className="font-medium text-gray-700 dark:text-gray-200">{dimCfg?.label || rule.dimension}</span>
                                                                          <span className="mx-1.5 text-gray-400">{rule.operator === 'equals' ? '等于' : rule.operator === 'contains' ? '包含' : rule.operator}</span>
                                                                          <span className="font-medium text-amber-700 dark:text-amber-300">
                                                                              {rule.values.length > 0
                                                                                  ? rule.values.map(v => getReadableValue(rule.dimension, v)).join('、')
                                                                                  : '未指定'}
                                                                          </span>
                                                                      </div>
                                                                  </div>
                                                              );
                                                          })}
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  )}
                              </div>
                              )}

                              {/* Column Permissions - Read-only */}
                              {userPermTab === 'COLUMN' && (
                              <div className="animate-fade-in">
                                  {(selectedPermUserRole.columnPermissions || []).length === 0 ? (
                                      <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                          <Columns className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                          暂未配置列权限（默认可见全部列）
                                      </div>
                                  ) : (
                                      <div className="space-y-3">
                                          {columnConfig.map(rc => {
                                              const colRule = (selectedPermUserRole.columnPermissions || []).find(r => r.resource === rc.id);
                                              if (!colRule) return null;
                                              return (
                                                  <div key={rc.id} className="border border-gray-200 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-[#1C1C1E]">
                                                      <div className="flex items-center gap-2 mb-3">
                                                          <Columns className="w-4 h-4 text-purple-500"/>
                                                          <span className="font-bold text-sm text-gray-800 dark:text-white">{rc.label}</span>
                                                          <span className="text-xs text-gray-400">{colRule.allowedColumns.length}/{rc.columns.length} 可见列</span>
                                                      </div>
                                                      <div className="flex flex-wrap gap-1.5">
                                                          {rc.columns.map(col => {
                                                              const isAllowed = colRule.allowedColumns.includes(col.id);
                                                              return (
                                                                  <span key={col.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${
                                                                      isAllowed
                                                                          ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30'
                                                                          : 'bg-gray-50 text-gray-400 border-gray-100 dark:bg-white/5 dark:text-gray-500 dark:border-white/10 line-through opacity-60'
                                                                  }`}>
                                                                      {isAllowed ? <Check className="w-3 h-3"/> : <X className="w-3 h-3"/>} {col.label}
                                                                  </span>
                                                              );
                                                          })}
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  )}
                              </div>
                              )}
                          </div>
                          </>
                          ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                  <Shield className="w-10 h-10 mb-2 opacity-20"/>
                                  <p className="text-sm">该用户尚未分配角色</p>
                              </div>
                          )}
                      </>
                  ) : selectedRoleId ? (
                      isEditingRole ? (
                          <div className="flex flex-col flex-1 min-h-0">
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
                              
                              <div className="px-6 py-2.5 flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] shrink-0">
                                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mr-1">配置范围</span>
                                <button
                                  type="button"
                                  onClick={() => setPlatformPermScope('__main__')}
                                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${platformPermScope === '__main__' ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-white dark:bg-black/40 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300'}`}
                                >
                                  主业务平台
                                </button>
                                {spaces.map(s => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setPlatformPermScope(s.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${platformPermScope === s.id ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-white dark:bg-black/40 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300'}`}
                                  >
                                    {s.name}
                                  </button>
                                ))}
                              </div>

                              <div className="flex-1 overflow-auto min-h-0 flex flex-col">
                              {platformPermScope === '__main__' ? (
                              <>
                              {/* Tabs - sticky */}
                              <div className="sticky top-0 z-20 bg-white dark:bg-[#1C1C1E] px-6 pt-4 pb-0 border-b border-gray-100 dark:border-white/10">
                                  <div className="flex gap-6">
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
                              </div>

                              <div className="p-6 space-y-6">

                              {/* Functional Permissions - 三级树 */}
                              {roleConfigTab === 'FUNCTIONAL' && (
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
                              )}

                              {/* Row Data Permissions */}
                              {roleConfigTab === 'ROW' && (
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
                                                                      {buildFormulaDisplay(selectedResource).split(/(\(|\)|AND|OR)/).filter(Boolean).map((token, ti) => {
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
                                                                          const renderDeptNode = (node: { dept: Department; children: any[] }, depth: number): React.ReactNode => {
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
                                                                                      {node.children.map((child: any) => renderDeptNode(child, depth + 1))}
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
                                                                                  {tree.length > 0 ? tree.map((n: any) => renderDeptNode(n, 0)) : <div className="px-3 py-4 text-center text-xs text-gray-400">暂无部门</div>}
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
                              )}

                              {/* Column Data Permissions */}
                              {roleConfigTab === 'COLUMN' && (
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
                                                  const checkedCount = rule ? rule.allowedColumns.length : 0;
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
                                                                  {!hasFuncPerm ? '未开启功能权限' : checkedCount > 0 ? `${checkedCount}/${res.columns.length} 列可见` : `${res.columns.length} 个数据列`}
                                                              </div>
                                                          </div>
                                                          {hasFuncPerm && checkedCount > 0 && (
                                                              <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{checkedCount}</span>
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
                                              const checkedCount = rule ? rule.allowedColumns.length : 0;
                                              return (
                                                  <>
                                                      <div className="flex items-start justify-between gap-3">
                                                          <div>
                                                              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{resConfig.label} — 列权限配置</h4>
                                                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">勾选代表该角色可以查看对应的数据列</p>
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
                                                                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                                                              >全选</button>
                                                              <span className="text-gray-300 dark:text-gray-600">|</span>
                                                              <button
                                                                  onClick={() => {
                                                                      setRoleForm(prev => ({
                                                                          ...prev,
                                                                          columnPermissions: (prev.columnPermissions || []).filter(r => r.resource !== selectedColumnResource)
                                                                      }));
                                                                  }}
                                                                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline font-medium"
                                                              >全不选</button>
                                                          </div>
                                                      </div>

                                                      <div className="space-y-2">
                                                          {resConfig.columns.map(col => {
                                                              const isChecked = rule ? rule.allowedColumns.includes(col.id) : false;
                                                              return (
                                                                  <label
                                                                      key={col.id}
                                                                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                                                                          isChecked
                                                                              ? 'bg-purple-50 dark:bg-purple-900/15 border-purple-200 dark:border-purple-800/40'
                                                                              : 'bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/10 hover:border-purple-200 dark:hover:border-purple-800/30'
                                                                      }`}
                                                                  >
                                                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-purple-500 border-purple-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                                          {isChecked && <Check className="w-3 h-3 text-white"/>}
                                                                      </div>
                                                                      <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleColumn(col.id)} />
                                                                      <span className={`text-sm font-medium ${isChecked ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>{col.label}</span>
                                                                      {isChecked && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 font-bold">可见</span>}
                                                                  </label>
                                                              );
                                                          })}
                                                      </div>

                                                      <div className="text-xs text-gray-400 dark:text-gray-500 italic pt-2 border-t border-gray-200/60 dark:border-white/10">
                                                          已选 <strong className="text-purple-600 dark:text-purple-400">{checkedCount}</strong> / {resConfig.columns.length} 列可见{checkedCount === 0 && '，默认可见所有基础列'}
                                                      </div>
                                                  </>
                                              );
                                          })()}
                                      </div>
                                  </div>
                              </div>
                              )}
                          </div>
                          </>
                      ) : platformEmbedRole && spaces.find(s => s.id === platformPermScope) ? (
                          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                              <SpaceRoleDetail
                                key={platformPermScope}
                                space={spaces.find(s => s.id === platformPermScope)!}
                                role={platformEmbedRole}
                                localOnly
                                canEdit={!roleForm.isSystem}
                                apiMode={apiMode}
                                onSaved={sr => {
                                  if (!sr) return;
                                  setRoleForm(prev => ({
                                    ...prev,
                                    appPermissions: {
                                      ...((prev as RoleDefinition).appPermissions || {}),
                                      [platformPermScope]: {
                                        permissions: sr.permissions ?? [],
                                        rowPermissions: sr.rowPermissions ?? [],
                                        rowLogic: sr.rowLogic ?? {},
                                        columnPermissions: sr.columnPermissions ?? [],
                                      },
                                    },
                                  }));
                                }}
                                members={[]}
                                allUsers={users}
                                initialEditing
                              />
                          </div>
                      ) : (
                          <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-gray-400">
                              未找到该应用，请从上方重新选择
                          </div>
                      )}
                          </div>
                          </div>
                      ) : (
                          <>
                              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                                  <div>
                                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                          {roleForm.name}
                                          {selectedRoleId === 'Admin' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full font-normal">内置</span>}
                                      </h2>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{roleForm.description || '暂无描述'}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      {selectedRoleId !== 'Admin' && (
                                          <button onClick={() => handleDeleteRole(selectedRoleId)} className="px-3 py-1.5 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-1"><Trash2 className="w-4 h-4"/> 删除</button>
                                      )}
                                      <button onClick={() => { const r = roles.find(r => r.id === selectedRoleId); if (r) handleCopyRole(r); }} className="px-3 py-1.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-1"><Copy className="w-4 h-4"/> 复制</button>
                                      <button onClick={() => setIsEditingRole(true)} className="px-4 py-1.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-1"><Edit className="w-4 h-4"/> 编辑角色</button>
                                  </div>
                              </div>
                              
                              {/* Tab 切换 */}
                              <div className="flex border-b border-gray-100 dark:border-white/10 px-6 overflow-x-auto">
                                  {([
                                      { id: 'MEMBERS' as const, icon: <UserIcon className="w-4 h-4"/>, label: '角色成员', badge: String(users.filter(u => selectedRoleId && u.roles?.includes(selectedRoleId)).length) },
                                      { id: 'FUNCTIONAL' as const, icon: <CheckSquare className="w-4 h-4"/>, label: '功能权限', badge: String((roleForm.permissions || []).length) },
                                      { id: 'ROW' as const, icon: <Database className="w-4 h-4"/>, label: '数据行权限', badge: String((roleForm.rowPermissions || []).length) },
                                      { id: 'COLUMN' as const, icon: <Columns className="w-4 h-4"/>, label: '数据列权限', badge: String((roleForm.columnPermissions || []).length) },
                                  ]).map(tab => (
                                      <button
                                          key={tab.id}
                                          onClick={() => setRoleDetailTab(tab.id)}
                                          className={`px-4 py-3 text-sm font-bold transition-colors relative whitespace-nowrap ${roleDetailTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                      >
                                          <div className="flex items-center gap-2">{tab.icon} {tab.label} <span className="text-xs font-normal text-gray-400">({tab.badge})</span></div>
                                          {roleDetailTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
                                      </button>
                                  ))}
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
                                          {users.filter(u => selectedRoleId && u.roles?.includes(selectedRoleId)).length > 0 ? (
                                              users.filter(u => selectedRoleId && u.roles?.includes(selectedRoleId)).map(user => (
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

                                  {/* ===== 功能权限 Tab ===== */}
                                  {roleDetailTab === 'FUNCTIONAL' && (
                                  <div className="animate-fade-in">
                                      {(roleForm.permissions || []).length === 0 ? (
                                          <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                              暂未配置任何功能权限
                                          </div>
                                      ) : (
                                          <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1C1C1E]">
                                          {permissionTree.map((group, gIdx) => {
                                              const current    = roleForm.permissions || [];
                                              const groupPerms = allPermsInGroup(group);
                                              const groupState = getCheckState(groupPerms, current);
                                              if (groupState === 'none') return null;
                                              return (
                                                  <div key={group.id} className={gIdx > 0 ? 'border-t border-gray-100 dark:border-white/10' : ''}>
                                                      <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10">
                                                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${groupState === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}>
                                                              <Check className="w-2.5 h-2.5 text-white"/>
                                                          </div>
                                                          <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{group.label}</span>
                                                          <span className="text-[11px] text-blue-500 dark:text-blue-400 ml-auto font-mono">
                                                              {groupPerms.filter(id => current.includes(id)).length}/{groupPerms.length}
                                                          </span>
                                                      </div>
                                                      {group.subgroups.map(sg => {
                                                          const sgPerms = allPermsInSubgroup(sg);
                                                          const sgState = getCheckState(sgPerms, current);
                                                          if (sgState === 'none') return null;
                                                          return (
                                                              <div key={sg.id}>
                                                                  <div className="flex items-center gap-2.5 py-1.5 pr-4" style={{ paddingLeft: 36 }}>
                                                                      <div className="w-px h-4 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0"/>
                                                                      <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${sgState === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}>
                                                                          <Check className="w-2 h-2 text-white"/>
                                                                      </div>
                                                                      <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{sg.label}</span>
                                                                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                                                                          {sgPerms.filter(id => current.includes(id)).length}/{sgPerms.length}
                                                                      </span>
                                                                  </div>
                                                                  {sg.categories && sg.categories.map(cat => {
                                                                      const catPermIds = allPermsInCategory(cat);
                                                                      const catState = getCheckState(catPermIds, current);
                                                                      if (catState === 'none') return null;
                                                                      return (
                                                                          <div key={cat.id}>
                                                                              <div className="flex items-center gap-2 py-1 pr-4" style={{ paddingLeft: 56 }}>
                                                                                  <div className="w-px h-3 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-0.5 shrink-0"/>
                                                                                  <div className={`w-2.5 h-2.5 rounded border flex items-center justify-center shrink-0 ${catState === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}>
                                                                                      <Check className="w-1.5 h-1.5 text-white"/>
                                                                                  </div>
                                                                                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{cat.label}</span>
                                                                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                                                                      {catPermIds.filter(id => current.includes(id)).length}/{catPermIds.length}
                                                                                  </span>
                                                                              </div>
                                                                              {cat.permissions.filter(p => current.includes(p.id)).map(perm => (
                                                                                  <div key={perm.id} className="flex items-center gap-2.5 py-0.5 pr-4" style={{ paddingLeft: 76 }}>
                                                                                      <div className="w-px h-3 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0"/>
                                                                                      <div className="w-2.5 h-2.5 rounded border bg-blue-600 border-blue-600 flex items-center justify-center shrink-0">
                                                                                          <Check className="w-1.5 h-1.5 text-white"/>
                                                                                      </div>
                                                                                      <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">{perm.label}</span>
                                                                                  </div>
                                                                              ))}
                                                                          </div>
                                                                      );
                                                                  })}
                                                                  {!sg.categories && sg.permissions && sg.permissions.filter(p => current.includes(p.id)).map(perm => (
                                                                      <div key={perm.id} className="flex items-center gap-2.5 py-1 pr-4" style={{ paddingLeft: 64 }}>
                                                                          <div className="w-px h-3.5 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0"/>
                                                                          <div className="w-3 h-3 rounded border bg-blue-600 border-blue-600 flex items-center justify-center shrink-0">
                                                                              <Check className="w-2 h-2 text-white"/>
                                                                          </div>
                                                                          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{perm.label}</span>
                                                                      </div>
                                                                  ))}
                                                              </div>
                                                          );
                                                      })}
                                                  </div>
                                              );
                                          })}
                                          </div>
                                      )}
                                  </div>
                                  )}

                                  {/* ===== 数据行权限 Tab ===== */}
                                  {roleDetailTab === 'ROW' && (
                                  <div className="animate-fade-in">
                                      <div className="mb-3 flex items-center gap-2">
                                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">基础范围：</span>
                                          {(roleForm.rowPermissions && roleForm.rowPermissions.length > 0) ? (
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30">
                                                  自定义维度规则
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30">
                                                  全部数据
                                              </span>
                                          )}
                                          <span className="text-xs text-gray-400">
                                              {(roleForm.rowPermissions && roleForm.rowPermissions.length > 0) ? '按维度规则过滤可见数据' : '可见所有数据'}
                                          </span>
                                      </div>
                                      {(roleForm.rowPermissions && roleForm.rowPermissions.length > 0) ? (
                                          <div className="space-y-3">
                                              {resourceConfig.map(res => {
                                                  const rules = roleForm.rowPermissions?.filter(r => r.resource === res.id) || [];
                                                  if (rules.length === 0) return null;
                                                  const formula = buildFormulaDisplay(res.id);
                                                  return (
                                                      <div key={res.id} className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                                                          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/60 dark:bg-amber-900/10">
                                                              <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"/>
                                                              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{res.label}</span>
                                                              <span className="text-xs text-amber-500 dark:text-amber-400 ml-auto">{rules.length} 条规则</span>
                                                          </div>
                                                          {rules.length >= 2 && formula && (
                                                              <div className="px-4 py-2 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 border-b border-gray-100 dark:border-white/10">
                                                                  <div className="flex items-center gap-2 flex-wrap">
                                                                      <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider shrink-0">公式</span>
                                                                      <div className="text-[11px] font-mono font-semibold flex flex-wrap items-center gap-x-1 gap-y-0.5">
                                                                          {formula.split(/(\(|\)|AND|OR)/).filter(Boolean).map((token, ti) => {
                                                                              const trimmed = token.trim();
                                                                              if (!trimmed) return null;
                                                                              if (trimmed === '(' || trimmed === ')') {
                                                                                  return <span key={ti} className="text-sm font-extrabold text-indigo-500 dark:text-indigo-400 mx-0.5 leading-none">{trimmed}</span>;
                                                                              }
                                                                              if (trimmed === 'AND') {
                                                                                  return <span key={ti} className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-extrabold tracking-wider">{trimmed}</span>;
                                                                              }
                                                                              if (trimmed === 'OR') {
                                                                                  return <span key={ti} className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold tracking-wider">{trimmed}</span>;
                                                                              }
                                                                              return <span key={ti} className="text-indigo-700 dark:text-indigo-300">{trimmed}</span>;
                                                                          })}
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          )}
                                                          <div className="bg-white dark:bg-[#1C1C1E]">
                                                              {rules.map((rule, ruleIdx) => {
                                                                  const dimCfg = res.dimensions.find(d => d.id === rule.dimension);
                                                                  const op = ruleIdx > 0 ? getDimOperator(res.id, rule.id) : null;
                                                                  const detailGrpIdx = getRuleGroupIndex(res.id, rule.id);
                                                                  const detailGrpColor = detailGrpIdx >= 0 ? GROUP_COLORS[detailGrpIdx % GROUP_COLORS.length] : null;
                                                                  return (
                                                                      <React.Fragment key={rule.id}>
                                                                          {op && (
                                                                              <div className="flex items-center gap-2 px-4 py-0.5">
                                                                                  <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10"/>
                                                                                  <span className={`text-[10px] font-extrabold tracking-wider ${op === 'OR' ? 'text-amber-500 dark:text-amber-400' : 'text-blue-500 dark:text-blue-400'}`}>{op}</span>
                                                                                  <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10"/>
                                                                              </div>
                                                                          )}
                                                                          <div className={`flex items-center gap-3 px-4 py-2.5 ${detailGrpColor ? `border-l-[3px] ${detailGrpColor.border} ${detailGrpColor.bg}` : ''}`}>
                                                                              {detailGrpColor && <span className={`text-[9px] font-extrabold ${detailGrpColor.text}`}>{detailGrpColor.label}</span>}
                                                                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 min-w-[64px]">{dimCfg?.label || rule.dimension}</span>
                                                                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">等于</span>
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
                                                                      </React.Fragment>
                                                                  );
                                                              })}
                                                          </div>
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      ) : (
                                          <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                              <Database className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                              未配置数据行权限，默认可见所有数据行
                                          </div>
                                      )}
                                  </div>
                                  )}

                                  {/* ===== 数据列权限 Tab ===== */}
                                  {roleDetailTab === 'COLUMN' && (
                                  <div className="animate-fade-in">
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
                                          <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                                              <Columns className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                                              未配置数据列权限，默认可见所有基础列
                                          </div>
                                      )}
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

          {/* Space-specific role management */}
          {activeSpaceId !== MAIN_SPACE_ID && (
            <SpaceRoleManager spaceId={activeSpaceId} />
          )}
        </>
      )}

      {/* User Modal */}
      {isModalOpen && (

          <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-lg flex flex-col animate-modal-enter border-white/10">
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">新增用户</h3>
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
                              <select
                                  multiple
                                  value={userForm.roles || []}
                                  onChange={e => {
                                      const selected = Array.from(e.target.selectedOptions, o => o.value);
                                      setUserForm({ ...userForm, roles: selected });
                                  }}
                                  className="w-full min-h-[7.5rem] p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white"
                              >
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
                      <button onClick={handleSaveUser} className="px-5 py-2.5 bg-[#0071E3] text-white rounded-full text-sm font-medium hover:bg-[#0062CC] transition shadow-sm">保存</button>
                  </div>
              </div>
          </div>
          </ModalPortal>

      )}

      {/* User Details Drawer */}
      {isDrawerOpen && detailsUser && (
        <UserDetailPanel
          user={detailsUser}
          isClosing={isDrawerClosing}
          onClose={closeDrawer}
          roles={roles}
          departments={departments}
          users={users}
          onEmployeeCard={() => setIsEmployeeCardOpen(true)}
          onSave={(updated) => {
            setUsers(prev => prev.map(u => u.id === detailsUser.id ? { ...u, ...updated } as User : u));
            setDetailsUser(prev => prev ? { ...prev, ...updated } as User : prev);
          }}
        />
      )}

      {/* Employee Card Modal */}
      {isEmployeeCardOpen && detailsUser && (
        <EmployeeCardModal user={detailsUser} roles={roles} departments={departments} users={users} onClose={() => setIsEmployeeCardOpen(false)} />
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
                      {users.filter(u => selectedRoleId && !u.roles?.includes(selectedRoleId) && (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))).map(user => (
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
                      {users.filter(u => selectedRoleId && !u.roles?.includes(selectedRoleId) && (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))).length === 0 && (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                              没有找到可添加的用户
                          </div>
                      )}
                  </div>
              </div>
          </div>
          </ModalPortal>

      )}

      {/* 创建应用弹窗 */}
      {showCreateSpace && (() => {
        const resetCreateSpace = () => { setShowCreateSpace(false); setNewSpaceName(''); setNewSpaceDesc(''); setNewSpaceAdminId(''); setNewSpaceAdminSearch(''); setShowAdminDropdown(false); };
        const selectedAdmin = users.find(u => u.id === newSpaceAdminId);
        const adminCandidates = users
          .filter(u => u.status === 'Active')
          .filter(u => !newSpaceAdminSearch || u.name.toLowerCase().includes(newSpaceAdminSearch.toLowerCase()) || u.email.toLowerCase().includes(newSpaceAdminSearch.toLowerCase()));
        return (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-md flex flex-col animate-modal-enter border-white/10">
              <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Box className="w-5 h-5" /> 添加应用</h3>
                <button onClick={resetCreateSpace} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">应用名称 <span className="text-red-500">*</span></label>
                  <input
                    value={newSpaceName}
                    onChange={e => setNewSpaceName(e.target.value)}
                    placeholder="例如：SAB 客户洞察"
                    className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white placeholder-gray-300"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">描述</label>
                  <textarea
                    value={newSpaceDesc}
                    onChange={e => setNewSpaceDesc(e.target.value)}
                    placeholder="应用用途说明（选填）"
                    rows={2}
                    className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white placeholder-gray-300 resize-none"
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">应用管理员 <span className="text-red-500">*</span></label>
                  {selectedAdmin ? (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {selectedAdmin.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedAdmin.name}</div>
                        <div className="text-xs text-gray-400 truncate">{selectedAdmin.email}</div>
                      </div>
                      <button onClick={() => { setNewSpaceAdminId(''); setNewSpaceAdminSearch(''); }} className="p-1 text-gray-400 hover:text-red-500 transition shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={newSpaceAdminSearch}
                          onChange={e => { setNewSpaceAdminSearch(e.target.value); setShowAdminDropdown(true); }}
                          onFocus={() => setShowAdminDropdown(true)}
                          placeholder="搜索并选择管理员..."
                          className="w-full pl-9 pr-3 p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      {showAdminDropdown && (
                        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-10 max-h-48 overflow-auto">
                          {adminCandidates.length === 0 ? (
                            <div className="p-3 text-xs text-gray-400 text-center">无匹配用户</div>
                          ) : adminCandidates.slice(0, 20).map(u => (
                            <button
                              key={u.id}
                              onClick={() => { setNewSpaceAdminId(u.id); setNewSpaceAdminSearch(''); setShowAdminDropdown(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left"
                            >
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {u.name.slice(0, 1)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-900 dark:text-white truncate">{u.name}</div>
                                <div className="text-xs text-gray-400 truncate">{u.email}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 pt-0 flex justify-end gap-3">
                <button
                  onClick={resetCreateSpace}
                  className="px-5 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                >取消</button>
                <button
                  onClick={async () => {
                    if (!newSpaceName.trim()) { alert('请输入应用名称'); return; }
                    if (!newSpaceAdminId) { alert('请选择应用管理员'); return; }
                    if (spaces.some(s => s.name === newSpaceName.trim())) {
                      alert('已存在同名应用');
                      return;
                    }
                    setCreatingSpace(true);
                    try {
                      let createdId: string;
                      if (apiMode) {
                        const created = await spaceApi.create({
                          name: newSpaceName.trim(),
                          description: newSpaceDesc.trim(),
                          adminUserId: newSpaceAdminId,
                          permTree: [], resourceConfig: [], columnConfig: [],
                        });
                        await refreshSpaces();
                        createdId = (created as any).id;
                      } else {
                        const genId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
                        const newSpace: Space = {
                          id: genId('space_mock'),
                          name: newSpaceName.trim(),
                          description: newSpaceDesc.trim(),
                          icon: 'Box',
                          permTree: [],
                          resourceConfig: [],
                          columnConfig: [],
                          sortOrder: spaces.length,
                        };
                        const adminRole: SpaceRole = {
                          id: genId('sr'),
                          spaceId: newSpace.id,
                          name: '应用管理员',
                          description: '拥有该应用内所有权限，可管理角色、成员与配置',
                          permissions: [],
                          rowPermissions: [],
                          columnPermissions: [],
                          sortOrder: 0,
                        };
                        try { localStorage.setItem(`spaceMock:roles:${newSpace.id}`, JSON.stringify([adminRole])); } catch {}
                        const adminUser = users.find(u => u.id === newSpaceAdminId);
                        if (adminUser) {
                          const adminMember: SpaceMember = {
                            id: genId('sm'),
                            spaceId: newSpace.id,
                            userId: adminUser.id,
                            roleId: adminRole.id,
                            isAdmin: true,
                            userName: adminUser.name,
                            userEmail: adminUser.email,
                            roleName: adminRole.name,
                          };
                          try { localStorage.setItem(`spaceMock:members:${newSpace.id}`, JSON.stringify([adminMember])); } catch {}
                        }
                        setSpaces(prev => {
                          const next = [...prev, newSpace];
                          try { localStorage.setItem('spaceMock:list', JSON.stringify(next)); } catch {}
                          return next;
                        });
                        createdId = newSpace.id;
                      }
                      resetCreateSpace();
                      setActiveSpaceId(createdId);
                    } catch (e: any) {
                      alert(e?.message || '创建失败');
                    } finally {
                      setCreatingSpace(false);
                    }
                  }}
                  disabled={creatingSpace || !newSpaceName.trim() || !newSpaceAdminId}
                  className="px-5 py-2.5 bg-[#0071E3] text-white rounded-full text-sm font-medium hover:bg-[#0062CC] transition shadow-sm disabled:opacity-40"
                >{creatingSpace ? '创建中...' : '创建应用'}</button>
              </div>
            </div>
          </div>
        </ModalPortal>
        );
      })()}

    </div>
  );
};

export default UserManager;
