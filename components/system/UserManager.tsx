import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserType, RoleDefinition, PermissionDimension, PermissionResource, ColumnPermissionRule, Department, Space, SpaceRole, SpaceMember, AppScopedRolePermissions } from '../../types';
import { Settings } from 'lucide-react';
import UserDetailPanel from '../common/UserDetailPanel';
import EmployeeCardModal from '../common/EmployeeCardModal';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { permissionTree, resourceConfig } from './permissionConfig';
import { useRoleDrag } from './userManager/useRoleDrag';
import { useUserDrag } from './userManager/useUserDrag';
import { usePermissionTreeExpansion } from './userManager/usePermissionTreeExpansion';
import { useRowPermissionRules } from './userManager/useRowPermissionRules';
import { useFunctionalPermissions } from './userManager/useFunctionalPermissions';
import { useUserDrawer } from './userManager/useUserDrawer';
import { useRowPermissionHelpers } from './userManager/useRowPermissionHelpers';
import SpaceRoleManager from './SpaceRoleManager';
import { spaceApi, userApi } from '../../services/api';
import { defaultAppScopedPermissions } from '../../utils/mergeRolePermissions';
import { MAIN_SPACE_ID } from './user/constants';
import { getDimensionOptions as dimOptions, getReadableValue as dimReadable } from './user/dimensionOptions';
import UserManagerHeader from './user/UserManagerHeader';
import UserTable from './user/UserTable';
import RoleListSidebar from './user/RoleListSidebar';
import UserPermissionOverview from './user/UserPermissionOverview';
import RoleEditPanel from './user/RoleEditPanel';
import RoleDetailReadOnlyView from './user/RoleDetailReadOnlyView';
import UserEditModal from './user/UserEditModal';
import AddUserToRoleModal from './user/AddUserToRoleModal';
import CreateSpaceModal from './user/CreateSpaceModal';

interface UserManagerProps {
  defaultTab?: 'USERS' | 'ROLES';
}

