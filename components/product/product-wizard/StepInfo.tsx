import React from 'react';
import { Cpu, Sparkles, Loader2 } from 'lucide-react';
import type { Product, AuthTypeData, AtomicCapability } from '../../../types';
import { MAINTENANCE_FIELD_META, type MaintenanceField, type AuthTypeConfig } from './constants';
import { cardClass, inputClass, selectClass, labelClass } from './styles';
import AuthTypeEditor from './AuthTypeEditor';
import CompositionEditor from './CompositionEditor';

export interface StepInfoProps {
  form: Partial<Product>;
  skuName: string;
  fullProductName: string;
  isMaintenanceProduct: boolean;
  updateForm: (patch: Partial<Product>) => void;
  setSkuName: (name: string) => void;
  setMaintenanceModal: (state: { open: boolean; field: MaintenanceField | null; html: string }) => void;
  generatingAI: boolean;
  onAIGenerate: () => void;
  selectedAuthTypes: AuthTypeData[];
  getAuthCfg: (id: string, name?: string) => AuthTypeConfig;
  updateAuthTypeConfig: (atId: string, patch: Partial<AuthTypeConfig>) => void;
  onOpenAuthPicker: () => void;
  onRemoveAuthType: (atId: string) => void;
  selectedComponents: AtomicCapability[];
  onOpenComponentPicker: () => void;
  onRemoveComponent: (compId: string) => void;
}

const StepInfo: React.FC<StepInfoProps> = ({
  form,
  skuName,
  fullProductName,
  isMaintenanceProduct,
  updateForm,
  setSkuName,
  setMaintenanceModal,
  generatingAI,
  onAIGenerate,
  selectedAuthTypes,
  getAuthCfg,
  updateAuthTypeConfig,
  onOpenAuthPicker,
  onRemoveAuthType,
  selectedComponents,
  onOpenComponentPicker,
  onRemoveComponent,
}) => (
  <div className="space-y-5">
      {/* 基本信息 */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">基本信息</h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>产品类别 <span className="text-red-500">*</span></label>
              <select
                value={form.productKind || ''}
                onChange={e => updateForm({ productKind: (e.target.value || undefined) as '通用产品/非维保服务产品' | '维保服务产品' | undefined })}
                className={selectClass}
              >
                <option value="">请选择</option>
                <option value="通用产品/非维保服务产品">通用产品/非维保服务产品</option>
                <option value="维保服务产品">维保服务产品</option>
              </select>
            </div>
          </div>
          {isMaintenanceProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 rounded-lg bg-blue-50/40 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
              {(['maintenanceContent', 'maintenanceStandard'] as MaintenanceField[]).map(field => {
                const meta = MAINTENANCE_FIELD_META[field];
                const html = (form[field] as string | undefined) || '';
                const empty = !html || html.replace(/<[^>]+>/g, '').trim() === '';
                return (
                  <div key={field}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {meta.label} <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setMaintenanceModal({ open: true, field, html })}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        {empty ? '+ 编辑' : '编辑'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMaintenanceModal({ open: true, field, html })}
                      className={`w-full border border-gray-200 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-black hover:border-blue-300 dark:hover:border-blue-500/40 transition min-h-[88px] flex items-start justify-start text-left ${empty ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      {empty ? (
                        <span className="text-xs">{meta.placeholder}</span>
                      ) : (
                        <div
                          className="rte-content text-xs line-clamp-4 break-words text-left w-full"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>产品名称 <span className="text-red-500">*</span></label>
              <input value={form.name || ''} onChange={e => updateForm({ name: e.target.value })} className={inputClass} placeholder="例如：WPS 365" />
            </div>
            <div>
              <label className={labelClass}>规格名称 <span className="text-red-500">*</span></label>
              <input value={skuName} onChange={e => setSkuName(e.target.value)} className={inputClass} placeholder="例如：商业版" />
            </div>
            <div>
              <label className={labelClass}>产品详细名称 <span className="text-gray-400 font-normal">（自动生成）</span></label>
              <input
                value={fullProductName}
                readOnly
                className={inputClass + ' bg-gray-50 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                placeholder="产品名称 + 规格名称"
                title="由产品名称和规格名称自动拼接"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>产品规格描述</label>
            <div className="flex items-center gap-2">
              <input value={form.description || ''} onChange={e => updateForm({ description: e.target.value })} className={inputClass} placeholder="输入产品规格描述" />
              <button onClick={onAIGenerate} disabled={generatingAI || !form.name} className="shrink-0 p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 transition" title="AI 自动填充">
                {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>是否含升级保障期限</label>
              <select value={form.hasUpgradeWarranty ? '是' : '否'} onChange={e => updateForm({ hasUpgradeWarranty: e.target.value === '是' })} className={selectClass}>
                <option value="否">否</option>
                <option value="是">是</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>是否包含售后服务期限</label>
              <select
                value={form.hasAfterSalesService ? '是' : '否'}
                onChange={e => {
                  const has = e.target.value === '是';
                  updateForm({
                    hasAfterSalesService: has,
                    afterSalesServiceDefault: has ? (form.afterSalesServiceDefault || '1年') : '',
                  });
                }}
                className={selectClass}
              >
                <option value="否">否</option>
                <option value="是">是</option>
              </select>
            </div>
            {form.hasAfterSalesService && (
              <div>
                <label className={labelClass}>售后服务期限默认（非周期性订单）</label>
                <select
                  value={form.afterSalesServiceDefault || '1年'}
                  onChange={e => updateForm({ afterSalesServiceDefault: e.target.value })}
                  className={selectClass}
                >
                  {['1年', '3年'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      
    <AuthTypeEditor
      selectedAuthTypes={selectedAuthTypes}
      getAuthCfg={getAuthCfg}
      updateAuthTypeConfig={updateAuthTypeConfig}
      onOpenPicker={onOpenAuthPicker}
      onRemove={onRemoveAuthType}
    />
    <CompositionEditor
      selectedComponents={selectedComponents}
      onOpenPicker={onOpenComponentPicker}
      onRemove={onRemoveComponent}
    />
  </div>
);

export default StepInfo;
