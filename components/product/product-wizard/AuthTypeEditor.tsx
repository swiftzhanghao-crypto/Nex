import React from 'react';
import { Plus, Trash2, Key } from 'lucide-react';
import type { AuthTypeData } from '../../../types';
import { resolvePurchaseUnit, resolveAuxPurchaseUnit } from '../../../utils/authTypeDefaults';
import { PURCHASE_UNIT_OPTIONS, AUX_PURCHASE_UNIT_OPTIONS, type AuthTypeConfig } from './constants';
import { cardClass } from './styles';

export interface AuthTypeEditorProps {
  selectedAuthTypes: AuthTypeData[];
  getAuthCfg: (id: string, name?: string) => AuthTypeConfig;
  updateAuthTypeConfig: (atId: string, patch: Partial<AuthTypeConfig>) => void;
  onOpenPicker: () => void;
  onRemove: (atId: string) => void;
}

const AuthTypeEditor: React.FC<AuthTypeEditorProps> = ({
  selectedAuthTypes,
  getAuthCfg,
  updateAuthTypeConfig,
  onOpenPicker,
  onRemove,
}) => (
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">授权类型</h3>
            <span className="text-xs text-gray-400">({selectedAuthTypes.length})</span>
          </div>
          <button onClick={onOpenPicker} className="unified-button-primary text-xs">
            <Plus className="w-3.5 h-3.5" /> 添加授权类型
          </button>
        </div>
        {selectedAuthTypes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1300px]">
              <thead className="unified-table-header">
                <tr>
                  <th className="px-5 py-3 w-10">#</th>
                  <th className="px-5 py-3">授权类型</th>
                  <th className="px-5 py-3 w-[90px]">定价周期</th>
                  <th className="px-4 py-3 w-[120px]">购买单位</th>
                  <th className="px-4 py-3 w-[140px]">辅助购买单位</th>
                  <th className="px-5 py-3">直签授权模板</th>
                  <th className="px-5 py-3">渠道授权模板</th>
                  <th className="px-5 py-3 w-[120px]">在售类型</th>
                  <th className="px-5 py-3 w-[100px] text-center">售卖状态</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {selectedAuthTypes.map((at, idx) => {
                  const cfg = getAuthCfg(at.id, at.name);
                  return (
                  <tr key={at.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${!cfg.enabled ? 'opacity-60 bg-gray-50/40 dark:bg-white/[0.02]' : ''}`}>
                    <td className="px-6 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{at.name}</td>
                    <td className="px-6 py-3 text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${at.period === '周期性' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>{at.period}</span>
                    </td>
                    <td className="px-4 py-2">
                      {(() => {
                        const defaultUnit = resolvePurchaseUnit(at);
                        return (
                          <select
                            value={cfg.purchaseUnit}
                            onChange={e => updateAuthTypeConfig(at.id, { purchaseUnit: e.target.value })}
                            title={defaultUnit ? `授权类型默认：${defaultUnit}` : '授权类型未配置默认值'}
                            className="w-full text-xs px-2 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition appearance-none cursor-pointer"
                          >
                            <option value="">请选择</option>
                            {PURCHASE_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                            {defaultUnit && !PURCHASE_UNIT_OPTIONS.includes(defaultUnit) && (
                              <option value={defaultUnit}>{defaultUnit}</option>
                            )}
                          </select>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-2">
                      {at.period === '周期性' ? (() => {
                        const defaultAux = resolveAuxPurchaseUnit(at);
                        return (
                          <select
                            value={cfg.auxPurchaseUnit}
                            onChange={e => updateAuthTypeConfig(at.id, { auxPurchaseUnit: e.target.value })}
                            title={defaultAux ? `授权类型默认：${defaultAux}` : '授权类型未配置默认值'}
                            className="w-full text-xs px-2 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition appearance-none cursor-pointer"
                          >
                            <option value="">请选择</option>
                            {AUX_PURCHASE_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                            {defaultAux && !AUX_PURCHASE_UNIT_OPTIONS.includes(defaultAux) && (
                              <option value={defaultAux}>{defaultAux}</option>
                            )}
                          </select>
                        );
                      })() : (
                        <span className="text-[11px] text-gray-300 dark:text-gray-600 italic">非周期性不适用</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={cfg.directTpl}
                        onChange={e => updateAuthTypeConfig(at.id, { directTpl: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition"
                        placeholder="直签授权书模板名"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={cfg.channelTpl}
                        onChange={e => updateAuthTypeConfig(at.id, { channelTpl: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition"
                        placeholder="渠道授权书模板名"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={cfg.saleStatus}
                        onChange={e => updateAuthTypeConfig(at.id, { saleStatus: e.target.value as '标准在售' | '非标在售' })}
                        className="w-full text-xs px-2 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition appearance-none cursor-pointer"
                      >
                        <option value="标准在售">标准在售</option>
                        <option value="非标在售">非标在售</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          role="switch"
                          aria-checked={cfg.enabled}
                          onClick={() => updateAuthTypeConfig(at.id, { enabled: !cfg.enabled })}
                          title={cfg.enabled ? '点击禁用售卖' : '点击启用售卖'}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            cfg.enabled ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-white/15'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                              cfg.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[11px] font-medium ${cfg.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {cfg.enabled ? '启用' : '禁用'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => onRemove(at.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <Key className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">暂未添加授权类型</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">点击右上角按钮添加授权类型</div>
          </div>
        )}
      </div>

      
);

export default AuthTypeEditor;
