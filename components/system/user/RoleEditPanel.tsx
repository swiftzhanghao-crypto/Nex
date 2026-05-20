import React from 'react';
import { Save, CheckSquare, Database, Columns } from 'lucide-react';
import type { RoleDefinition, Space, SpaceRole } from '../../../types';
import SpaceRoleDetail from '../space/SpaceRoleDetail';
import type { User } from '../../../types';
import RoleFunctionalPermissionTree from './RoleFunctionalPermissionTree';
import RoleRowPermissionEditor from './RoleRowPermissionEditor';
import RoleColumnPermissionEditor from './RoleColumnPermissionEditor';
import type { RoleFunctionalPermissionTreeProps } from './RoleFunctionalPermissionTree';
import type { RoleRowPermissionEditorProps } from './RoleRowPermissionEditor';
import type { RoleColumnPermissionEditorProps } from './RoleColumnPermissionEditor';

export interface RoleEditPanelProps {
  selectedRoleId: string | null;
  roleForm: Partial<RoleDefinition>;
  setRoleForm: React.Dispatch<React.SetStateAction<Partial<RoleDefinition>>>;
  platformPermScope: string;
  setPlatformPermScope: (id: string) => void;
  spaces: Space[];
  roleConfigTab: 'FUNCTIONAL' | 'ROW' | 'COLUMN';
  setRoleConfigTab: (tab: 'FUNCTIONAL' | 'ROW' | 'COLUMN') => void;
  onSaveRole: () => void;
  onCancelEdit: () => void;
  platformEmbedRole: SpaceRole | null;
  apiMode: boolean;
  users: User[];
  functionalProps: Omit<RoleFunctionalPermissionTreeProps, 'roleForm' | 'setRoleForm'>;
  rowProps: Omit<RoleRowPermissionEditorProps, 'roleForm' | 'setRoleForm'>;
  columnProps: Omit<RoleColumnPermissionEditorProps, 'roleForm' | 'setRoleForm'>;
}

const RoleEditPanel: React.FC<RoleEditPanelProps> = ({
  selectedRoleId,
  roleForm,
  setRoleForm,
  platformPermScope,
  setPlatformPermScope,
  spaces,
  roleConfigTab,
  setRoleConfigTab,
  onSaveRole,
  onCancelEdit,
  platformEmbedRole,
  apiMode,
  users,
  functionalProps,
  rowProps,
  columnProps,
}) => (
  <div className="flex flex-col flex-1 min-h-0">
    <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
      <div>
        <input
          value={roleForm.name}
          onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
          className="text-xl font-bold text-gray-900 dark:text-white bg-transparent outline-none placeholder-gray-300"
          placeholder="角色名称"
        />
        <input
          value={roleForm.description}
          onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
          className="text-sm text-gray-500 dark:text-gray-400 bg-transparent outline-none w-full mt-1 placeholder-gray-300"
          placeholder="角色描述..."
        />
      </div>
      <div className="flex gap-2">
        {selectedRoleId !== 'new' && (
          <button
            onClick={onCancelEdit}
            className="px-4 py-1.5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition"
          >
            取消
          </button>
        )}
        <button
          onClick={onSaveRole}
          className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm hover:opacity-80 transition flex items-center gap-1"
        >
          <Save className="w-4 h-4" /> 保存配置
        </button>
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
          <div className="sticky top-0 z-20 bg-white dark:bg-[#1C1C1E] px-6 pt-4 pb-0 border-b border-gray-100 dark:border-white/10">
            <div className="flex gap-6">
              {([
                { id: 'FUNCTIONAL' as const, icon: <CheckSquare className="w-4 h-4" />, label: '功能权限' },
                { id: 'ROW' as const, icon: <Database className="w-4 h-4" />, label: '数据行权限' },
                { id: 'COLUMN' as const, icon: <Columns className="w-4 h-4" />, label: '数据列权限' },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRoleConfigTab(tab.id)}
                  className={`pb-3 text-sm font-bold transition-colors relative ${roleConfigTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  <div className="flex items-center gap-2">
                    {tab.icon} {tab.label}
                  </div>
                  {roleConfigTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 space-y-6">
            {roleConfigTab === 'FUNCTIONAL' && (
              <RoleFunctionalPermissionTree roleForm={roleForm} setRoleForm={setRoleForm} {...functionalProps} />
            )}
            {roleConfigTab === 'ROW' && (
              <RoleRowPermissionEditor roleForm={roleForm} setRoleForm={setRoleForm} {...rowProps} />
            )}
            {roleConfigTab === 'COLUMN' && (
              <RoleColumnPermissionEditor roleForm={roleForm} setRoleForm={setRoleForm} {...columnProps} />
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
        <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-gray-400">未找到该应用，请从上方重新选择</div>
      )}
    </div>
  </div>
);

export default RoleEditPanel;
