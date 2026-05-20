import React from 'react';
import { Plus, Trash2, CheckCircle, ShoppingBag, Briefcase, XCircle, RefreshCcw, Tag, Pencil, Building2, Wrench, Percent, Search, X, ChevronDown, ChevronRight, Check, Upload, Download, Globe, Layers, Network, Sparkles, Package, Box, Settings, Truck, Zap, ArrowUpRight, User as UserIcon } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import { purchaseNatureBadgeClass, memoWithIgnoreCallbacks } from './wizardUtils';
import { purchaseNatureDisplay, subscriptionStatusLabel } from '../inferOrderLinePurchaseNatureFromSubscription';
import { inferOrderLinePurchaseNatureFromSubscription } from '../inferOrderLinePurchaseNatureFromSubscription';
import { ALL_INSTALL_PKG_ROWS } from '../../../data/staticData';
import type {
  PurchaseNature, ActivationMethod, OrderItem, SubUnitAuthMode, Product, Contract,
  Customer, ConversionOrder, BuyerType, OrderSource, ProductSku,
  SkuPricingOption, Subscription, Order, SubscriptionLineProductSnapshot,
} from '../../../types';
import type { SubUnitLocal } from './subUnitCsv';

type CategoryTreeNode = { label: string; subs: string[] };
type OppItemWarning = { productName: string; missingFields: string[] };
type ServiceDetailRow = {
  id: string; productType: string; productSpec: string; productName: string;
  serviceMethod: string; servicePeriod: string; quantity: number; unitPrice: number;
  subtotal: number; sourceProductName: string; category: string;
};

export interface Step3ProductSelectProps {
  SUB_UNIT_CSV_HEADERS: readonly string[];
  addItemSubUnit: (itemIdx: number) => void;
  addTempSubUnit: () => void;
  availableConversionOrders: ConversionOrder[];
  buyerType: BuyerType | '';
  calculateNewOrderTotal: () => number;
  canAddItem: boolean;
  categoryPickerRef: React.RefObject<HTMLDivElement | null>;
  categoryTree: CategoryTreeNode[];
  conversionTotalAmount: number;
  customers: Customer[];
  downloadSubUnitTemplate: () => void;
  editingItemIndex: number | null;
  enableConversion: boolean;
  enableSubUnitAuth: boolean;
  expandedSubUnitIdx: number | null;
  handleAddItem: () => void;
  handleEditItem: (idx: number) => void;
  handleRemoveItem: (idx: number) => void;
  handleSubUnitImport: (itemIdx: number, file: File) => void;
  handleTempSubUnitImport: (file: File) => void;
  handleUpdateItem: <K extends keyof OrderItem>(index: number, field: K, value: OrderItem[K]) => void;
  hasServiceConfig: boolean;
  isCategoryPickerOpen: boolean;
  linkedOpportunityId: string;
  negotiatedPrice: number | null;
  newOrderCustomer: string;
  newOrderItems: OrderItem[];
  oppItemWarnings: OppItemWarning[];
  orderSource: OrderSource;
  originalOrderId: string | undefined;
  products: Product[];
  removeItemSubUnit: (itemIdx: number, unitId: string) => void;
  removeTempSubUnit: (unitId: string) => void;
  renewalOrder: Order | undefined;
  selectedCategoryLabel: string;
  selectedConversionIds: string[];
  selectedCustomerObj: Customer | undefined;
  selectedLicensePeriodType: string | undefined;
  selectedLicenseType: string | undefined;
  selectedOption: SkuPricingOption | undefined;
  selectedProduct: Product | undefined;
  selectedSku: ProductSku | undefined;
  sellerContact: string;
  sellerName: string;
  serviceDetailItems: ServiceDetailRow[];
  serviceProcurementMode: 'together' | 'separate';
  setAgentCode: React.Dispatch<React.SetStateAction<string>>;
  setBusinessManagerId: React.Dispatch<React.SetStateAction<string>>;
  setConversionSearch: React.Dispatch<React.SetStateAction<string>>;
  setDirectChannel: React.Dispatch<React.SetStateAction<string>>;
  setEditingItemIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setEnableConversion: React.Dispatch<React.SetStateAction<boolean>>;
  setExpandedSubUnitIdx: React.Dispatch<React.SetStateAction<number | null>>;
  setHasOpportunity: React.Dispatch<React.SetStateAction<'' | 'yes' | 'no'>>;
  setImportTargetIdx: React.Dispatch<React.SetStateAction<number | null>>;
  setIsAgentOrder: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCategoryPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsContractPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsConversionPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOppPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSellerCategoryPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLinkedContractIds: React.Dispatch<React.SetStateAction<string[]>>;
  setLinkedOpportunityId: React.Dispatch<React.SetStateAction<string>>;
  setNegotiatedPrice: React.Dispatch<React.SetStateAction<number | null>>;
  setNewContactForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; email: string; position: string }>>;
  setNewOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  setOppItemWarnings: React.Dispatch<React.SetStateAction<OppItemWarning[]>>;
  setOrderEnterpriseId: React.Dispatch<React.SetStateAction<string>>;
  setPurchaseNatureManualByRow: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setSalesRepId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedBuyerNameId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedChannelId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedConversionIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedItContactId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedPurchasingContactId: React.Dispatch<React.SetStateAction<string>>;
  setSellerHoverCategory: React.Dispatch<React.SetStateAction<string>>;
  setSellerName: React.Dispatch<React.SetStateAction<string>>;
  setSellerProductCategory: React.Dispatch<React.SetStateAction<string>>;
  setServiceProcurementMode: React.Dispatch<React.SetStateAction<'together' | 'separate'>>;
  setShowAddProductModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowNewContactModal: React.Dispatch<React.SetStateAction<'Purchasing' | 'IT' | null>>;
  setTempActivationMethod: React.Dispatch<React.SetStateAction<ActivationMethod>>;
  setTempCategory: React.Dispatch<React.SetStateAction<string>>;
  setTempEcoProductName: React.Dispatch<React.SetStateAction<string>>;
  setTempEnterpriseId: React.Dispatch<React.SetStateAction<string>>;
  setTempHoverCategory: React.Dispatch<React.SetStateAction<string>>;
  setTempLicensePeriod: React.Dispatch<React.SetStateAction<string>>;
  setTempLicensePeriodNum: React.Dispatch<React.SetStateAction<number | ''>>;
  setTempLicensePeriodUnit: React.Dispatch<React.SetStateAction<'年' | '月' | '日'>>;
  setTempLicensee: React.Dispatch<React.SetStateAction<string>>;
  setTempMediaCount: React.Dispatch<React.SetStateAction<number | ''>>;
  setTempPkgCpu: React.Dispatch<React.SetStateAction<string>>;
  setTempPkgLink: React.Dispatch<React.SetStateAction<string>>;
  setTempPkgOs: React.Dispatch<React.SetStateAction<string>>;
  setTempPkgType: React.Dispatch<React.SetStateAction<'' | '通用' | '定制'>>;
  setTempPricingOptionId: React.Dispatch<React.SetStateAction<string>>;
  setTempProductId: React.Dispatch<React.SetStateAction<string>>;
  setTempProductWithSku: (productId: string, skuId: string) => void;
  setTempPurchaseNature: React.Dispatch<React.SetStateAction<PurchaseNature>>;
  setTempPurchaseNature365: React.Dispatch<React.SetStateAction<PurchaseNature>>;
  setTempQuantity: React.Dispatch<React.SetStateAction<number>>;
  setTempSiteLicensePcCount: React.Dispatch<React.SetStateAction<number | ''>>;
  setTempSkuId: React.Dispatch<React.SetStateAction<string>>;
  setTempSkuIdFromOption: (skuId: string) => void;
  setTempSubUnitMode: React.Dispatch<React.SetStateAction<SubUnitAuthMode>>;
  setTempSubUnits: React.Dispatch<React.SetStateAction<SubUnitLocal[]>>;
  setTerminalChannel: React.Dispatch<React.SetStateAction<string>>;
  showAddProductModal: boolean;
  showLicensePeriod: boolean;
  showServiceDetailTable: boolean;
  subUnitImportRef: React.RefObject<HTMLInputElement | null>;
  subscriptionCheckout: { subscription: Subscription; lineProduct: SubscriptionLineProductSnapshot; mode: 'renew' | 'addon' } | null | undefined;
  subscriptionLock: null | { mode: 'renew' | 'addon'; lineProduct: SubscriptionLineProductSnapshot };
  subscriptions: Subscription[];
  tempActivationMethod: ActivationMethod;
  tempCategory: string;
  tempEcoProductName: string;
  tempEnterpriseId: string;
  tempHoverCategory: string;
  tempLicensePeriodNum: number | '';
  tempLicensePeriodUnit: '年' | '月' | '日';
  tempLicensee: string;
  tempMediaCount: number | '';
  tempPkgCpu: string;
  tempPkgLink: string;
  tempPkgOs: string;
  tempPkgType: '' | '通用' | '定制';
  tempPricingOptionId: string;
  tempProductId: string;
  tempPurchaseNature: PurchaseNature;
  tempPurchaseNature365: PurchaseNature;
  tempQuantity: number;
  tempSiteLicensePcCount: number | '';
  tempSkuId: string;
  tempSubUnitImportRef: React.RefObject<HTMLInputElement | null>;
  tempSubUnitMode: SubUnitAuthMode;
  tempSubUnits: SubUnitLocal[];
  updateItemSubUnit: (itemIdx: number, unitId: string, field: keyof SubUnitLocal, value: string) => void;
  updateItemSubUnitMode: (itemIdx: number, mode: SubUnitAuthMode) => void;
  updateTempSubUnit: (unitId: string, field: keyof SubUnitLocal, value: string) => void;
}