const UserManager: React.FC<UserManagerProps> = ({ defaultTab = 'USERS' }) => {
  const { users, setUsers, departments, roles, setRoles, channels, apiMode, spaces, setSpaces, refreshSpaces } = useAppContext();
  const { currentUser } = useAuth();
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
      if (userForm.userType === 'External' && !userForm.channelId) return;
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
            } catch (e: unknown) {
              alert(e instanceof Error ? e.message : '保存平台角色到服务器失败');
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
            } catch (e: unknown) {
              alert(e instanceof Error ? e.message : '创建平台角色失败');
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

  const getDepartmentPathForDim = (deptId: string): string => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return deptId;
    if (dept.parentId) return getDepartmentPathForDim(dept.parentId) + ' / ' + dept.name;
    return dept.name;
  };

  const getDimensionOptions = (dim: PermissionDimension) =>
    dimOptions(dim, departments, channels, getDepartmentPathForDim);

  const getReadableValue = (dim: PermissionDimension, val: string) =>
    dimReadable(dim, val, departments, channels, getDepartmentPathForDim);


  return (
    <div className="page-container gap-2.5 animate-page-enter relative h-full flex flex-col min-w-0">
      <UserManagerHeader
        activeTab={activeTab}
        activeSpaceId={activeSpaceId}
        setActiveSpaceId={setActiveSpaceId}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenCreateUser={() => handleOpenModal()}
        spaces={spaces}
        setSpaces={setSpaces}
        refreshSpaces={refreshSpaces}
        apiMode={apiMode}
        onShowCreateSpace={() => setShowCreateSpace(true)}
        userPermSearch={userPermSearch}
        setUserPermSearch={setUserPermSearch}
        showUserPermDropdown={showUserPermDropdown}
        setShowUserPermDropdown={setShowUserPermDropdown}
        selectedPermUser={selectedPermUser}
        userPermSearchRef={userPermSearchRef}
        userPermSearchResults={userPermSearchResults}
        onSelectPermUser={handleSelectPermUser}
        onClearPermUser={handleClearPermUser}
        getRoleName={getRoleName}
      />
      {activeTab === 'USERS' && (
        <UserTable
          searchTerm={searchTerm}
          currentUsers={currentUsers}
          filteredUsersCount={filteredUsers.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          channels={channels}
          dragUserId={dragUserId}
          dragOverUserId={dragOverUserId}
          onDragStart={handleUserDragStart}
          onDragOver={handleUserDragOver}
          onDrop={handleUserDrop}
          onDragEnd={handleUserDragEnd}
          onAvatarClick={handleAvatarClick}
          getDepartmentName={getDepartmentName}
        />
      )}
      {activeTab === 'ROLES' && (
        <>
          {activeSpaceId === MAIN_SPACE_ID && (
            <div className="flex gap-6 flex-1 min-h-0 animate-fade-in">
              <RoleListSidebar
                roles={roles}
                selectedRoleId={selectedRoleId}
                roleSearchTerm={roleSearchTerm}
                setRoleSearchTerm={setRoleSearchTerm}
                isRoleSearchOpen={isRoleSearchOpen}
                setIsRoleSearchOpen={setIsRoleSearchOpen}
                roleSearchInputRef={roleSearchInputRef}
                dragRoleId={dragRoleId}
                dragOverRoleId={dragOverRoleId}
                onDragStart={handleRoleDragStart}
                onDragOver={handleRoleDragOver}
                onDrop={handleRoleDrop}
                onDragEnd={handleRoleDragEnd}
                onSelectRole={handleSelectRole}
                onCreateRole={handleCreateRole}
                onCopyRole={handleCopyRole}
                onDeleteRole={handleDeleteRole}
              />
              <div className="unified-card flex-1 dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col">
                {selectedPermUser ? (
                  <UserPermissionOverview
                    selectedPermUser={selectedPermUser}
                    selectedPermUserRole={selectedPermUserRole}
                    departments={departments}
                    userPermTab={userPermTab}
                    setUserPermTab={setUserPermTab}
                    onClear={handleClearPermUser}
                    allPermsInGroup={allPermsInGroup}
                    getReadableValue={getReadableValue}
                  />
                ) : selectedRoleId ? (
                  isEditingRole ? (
                    <RoleEditPanel
                      selectedRoleId={selectedRoleId}
                      roleForm={roleForm}
                      setRoleForm={setRoleForm}
                      platformPermScope={platformPermScope}
                      setPlatformPermScope={setPlatformPermScope}
                      spaces={spaces}
                      roleConfigTab={roleConfigTab}
                      setRoleConfigTab={setRoleConfigTab}
                      onSaveRole={handleSaveRole}
                      onCancelEdit={() => setIsEditingRole(false)}
                      platformEmbedRole={platformEmbedRole}
                      apiMode={apiMode}
                      users={users}
                      functionalProps={{
                        expandedGroups, setExpandedGroups, expandedSubgroups, setExpandedSubgroups,
                        expandedCategories, setExpandedCategories, toggleGroupExpand, toggleSubgroupExpand,
                        toggleCategoryExpand, allPermsInGroup, allPermsInSubgroup, allPermsInCategory,
                        getCheckState, togglePermission, toggleModule, toggleSubgroupPerms, toggleCategoryPerms,
                      }}
                      rowProps={{
                        selectedResource, setSelectedResource, openDimDropdown, setOpenDimDropdown,
                        openDimPicker, setOpenDimPicker, dropdownPos, setDropdownPos, computeDropdownPos,
                        groupSelectMode, setGroupSelectMode, groupSelectRules, setGroupSelectRules,
                        hasResourceFunctionalPerm, getResourcePermHint, getDimOperator, getDimensionOptions,
                        getReadableValue, buildDeptTree, getRuleGroupIndex, getRuleGroup,
                        toggleRuleValue, setRuleSingleValue, clearRuleValue, changeRuleDimension,
                        removeSingleRule, removeDimGroup, addCondition, createRuleGroup, toggleDimOperator,
                      }}
                      columnProps={{
                        selectedColumnResource, setSelectedColumnResource,
                        hasResourceFunctionalPerm, getResourcePermHint, toggleColumn,
                      }}
                    />
                  ) : (
                    <RoleDetailReadOnlyView
                      roleForm={roleForm}
                      selectedRoleId={selectedRoleId}
                      roles={roles}
                      users={users}
                      roleDetailTab={roleDetailTab}
                      setRoleDetailTab={setRoleDetailTab}
                      onDeleteRole={handleDeleteRole}
                      onCopyRole={handleCopyRole}
                      onEditRole={() => setIsEditingRole(true)}
                      onAddMember={() => setIsAddUserModalOpen(true)}
                      onRemoveMember={handleRemoveUserFromRole}
                      allPermsInGroup={allPermsInGroup}
                      allPermsInSubgroup={allPermsInSubgroup}
                      allPermsInCategory={allPermsInCategory}
                      getCheckState={getCheckState}
                      getReadableValue={getReadableValue}
                      getDimOperator={getDimOperator}
                      getRuleGroupIndex={getRuleGroupIndex}
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <Settings className="w-12 h-12 mb-2 opacity-20" />
                    <p>请选择一个角色进行配置</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeSpaceId !== MAIN_SPACE_ID && <SpaceRoleManager spaceId={activeSpaceId} />}
        </>
      )}
      {isModalOpen && (
        <UserEditModal
          userForm={userForm}
          setUserForm={setUserForm}
          roles={roles}
          departments={departments}
          channels={channels}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
        />
      )}
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
      {isEmployeeCardOpen && detailsUser && (
        <EmployeeCardModal user={detailsUser} roles={roles} departments={departments} users={users} onClose={() => setIsEmployeeCardOpen(false)} />
      )}
      {isAddUserModalOpen && (
        <AddUserToRoleModal
          users={users}
          selectedRoleId={selectedRoleId}
          userSearchTerm={userSearchTerm}
          setUserSearchTerm={setUserSearchTerm}
          onClose={() => setIsAddUserModalOpen(false)}
          onAddUser={handleAddUserToRole}
        />
      )}
      {showCreateSpace && (
        <CreateSpaceModal
          newSpaceName={newSpaceName}
          setNewSpaceName={setNewSpaceName}
          newSpaceDesc={newSpaceDesc}
          setNewSpaceDesc={setNewSpaceDesc}
          newSpaceAdminId={newSpaceAdminId}
          setNewSpaceAdminId={setNewSpaceAdminId}
          newSpaceAdminSearch={newSpaceAdminSearch}
          setNewSpaceAdminSearch={setNewSpaceAdminSearch}
          showAdminDropdown={showAdminDropdown}
          setShowAdminDropdown={setShowAdminDropdown}
          creatingSpace={creatingSpace}
          setCreatingSpace={setCreatingSpace}
          users={users}
          spaces={spaces}
          setSpaces={setSpaces}
          refreshSpaces={refreshSpaces}
          apiMode={apiMode}
          onClose={() => { setShowCreateSpace(false); setNewSpaceName(''); setNewSpaceDesc(''); setNewSpaceAdminId(''); setNewSpaceAdminSearch(''); setShowAdminDropdown(false); }}
          onCreated={(id) => setActiveSpaceId(id)}
        />
      )}
    </div>
  );
};

export default UserManager;
