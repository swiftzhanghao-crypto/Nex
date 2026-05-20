import React from 'react';
import { Globe, Tag, Key, Check, Info, Plus, Trash2, Search } from 'lucide-react';
import type { Product, SalesScopeRow } from '../../../types';
import {
  SALES_CHANNEL_OPTIONS,
  SELLABLE_CUSTOMER_TYPES,
  CHANNEL_LEVEL_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
} from './constants';
import { cardClass } from './styles';

export interface StepSalesScopeProps {
  form: Partial<Product>;
  updateForm: (patch: Partial<Product>) => void;
  updateSalesScopeRow: (idx: number, patch: Partial<SalesScopeRow>) => void;
  openSalesOrgPicker: () => void;
  onOpenMaterialPicker: (rowIdx: number, kind: '授权' | '介质') => void;
}

const StepSalesScope: React.FC<StepSalesScopeProps> = ({
  form,
  updateForm,
  updateSalesScopeRow,
  openSalesOrgPicker,
  onOpenMaterialPicker,
}) => {
  const toggleSalesChannel = (ch: string) => {
    const cur = form.salesChannels || [];
    const next = cur.includes(ch) ? cur.filter(x => x !== ch) : [...cur, ch];
    if (ch === '渠道端' && cur.includes(ch)) {
      updateForm({ salesChannels: next, sellableChannelLevels: [] });
    } else {
      updateForm({ salesChannels: next });
    }
  };
  const toggleCustomerType = (t: string) => {
    const cur = form.sellableCustomerTypes || [];
    updateForm({ sellableCustomerTypes: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] });
  };
  const toggleChannelLevel = (lvl: string) => {
    const cur = form.sellableChannelLevels || [];
    updateForm({ sellableChannelLevels: cur.includes(lvl) ? cur.filter(x => x !== lvl) : [...cur, lvl] });
  };
  const channelEnabled = (form.salesChannels || []).includes('渠道端');

  return (
    <div className="space-y-5">
      {/* ===== 模块 1：销售渠道设置 ===== */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">销售渠道设置</h3>
            {(form.salesChannels || []).length > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold">
                已选 {(form.salesChannels || []).length}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">支持多选</span>
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {SALES_CHANNEL_OPTIONS.map(ch => {
              const active = (form.salesChannels || []).includes(ch);
              return (
                <button
                  key={ch} type="button"
                  onClick={() => toggleSalesChannel(ch)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5 ${
                    active
                      ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-transparent'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {ch}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-400">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>选择产品在哪些渠道可销售。仅勾选"渠道端"时，下方"渠道级别"配置生效。</span>
          </div>
        </div>
      </div>

      {/* ===== 模块 2：可销售客户清单 ===== */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">可销售客户清单</h3>
            {(form.sellableCustomerTypes || []).length > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold">
                已选 {(form.sellableCustomerTypes || []).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateForm({ sellableCustomerTypes: [...SELLABLE_CUSTOMER_TYPES] })}
              className="text-xs text-[#0071E3] dark:text-[#0A84FF] hover:underline"
            >
              全选
            </button>
            <span className="text-gray-300 dark:text-white/10">|</span>
            <button
              type="button"
              onClick={() => updateForm({ sellableCustomerTypes: [] })}
              className="text-xs text-gray-500 hover:underline"
            >
              清空
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-1.5">
            {SELLABLE_CUSTOMER_TYPES.map(t => {
              const active = (form.sellableCustomerTypes || []).includes(t);
              return (
                <button
                  key={t} type="button"
                  onClick={() => toggleCustomerType(t)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition flex items-center gap-1 ${
                    active
                      ? 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-transparent'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {t}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-400">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>限定该产品可售卖给哪些类型的客户；下单时将根据客户类型校验是否可购买。</span>
          </div>
        </div>
      </div>

      {/* ===== 模块 3：渠道级别（仅当勾选"渠道端"时启用） ===== */}
      <div className={cardClass + (channelEnabled ? '' : ' opacity-60')}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">渠道级别</h3>
            {(form.sellableChannelLevels || []).length > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold">
                已选 {(form.sellableChannelLevels || []).length}
              </span>
            )}
            {!channelEnabled && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500">
                需先勾选「渠道端」
              </span>
            )}
          </div>
          {channelEnabled && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateForm({ sellableChannelLevels: [...CHANNEL_LEVEL_OPTIONS] })}
                className="text-xs text-[#0071E3] dark:text-[#0A84FF] hover:underline"
              >
                全选
              </button>
              <span className="text-gray-300 dark:text-white/10">|</span>
              <button
                type="button"
                onClick={() => updateForm({ sellableChannelLevels: [] })}
                className="text-xs text-gray-500 hover:underline"
              >
                清空
              </button>
            </div>
          )}
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {CHANNEL_LEVEL_OPTIONS.map(lvl => {
              const active = (form.sellableChannelLevels || []).includes(lvl);
              return (
                <button
                  key={lvl} type="button"
                  disabled={!channelEnabled}
                  onClick={() => toggleChannelLevel(lvl)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5 ${
                    active
                      ? 'border-amber-400 dark:border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-transparent'
                  } disabled:cursor-not-allowed`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {lvl}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-400">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>渠道端售卖时，仅以下渠道级别的代理商可分销该产品。</span>
          </div>
        </div>
      </div>

      {/* ===== 模块 4：允许售卖的销售组织（原有） ===== */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">允许售卖的销售组织</h3>
          </div>
          <button onClick={openSalesOrgPicker} className="unified-button-primary text-xs">
            <Plus className="w-3.5 h-3.5" /> 添加销售组织
          </button>
        </div>

      {(form.salesScope || []).length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1400px]">
            <thead className="unified-table-header">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 min-w-[180px]">销售组织</th>
                <th className="px-4 py-3 min-w-[160px]">商务发货产品名称</th>
                <th className="px-4 py-3 w-[130px]">物料类型</th>
                <th className="px-4 py-3 min-w-[200px]">授权物料名称</th>
                <th className="px-4 py-3 min-w-[200px]">介质物料名称</th>
                <th className="px-4 py-3 w-[140px]">供货组织</th>
                <th className="px-4 py-3 w-[80px]">状态</th>
                <th className="px-4 py-3 w-[60px] text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {form.salesScope!.map((row, idx) => {
                // 介质物料是否需要：仅 "介质+授权" / "介质+服务" 需要
                const mediaRequired = row.materialType === '介质+授权' || row.materialType === '介质+服务';
                return (
                <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors align-top">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.salesOrg}</td>
                  {/* 商务发货产品名称：默认带出产品名，可编辑 */}
                  <td className="px-3 py-2">
                    <input
                      value={row.businessShipProductName || ''}
                      onChange={e => updateSalesScopeRow(idx, { businessShipProductName: e.target.value })}
                      placeholder={form.name ? `默认：${form.name}` : '请输入'}
                      className="w-full text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition"
                    />
                  </td>
                  {/* 物料类型：切换到不需要介质的类型时自动清空介质物料 */}
                  <td className="px-3 py-2">
                    <select
                      value={row.materialType}
                      onChange={e => {
                        const newType = e.target.value;
                        const stillNeedsMedia = newType === '介质+授权' || newType === '介质+服务';
                        const patch: Partial<SalesScopeRow> = { materialType: newType };
                        if (!stillNeedsMedia) {
                          // 清空介质相关字段；若供货组织来自介质，需重新以授权物料的供货组织兜底
                          patch.mediaMaterialName = '';
                          patch.mediaMaterialCode = '';
                        }
                        updateSalesScopeRow(idx, patch);
                      }}
                      className="w-full text-xs px-2 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition appearance-none cursor-pointer"
                    >
                      <option value="">请选择</option>
                      {MATERIAL_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  {/* 授权物料名称：点击打开物料选择器 */}
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => { onOpenMaterialPicker(idx, '授权'); }}
                      className="w-full text-left text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 hover:border-blue-400 transition flex items-center justify-between gap-1 group/picker"
                    >
                      {row.authMaterialName ? (
                        <span className="truncate">
                          {row.authMaterialName}
                          {row.authMaterialCode && <span className="ml-1 text-gray-400">({row.authMaterialCode})</span>}
                        </span>
                      ) : (
                        <span className="text-gray-400">点击选择授权物料</span>
                      )}
                      <Search className="w-3 h-3 text-gray-400 shrink-0 group-hover/picker:text-blue-500" />
                    </button>
                  </td>
                  {/* 介质物料名称：仅 "介质+授权" / "介质+服务" 需要；其他类型显示不适用 */}
                  <td className="px-3 py-2">
                    {mediaRequired ? (
                      <button
                        type="button"
                        onClick={() => { onOpenMaterialPicker(idx, '介质'); }}
                        className="w-full text-left text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 hover:border-blue-400 transition flex items-center justify-between gap-1 group/picker"
                      >
                        {row.mediaMaterialName ? (
                          <span className="truncate">
                            {row.mediaMaterialName}
                            {row.mediaMaterialCode && <span className="ml-1 text-gray-400">({row.mediaMaterialCode})</span>}
                          </span>
                        ) : (
                          <span className="text-gray-400">点击选择介质物料</span>
                        )}
                        <Search className="w-3 h-3 text-gray-400 shrink-0 group-hover/picker:text-blue-500" />
                      </button>
                    ) : (
                      <div
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] text-gray-300 dark:text-gray-600 italic cursor-not-allowed"
                        title={row.materialType ? `物料类型「${row.materialType}」不需要介质物料` : '请先选择物料类型'}
                      >
                        {row.materialType ? '不适用' : '请先选择物料类型'}
                      </div>
                    )}
                  </td>
                  {/* 供货组织：自动从所选物料带出，只读 */}
                  <td className="px-4 py-3 text-xs">
                    {row.supplyOrg ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium">{row.supplyOrg}</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 italic">选择物料后自动带出</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="unified-tag-gray !rounded-full">{row.status === 'listed' ? '已上架' : '未上架'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => updateForm({ salesScope: form.salesScope!.filter((_, i) => i !== idx) })}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <Globe className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">暂无销售范围</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">点击上方按钮添加销售组织</div>
        </div>
      )}
      </div>
    </div>
  );
};

export default StepSalesScope;
