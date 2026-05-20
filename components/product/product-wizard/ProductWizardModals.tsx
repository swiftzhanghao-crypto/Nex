import React from 'react';
import { Key, Search, X, Check, Plus, Cpu, Globe, Gift, Package, Loader2, Info } from 'lucide-react';

import {
  Product, InstallPackage, SalesScopeRow, AtomicCapability,
  BenefitProduct, PublicCloudBenefitType, PrivateCloudBenefitType,
} from '../../../types';
import ModalPortal from '../../common/ModalPortal';
import RichTextEditor from '../../common/RichTextEditor';
import { MAINTENANCE_FIELD_META, MAINTENANCE_VARIABLES, type MaintenanceField } from './constants';
import { inputClass, selectClass, labelClass } from './styles';

// Props bundle for all wizard modals
export interface ProductWizardModalsProps {
  // auth picker
  isAuthPickerOpen: boolean;
  setIsAuthPickerOpen: (v: boolean) => void;
  authPickerSearch: string;
  setAuthPickerSearch: (v: string) => void;
  authTypeCandidates: import('../../../types').AuthTypeData[];
  unaddedAuthTypeCandidates: import('../../../types').AuthTypeData[];
  selectedAuthTypeIds: string[];
  selectedAuthTypes: import('../../../types').AuthTypeData[];
  handleAddAuthType: (id: string) => void;
  handleRemoveAuthType: (id: string) => void;
  handleAddAllAuthTypes: () => void;
  // component picker
  isComponentPickerOpen: boolean;
  setIsComponentPickerOpen: (v: boolean) => void;
  componentPickerSearch: string;
  setComponentPickerSearch: (v: string) => void;
  componentCandidates: AtomicCapability[];
  unaddedComponentCandidates: AtomicCapability[];
  selectedComponentIds: string[];
  selectedComponents: AtomicCapability[];
  handleAddComponent: (c: AtomicCapability) => void;
  handleRemoveComponent: (id: string) => void;
  handleAddAllComponents: () => void;
  // maintenance modal
  maintenanceModal: { open: boolean; field: MaintenanceField | null; html: string };
  setMaintenanceModal: (s: { open: boolean; field: MaintenanceField | null; html: string }) => void;
  updateForm: (patch: Partial<Product>) => void;
  // sales org picker
  showAddSalesOrg: boolean;
  closeSalesOrgPicker: () => void;
  salesOrgPickerSearch: string;
  setSalesOrgPickerSearch: (v: string) => void;
  salesOrgCandidates: string[];
  unaddedSalesOrgCandidates: string[];
  addedSalesOrgs: Set<string>;
  salesOrgPickerSelected: Set<string>;
  toggleSalesOrgPicker: (org: string) => void;
  setSalesOrgPickerSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleAddSalesScopes: () => void;
  // install pkg
  isAddPkgOpen: boolean;
  setIsAddPkgOpen: (v: boolean) => void;
  pkgTab: 'public' | 'private';
  pkgForm: Partial<InstallPackage>;
  setPkgForm: React.Dispatch<React.SetStateAction<Partial<InstallPackage>>>;
  deployPkgLoading: boolean;
  deployPkgError: string | null;
  setDeployPkgError: (e: string | null) => void;
  handleQueryDeployPackage: (id: string) => Promise<void>;
  isPkgFormValid: boolean;
  handleAddInstallPkg: () => void;
  form: Partial<Product>;
  skuName: string;
  // benefit picker
  benefitPicker: { open: boolean; cloud: 'public' | 'private' | null; type: PublicCloudBenefitType | PrivateCloudBenefitType | null };
  closeBenefitPicker: () => void;
  benefitPickerSearch: string;
  setBenefitPickerSearch: (v: string) => void;
  benefitProductList: BenefitProduct[];
  benefitProductLoading: boolean;
  benefitPickerSelected: Set<string>;
  togglePrivateBenefitInPicker: (code: string) => void;
  setPublicBenefitProduct: (type: PublicCloudBenefitType, p: BenefitProduct) => void;
  commitPrivateBenefits: (type: PrivateCloudBenefitType, items: BenefitProduct[]) => void;
  // material picker
  materialPicker: { open: boolean; rowIdx: number | null; kind: '授权' | '介质' | null };
  setMaterialPicker: (s: { open: boolean; rowIdx: number | null; kind: '授权' | '介质' | null }) => void;
  materialSearch: string;
  setMaterialSearch: (v: string) => void;
  materialList: import('../../../types').MaterialListItem[];
  materialLoading: boolean;
  updateSalesScopeRow: (idx: number, patch: Partial<SalesScopeRow>) => void;
}

