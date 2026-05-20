import React from 'react';
import { Globe, Package, Gift, Info, Search, Trash2 } from 'lucide-react';
import type { Product, PublicCloudBenefitType, PrivateCloudBenefitType } from '../../../types';
import { PUBLIC_CLOUD_BENEFIT_TYPES, PRIVATE_CLOUD_BENEFIT_TYPES } from './constants';
import { cardClass, selectClass, labelClass } from './styles';

export interface StepBenefitsProps {
  form: Partial<Product>;
  benefitTab: 'public' | 'private';
  setBenefitTab: (tab: 'public' | 'private') => void;
  publicBenefitType: PublicCloudBenefitType | '';
  setPublicBenefitType: (t: PublicCloudBenefitType | '') => void;
  privateBenefitType: PrivateCloudBenefitType | '';
  setPrivateBenefitType: (t: PrivateCloudBenefitType | '') => void;
  openBenefitPicker: (cloud: 'public' | 'private', type: PublicCloudBenefitType | PrivateCloudBenefitType) => void;
  removePublicBenefit: (type: PublicCloudBenefitType) => void;
  removePrivateBenefit: (type: PrivateCloudBenefitType, code: string) => void;
}

const StepBenefits: React.FC<StepBenefitsProps> = ({
  form,
  benefitTab,
  setBenefitTab,
  publicBenefitType,
  setPublicBenefitType,
  privateBenefitType,
  setPrivateBenefitType,
  openBenefitPicker,
  removePublicBenefit,
  removePrivateBenefit,
}) => {
  const publicBenefitOfType = (t: PublicCloudBenefitType) =>
    (form.publicCloudBenefits || []).find(b => b.type === t);
  const privateBenefitsOfType = (t: PrivateCloudBenefitType) =>
    (form.privateCloudBenefits || []).filter(b => b.type === t);
  const publicCount = (form.publicCloudBenefits || []).length;
  const privateCount = (form.privateCloudBenefits || []).length;
  const isPublic = benefitTab === 'public';

  return (
      <div className={cardClass}>
        {/* Tab 切换 */}
        <div className="border-b border-gray-200 dark:border-white/10">
          <div className="flex gap-0 px-6 pt-3">
            <button
              type="button"
              onClick={() => setBenefitTab('public')}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                isPublic
                  ? 'text-[#0071E3] dark:text-[#0A84FF] border-[#0071E3] dark:border-[#0A84FF]'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Globe className={`w-4 h-4 ${isPublic ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400'}`} />
              公有云权益关联
              {publicCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isPublic ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                  {publicCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setBenefitTab('private')}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                !isPublic
                  ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Package className={`w-4 h-4 ${!isPublic ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
              私有云权益关联
              {privateCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${!isPublic ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                  {privateCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 内容：公有云 */}
        {isPublic && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                先选择「权益类型」，再通过外系统的产品查询接口选择产品。每种权益类型可关联一个产品。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-3xl">
              <div>
                <label className={labelClass}>权益类型</label>
                <select
                  value={publicBenefitType}
                  onChange={e => setPublicBenefitType(e.target.value as PublicCloudBenefitType | '')}
                  className={selectClass}
                >
                  <option value="">请选择权益类型</option>
                  {PUBLIC_CLOUD_BENEFIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={!publicBenefitType}
                  onClick={() => publicBenefitType && openBenefitPicker('public', publicBenefitType)}
                  className="px-4 h-[42px] text-xs font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  {publicBenefitType ? `从外系统选择「${publicBenefitType}」产品` : '请先选择权益类型'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {PUBLIC_CLOUD_BENEFIT_TYPES.map(t => {
                const b = publicBenefitOfType(t);
                if (!b) return null;
                return (
                  <div key={t} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">{t}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.productName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{b.productCode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openBenefitPicker('public', t)}
                        className="px-2.5 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                      >
                        更换
                      </button>
                      <button
                        type="button"
                        onClick={() => removePublicBenefit(t)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition"
                        title="移除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {publicCount === 0 && (
                <div className="py-10 text-center text-xs text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                  <Gift className="w-7 h-7 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  暂无公有云权益关联，请选择权益类型后从外系统添加
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 内容：私有云 */}
        {!isPublic && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50/60 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
              <Info className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-700 dark:text-purple-300">
                先选择「权益类型」，再通过外系统的产品查询接口选择产品。每种权益类型支持多选。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-3xl">
              <div>
                <label className={labelClass}>权益类型</label>
                <select
                  value={privateBenefitType}
                  onChange={e => setPrivateBenefitType(e.target.value as PrivateCloudBenefitType | '')}
                  className={selectClass}
                >
                  <option value="">请选择权益类型</option>
                  {PRIVATE_CLOUD_BENEFIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={!privateBenefitType}
                  onClick={() => privateBenefitType && openBenefitPicker('private', privateBenefitType)}
                  className="px-4 h-[42px] text-xs font-medium text-white bg-purple-600 dark:bg-purple-500 rounded-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  {privateBenefitType ? `从外系统选择「${privateBenefitType}」产品` : '请先选择权益类型'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {PRIVATE_CLOUD_BENEFIT_TYPES.map(t => {
                const items = privateBenefitsOfType(t);
                if (items.length === 0) return null;
                return (
                  <div key={t} className="border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50/60 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">{t}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">已关联 {items.length} 个产品</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openBenefitPicker('private', t)}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-0.5 rounded transition"
                      >
                        + 继续添加
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                      {items.map(b => (
                        <div key={b.productCode} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.productName}</div>
                            <div className="text-[11px] text-gray-400 font-mono">{b.productCode}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePrivateBenefit(t, b.productCode)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition shrink-0"
                            title="移除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {privateCount === 0 && (
                <div className="py-10 text-center text-xs text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                  <Package className="w-7 h-7 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  暂无私有云权益关联，请选择权益类型后从外系统添加
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  );
};

export default StepBenefits;
