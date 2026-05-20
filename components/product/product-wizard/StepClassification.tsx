import React from 'react';
import { FileText, Tag, Check, Plus, X } from 'lucide-react';
import type { Product } from '../../../types';
import { BUSINESS_TAG_OPTIONS } from './constants';
import { cardClass, selectClass, labelClass } from './styles';

export interface StepClassificationProps {
  form: Partial<Product>;
  updateForm: (patch: Partial<Product>) => void;
  classificationOptions: Record<string, string[]>;
}

const StepClassification: React.FC<StepClassificationProps> = ({ form, updateForm, classificationOptions }) => (
    <div className="space-y-5">
      {/* 营管分类 */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">营管分类</h3>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
            {([
              ['productCategory', '产品一级分类', 'productCategories'],
              ['subCategory', '产品二级分类', 'subCategories'],
              ['productLine', '产品条线', 'productLines'],
              ['category', '产品类型', 'categories'],
              ['productSeries', '产品系列', 'productSeries'],
              ['productClass', '产品类', 'productClasses'],
              ['productClassification', '产品分类', 'productClassifications'],
              ['productType', '规格分类', 'productTypes'],
            ] as [keyof Product, string, string][]).map(([field, label, optKey]) => (
              <div key={field as string}>
                <label className={labelClass}>{label}</label>
                <select
                  value={(form[field] as string) || ''}
                  onChange={e => updateForm({ [field]: e.target.value })}
                  className={selectClass}
                >
                  <option value="">请选择</option>
                  {(classificationOptions[optKey] || []).map((v: string) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 财务分类 */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">财务分类</h3>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {([
              ['productLineFinance', '产品条线-财务口径', 'productLinesFinance'],
              ['productClassFinance', '产品类-财务口径', 'productClassesFinance'],
              ['productSeriesFinance', '产品系列-财务口径', 'productSeriesFinance'],
            ] as [keyof Product, string, string][]).map(([field, label, optKey]) => (
              <div key={field as string}>
                <label className={labelClass}>{label}</label>
                <select
                  value={(form[field] as string) || ''}
                  onChange={e => updateForm({ [field]: e.target.value })}
                  className={selectClass}
                >
                  <option value="">请选择</option>
                  {(classificationOptions[optKey] || []).map((v: string) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 业务标签 */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">关联业务标签</h3>
          <span className="text-xs text-gray-400">（多选）</span>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            已选 <span className="font-bold text-[#0071E3] dark:text-[#0A84FF]">{form.tags?.length || 0}</span> / {BUSINESS_TAG_OPTIONS.length}
          </span>
        </div>

        {/* 已选标签区 */}
        <div className="px-6 pt-5">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Check className="w-3 h-3 text-green-500" /> 已选标签
          </div>
          {(form.tags?.length || 0) > 0 ? (
            <div className="flex flex-wrap gap-2">
              {form.tags!.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0071E3] dark:bg-[#0A84FF] text-white shadow-sm"
                >
                  {tag}
                  <button
                    onClick={() => updateForm({ tags: form.tags?.filter(t => t !== tag) })}
                    className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition"
                    title="移除"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 dark:text-gray-500 italic py-1">未选择任何标签</div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="mx-6 my-4 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />

        {/* 可选标签区 */}
        <div className="px-6 pb-5">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Plus className="w-3 h-3 text-gray-400" /> 可选标签
          </div>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TAG_OPTIONS.map(tag => {
              const selected = form.tags?.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    const current = form.tags || [];
                    updateForm({ tags: selected ? current.filter(t => t !== tag) : [...current, tag] });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1 ${
                    selected
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700 cursor-default'
                      : 'border-dashed border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-400 bg-transparent hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/10'
                  }`}
                  title={selected ? '已选中（点击下方蓝色徽章可移除）' : `点击添加「${tag}」`}
                >
                  {selected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
);

export default StepClassification;