const ProductWizardModals: React.FC<ProductWizardModalsProps> = (props) => {
  const {
    isAuthPickerOpen,
    setIsAuthPickerOpen,
    authPickerSearch,
    setAuthPickerSearch,
    authTypeCandidates,
    unaddedAuthTypeCandidates,
    selectedAuthTypeIds,
    selectedAuthTypes,
    handleAddAuthType,
    handleRemoveAuthType,
    handleAddAllAuthTypes,
    isComponentPickerOpen,
    setIsComponentPickerOpen,
    componentPickerSearch,
    setComponentPickerSearch,
    componentCandidates,
    unaddedComponentCandidates,
    selectedComponentIds,
    selectedComponents,
    handleAddComponent,
    handleRemoveComponent,
    handleAddAllComponents,
    maintenanceModal,
    setMaintenanceModal,
    updateForm,
    showAddSalesOrg,
    closeSalesOrgPicker,
    salesOrgPickerSearch,
    setSalesOrgPickerSearch,
    salesOrgCandidates,
    unaddedSalesOrgCandidates,
    addedSalesOrgs,
    salesOrgPickerSelected,
    toggleSalesOrgPicker,
    setSalesOrgPickerSelected,
    handleAddSalesScopes,
    isAddPkgOpen,
    setIsAddPkgOpen,
    pkgTab,
    pkgForm,
    setPkgForm,
    deployPkgLoading,
    deployPkgError,
    setDeployPkgError,
    handleQueryDeployPackage,
    isPkgFormValid,
    handleAddInstallPkg,
    form,
    skuName,
    benefitPicker,
    closeBenefitPicker,
    benefitPickerSearch,
    setBenefitPickerSearch,
    benefitProductList,
    benefitProductLoading,
    benefitPickerSelected,
    togglePrivateBenefitInPicker,
    setPublicBenefitProduct,
    commitPrivateBenefits,
    materialPicker,
    setMaterialPicker,
    materialSearch,
    setMaterialSearch,
    materialList,
    materialLoading,
    updateSalesScopeRow,
  } = props;
  return (
  <>
      {/* 授权类型选择器 */}
      {isAuthPickerOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border-white/10">
              <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-500" /> 选择授权类型
                </h3>
                <button onClick={() => setIsAuthPickerOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="px-5 pt-4 pb-3 shrink-0 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={authPickerSearch}
                    onChange={e => setAuthPickerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                    placeholder="搜索授权类型名称..."
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    匹配 <span className="font-semibold text-gray-700 dark:text-gray-200">{authTypeCandidates.length}</span> 项
                    {authPickerSearch && unaddedAuthTypeCandidates.length !== authTypeCandidates.length && (
                      <span className="ml-1.5 text-gray-400">（{authTypeCandidates.length - unaddedAuthTypeCandidates.length} 项已添加）</span>
                    )}
                  </span>
                  <button
                    onClick={handleAddAllAuthTypes}
                    disabled={unaddedAuthTypeCandidates.length === 0}
                    className="px-3 py-1 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" /> {authPickerSearch ? `全部添加 (${unaddedAuthTypeCandidates.length})` : `添加全部 (${unaddedAuthTypeCandidates.length})`}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {authTypeCandidates.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {authTypeCandidates.map(at => {
                      const isAdded = selectedAuthTypeIds.includes(at.id);
                      return (
                      <div key={at.id} className={`py-2.5 flex items-center justify-between gap-3 -mx-2 px-2 rounded-lg transition ${isAdded ? 'bg-green-50/40 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{at.name}</div>
                            {isAdded && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <Check className="w-2.5 h-2.5" /> 已添加
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${at.period === '周期性' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>{at.period}</span>
                            {at.nccBiz && <span className="text-[10px] text-gray-400">NCC业务: {at.nccBiz}</span>}
                          </div>
                        </div>
                        {isAdded ? (
                          <button onClick={() => handleRemoveAuthType(at.id)} className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition flex items-center gap-1">
                            <X className="w-3 h-3" /> 移除
                          </button>
                        ) : (
                          <button onClick={() => handleAddAuthType(at.id)} className="shrink-0 px-3 py-1.5 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1">
                            <Plus className="w-3 h-3" /> 添加
                          </button>
                        )}
                      </div>
                    );})}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">无匹配结果</div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                <span className="text-xs text-gray-500 dark:text-gray-400">已添加 <span className="font-bold text-[#0071E3] dark:text-[#0A84FF]">{selectedAuthTypes.length}</span> 项</span>
                <button onClick={() => setIsAuthPickerOpen(false)} className="px-4 py-1.5 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition">完成</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 组件选择器 */}
      {isComponentPickerOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-3xl flex flex-col max-h-[80vh] border-white/10">
              <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" /> 选择组件
                </h3>
                <button onClick={() => setIsComponentPickerOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="px-5 pt-4 pb-3 shrink-0 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={componentPickerSearch}
                    onChange={e => setComponentPickerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                    placeholder="搜索组件名称或编号..."
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    匹配 <span className="font-semibold text-gray-700 dark:text-gray-200">{componentCandidates.length}</span> 项
                    {componentCandidates.length !== unaddedComponentCandidates.length && (
                      <span className="ml-1.5 text-gray-400">（{componentCandidates.length - unaddedComponentCandidates.length} 项已添加）</span>
                    )}
                  </span>
                  <button
                    onClick={handleAddAllComponents}
                    disabled={unaddedComponentCandidates.length === 0}
                    className="px-3 py-1 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" /> {componentPickerSearch ? `全部添加 (${unaddedComponentCandidates.length})` : `添加全部 (${unaddedComponentCandidates.length})`}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {componentCandidates.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {componentCandidates.map(c => {
                      const isAdded = selectedComponentIds.includes(c.id);
                      return (
                      <div key={c.id} className={`py-2.5 flex items-center justify-between gap-3 -mx-2 px-2 rounded-lg transition ${isAdded ? 'bg-green-50/40 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</div>
                            {c.nature && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                c.nature === '自有' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : c.nature === '第三方采购' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                              }`}>{c.nature}</span>
                            )}
                            {isAdded && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shrink-0">
                                <Check className="w-2.5 h-2.5" /> 已添加
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-gray-400">{c.id}</span>
                            {c.version && <span className="text-[10px] text-gray-400">v{c.version}</span>}
                            {c.description && <span className="text-[10px] text-gray-400 truncate">— {c.description}</span>}
                          </div>
                        </div>
                        {isAdded ? (
                          <button onClick={() => handleRemoveComponent(c.id)} className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition flex items-center gap-1">
                            <X className="w-3 h-3" /> 移除
                          </button>
                        ) : (
                          <button onClick={() => handleAddComponent(c)} className="shrink-0 px-3 py-1.5 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1">
                            <Plus className="w-3 h-3" /> 添加
                          </button>
                        )}
                      </div>
                    );})}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">无匹配结果</div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                <span className="text-xs text-gray-500 dark:text-gray-400">已添加 <span className="font-bold text-[#0071E3] dark:text-[#0A84FF]">{selectedComponents.length}</span> 项</span>
                <button onClick={() => setIsComponentPickerOpen(false)} className="px-4 py-1.5 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition">完成</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 运维包富文本编辑弹窗 */}
      {maintenanceModal.open && maintenanceModal.field && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in p-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {MAINTENANCE_FIELD_META[maintenanceModal.field].label}使用说明
                </h3>
                <button
                  onClick={() => setMaintenanceModal({ open: false, field: null, html: '' })}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 overflow-y-auto custom-scrollbar flex-1">
                <RichTextEditor
                  key={maintenanceModal.field}
                  fieldName={MAINTENANCE_FIELD_META[maintenanceModal.field].label}
                  value={maintenanceModal.html}
                  onChange={(html) => setMaintenanceModal({ ...maintenanceModal, html })}
                  variables={MAINTENANCE_VARIABLES}
                  placeholder="请输入模板内容"
                  maxLength={10000}
                  minHeight={260}
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-center gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                  onClick={() => setMaintenanceModal({ open: false, field: null, html: '' })}
                  className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (maintenanceModal.field) {
                      updateForm({ [maintenanceModal.field]: maintenanceModal.html } as Partial<Product>);
                    }
                    setMaintenanceModal({ open: false, field: null, html: '' });
                  }}
                  className="px-6 py-2 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 销售组织多选器 */}
      {showAddSalesOrg && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border-white/10">
              <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" /> 选择销售组织
                  <span className="text-xs font-normal text-gray-400">（可多选）</span>
                </h3>
                <button onClick={closeSalesOrgPicker} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="px-5 pt-4 pb-3 shrink-0 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={salesOrgPickerSearch}
                    onChange={e => setSalesOrgPickerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                    placeholder="搜索销售组织..."
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    匹配 <span className="font-semibold text-gray-700 dark:text-gray-200">{salesOrgCandidates.length}</span> 项
                    {salesOrgCandidates.length !== unaddedSalesOrgCandidates.length && (
                      <span className="ml-1.5 text-gray-400">（{salesOrgCandidates.length - unaddedSalesOrgCandidates.length} 项已添加）</span>
                    )}
                  </span>
                  <button
                    onClick={() => {
                      const next = new Set(salesOrgPickerSelected);
                      const allSelected = unaddedSalesOrgCandidates.every(o => next.has(o));
                      if (allSelected) {
                        unaddedSalesOrgCandidates.forEach(o => next.delete(o));
                      } else {
                        unaddedSalesOrgCandidates.forEach(o => next.add(o));
                      }
                      setSalesOrgPickerSelected(next);
                    }}
                    disabled={unaddedSalesOrgCandidates.length === 0}
                    className="px-3 py-1 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {unaddedSalesOrgCandidates.length > 0 && unaddedSalesOrgCandidates.every(o => salesOrgPickerSelected.has(o))
                      ? `取消全选 (${unaddedSalesOrgCandidates.length})`
                      : `全选 (${unaddedSalesOrgCandidates.length})`}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {salesOrgCandidates.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {salesOrgCandidates.map(org => {
                      const isAdded = addedSalesOrgs.has(org);
                      const isChecked = salesOrgPickerSelected.has(org);
                      return (
                        <label
                          key={org}
                          className={`py-2.5 px-2 -mx-2 flex items-center gap-3 rounded-lg transition ${
                            isAdded
                              ? 'bg-green-50/40 dark:bg-green-900/10 cursor-not-allowed'
                              : 'hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isAdded}
                            checked={isAdded || isChecked}
                            onChange={() => !isAdded && toggleSalesOrgPicker(org)}
                            className="w-4 h-4 accent-[#0071E3] dark:accent-[#0A84FF] disabled:opacity-60"
                          />
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{org}</span>
                            {isAdded && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <Check className="w-2.5 h-2.5" /> 已添加
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">无匹配结果</div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  已选 <span className="font-bold text-[#0071E3] dark:text-[#0A84FF]">{salesOrgPickerSelected.size}</span> 项
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={closeSalesOrgPicker}
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddSalesScopes}
                    disabled={salesOrgPickerSelected.size === 0}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    添加 ({salesOrgPickerSelected.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 新增安装包弹窗 */}
      {isAddPkgOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in p-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  新增{pkgTab === 'public' ? '端' : '私有云'}安装包
                </h3>
                <button onClick={() => setIsAddPkgOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
                {/* 安装包维护来源 */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">安装包维护来源</h4>
                  <div className="flex gap-2">
                    {pkgTab === 'public' ? (
                      (['SMS手工维护', '对接交付物平台'] as const).map(s => {
                        const active = (pkgForm.source || 'SMS手工维护') === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setPkgForm(prev => ({ ...prev, source: s }))}
                            className={`px-4 py-2 text-xs font-medium rounded-lg border transition ${
                              active
                                ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] bg-blue-50/60 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-transparent'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })
                    ) : (
                      // 私有云：仅"对接运维聚合平台"，单标签呈现
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 text-xs font-medium rounded-lg border border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] bg-blue-50/60 dark:bg-blue-900/20 cursor-default"
                      >
                        对接运维聚合平台
                      </button>
                    )}
                  </div>
                </div>

                {/* 表单字段：根据 pkgTab 切换 */}
                {pkgTab === 'public' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className={labelClass}>交付物编号</label>
                      <input
                        value={pkgForm.deliveryItemId || ''}
                        onChange={e => setPkgForm({ ...pkgForm, deliveryItemId: e.target.value })}
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5'}
                        placeholder={pkgForm.source === '对接交付物平台' ? '由交付物平台带出' : '可选'}
                        readOnly={pkgForm.source === '对接交付物平台'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>交付物名称 <span className="text-red-500">*</span></label>
                      <input
                        value={pkgForm.deliveryItemName || ''}
                        onChange={e => setPkgForm({ ...pkgForm, deliveryItemName: e.target.value })}
                        className={inputClass}
                        placeholder="请输入"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>发布平台 <span className="text-red-500">*</span></label>
                      <select
                        value={pkgForm.platform || ''}
                        onChange={e => setPkgForm({ ...pkgForm, platform: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">请选择</option>
                        {['Windows', 'Linux', 'macOS', 'Android', 'iOS', '通用'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>安装包链接 <span className="text-red-500">*</span></label>
                      <input
                        value={pkgForm.url || ''}
                        onChange={e => setPkgForm({ ...pkgForm, url: e.target.value })}
                        className={inputClass}
                        placeholder="请输入"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>CPU <span className="text-red-500">*</span></label>
                      <select
                        value={pkgForm.cpu || ''}
                        onChange={e => setPkgForm({ ...pkgForm, cpu: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">请选择</option>
                        {['x86_64', 'ARM64', 'MIPS64', 'LoongArch', '通用'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>操作系统 <span className="text-red-500">*</span></label>
                      <select
                        value={pkgForm.os || ''}
                        onChange={e => setPkgForm({ ...pkgForm, os: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">请选择</option>
                        {['Windows', 'CentOS', 'Ubuntu', 'UOS', 'Kylin', 'macOS', 'Android', 'iOS'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  // 私有云：先填部署包 ID，回车/失焦从运维聚合平台带出其他字段
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className={labelClass}>部署包ID <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          value={pkgForm.deployPackageId || ''}
                          onChange={e => {
                            setDeployPkgError(null);
                            setPkgForm(prev => ({ ...prev, deployPackageId: e.target.value }));
                          }}
                          onBlur={e => handleQueryDeployPackage(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleQueryDeployPackage((e.target as HTMLInputElement).value); }}
                          className={inputClass + ' pr-9'}
                          placeholder="请输入部署包ID（回车查询）"
                          autoFocus
                        />
                        {deployPkgLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                        )}
                      </div>
                      {deployPkgError && (
                        <div className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <Info className="w-3 h-3" /> {deployPkgError}
                        </div>
                      )}
                      {!deployPkgError && (
                        <div className="mt-1 text-[10px] text-gray-400">
                          示例 ID：DEP-100001 / DEP-100005 / DEP-100006
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>部署包名称</label>
                      <input
                        value={pkgForm.deployPackageName || ''}
                        readOnly
                        placeholder="由部署包ID自动带出"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>版本类型</label>
                      <input
                        value={pkgForm.versionType || ''}
                        readOnly
                        placeholder="由部署包ID自动带出"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>包产品类型</label>
                      <input
                        value={pkgForm.packageProductType || ''}
                        readOnly
                        placeholder="由部署包ID自动带出"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>版本号</label>
                      <input
                        value={pkgForm.versionNumber || ''}
                        readOnly
                        placeholder="由部署包ID自动带出"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>包类型</label>
                      <input
                        value={pkgForm.packageKind || ''}
                        readOnly
                        placeholder="由部署包ID自动带出"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                      />
                    </div>
                  </div>
                )}

                {/* 产品信息（自动带出，只读） */}
                <div className="border-t border-gray-100 dark:border-white/10 pt-5">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">产品信息</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className={labelClass}>产品编号</label>
                      <input
                        value="新建中（保存后生成）"
                        readOnly
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-500 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>产品条线</label>
                      <input
                        value={form.productLine || ''}
                        readOnly
                        placeholder="—"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-500 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>产品类型</label>
                      <input
                        value={form.productType || ''}
                        readOnly
                        placeholder="—"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-500 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>产品规格</label>
                      <input
                        value={skuName || ''}
                        readOnly
                        placeholder="—"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-500 dark:text-gray-400'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-end items-center gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                  onClick={() => setIsAddPkgOpen(false)}
                  className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition"
                >
                  取消
                </button>
                <button
                  onClick={handleAddInstallPkg}
                  disabled={!isPkgFormValid}
                  className="px-6 py-2 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 权益产品选择器（公有云单选 / 私有云多选） */}
      {benefitPicker.open && benefitPicker.cloud && benefitPicker.type && (() => {
        const isMulti = benefitPicker.cloud === 'private';
        const accentClass = isMulti ? 'bg-purple-600 dark:bg-purple-500' : 'bg-[#0071E3] dark:bg-[#0A84FF]';
        const existingCodes = isMulti
          ? new Set((form.privateCloudBenefits || []).filter(b => b.type === benefitPicker.type).map(b => b.productCode))
          : new Set<string>();
        const currentSinglePick = !isMulti
          ? (form.publicCloudBenefits || []).find(b => b.type === benefitPicker.type)?.productCode
          : undefined;
        const newSelectedCount = isMulti ? Array.from(benefitPickerSelected).filter(c => !existingCodes.has(c)).length : 0;
        return (
          <ModalPortal>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in p-4">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border-white/10">
                <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Gift className={`w-4 h-4 ${isMulti ? 'text-purple-500' : 'text-blue-500'}`} />
                    选择产品 - {benefitPicker.type}
                    <span className="text-xs font-normal text-gray-400">
                      （{isMulti ? '私有云权益 · 多选' : '公有云权益 · 单选'}）
                    </span>
                  </h3>
                  <button onClick={closeBenefitPicker} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="px-5 pt-4 pb-3 shrink-0 space-y-2.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      autoFocus
                      value={benefitPickerSearch}
                      onChange={e => setBenefitPickerSearch(e.target.value)}
                      className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                      placeholder="按产品编号或名称搜索..."
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    共 <span className="font-semibold text-gray-700 dark:text-gray-200">{benefitProductList.length}</span> 条匹配产品
                    {isMulti && existingCodes.size > 0 && (
                      <span className="ml-1.5 text-gray-400">（其中 {benefitProductList.filter(p => existingCodes.has(p.code)).length} 项已添加）</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5">
                  {benefitProductLoading ? (
                    <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> 调用外系统接口查询...
                    </div>
                  ) : benefitProductList.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                      {benefitProductList.map(p => {
                        const isAlreadyAdded = isMulti && existingCodes.has(p.code);
                        const isChecked = benefitPickerSelected.has(p.code);
                        const isCurrentSingle = !isMulti && currentSinglePick === p.code;

                        if (isMulti) {
                          return (
                            <label
                              key={p.code}
                              className={`py-3 px-3 -mx-2 flex items-center gap-3 rounded-lg transition ${
                                isAlreadyAdded
                                  ? 'bg-green-50/40 dark:bg-green-900/10 cursor-not-allowed'
                                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={isAlreadyAdded}
                                checked={isAlreadyAdded || isChecked}
                                onChange={() => !isAlreadyAdded && togglePrivateBenefitInPicker(p.code)}
                                className="w-4 h-4 accent-purple-600 dark:accent-purple-500 disabled:opacity-60"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                                  {isAlreadyAdded && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                      <Check className="w-2.5 h-2.5" /> 已添加
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[11px] font-mono text-gray-400">{p.code}</span>
                                  {p.description && <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">— {p.description}</span>}
                                </div>
                              </div>
                            </label>
                          );
                        }

                        // 单选
                        return (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => {
                              setPublicBenefitProduct(benefitPicker.type as PublicCloudBenefitType, p);
                              closeBenefitPicker();
                            }}
                            className={`w-full text-left py-3 px-3 -mx-2 flex items-center gap-3 rounded-lg transition ${
                              isCurrentSingle ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                                {isCurrentSingle && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                    <Check className="w-2.5 h-2.5" /> 当前选中
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[11px] font-mono text-gray-400">{p.code}</span>
                                {p.description && <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">— {p.description}</span>}
                              </div>
                            </div>
                            <Check className={`w-4 h-4 shrink-0 ${isCurrentSingle ? 'text-blue-500' : 'text-transparent'}`} />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">无匹配产品</div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isMulti ? <>本次新增 <span className="font-bold text-purple-600 dark:text-purple-400">{newSelectedCount}</span> 项</> : '点击产品即完成关联'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeBenefitPicker}
                      className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition"
                    >
                      {isMulti ? '取消' : '关闭'}
                    </button>
                    {isMulti && (
                      <button
                        onClick={() => {
                          commitPrivateBenefits(benefitPicker.type as PrivateCloudBenefitType, benefitProductList);
                          closeBenefitPicker();
                        }}
                        disabled={newSelectedCount === 0}
                        className={`px-4 py-1.5 text-sm font-medium text-white ${accentClass} rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        添加 ({newSelectedCount})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ModalPortal>
        );
      })()}

      {/* 物料选择器（授权 / 介质） */}
      {materialPicker.open && materialPicker.kind && materialPicker.rowIdx != null && (() => {
        const row = form.salesScope?.[materialPicker.rowIdx];
        // 锁定供货组织：来自当前行已选的"另一类"物料
        const lockedSupplyOrg = materialPicker.kind === '授权'
          ? (row?.mediaMaterialCode ? row?.supplyOrg : '')
          : (row?.authMaterialCode ? row?.supplyOrg : '');
        const filteredList = lockedSupplyOrg
          ? materialList.filter(m => m.supplyOrg === lockedSupplyOrg)
          : materialList;
        const otherKindLabel = materialPicker.kind === '授权' ? '介质' : '授权';

        return (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in p-4">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border-white/10">
              <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  选择{materialPicker.kind}物料
                  <span className="text-xs font-normal text-gray-400">
                    （销售组织：{row?.salesOrg}）
                  </span>
                </h3>
                <button
                  onClick={() => setMaterialPicker({ open: false, rowIdx: null, kind: null })}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="px-5 pt-4 pb-3 shrink-0 space-y-2.5">
                {/* 供货组织一致性约束提示 */}
                {lockedSupplyOrg && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50/70 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/30">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-200 flex-1">
                      已锁定供货组织为
                      <span className="mx-1 font-semibold">{lockedSupplyOrg}</span>
                      （与已选{otherKindLabel}物料保持一致）。如需切换，请先
                      <button
                        type="button"
                        onClick={() => {
                          const idx = materialPicker.rowIdx!;
                          const patch: Partial<SalesScopeRow> = materialPicker.kind === '授权'
                            ? { mediaMaterialCode: '', mediaMaterialName: '', supplyOrg: '' }
                            : { authMaterialCode: '', authMaterialName: '', supplyOrg: '' };
                          updateSalesScopeRow(idx, patch);
                        }}
                        className="mx-0.5 font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
                      >
                        清空已选{otherKindLabel}物料
                      </button>
                      解除限制。
                    </div>
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={materialSearch}
                    onChange={e => setMaterialSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                    placeholder="按物料编号或名称搜索..."
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  共 <span className="font-semibold text-gray-700 dark:text-gray-200">{filteredList.length}</span> 条匹配物料
                  {lockedSupplyOrg && materialList.length > filteredList.length && (
                    <span className="ml-1.5 text-gray-400">（已过滤 {materialList.length - filteredList.length} 条非「{lockedSupplyOrg}」物料）</span>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {materialLoading ? (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> 加载物料清单...
                  </div>
                ) : filteredList.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredList.map(m => {
                      const currentCode = materialPicker.kind === '授权' ? row?.authMaterialCode : row?.mediaMaterialCode;
                      const isSelected = currentCode === m.code;
                      return (
                        <button
                          key={m.code}
                          type="button"
                          onClick={() => {
                            const idx = materialPicker.rowIdx!;
                            const patch: Partial<SalesScopeRow> = materialPicker.kind === '授权'
                              ? { authMaterialCode: m.code, authMaterialName: m.name, supplyOrg: m.supplyOrg }
                              : { mediaMaterialCode: m.code, mediaMaterialName: m.name, supplyOrg: m.supplyOrg };
                            updateSalesScopeRow(idx, patch);
                            setMaterialPicker({ open: false, rowIdx: null, kind: null });
                          }}
                          className={`w-full text-left py-3 px-3 -mx-2 flex items-center gap-3 rounded-lg transition ${
                            isSelected ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name}</span>
                              {isSelected && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                  <Check className="w-2.5 h-2.5" /> 当前选中
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[11px] font-mono text-gray-400">{m.code}</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${m.kind === '授权' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>{m.kind}</span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">供货组织：{m.supplyOrg}</span>
                            </div>
                          </div>
                          <Check className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-500' : 'text-transparent'}`} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                    {lockedSupplyOrg
                      ? <>当前供货组织「{lockedSupplyOrg}」下无匹配的{materialPicker.kind}物料</>
                      : '无匹配物料'}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-end items-center bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                  onClick={() => setMaterialPicker({ open: false, rowIdx: null, kind: null })}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
        );
      })()}
  </>
  );
};

export default ProductWizardModals;