const Step3ProductSelect: React.FC<Step3ProductSelectProps> = ({
  SUB_UNIT_CSV_HEADERS,
  addItemSubUnit,
  addTempSubUnit,
  availableConversionOrders,
  buyerType,
  calculateNewOrderTotal,
  canAddItem,
  categoryPickerRef,
  categoryTree,
  conversionTotalAmount,
  customers,
  downloadSubUnitTemplate,
  editingItemIndex,
  enableConversion,
  enableSubUnitAuth,
  expandedSubUnitIdx,
  handleAddItem,
  handleEditItem,
  handleRemoveItem,
  handleSubUnitImport,
  handleTempSubUnitImport,
  handleUpdateItem,
  hasServiceConfig,
  isCategoryPickerOpen,
  linkedOpportunityId,
  negotiatedPrice,
  newOrderCustomer,
  newOrderItems,
  oppItemWarnings,
  orderSource,
  originalOrderId,
  products,
  removeItemSubUnit,
  removeTempSubUnit,
  renewalOrder,
  selectedCategoryLabel,
  selectedConversionIds,
  selectedCustomerObj,
  selectedLicensePeriodType,
  selectedLicenseType,
  selectedOption,
  selectedProduct,
  selectedSku,
  sellerContact,
  sellerName,
  serviceDetailItems,
  serviceProcurementMode,
  setAgentCode,
  setBusinessManagerId,
  setConversionSearch,
  setDirectChannel,
  setEditingItemIndex,
  setEnableConversion,
  setExpandedSubUnitIdx,
  setHasOpportunity,
  setImportTargetIdx,
  setIsAgentOrder,
  setIsCategoryPickerOpen,
  setIsContractPickerOpen,
  setIsConversionPickerOpen,
  setIsOppPickerOpen,
  setIsSellerCategoryPickerOpen,
  setLinkedContractIds,
  setLinkedOpportunityId,
  setNegotiatedPrice,
  setNewContactForm,
  setNewOrderItems,
  setOppItemWarnings,
  setOrderEnterpriseId,
  setPurchaseNatureManualByRow,
  setSalesRepId,
  setSelectedBuyerNameId,
  setSelectedChannelId,
  setSelectedConversionIds,
  setSelectedItContactId,
  setSelectedPurchasingContactId,
  setSellerHoverCategory,
  setSellerName,
  setSellerProductCategory,
  setServiceProcurementMode,
  setShowAddProductModal,
  setShowNewContactModal,
  setTempActivationMethod,
  setTempCategory,
  setTempEcoProductName,
  setTempEnterpriseId,
  setTempHoverCategory,
  setTempLicensePeriod,
  setTempLicensePeriodNum,
  setTempLicensePeriodUnit,
  setTempLicensee,
  setTempMediaCount,
  setTempPkgCpu,
  setTempPkgLink,
  setTempPkgOs,
  setTempPkgType,
  setTempPricingOptionId,
  setTempProductId,
  setTempProductWithSku,
  setTempPurchaseNature,
  setTempPurchaseNature365,
  setTempQuantity,
  setTempSiteLicensePcCount,
  setTempSkuId,
  setTempSkuIdFromOption,
  setTempSubUnitMode,
  setTempSubUnits,
  setTerminalChannel,
  showAddProductModal,
  showLicensePeriod,
  showServiceDetailTable,
  subUnitImportRef,
  subscriptionCheckout,
  subscriptionLock,
  subscriptions,
  tempActivationMethod,
  tempCategory,
  tempEcoProductName,
  tempEnterpriseId,
  tempHoverCategory,
  tempLicensePeriodNum,
  tempLicensePeriodUnit,
  tempLicensee,
  tempMediaCount,
  tempPkgCpu,
  tempPkgLink,
  tempPkgOs,
  tempPkgType,
  tempPricingOptionId,
  tempProductId,
  tempPurchaseNature,
  tempPurchaseNature365,
  tempQuantity,
  tempSiteLicensePcCount,
  tempSkuId,
  tempSubUnitImportRef,
  tempSubUnitMode,
  tempSubUnits,
  updateItemSubUnit,
  updateItemSubUnitMode,
  updateTempSubUnit
}) => {
  return (
                    <div className="space-y-2.5 animate-fade-in">
                        {orderSource === 'Renewal' && originalOrderId && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-2xl text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-3">
                                <RefreshCcw className="w-5 h-5"/>
                                <span>续费模式：正在基于订单 <strong>{originalOrderId}</strong> 的明细进行续费。您可以继续添加或移除产品。</span>
                            </div>
                        )}

                        {linkedOpportunityId && (newOrderItems.length > 0 || oppItemWarnings.length > 0) && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl text-sm text-amber-700 dark:text-amber-300 space-y-2">
                                {newOrderItems.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2 font-bold">
                                            <Briefcase className="w-4 h-4 shrink-0"/>
                                            <span>已从商机自动带入 {newOrderItems.length} 个产品，以下信息需要您补充完善：</span>
                                        </div>
                                        <ul className="list-disc list-inside text-xs space-y-1 ml-6 text-amber-600 dark:text-amber-400">
                                            <li>订购性质 — 系统会结合「续费管理」订阅自动判断，请核对；365 订购性质请按需选择</li>
                                            <li>数量、授权/服务期限 — 请确认或修改</li>
                                            <li>激活方式、安装包类型、介质数量 — 请点击编辑按钮补充</li>
                                        </ul>
                                    </>
                                )}
                                {oppItemWarnings.length > 0 && (
                                    <div className={`space-y-1 ${newOrderItems.length > 0 ? 'mt-2 pt-2 border-t border-amber-200 dark:border-amber-700/50' : ''}`}>
                                        {newOrderItems.length === 0 && (
                                            <div className="flex items-center gap-2 font-bold mb-2">
                                                <XCircle className="w-4 h-4 text-red-500 shrink-0"/>
                                                <span className="text-red-600 dark:text-red-400">商机产品匹配失败，请手动添加产品：</span>
                                            </div>
                                        )}
                                        {oppItemWarnings.map((w, wi) => (
                                            <div key={wi} className="text-xs flex items-start gap-1.5">
                                                <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5"/>
                                                <span><strong>{w.productName}</strong>：{w.missingFields.join('、')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 订单产品明细列表 - 置顶 */}
                        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-apple">
                            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-blue-500"/> 订单产品明细
                                    {newOrderItems.length > 0 && <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full ml-1">{newOrderItems.length}</span>}
                                </h4>
                                <div className="flex items-center gap-3">
                                    {newOrderItems.length > 0 && (
                                        <div className="text-sm text-gray-500">总计：<span className="text-lg font-bold text-red-600 dark:text-red-400">¥{calculateNewOrderTotal().toLocaleString()}</span></div>
                                    )}
                                    <button
                                        onClick={() => { setEditingItemIndex(null); setTempPurchaseNature('New'); setTempPurchaseNature365('New'); setTempSubUnitMode('none'); setTempSubUnits([]); setShowAddProductModal(true); }}
                                        disabled={!!subscriptionLock || (enableSubUnitAuth && newOrderItems.length >= 1)}
                                        title={subscriptionLock ? '订阅续费/增购模式下不可再添加产品' : (enableSubUnitAuth && newOrderItems.length >= 1 ? '下级单位授权模式下仅允许一个产品明细' : undefined)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold transition shadow-apple disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0071E3]"
                                    >
                                        <Plus className="w-3.5 h-3.5"/> 添加产品
                                    </button>
                                </div>
                            </div>
                            {(buyerType === 'Customer' || buyerType === 'Channel') && newOrderCustomer && !renewalOrder && !subscriptionCheckout && newOrderItems.length > 0 && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 px-5 pb-2 leading-relaxed">
                                    每条明细<strong>下方</strong>为与「续费管理」订阅的比对结果；如需修改订购性质，请点击<strong>编辑</strong>按钮。
                                </p>
                            )}
                            {newOrderItems.length > 0 ? (
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className="unified-table-header">
                                        <tr><th className="p-3 pl-4 text-center w-16 whitespace-nowrap">明细编号</th><th className="p-3">产品/规格</th><th className="p-3">订购性质</th><th className="p-3">365订购性质</th><th className="p-3">授权类型</th><th className="p-3 text-center">数量</th><th className="p-3 text-center">授权/服务期限</th>{(buyerType === 'Customer' || buyerType === 'Channel') && <th className="p-3">激活方式</th>}<th className="p-3 text-right">单价</th><th className="p-3 text-right">小计</th><th className="p-3 text-center">操作</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {newOrderItems.map((item, idx) => {
                                            const rowLocked = !!subscriptionLock && idx === 0;
                                            const addonTimeLocked = rowLocked && subscriptionLock?.mode === 'addon';
                                            const lineColSpan = 10 + (buyerType === 'Customer' || buyerType === 'Channel' ? 1 : 0);
                                            return (
                                            <React.Fragment key={idx}>
                                            <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-3 pl-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs font-bold font-mono text-[#0071E3] dark:text-[#0A84FF]">{String(idx + 1).padStart(3, '0')}</span>
                                                </td>
                                                <td className="p-3"><div className="font-bold text-gray-900 dark:text-white text-sm">{item.productName}</div><div className="text-xs text-gray-500 mt-0.5">{item.skuName}</div>{item.ecoProductName && <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><Tag className="w-2.5 h-2.5"/>生态: {item.ecoProductName}</div>}{rowLocked && <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">（来自订阅，不可更换产品）</div>}</td>
                                                <td className="p-3"><span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${purchaseNatureBadgeClass((item.purchaseNature || 'New') as PurchaseNature)}`}>{purchaseNatureDisplay((item.purchaseNature || 'New') as PurchaseNature)}</span></td>
                                                <td className="p-3"><span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${purchaseNatureBadgeClass((item.purchaseNature365 || 'New') as PurchaseNature)}`}>{purchaseNatureDisplay((item.purchaseNature365 || 'New') as PurchaseNature)}</span></td>
                                                <td className="p-3"><span className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300 font-medium">{item.pricingOptionName || '默认'}</span></td>
                                                <td className="p-3 text-center"><span className="text-sm font-medium text-gray-900 dark:text-white">{item.quantity}</span></td>
                                                <td className="p-3 text-center">
                                                    {addonTimeLocked ? (
                                                        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                                                            <div><span className="text-gray-400">起</span> {item.licenseStartDate || '-'}</div>
                                                            <div><span className="text-gray-400">止</span> {item.licenseEndDate || '-'}</div>
                                                            <div className="inline-flex px-2 py-0.5 text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800">{item.licensePeriod}</div>
                                                        </div>
                                                    ) : item.licensePeriod && item.licensePeriod !== '永久' ? (
                                                        <span className="inline-flex px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg">{item.licensePeriod}</span>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600">-</span>
                                                    )}
                                                </td>
                                                {(buyerType === 'Customer' || buyerType === 'Channel') && (
                                                    <td className="p-3"><span className="text-xs text-gray-700 dark:text-gray-300">{({ Account: '账号激活', SerialKey: '序列号激活', AccountAndSerialKey: '账号+序列号', LicenseKey: '授权码激活', Online: '在线激活', Dongle: '硬件加密狗' } as Record<string, string>)[item.activationMethod || 'Account'] || '账号激活'}</span></td>
                                                )}
                                                <td className="p-3 text-right"><span className="text-sm font-medium text-gray-900 dark:text-white" style={{fontVariantNumeric:'tabular-nums'}}>¥{item.priceAtPurchase.toLocaleString()}</span></td>
                                                <td className="p-3 text-right font-bold text-red-600 dark:text-red-400">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                    <button type="button" onClick={() => handleEditItem(idx)} disabled={rowLocked} className="text-gray-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-30 disabled:pointer-events-none" title="编辑"><Pencil className="w-3.5 h-3.5"/></button>
                                                    <button type="button" onClick={() => handleRemoveItem(idx)} disabled={rowLocked} className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-30 disabled:pointer-events-none" title="删除"><Trash2 className="w-3.5 h-3.5"/></button>
                                                    </div>
                                                    {item.subUnitAuthMode && item.subUnitAuthMode !== 'none' && item.subUnits && item.subUnits.length > 0 && (
                                                        <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1 font-bold flex items-center justify-center gap-1"><Building2 className="w-3 h-3"/>{item.subUnits.length} 个下级单位</div>
                                                    )}
                                                </td>
                                            </tr>
                                            </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="px-5 pb-4 pt-1">
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-300 dark:text-gray-600">
                                        <ShoppingBag className="w-10 h-10 mb-3 opacity-40"/>
                                        <p className="text-sm font-medium">暂无产品，请点击右上方"添加产品"按钮</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 产品服务信息 */}
                        {hasServiceConfig && newOrderItems.length > 0 && (
                        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Wrench className="w-4 h-4 text-teal-500"/> 产品服务信息
                                </h4>
                            </div>
                            <div className="px-5 py-4 space-y-4">
                                {/* 采购方式选择 */}
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">产品和服务是否分开采购</label>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="serviceProcurement" checked={serviceProcurementMode === 'separate'} onChange={() => setServiceProcurementMode('separate')} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">产品和服务分开采购</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="serviceProcurement" checked={serviceProcurementMode === 'together'} onChange={() => setServiceProcurementMode('together')} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">产品和服务一并采购</span>
                                        </label>
                                    </div>
                                </div>

                                {serviceProcurementMode === 'separate' && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                                        分开采购模式下，服务将作为独立的产品行添加到订单产品列表，通过产品明细编号与主产品关联。
                                    </div>
                                )}

                                {/* 一并采购模式 - 服务明细表格 */}
                                {showServiceDetailTable && serviceDetailItems.length > 0 && (
                                    <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                                        <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                服务明细
                                                <span className="text-xs font-mono bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">{serviceDetailItems.length}</span>
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button type="button" className="text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline flex items-center gap-1">
                                                    <Plus className="w-3 h-3"/> 新增服务
                                                </button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm min-w-[700px]">
                                                <thead className="bg-gray-50/80 dark:bg-[#2C2C2E]">
                                                    <tr>
                                                        <th className="p-2.5 pl-4 text-center w-12 text-xs font-bold text-gray-500 dark:text-gray-400">编号</th>
                                                        <th className="p-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">产品类型</th>
                                                        <th className="p-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">产品规格</th>
                                                        <th className="p-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">产品名称</th>
                                                        <th className="p-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">授权方式/服务方式</th>
                                                        <th className="p-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">授权或服务期限</th>
                                                        <th className="p-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">数量</th>
                                                        {buyerType !== 'Channel' && <th className="p-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 text-right">服务成本预提单价</th>}
                                                        {buyerType !== 'Channel' && <th className="p-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 text-right">服务成本预提金额小计(含税)</th>}
                                                        <th className="p-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">操作</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                    {serviceDetailItems.map((svc, idx) => (
                                                        <tr key={svc.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="p-2.5 pl-4 text-center">
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/40 text-[10px] font-bold font-mono text-teal-600 dark:text-teal-400">{idx + 1}</span>
                                                            </td>
                                                            <td className="p-2.5 text-xs text-gray-700 dark:text-gray-300">{svc.productType}</td>
                                                            <td className="p-2.5 text-xs text-gray-700 dark:text-gray-300">{svc.productSpec}</td>
                                                            <td className="p-2.5 text-xs font-medium text-gray-900 dark:text-white">{svc.productName}</td>
                                                            <td className="p-2.5 text-xs text-gray-700 dark:text-gray-300">{svc.serviceMethod}</td>
                                                            <td className="p-2.5 text-center">
                                                                <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded">{svc.servicePeriod}</span>
                                                            </td>
                                                            <td className="p-2.5 text-center text-xs font-medium text-gray-900 dark:text-white">{svc.quantity}</td>
                                                            {buyerType !== 'Channel' && <td className="p-2.5 text-right text-xs font-mono text-gray-700 dark:text-gray-300">¥{svc.unitPrice.toLocaleString()}</td>}
                                                            {buyerType !== 'Channel' && <td className="p-2.5 text-right text-xs font-bold font-mono text-gray-900 dark:text-white">¥{svc.subtotal.toLocaleString()}</td>}
                                                            <td className="p-2.5 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button type="button" className="text-[10px] font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline">编辑</button>
                                                                    <button type="button" className="text-[10px] font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline">详情</button>
                                                                    <button type="button" className="text-[10px] font-medium text-red-500 hover:underline">删除</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                {buyerType !== 'Channel' && (
                                                    <tfoot className="border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5">
                                                        <tr>
                                                            <td colSpan={8} className="p-2.5 pl-4 text-right font-bold text-xs text-gray-700 dark:text-gray-300">合计</td>
                                                            <td className="p-2.5 text-right font-bold text-xs font-mono text-red-600 dark:text-red-400">¥{serviceDetailItems.reduce((sum, s) => sum + s.subtotal, 0).toLocaleString()}</td>
                                                            <td className="p-2.5"></td>
                                                        </tr>
                                                    </tfoot>
                                                )}
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {serviceProcurementMode === 'together' && !showServiceDetailTable && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                                        请完善产品的订购性质、单价和数量后，系统将自动匹配并带出基础服务和必选服务。
                                    </div>
                                )}
                            </div>
                        </div>
                        )}

                        {/* 折算抵扣 - 仅自成交订单 */}
                        {buyerType === 'SelfDeal' && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-3">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-2">
                                <Percent className="w-4 h-4 text-amber-500"/> 折算抵扣
                            </h4>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">是否折算</label>
                                <button
                                    onClick={() => { setEnableConversion(!enableConversion); if (enableConversion) { setSelectedConversionIds([]); } }}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${enableConversion ? 'bg-[#0071E3]' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${enableConversion ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{enableConversion ? '需要折算' : '不需要折算'}</span>
                            </div>
                            {enableConversion && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => { setConversionSearch(''); setIsConversionPickerOpen(true); }}
                                        className="flex items-center gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition text-sm font-medium"
                                    >
                                        <Search className="w-4 h-4"/> 选择关联折算单
                                    </button>
                                    {selectedConversionIds.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="grid gap-2">
                                                {selectedConversionIds.map(cid => {
                                                    const co = availableConversionOrders.find(c => c.id === cid);
                                                    if (!co) return null;
                                                    return (
                                                        <div key={cid} className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-mono text-gray-500 dark:text-gray-400">{co.id}</div>
                                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">{co.enterpriseName}</div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">¥{co.amount.toLocaleString()}</span>
                                                                <button onClick={() => setSelectedConversionIds(prev => prev.filter(id => id !== cid))} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"><X className="w-3.5 h-3.5"/></button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">折算总金额:</span>
                                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">¥{conversionTotalAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        )}


                        {/* 添加产品抽屉 */}
                        {showAddProductModal && (
                        <ModalPortal>
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[600] animate-fade-in" onClick={() => { setShowAddProductModal(false); setEditingItemIndex(null); }}/>
                        <div className="fixed inset-y-0 right-0 z-[601] w-[85vw] max-w-[1600px] flex flex-col bg-white dark:bg-[#1C1C1E] shadow-[-8px_0_30px_rgba(0,0,0,0.12)] dark:shadow-[-8px_0_30px_rgba(0,0,0,0.5)] animate-drawer-enter">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0 bg-white dark:bg-[#1C1C1E]">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-blue-500"/> {editingItemIndex !== null ? '编辑产品' : '添加产品'}
                                </h4>
                                <button onClick={() => { setShowAddProductModal(false); setEditingItemIndex(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition">
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-6 py-5 pb-8 space-y-5">

                            {/* ═══ 产品信息 ═══ */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                    <ShoppingBag className="w-4 h-4 text-blue-500"/>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">产品信息</span>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2 relative" ref={categoryPickerRef}>
                                    <label className="text-xs font-bold text-gray-500 uppercase">产品分类 <span className="text-red-500">*</span></label>
                                    <button
                                        type="button"
                                        onClick={() => { setIsCategoryPickerOpen(!isCategoryPickerOpen); if (!isCategoryPickerOpen && !tempHoverCategory && categoryTree.length > 0) setTempHoverCategory(categoryTree[0].label); }}
                                        className={`w-full p-3 bg-white dark:bg-[#1C1C1E] border rounded-xl outline-none text-sm text-left flex items-center justify-between transition ${isCategoryPickerOpen ? 'ring-2 ring-[#0071E3] border-[#0071E3]' : 'border-gray-200 dark:border-white/10'}`}
                                    >
                                        <span className={tempCategory ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{selectedCategoryLabel || '-- 请选择分类 --'}</span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCategoryPickerOpen ? 'rotate-180' : ''}`}/>
                                    </button>
                                    {isCategoryPickerOpen && (
                                        <div className="absolute z-50 top-full left-0 mt-1 w-[480px] bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden flex" style={{ maxHeight: 320 }}>
                                            <div className="w-[180px] border-r border-gray-100 dark:border-white/10 overflow-y-auto py-1">
                                                {categoryTree.map(cat => (
                                                    <div
                                                        key={cat.label}
                                                        onMouseEnter={() => setTempHoverCategory(cat.label)}
                                                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                                                            tempHoverCategory === cat.label
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-blue-400 font-bold'
                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <span className="truncate">{cat.label}</span>
                                                        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50"/>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex-1 overflow-y-auto py-1">
                                                {categoryTree.find(c => c.label === tempHoverCategory)?.subs.map(sub => (
                                                    <div
                                                        key={sub}
                                                        onClick={() => { setTempCategory(sub); setIsCategoryPickerOpen(false); }}
                                                        className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                                                            tempCategory === sub
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-blue-400 font-bold'
                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                        }`}
                                                    >
                                                        {tempCategory === sub && <Check className="w-3.5 h-3.5 text-[#0071E3] dark:text-blue-400 shrink-0"/>}
                                                        <span className="truncate">{sub}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">选择产品 <span className="text-red-500">*</span></label>
                                    <select 
                                        className={`w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm disabled:opacity-50 disabled:cursor-not-allowed ${!tempCategory ? 'bg-gray-100 dark:bg-white/5' : 'bg-white dark:bg-[#1C1C1E]'}`}
                                        value={tempProductId && tempSkuId ? `${tempProductId}||${tempSkuId}` : tempProductId ? `${tempProductId}||` : ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (!val) { setTempProductId(''); return; }
                                            const [pId, sId] = val.split('||');
                                            if (sId) {
                                                setTempProductWithSku(pId, sId);
                                            } else {
                                                setTempProductId(pId);
                                            }
                                        }}
                                        disabled={!tempCategory}
                                    >
                                        <option value="">-- {tempCategory ? '请选择产品' : '请先选择分类'} --</option>
                                        {products.filter(p => p.status === 'OnShelf' && p.subCategory === tempCategory).map(p => {
                                            const activeSkus = p.skus.filter(s => s.status === 'Active');
                                            const uniqueSpecs: ProductSku[] = Array.from(new Map(activeSkus.map(s => [s.name, s])).values());
                                            if (uniqueSpecs.length <= 1) {
                                                return <option key={p.id} value={`${p.id}||${uniqueSpecs[0]?.id || ''}`}>{p.name}{uniqueSpecs[0] ? ` / ${uniqueSpecs[0].name}` : ''}</option>;
                                            }
                                            return (
                                                <optgroup key={p.id} label={p.name}>
                                                    {uniqueSpecs.map(s => (
                                                        <option key={`${p.id}-${s.id}`} value={`${p.id}||${s.id}`}>{p.name} / {s.name}</option>
                                                    ))}
                                                </optgroup>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">产品规格</label>
                                    <div className={`w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl text-sm min-h-[46px] flex items-center ${selectedProduct ? 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                        {(() => {
                                            if (!selectedProduct) return '选择产品后自动带出';
                                            const activeSkus = selectedProduct.skus.filter(s => s.status === 'Active');
                                            const uniqueNames = Array.from(new Set(activeSkus.map(s => s.name)));
                                            if (uniqueNames.length === 0) return <span className="text-gray-400">无规格</span>;
                                            if (selectedSku) return <span className="font-medium">{selectedSku.name}</span>;
                                            return <span className="font-medium">{uniqueNames.join(' / ')}</span>;
                                        })()}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">授权类型 <span className="text-red-500">*</span></label>
                                    {(() => {
                                        const activeSkus = selectedProduct?.skus.filter(s => s.status === 'Active') || [];
                                        const allOptions = activeSkus.flatMap(s => (s.pricingOptions || []).map(opt => ({ ...opt, skuId: s.id, skuCode: s.code })));
                                        if (!tempProductId) {
                                            return <div className="w-full p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-400 cursor-not-allowed">请先选择产品</div>;
                                        }
                                        if (allOptions.length === 0) {
                                            return <div className="w-full p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl text-sm text-amber-600 dark:text-amber-400">该产品暂无授权类型配置，可直接加入清单</div>;
                                        }
                                        return (
                                            <select
                                                className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
                                                value={tempPricingOptionId}
                                                onChange={e => {
                                                    const optId = e.target.value;
                                                    setTempPricingOptionId(optId);
                                                    const matched = allOptions.find(o => o.id === optId);
                                                    if (matched && matched.skuId !== tempSkuId) {
                                                        setTempSkuIdFromOption(matched.skuId);
                                                    }
                                                }}
                                            >
                                                <option value="">-- 请选择授权类型 --</option>
                                                {allOptions.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.title || opt.name} ({opt.skuCode})</option>
                                                ))}
                                            </select>
                                        );
                                    })()}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">数量 <span className="text-red-500">*</span></label>
                                    <input type="number" className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm" min="1" value={tempQuantity} onChange={e => setTempQuantity(Number(e.target.value))} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-teal-600 uppercase flex items-center gap-1">授权/服务期限</label>
                                    {showLicensePeriod ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="请输入"
                                            className="flex-1 p-3 bg-white dark:bg-[#1C1C1E] border border-teal-200 dark:border-teal-900/30 rounded-xl outline-none focus:ring-2 focus:ring-teal-200 transition text-sm font-medium text-teal-700 dark:text-teal-400"
                                            value={tempLicensePeriodNum}
                                            onChange={e => setTempLicensePeriodNum(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                        <select
                                            className="w-20 p-3 bg-white dark:bg-[#1C1C1E] border border-teal-200 dark:border-teal-900/30 rounded-xl outline-none focus:ring-2 focus:ring-teal-200 transition text-sm font-medium text-teal-700 dark:text-teal-400"
                                            value={tempLicensePeriodUnit}
                                            onChange={e => setTempLicensePeriodUnit(e.target.value as '年' | '月' | '日')}
                                        >
                                            <option value="年">年</option>
                                            <option value="月">月</option>
                                            <option value="日">日</option>
                                        </select>
                                    </div>
                                    ) : (
                                    <div className="w-full p-3 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-900/30 rounded-xl text-sm font-medium text-teal-700 dark:text-teal-400">
                                        永久
                                    </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-orange-500 uppercase flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> 单价 <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            className="w-full p-3 pr-16 bg-white dark:bg-[#1C1C1E] border border-orange-200 dark:border-orange-900/30 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 transition text-sm font-bold text-orange-600" 
                                            value={negotiatedPrice !== null ? negotiatedPrice : ''} 
                                            onChange={e => setNegotiatedPrice(Number(e.target.value))} 
                                            placeholder={`基准: ¥${selectedOption?.price || selectedSku?.price || 0}`} 
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-orange-400 font-medium pointer-events-none">
                                            {showLicensePeriod ? `元/${tempLicensePeriodUnit}` : '元'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-orange-400 uppercase flex items-center gap-1">计价单价</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full p-3 pr-16 bg-gray-100 dark:bg-white/5 border border-orange-100 dark:border-orange-900/20 rounded-xl outline-none transition text-sm font-medium text-orange-500 cursor-not-allowed"
                                            value={negotiatedPrice !== null ? negotiatedPrice : (selectedOption?.price || selectedSku?.price || 0)}
                                            readOnly
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-orange-300 font-medium pointer-events-none">
                                            {showLicensePeriod ? `元/${tempLicensePeriodUnit}` : '元'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-red-500 uppercase flex items-center gap-1">产品金额</label>
                                    {(() => {
                                        const unitPrice = negotiatedPrice !== null ? negotiatedPrice : (selectedOption?.price || selectedSku?.price || 0);
                                        const periodMultiplier = showLicensePeriod && tempLicensePeriodNum
                                            ? (tempLicensePeriodUnit === '年' ? Number(tempLicensePeriodNum) : tempLicensePeriodUnit === '月' ? Number(tempLicensePeriodNum) / 12 : Number(tempLicensePeriodNum) / 365)
                                            : 1;
                                        const qty = Number(tempQuantity) || 0;
                                        const totalAmount = unitPrice * qty * periodMultiplier;
                                        const divisor = qty * periodMultiplier;
                                        return (
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full p-3 pr-10 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl outline-none focus:ring-2 focus:ring-red-200 transition text-sm font-bold text-red-600 dark:text-red-400 text-right font-mono"
                                                    value={Math.round(totalAmount * 100) / 100}
                                                    onChange={e => {
                                                        const val = Number(e.target.value);
                                                        if (!isFinite(val) || divisor === 0) return;
                                                        setNegotiatedPrice(Math.round((val / divisor) * 100) / 100);
                                                    }}
                                                    min="0"
                                                    step="0.01"
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-red-400 font-medium pointer-events-none">¥</span>
                                                {(showLicensePeriod && tempLicensePeriodNum ? true : qty > 1) && (
                                                    <div className="text-[10px] font-normal text-red-400 dark:text-red-500 mt-1.5 text-right">
                                                        反推单价: ¥{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        {showLicensePeriod && tempLicensePeriodNum
                                                            ? ` × ${tempQuantity} × ${tempLicensePeriodNum}${tempLicensePeriodUnit}`
                                                            : ` × ${tempQuantity}`
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {selectedProduct?.tags?.includes('生态') && (
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1"><Tag className="w-3 h-3"/> 生态产品名称</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-emerald-200 dark:border-emerald-900/30 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 transition text-sm text-emerald-700 dark:text-emerald-400 placeholder:text-gray-400"
                                        placeholder="请输入生态产品具体名称"
                                        value={tempEcoProductName}
                                        onChange={e => setTempEcoProductName(e.target.value)}
                                    />
                                </div>
                                )}

                                </div>
                            </div>

                            {/* ═══ 服务信息 ═══ */}
                            {(() => {
                                const linkedSvcs = selectedProduct?.linkedServices || [];
                                if (linkedSvcs.length === 0) return null;
                                return linkedSvcs.map((svc) => {
                                    const svcProduct = products.find(p => p.id === svc.productId);
                                    if (!svcProduct || svcProduct.status !== 'OnShelf') return null;
                                    const svcSku = svc.skuId
                                        ? svcProduct.skus.find(s => s.id === svc.skuId && s.status === 'Active')
                                        : svcProduct.skus.find(s => s.status === 'Active');
                                    if (!svcSku) return null;
                                    const svcOption = svcSku.pricingOptions?.[0];
                                    const unitPrice = svcOption?.price ?? svcSku.price;
                                    const licenseTitle = svcOption?.title || '—';
                                    const periodUnit = svcOption?.license?.periodUnit;
                                    const periodNum = svcOption?.license?.period ?? 1;
                                    const periodLabel = periodUnit === 'Forever' ? '永久'
                                        : periodUnit === 'Year' ? `${periodNum}年`
                                        : periodUnit === 'Month' ? `${periodNum}月`
                                        : periodUnit === 'Day' ? `${periodNum}日` : '—';
                                    const priceUnitLabel = periodUnit === 'Year' ? '元/年'
                                        : periodUnit === 'Month' ? '元/月'
                                        : periodUnit === 'Day' ? '元/日' : '元';
                                    const qty = tempQuantity || 1;
                                    const totalCost = unitPrice * qty;
                                    return (
                                    <div key={svc.productId} className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                            <Wrench className="w-4 h-4 text-orange-500"/>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">服务明细详情</span>
                                            {svc.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-800/40">必选</span>}
                                            {!svc.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 font-bold">可选</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">产品类型：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{svcProduct.subCategory || svcProduct.productType || '—'}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">产品规格：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{svcSku.name}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">产品名称：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{svcProduct.name}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">授权/服务方式：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{licenseTitle}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">数量：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{qty}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">授权/服务期限：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{periodLabel}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">服务成本预提计价单价：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">¥ {unitPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元/{qty > 1 ? '个' : '个'}/{priceUnitLabel.replace('元/', '')}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">服务成本预提单价：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">¥ {unitPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} {priceUnitLabel}</span>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic font-medium">服务成本预提金额小计(含税)：</span>
                                                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">¥ {totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                });
                            })()}

                            {/* ═══ 交付物信息 ═══ */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                    <Box className="w-4 h-4 text-indigo-500"/>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">交付物信息</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {(buyerType === 'Customer' || buyerType === 'Channel') && (
                                    <div className="col-span-3 space-y-2">
                                        <label className="text-xs font-bold text-purple-500 uppercase flex items-center gap-1"><Zap className="w-3 h-3"/> 激活方式</label>
                                        <div className="flex gap-1.5">
                                            {([
                                                { id: 'Account' as ActivationMethod, label: '账号激活' },
                                                { id: 'SerialKey' as ActivationMethod, label: '序列号激活' },
                                                { id: 'AccountAndSerialKey' as ActivationMethod, label: '账号+序列号' },
                                            ]).map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setTempActivationMethod(opt.id)}
                                                    className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-bold transition border ${
                                                        tempActivationMethod === opt.id
                                                            ? 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                                            : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-purple-300 dark:hover:border-purple-700'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    )}

                                    {/* 介质数量 */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">介质数量</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={tempMediaCount}
                                            onChange={e => setTempMediaCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition"
                                            placeholder="请输入介质数量"
                                        />
                                    </div>

                                    {/* 端年场地授权覆盖的PC数量 */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">端年场地授权覆盖的PC数量</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={tempSiteLicensePcCount}
                                            onChange={e => setTempSiteLicensePcCount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition"
                                            placeholder="请输入PC数量"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 安装包选择 */}
                            {(() => {
                                if (!selectedProduct) return null;
                                const allPkgRows = ALL_INSTALL_PKG_ROWS.filter(r => r.productId === selectedProduct.id && r.enabled);

                                const universalPkgs = allPkgRows.filter(r => r.packageType === 'public');
                                const customPkgs = allPkgRows.filter(r => r.packageType === 'private');

                                const universalCpuOptions = Array.from(new Set(universalPkgs.map(p => p.cpu).filter(v => v && v !== '-')));
                                const universalOsOptions = Array.from(new Set(universalPkgs.map(p => p.os).filter(v => v && v !== '-')));
                                const customCpuOptions = Array.from(new Set(customPkgs.map(p => p.cpu).filter(v => v && v !== '-')));
                                const customOsOptions = Array.from(new Set(
                                    customPkgs.filter(p => !tempPkgCpu || p.cpu === tempPkgCpu).map(p => p.os).filter(v => v && v !== '-')
                                ));

                                if (allPkgRows.length === 0) return null;

                                let previewPkg: typeof allPkgRows[0] | null = null;
                                if (tempPkgType === '通用' && tempPkgCpu && tempPkgOs) {
                                    previewPkg = universalPkgs.find(p => p.cpu === tempPkgCpu && p.os === tempPkgOs) || null;
                                } else if (tempPkgType === '通用' && tempPkgOs) {
                                    previewPkg = universalPkgs.find(p => p.os === tempPkgOs) || null;
                                } else if (tempPkgType === '通用' && universalPkgs.length === 1) {
                                    previewPkg = universalPkgs[0] || null;
                                }

                                return (
                                    <div className="space-y-3">

                                        <div className="flex items-center gap-2 pb-1">
                                            <Package className="w-4 h-4 text-indigo-500"/>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">安装包信息 <span className="text-red-500">*</span></span>
                                        </div>

                                        {/* 通用 / 定制 切换 */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setTempPkgType('通用')}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                                                    tempPkgType === '通用'
                                                    ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/40 dark:bg-white/5 text-[#0071E3] dark:text-[#FF2D55]'
                                                    : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <Globe className="w-4 h-4"/> 通用
                                            </button>
                                            <button
                                                onClick={() => setTempPkgType('定制')}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                                                    tempPkgType === '定制'
                                                    ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/40 dark:bg-white/5 text-[#0071E3] dark:text-[#FF2D55]'
                                                    : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <Settings className="w-4 h-4"/> 定制
                                            </button>
                                            {tempPkgType && (
                                                <button onClick={() => setTempPkgType('')} className="text-xs text-gray-400 hover:text-gray-600 px-2 transition">清除</button>
                                            )}
                                        </div>

                                        {/* 通用：选择 CPU 和操作系统 */}
                                        {tempPkgType === '通用' && universalPkgs.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {universalCpuOptions.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">CPU</label>
                                                    <select
                                                        className="w-full p-2.5 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
                                                        value={tempPkgCpu}
                                                        onChange={e => { setTempPkgCpu(e.target.value); setTempPkgOs(''); }}
                                                    >
                                                        <option value="">-- 请选择 CPU --</option>
                                                        {universalCpuOptions.map(cpu => <option key={cpu} value={cpu}>{cpu}</option>)}
                                                    </select>
                                                </div>
                                                )}
                                                {universalOsOptions.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">操作系统</label>
                                                    <select
                                                        className="w-full p-2.5 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
                                                        value={tempPkgOs}
                                                        onChange={e => setTempPkgOs(e.target.value)}
                                                    >
                                                        <option value="">-- 请选择系统 --</option>
                                                        {Array.from(new Set(
                                                            universalPkgs.filter(p => !tempPkgCpu || p.cpu === tempPkgCpu).map(p => p.os).filter(v => v && v !== '-')
                                                        )).map(os => <option key={os} value={os}>{os}</option>)}
                                                    </select>
                                                </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 定制：先选发布平台/OS（如有定制安装包数据），再填安装包链接 */}
                                        {tempPkgType === '定制' && (
                                            <div className="space-y-4">
                                                {customCpuOptions.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">发布平台</label>
                                                            <select
                                                                className="w-full p-2.5 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
                                                                value={tempPkgCpu}
                                                                onChange={e => { setTempPkgCpu(e.target.value); setTempPkgOs(''); }}
                                                            >
                                                                <option value="">-- 请选择发布平台 --</option>
                                                                {customCpuOptions.map(cpu => <option key={cpu} value={cpu}>{cpu}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">操作系统</label>
                                                            <select
                                                                className={`w-full p-2.5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm disabled:opacity-50 disabled:cursor-not-allowed ${!tempPkgCpu ? 'bg-gray-100 dark:bg-white/5' : 'bg-white dark:bg-[#1C1C1E]'}`}
                                                                value={tempPkgOs}
                                                                onChange={e => setTempPkgOs(e.target.value)}
                                                                disabled={!tempPkgCpu}
                                                            >
                                                                <option value="">-- {tempPkgCpu ? '请选择系统' : '请先选 CPU'} --</option>
                                                                {customOsOptions.map(os => <option key={os} value={os}>{os}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">安装包链接 <span className="text-red-400 text-[10px] normal-case font-normal ml-1">定制安装包请粘贴链接</span></label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="url"
                                                            value={tempPkgLink}
                                                            onChange={e => setTempPkgLink(e.target.value)}
                                                            placeholder="请粘贴定制安装包下载链接"
                                                            className="flex-1 p-2.5 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm text-gray-800 dark:text-white placeholder:text-gray-400"
                                                        />
                                                        {tempPkgLink && (
                                                            <button onClick={() => setTempPkgLink('')} className="px-3 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 dark:border-white/10 rounded-xl transition">清除</button>
                                                        )}
                                                    </div>
                                                    {tempPkgLink && (
                                                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-1">
                                                            <CheckCircle className="w-3 h-3"/>
                                                            <span>已填写安装包链接</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 已确认的安装包预览 */}
                                        {previewPkg && (
                                            <div className="flex items-center gap-3 p-3.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 rounded-xl">
                                                <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0"/>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-indigo-800 dark:text-indigo-300">{previewPkg.deliveryItemName}</div>
                                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                        {[previewPkg.platform, previewPkg.cpu, previewPkg.os].filter(v => v && v !== '-').join(' · ')}
                                                        {previewPkg.productSpec && <span className="ml-2 text-indigo-400">({previewPkg.productSpec})</span>}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono text-indigo-400 shrink-0">{previewPkg.id}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* ═══ 产品交付信息 ═══ */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                    <Truck className="w-4 h-4 text-cyan-500"/>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">产品交付信息</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-cyan-500 uppercase flex items-center gap-1"><UserIcon className="w-3 h-3"/> 被授权方</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-cyan-200 dark:border-cyan-900/30 rounded-xl outline-none focus:ring-2 focus:ring-cyan-200 transition text-sm text-cyan-700 dark:text-cyan-400"
                                            placeholder="默认取客户名称"
                                            value={tempLicensee}
                                            onChange={e => setTempLicensee(e.target.value)}
                                        />
                                    </div>

                                    {(buyerType === 'Customer' || buyerType === 'Channel') && newOrderCustomer && selectedCustomerObj?.enterprises && selectedCustomerObj.enterprises.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3"/> 关联企业 ID <span className="text-red-500">*</span></label>
                                        <select
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-indigo-200 dark:border-indigo-900/30 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition text-sm text-indigo-700 dark:text-indigo-400"
                                            value={tempEnterpriseId}
                                            onChange={e => setTempEnterpriseId(e.target.value)}
                                        >
                                            <option value="">-- 请选择关联企业 --</option>
                                            {selectedCustomerObj.enterprises.map(ent => (
                                                <option key={ent.id} value={ent.id}>{ent.name} (ID: {ent.id})</option>
                                            ))}
                                        </select>
                                    </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-teal-500 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3"/> 供货组织（卖方名称）</label>
                                        <div className={`w-full p-3 border border-teal-200 dark:border-teal-900/30 rounded-xl text-sm min-h-[46px] flex items-center ${sellerName ? 'bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400 font-medium' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}>
                                            {sellerName || '请在第二步"产品类型"中选择'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ═══ 续费信息 ═══ */}
                            {(() => {
                                const canInfer = (buyerType === 'Customer' || buyerType === 'Channel') && !!newOrderCustomer && !renewalOrder && !subscriptionCheckout && !!tempProductId;
                                const tempItem: OrderItem = {
                                    productId: tempProductId,
                                    skuId: tempSkuId,
                                    productName: selectedProduct?.name || '',
                                    skuName: selectedSku?.name || '',
                                    quantity: tempQuantity,
                                    licensePeriod: tempLicensePeriodNum ? `${tempLicensePeriodNum}${tempLicensePeriodUnit}` : undefined,
                                    purchaseNature: tempPurchaseNature,
                                    purchaseNature365: tempPurchaseNature365,
                                } as OrderItem;
                                const modalInf = canInfer ? inferOrderLinePurchaseNatureFromSubscription(tempItem, newOrderCustomer, subscriptions) : null;
                                return (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                    <Layers className="w-4 h-4 text-blue-500"/>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">续费信息</span>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">订购性质</label>
                                        <select
                                            value={tempPurchaseNature}
                                            onChange={e => setTempPurchaseNature(e.target.value as PurchaseNature)}
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 transition text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                                        >
                                            <option value="New">新购</option>
                                            <option value="Renewal">续费</option>
                                            <option value="AddOn">增购</option>
                                            <option value="Upgrade">升级</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">365 订购性质</label>
                                        <select
                                            value={tempPurchaseNature365}
                                            onChange={e => setTempPurchaseNature365(e.target.value as PurchaseNature)}
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 transition text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                                        >
                                            <option value="New">新购</option>
                                            <option value="Renewal">续费</option>
                                            <option value="AddOn">增购</option>
                                            <option value="Upgrade">升级</option>
                                        </select>
                                    </div>
                                </div>
                                {modalInf && (
                                <div className="border-l-2 border-teal-500/80 pl-3 pr-2 py-3 space-y-2.5 rounded-r-xl bg-teal-50/40 dark:bg-teal-950/20">
                                    <div className="text-[11px] font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-300"/>
                                        订购性质识别
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                                        <span className="text-gray-500">当前选择</span>
                                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold ${purchaseNatureBadgeClass(tempPurchaseNature)}`}>{purchaseNatureDisplay(tempPurchaseNature)}</span>
                                        <span className="text-gray-400">·</span>
                                        <span className="text-gray-500">系统推荐</span>
                                        {modalInf.purchaseNature ? (
                                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold ${purchaseNatureBadgeClass(modalInf.purchaseNature)}`}>{purchaseNatureDisplay(modalInf.purchaseNature)}</span>
                                        ) : (
                                            <span className="text-[11px] text-gray-500">待完善授权信息后判定</span>
                                        )}
                                        {modalInf.purchaseNature && modalInf.purchaseNature !== tempPurchaseNature && (
                                            <button type="button" onClick={() => { setTempPurchaseNature(modalInf.purchaseNature!); setTempPurchaseNature365(modalInf.purchaseNature!); }} className="ml-1 text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200 underline underline-offset-2 font-bold transition">
                                                采纳推荐
                                            </button>
                                        )}
                                    </div>
                                    {modalInf.matchedSubscription && modalInf.matchedProduct && (
                                        <div className="rounded-xl border border-teal-100/90 dark:border-teal-800/40 bg-teal-50/40 dark:bg-teal-950/25 px-3 py-2.5 space-y-2 text-xs text-gray-800 dark:text-gray-200">
                                            <div>
                                                <span className="text-gray-500">对应订阅批</span>{' '}
                                                <span className="font-mono font-semibold text-[#0071E3] dark:text-[#0A84FF]">{modalInf.matchedSubscription.id}</span>
                                                <span className="text-gray-400 mx-1">·</span>
                                                <span className="text-gray-500">产品线</span> {modalInf.matchedSubscription.productLine}
                                            </div>
                                            <div>
                                                <div className="text-gray-500 mb-1">匹配产品（链上快照）</div>
                                                <div className="grid gap-1.5 sm:grid-cols-2">
                                                    <div><span className="text-gray-500">产品</span> {modalInf.matchedProduct.productName}</div>
                                                    <div><span className="text-gray-500">编码</span> {modalInf.matchedProduct.productCode}</div>
                                                    <div><span className="text-gray-500">SKU</span> {modalInf.matchedProduct.skuName}</div>
                                                    <div><span className="text-gray-500">当前数量</span> {modalInf.matchedProduct.currentQuantity}</div>
                                                    <div className="sm:col-span-2"><span className="text-gray-500">周期</span> {modalInf.matchedProduct.startDate} ~ {modalInf.matchedProduct.endDate} · {subscriptionStatusLabel(modalInf.matchedProduct.status)}</div>
                                                    <div className="sm:col-span-2"><span className="text-gray-500">授权类型</span> {modalInf.matchedProduct.licenseType}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {modalInf.headline && (
                                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{modalInf.headline}</p>
                                    )}
                                    {modalInf.bullets.length > 0 && (
                                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pl-4 list-disc marker:text-teal-600">
                                            {modalInf.bullets.map((b, bi) => (
                                                <li key={bi} className="leading-relaxed">{b}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                )}
                                {!canInfer && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                                    点击「确认添加」后，系统会根据当前订单客户与本产品授权期限，自动推断订购性质；您也可手动选择。
                                </div>
                                )}
                            </div>
                                );
                            })()}

                            {/* ═══ 下级单位授权 ═══ */}
                            {(buyerType !== 'SelfDeal' && selectedProduct?.subUnitLicenseAllowed !== false) && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                    <Building2 className="w-4 h-4 text-indigo-500"/>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">下级单位授权</span>
                                    {selectedProduct?.subUnitLicenseAllowed === true && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-bold border border-green-100 dark:border-green-800">产品已启用</span>
                                    )}
                                </div>
                                <div className="flex items-start gap-4 flex-wrap">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5"><span className="text-blue-500 shrink-0 mt-px">ⓘ</span><span>选此方式表示由交付邮件的接收方在同一企业ID下查看一份电子授权信息（包含下级清单）；金山将交付邮件发送至线上收货"指定接收邮箱"</span></p>
                                    <p className="text-xs text-orange-500 dark:text-orange-400 flex items-start gap-1.5 shrink-0"><span className="shrink-0 mt-px">⚠</span><span>下级单位【卖方业务联系人】需要与主订单【卖方业务联系人】保持一致，否则存在退单可能性</span></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">按下级单位授权</span>
                                    <select
                                        value={tempSubUnitMode}
                                        onChange={e => { const mode = e.target.value as SubUnitAuthMode; setTempSubUnitMode(mode); if (mode === 'none') { setTempSubUnits([]); } else if (tempSubUnits.length === 0) { setTempSubUnits([{ id: `su_${Date.now()}_0`, unitName: '', enterpriseId: '', enterpriseName: '-', authCount: '', itContact: '', phone: '', email: '', customerType: '-', industryLine: '-', sellerContact: '-' }, { id: `su_${Date.now()}_1`, unitName: '', enterpriseId: '', enterpriseName: '-', authCount: '', itContact: '', phone: '', email: '', customerType: '-', industryLine: '-', sellerContact: '-' }]); } }}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-xs font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-indigo-400 transition min-w-[280px]"
                                    >
                                        <option value="none">无下级单位</option>
                                        <option value="separate_auth_separate_eid">授权分别呈现，企业ID分别管理</option>
                                        <option value="separate_auth_unified_eid">授权分别呈现，企业ID统一管理</option>
                                        <option value="unified_auth_with_list">授权和企业ID统一管理并提供下级清单</option>
                                    </select>
                                </div>
                                {tempSubUnitMode !== 'none' && (() => {
                                    const subTotal = tempSubUnits.reduce((s, u) => s + (parseInt(u.authCount) || 0), 0);
                                    const matched = tempSubUnits.length > 0 && subTotal === tempQuantity;
                                    const hasSubData = tempSubUnits.length > 0 && tempSubUnits.some(u => u.authCount);
                                    return (
                                    <div>
                                        <div className="px-5 py-2.5 flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                                {hasSubData && (
                                                    <div className={`inline-flex items-center gap-2 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${matched ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200'}`}>
                                                        <span>合计: {subTotal}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span>明细数量: {tempQuantity}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span>{matched ? '✓ 匹配' : '✗ 不匹配'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button onClick={addTempSubUnit} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition">
                                                    <Plus className="w-3 h-3"/> 新增下级单位
                                                </button>
                                                <button onClick={() => tempSubUnitImportRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1C1C1E] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs font-bold transition">
                                                    <Upload className="w-3 h-3"/> 批量导入
                                                </button>
                                                <button onClick={downloadSubUnitTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-xs font-medium transition">
                                                    <Download className="w-3 h-3"/> 下载模板
                                                </button>
                                            </div>
                                        </div>
                                        {(() => {
                                            const isUnifiedEid = tempSubUnitMode === 'separate_auth_unified_eid' || tempSubUnitMode === 'unified_auth_with_list';
                                            const colCount = isUnifiedEid ? 10 : 12;
                                            return (
                                        <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                                            <table className="w-full text-left text-xs" style={{ minWidth: isUnifiedEid ? 900 : 1100 }}>
                                                <thead className="sticky top-0 z-10"><tr className="bg-indigo-100/80 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                                                    <th className="p-2 pl-5 w-8 text-center">#</th>
                                                    <th className="p-2 whitespace-nowrap">客户下级单位名称</th>
                                                    {!isUnifiedEid && <th className="p-2 whitespace-nowrap">企业ID</th>}
                                                    {!isUnifiedEid && <th className="p-2 whitespace-nowrap">企业名称</th>}
                                                    <th className="p-2 whitespace-nowrap">授权数量</th>
                                                    <th className="p-2 whitespace-nowrap">IT联系人</th>
                                                    <th className="p-2 whitespace-nowrap">手机</th>
                                                    <th className="p-2 whitespace-nowrap">邮箱</th>
                                                    <th className="p-2 whitespace-nowrap">客户类型</th>
                                                    <th className="p-2 whitespace-nowrap">行业条线</th>
                                                    <th className="p-2 whitespace-nowrap">卖方联系人</th>
                                                    <th className="p-2 pr-5 text-center whitespace-nowrap">操作</th>
                                                </tr></thead>
                                                <tbody className="divide-y divide-indigo-100 dark:divide-indigo-800/20">
                                                    {tempSubUnits.map((unit, si) => (
                                                    <tr key={unit.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors align-top">
                                                        <td className="p-2 pl-5 text-center text-gray-400 font-mono">{si + 1}</td>
                                                        <td className="p-2">
                                                            <select value={unit.unitName} onChange={e => { const cust = customers.find(c => c.companyName === e.target.value); updateTempSubUnit(unit.id, 'unitName', e.target.value); updateTempSubUnit(unit.id, 'enterpriseId', ''); updateTempSubUnit(unit.id, 'enterpriseName', '-'); if (cust) { updateTempSubUnit(unit.id, 'customerType', cust.customerType || '-'); updateTempSubUnit(unit.id, 'industryLine', cust.industryLine || cust.industry || '-'); } }} className={`w-full min-w-[140px] px-2 py-1 border rounded-lg text-xs outline-none transition bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400 ${!unit.unitName ? 'border-red-300' : 'border-gray-200 dark:border-white/10'}`}>
                                                                <option value="">请选择客户</option>
                                                                {customers.filter(c => c.id !== newOrderCustomer).map(c => <option key={c.id} value={c.companyName}>{c.companyName}</option>)}
                                                            </select>
                                                        </td>
                                                        {!isUnifiedEid && <td className="p-2">{(() => { const uc = customers.find(c => c.companyName === unit.unitName); const ents = uc?.enterprises; return ents && ents.length > 0 ? (<select value={unit.enterpriseId} onChange={e => { const ent = ents.find(en => en.id === e.target.value); updateTempSubUnit(unit.id, 'enterpriseId', e.target.value); updateTempSubUnit(unit.id, 'enterpriseName', ent?.name || '-'); }} className={`w-full min-w-[90px] px-2 py-1 border rounded-lg text-xs outline-none transition bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400 ${!unit.enterpriseId ? 'border-red-300' : 'border-gray-200 dark:border-white/10'}`}><option value="">选择</option>{ents.map(ent => <option key={ent.id} value={ent.id}>{ent.id} ({ent.name})</option>)}</select>) : <span className="text-[10px] text-gray-400">{unit.unitName ? '无关联企业' : '请先选择'}</span>; })()}</td>}
                                                        {!isUnifiedEid && <td className="p-2 text-gray-500">{unit.enterpriseName}</td>}
                                                        <td className="p-2"><input type="number" min={1} value={unit.authCount} onChange={e => updateTempSubUnit(unit.id, 'authCount', e.target.value)} placeholder="数量" className={`w-full min-w-[60px] px-2 py-1 border rounded-lg text-xs outline-none transition bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400 ${!unit.authCount ? 'border-red-300' : 'border-gray-200 dark:border-white/10'}`}/></td>
                                                        <td className="p-2"><input value={unit.itContact} onChange={e => updateTempSubUnit(unit.id, 'itContact', e.target.value)} placeholder="联系人" className="w-full min-w-[80px] px-2 py-1 border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400"/></td>
                                                        <td className="p-2"><input value={unit.phone} onChange={e => updateTempSubUnit(unit.id, 'phone', e.target.value)} placeholder="手机号" className="w-full min-w-[90px] px-2 py-1 border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400"/></td>
                                                        <td className="p-2"><input type="email" value={unit.email} onChange={e => updateTempSubUnit(unit.id, 'email', e.target.value)} placeholder="邮箱" className={`w-full min-w-[100px] px-2 py-1 border rounded-lg text-xs outline-none bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400 ${!unit.email ? 'border-red-300' : 'border-gray-200 dark:border-white/10'}`}/></td>
                                                        <td className="p-2 text-gray-400 whitespace-nowrap">{unit.customerType}</td>
                                                        <td className="p-2 text-gray-400 whitespace-nowrap">{unit.industryLine}</td>
                                                        <td className="p-2 text-gray-400 whitespace-nowrap">{unit.sellerContact}</td>
                                                        <td className="p-2 pr-5 text-center whitespace-nowrap"><button onClick={() => removeTempSubUnit(unit.id)} className="text-red-500 hover:text-red-700 text-xs font-bold hover:underline">删除</button></td>
                                                    </tr>
                                                    ))}
                                                    {tempSubUnits.length === 0 && <tr><td colSpan={colCount} className="px-3 py-6 text-center text-gray-400 text-xs">暂无下级单位，请点击"新增下级单位"或"批量导入"添加</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                            );
                                        })()}
                                    </div>
                                    );
                                })()}
                            </div>
                            )}
                            <input ref={tempSubUnitImportRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleTempSubUnitImport(f); e.target.value = ''; }} />

                            </div>
                            {/* 底部操作栏 */}
                            <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#1C1C1E] flex items-center justify-between">
                                <button onClick={() => { setShowAddProductModal(false); setEditingItemIndex(null); }} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition">取消</button>
                                <button
                                    onClick={handleAddItem}
                                    disabled={!canAddItem}
                                    className="px-8 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-apple"
                                >
                                    {editingItemIndex !== null ? <><Check className="w-4 h-4"/> 保存修改</> : <><Plus className="w-4 h-4"/> 加入清单</>}
                                </button>
                            </div>
                        </div>
                        </ModalPortal>
                        )}


                    </div>
  );
};

export default memoWithIgnoreCallbacks(Step3ProductSelect);
