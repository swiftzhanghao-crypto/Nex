import React from 'react';
import { User as UserIcon, Plus, CheckCircle, Briefcase, X, XCircle, Phone, Mail, Users, ScrollText, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { FieldError } from './ValidationFeedback';
import type {
  BuyerType, Channel, Contract, Customer, CustomerContact,
  Opportunity, OrderItem, OrderSource, Product, User,
  SubscriptionLineProductSnapshot,
} from '../../../types';
import { memoWithIgnoreCallbacks } from './wizardUtils';

type CategoryTreeNode = { label: string; subs: string[] };
type OppItemWarning = { productName: string; missingFields: string[] };
type WizardEnterprise = { entId: string; entName: string; customerId: string; customerName: string };

export interface Step2BasicInfoProps {
  agentCode: string;
  allEnterprises: WizardEnterprise[];
  businessManagerId: string;
  buyerType: BuyerType | '';
  categoryTree: CategoryTreeNode[];
  channels: Channel[];
  contracts: Contract[];
  customers: Customer[];
  directChannel: string;
  getVisibleFieldError: (field: string) => string | undefined;
  handleCustomerChange: (customerId: string) => void;
  handleSelfDealEnterpriseChange: (enterpriseId: string) => void;
  hasOpportunity: '' | 'yes' | 'no';
  isAgentOrder: boolean;
  isSellerCategoryPickerOpen: boolean;
  itContacts: CustomerContact[];
  linkedContractIds: string[];
  linkedOpportunityId: string;
  markFieldTouched: (field: string) => void;
  newOrderCustomer: string;
  opportunities: Opportunity[];
  orderEnterpriseId: string;
  orderSource: OrderSource;
  products: Product[];
  purchasingContacts: CustomerContact[];
  salesRepId: string;
  salesUsers: User[];
  selectedBuyerNameId: string;
  selectedChannelId: string;
  selectedCustomerObj: Customer | undefined;
  selectedItContactId: string;
  selectedPurchasingContactId: string;
  sellerAvailableOrgs: string[];
  sellerCategoryLabel: string;
  sellerCategoryPickerRef: React.RefObject<HTMLDivElement | null>;
  sellerHoverCategory: string;
  sellerName: string;
  sellerProductCategory: string;
  setAgentCode: React.Dispatch<React.SetStateAction<string>>;
  setBusinessManagerId: React.Dispatch<React.SetStateAction<string>>;
  setDirectChannel: React.Dispatch<React.SetStateAction<string>>;
  setHasOpportunity: React.Dispatch<React.SetStateAction<'' | 'yes' | 'no'>>;
  setIsAgentOrder: React.Dispatch<React.SetStateAction<boolean>>;
  setIsContractPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOppPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSellerCategoryPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLinkedContractIds: React.Dispatch<React.SetStateAction<string[]>>;
  setLinkedOpportunityId: React.Dispatch<React.SetStateAction<string>>;
  setNewContactForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; email: string; position: string }>>;
  setNewOrderCustomer: React.Dispatch<React.SetStateAction<string>>;
  setNewOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  setOppItemWarnings: React.Dispatch<React.SetStateAction<OppItemWarning[]>>;
  setOrderEnterpriseId: React.Dispatch<React.SetStateAction<string>>;
  setSalesRepId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedBuyerNameId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedChannelId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedItContactId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedPurchasingContactId: React.Dispatch<React.SetStateAction<string>>;
  setSellerHoverCategory: React.Dispatch<React.SetStateAction<string>>;
  setSellerName: React.Dispatch<React.SetStateAction<string>>;
  setSellerProductCategory: React.Dispatch<React.SetStateAction<string>>;
  setShowNewContactModal: React.Dispatch<React.SetStateAction<'Purchasing' | 'IT' | null>>;
  setTerminalChannel: React.Dispatch<React.SetStateAction<string>>;
  subscriptionLock: null | { mode: 'renew' | 'addon'; lineProduct: SubscriptionLineProductSnapshot };
  terminalChannel: string;
  users: User[];
}

const Step2BasicInfo: React.FC<Step2BasicInfoProps> = ({
  agentCode,
  allEnterprises,
  businessManagerId,
  buyerType,
  categoryTree,
  channels,
  contracts,
  customers,
  directChannel,
  getVisibleFieldError,
  handleCustomerChange,
  handleSelfDealEnterpriseChange,
  hasOpportunity,
  isAgentOrder,
  isSellerCategoryPickerOpen,
  itContacts,
  linkedContractIds,
  linkedOpportunityId,
  markFieldTouched,
  newOrderCustomer,
  opportunities,
  orderEnterpriseId,
  orderSource,
  products,
  purchasingContacts,
  salesRepId,
  salesUsers,
  selectedBuyerNameId,
  selectedChannelId,
  selectedCustomerObj,
  selectedItContactId,
  selectedPurchasingContactId,
  sellerAvailableOrgs,
  sellerCategoryLabel,
  sellerCategoryPickerRef,
  sellerHoverCategory,
  sellerName,
  sellerProductCategory,
  setAgentCode,
  setBusinessManagerId,
  setDirectChannel,
  setHasOpportunity,
  setIsAgentOrder,
  setIsContractPickerOpen,
  setIsOppPickerOpen,
  setIsSellerCategoryPickerOpen,
  setLinkedContractIds,
  setLinkedOpportunityId,
  setNewContactForm,
  setNewOrderCustomer,
  setNewOrderItems,
  setOppItemWarnings,
  setOrderEnterpriseId,
  setSalesRepId,
  setSelectedBuyerNameId,
  setSelectedChannelId,
  setSelectedItContactId,
  setSelectedPurchasingContactId,
  setSellerHoverCategory,
  setSellerName,
  setSellerProductCategory,
  setShowNewContactModal,
  setTerminalChannel,
  subscriptionLock,
  terminalChannel,
  users
}) => {
  return (
                    <div className="space-y-2.5 animate-fade-in">

                        {/* 关联商机 */}
                        {buyerType !== 'SelfDeal' && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-purple-500"/> 关联商机 <span className="text-red-500 text-sm">*</span>
                                </h4>
                                <div className="flex gap-2">
                                    <button onClick={() => setHasOpportunity('yes')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${hasOpportunity === 'yes' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 shadow-sm' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300 dark:hover:border-white/20'}`}>
                                        <CheckCircle className="w-3.5 h-3.5"/>有商机
                                    </button>
                                    {buyerType !== 'Customer' && (
                                    <button onClick={() => setHasOpportunity('no')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${hasOpportunity === 'no' ? 'border-gray-500 bg-gray-100 dark:bg-gray-700/40 text-gray-700 dark:text-gray-200 shadow-sm' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300 dark:hover:border-white/20'}`}>
                                        <XCircle className="w-3.5 h-3.5"/>无商机
                                    </button>
                                    )}
                                </div>
                            </div>

                            {/* 有商机：选择商机 */}
                            {hasOpportunity === 'yes' && (
                                <div>
                                    {linkedOpportunityId ? (() => {
                                        const linkedOppObj = opportunities.find(o => o.id === linkedOpportunityId);
                                        const stageClass = linkedOppObj?.stage === '赢单' ? 'unified-tag-green !rounded-full' : linkedOppObj?.stage === '输单' ? 'unified-tag-gray !rounded-full' : linkedOppObj?.stage === '需求判断' ? 'unified-tag-blue !rounded-full' : linkedOppObj?.stage === '确认商机' ? 'unified-tag-indigo !rounded-full' : linkedOppObj?.stage === '确认渠道' ? 'unified-tag-purple !rounded-full' : 'unified-tag-yellow !rounded-full';
                                        return (
                                        <div className="p-3 bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">商机名称</div>
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{linkedOppObj?.name}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">商机编号</div>
                                                        <div className="text-xs font-mono text-gray-600 dark:text-gray-300">{linkedOppObj?.id}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">客户名称</div>
                                                        <div className="text-xs text-gray-700 dark:text-gray-300">{linkedOppObj?.customerName}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">商机阶段</div>
                                                        <span className={stageClass}>{linkedOppObj?.stage}</span>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">所属部门</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">{linkedOppObj?.department || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">负责人</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">{linkedOppObj?.ownerName || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">预计收入</div>
                                                        <div className="text-xs font-mono text-gray-700 dark:text-gray-300">{linkedOppObj?.expectedRevenue != null ? `¥${linkedOppObj.expectedRevenue.toLocaleString()}` : '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">预计关闭</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">{linkedOppObj?.closeDate ? new Date(linkedOppObj.closeDate).toLocaleDateString('zh-CN') : '-'}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { setLinkedOpportunityId(''); setNewOrderCustomer(''); setOrderEnterpriseId(''); setNewOrderItems([]); setSellerName(''); setOppItemWarnings([]); }}
                                                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5"/>
                                                </button>
                                            </div>
                                            {linkedOppObj?.products && linkedOppObj.products.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-green-200/50 dark:border-green-800/20">
                                                    <span className="text-[10px] text-gray-400 uppercase mr-1 self-center">产品:</span>
                                                    {linkedOppObj.products.map((p, pi) => (
                                                        <span key={pi} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/70 dark:bg-black/20 border border-green-200/60 dark:border-green-700/30 rounded-lg text-xs">
                                                            <span className="font-medium text-gray-800 dark:text-gray-200">{p.productName}</span>
                                                            {p.skuName && <span className="text-gray-400 dark:text-gray-500">/ {p.skuName}</span>}
                                                            {p.licenseType && <span className="text-green-600 dark:text-green-400 text-[10px]">({p.licenseType})</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })() : (
                                        <button
                                            onClick={() => setIsOppPickerOpen(true)}
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:border-[#0071E3] dark:hover:border-[#FF2D55] hover:text-[#0071E3] dark:hover:text-[#FF2D55] transition flex items-center justify-center gap-2"
                                        >
                                            <Briefcase className="w-4 h-4"/> 点击选择商机
                                        </button>
                                    )}
                                </div>
                            )}

                            {hasOpportunity === 'no' && (
                                <div className="text-xs text-gray-400 dark:text-gray-500">无关联商机，将手动填写客户信息。</div>
                            )}
                        </div>
                        )}

                        {/* 客户与买方信息 */}
                        {(buyerType === 'SelfDeal' || hasOpportunity === 'no' || (hasOpportunity === 'yes' && linkedOpportunityId)) && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-4">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-2">
                                <UserIcon className="w-4 h-4 text-indigo-500"/> 客户与买方信息
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {buyerType === 'SelfDeal' ? (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">企业 ID <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm"
                                            value={orderEnterpriseId}
                                            onChange={e => handleSelfDealEnterpriseChange(e.target.value)}
                                        >
                                            <option value="">-- 请选择企业 --</option>
                                            {allEnterprises.map(ent => (
                                                <option key={ent.entId} value={ent.entId}>{ent.entName} (ID: {ent.entId})</option>
                                            ))}
                                        </select>
                                    </div>
                                    {orderEnterpriseId && !allEnterprises.find(e => e.entId === orderEnterpriseId) && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">该企业 ID 未匹配到已有客户</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">关联客户</label>
                                    {newOrderCustomer ? (
                                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl">
                                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedCustomerObj?.companyName}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">自动匹配</div>
                                            </div>
                                        </div>
                                    ) : orderEnterpriseId ? (
                                        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                                            <div className="w-5 h-5 rounded-full border-2 border-amber-400 dark:border-amber-500 flex items-center justify-center shrink-0">
                                                <span className="text-amber-500 text-xs font-bold">?</span>
                                            </div>
                                            <div className="text-sm font-medium text-amber-700 dark:text-amber-400">企业暂未关联客户</div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 dark:bg-black/30 border border-dashed border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-400 dark:text-gray-500">
                                            选择企业后自动匹配
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">是否代理商订单</label>
                                    <button
                                        type="button"
                                        onClick={() => { setIsAgentOrder(!isAgentOrder); if (isAgentOrder) setAgentCode(''); }}
                                        className={`flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-all ${
                                            isAgentOrder
                                                ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/40 dark:bg-white/5'
                                                : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30'
                                        }`}
                                    >
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isAgentOrder ? 'bg-[#0071E3] dark:bg-[#FF2D55]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isAgentOrder ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </div>
                                        <span className={`text-sm font-medium ${isAgentOrder ? 'text-[#0071E3] dark:text-[#FF2D55]' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {isAgentOrder ? '是（代理商订单）' : '否'}
                                        </span>
                                    </button>
                                </div>
                                {isAgentOrder && (
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">代理商编号 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={agentCode}
                                        onChange={e => setAgentCode(e.target.value)}
                                        placeholder="请输入代理商编号"
                                        className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm text-gray-800 dark:text-white placeholder:text-gray-400"
                                    />
                                </div>
                                )}
                                </>
                                ) : hasOpportunity === 'yes' ? (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">选择客户 <span className="text-red-500">*</span></label>
                                    <select className={`w-full p-3 bg-white dark:bg-[#1C1C1E] border rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm ${getVisibleFieldError('newOrderCustomer') ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-white/10'}`} value={newOrderCustomer} onChange={e => handleCustomerChange(e.target.value)} onBlur={() => markFieldTouched('newOrderCustomer')}>
                                        <option value="">-- 请选择客户 --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                    </select>
                                    <FieldError error={getVisibleFieldError('newOrderCustomer')} />
                                    {linkedOpportunityId && (
                                        <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 mt-1">
                                            <Briefcase className="w-3 h-3 shrink-0" />
                                            <span>商机带入: {opportunities.find(o => o.id === linkedOpportunityId)?.name}，可手动调整</span>
                                        </div>
                                    )}
                                </div>
                                </>
                                ) : (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">选择客户 <span className="text-red-500">*</span></label>
                                    {subscriptionLock && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-1">来自订阅续费/增购，客户不可更换。</p>
                                    )}
                                    <select disabled={!!subscriptionLock} className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm disabled:opacity-60 disabled:cursor-not-allowed ${subscriptionLock ? 'bg-gray-100 dark:bg-white/5' : 'bg-white dark:bg-[#1C1C1E]'} ${getVisibleFieldError('newOrderCustomer') ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-white/10'}`} value={newOrderCustomer} onChange={e => handleCustomerChange(e.target.value)} onBlur={() => markFieldTouched('newOrderCustomer')}>
                                        <option value="">-- 请选择客户 --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                    </select>
                                    <FieldError error={getVisibleFieldError('newOrderCustomer')} />
                                </div>
                                </>
                                )}

                                {buyerType === 'Customer' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">买方名称（客户）</label>
                                    <select
                                        className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm"
                                        value={selectedBuyerNameId}
                                        onChange={e => setSelectedBuyerNameId(e.target.value)}
                                    >
                                        <option value="">-- 请选择买方 --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                    </select>
                                </div>
                                )}

                                {buyerType === 'Channel' && (
                                    <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">买方名称（代理商） <span className="text-red-500">*</span></label>
                                        <select className={`w-full p-3 bg-white dark:bg-[#1C1C1E] border rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm ${getVisibleFieldError('selectedChannelId') ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-white/10'}`} value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)} onBlur={() => markFieldTouched('selectedChannelId')}>
                                            <option value="">-- 选择渠道商 --</option>
                                            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <FieldError error={getVisibleFieldError('selectedChannelId')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">直接下级渠道</label>
                                        <input type="text" className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm" placeholder="买方订购本订单产品的渠道商" value={directChannel} onChange={e => setDirectChannel(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">终端渠道</label>
                                        <input type="text" className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm" placeholder="向最终用户销售本订单产品的渠道，与直接下级渠道不同时需要填写" value={terminalChannel} onChange={e => setTerminalChannel(e.target.value)} />
                                    </div>
                                    </>
                                )}
                                {buyerType !== 'SelfDeal' && (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">销售负责人</label>
                                    <select className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm" value={salesRepId} onChange={e => setSalesRepId(e.target.value)}>
                                        <option value="">-- 分配销售人员 --</option>
                                        {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">商务负责人</label>
                                    <select className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm" value={businessManagerId} onChange={e => setBusinessManagerId(e.target.value)}>
                                        <option value="">-- 分配商务人员 --</option>
                                        {users.filter(u => u.roles?.includes('Business') || u.roles?.includes('Admin')).map(u => <option key={u.id} value={u.id}>{u.name.replace(/\s*\(.*?\)/g, '')}</option>)}
                                    </select>
                                </div>
                                {linkedOpportunityId ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">卖方名称 <span className="text-red-500">*</span></label>
                                    <div className={`flex items-center gap-3 p-3 border rounded-xl ${sellerName ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/30' : getVisibleFieldError('sellerName') ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700' : 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/30'}`}>
                                        <Briefcase className="w-4 h-4 text-teal-500 shrink-0"/>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{sellerName || '—'}</div>
                                            <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">来自商机产品的销售组织</div>
                                        </div>
                                        <button onClick={() => setSellerName('')} className="text-gray-400 hover:text-red-500 p-0.5 transition shrink-0"><X className="w-3.5 h-3.5"/></button>
                                    </div>
                                </div>
                                ) : (
                                <>
                                <div className="space-y-2 relative" ref={sellerCategoryPickerRef}>
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">产品类型 <span className="text-red-500">*</span></label>
                                    <button
                                        type="button"
                                        onClick={() => { setIsSellerCategoryPickerOpen(!isSellerCategoryPickerOpen); if (!isSellerCategoryPickerOpen && !sellerHoverCategory && categoryTree.length > 0) setSellerHoverCategory(categoryTree[0].label); }}
                                        onBlur={() => markFieldTouched('sellerProductCategory')}
                                        className={`w-full p-3 bg-white dark:bg-[#1C1C1E] border rounded-xl outline-none text-sm text-left flex items-center justify-between transition ${isSellerCategoryPickerOpen ? 'ring-2 ring-[#0071E3] border-[#0071E3]' : getVisibleFieldError('sellerProductCategory') ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-white/10'}`}
                                    >
                                        <span className={sellerProductCategory ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{sellerCategoryLabel || '-- 请选择产品类型 --'}</span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSellerCategoryPickerOpen ? 'rotate-180' : ''}`}/>
                                    </button>
                                    {isSellerCategoryPickerOpen && (
                                        <div className="absolute z-50 bottom-full left-0 mb-1 w-[480px] bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden flex" style={{ height: 320 }}>
                                            <div className="w-[180px] border-r border-gray-100 dark:border-white/10 overflow-y-auto py-1">
                                                {categoryTree.map(cat => (
                                                    <div
                                                        key={cat.label}
                                                        onMouseEnter={() => setSellerHoverCategory(cat.label)}
                                                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                                                            sellerHoverCategory === cat.label
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
                                                {categoryTree.find(c => c.label === sellerHoverCategory)?.subs.map(sub => (
                                                    <div
                                                        key={sub}
                                                        onClick={() => { if (sellerProductCategory !== sub) { setSellerProductCategory(sub); setSellerName(''); } setIsSellerCategoryPickerOpen(false); }}
                                                        className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                                                            sellerProductCategory === sub
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-blue-400 font-bold'
                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                        }`}
                                                    >
                                                        {sellerProductCategory === sub && <Check className="w-3.5 h-3.5 text-[#0071E3] dark:text-blue-400 shrink-0"/>}
                                                        <span className="truncate">{sub}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <FieldError error={getVisibleFieldError('sellerProductCategory')} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">卖方名称（销售组织） <span className="text-red-500">*</span></label>
                                    <select
                                        className={`w-full p-3 bg-white dark:bg-[#1C1C1E] border rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm disabled:opacity-50 disabled:cursor-not-allowed ${getVisibleFieldError('sellerName') ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-white/10'}`}
                                        value={sellerName}
                                        onChange={e => setSellerName(e.target.value)}
                                        onBlur={() => markFieldTouched('sellerName')}
                                        disabled={sellerAvailableOrgs.length === 0}
                                    >
                                        <option value="">{sellerAvailableOrgs.length === 0 ? (sellerProductCategory ? '该分类下暂无销售组织' : '请先选择产品类型') : '-- 请选择卖方名称 --'}</option>
                                        {sellerAvailableOrgs.map(org => (
                                            <option key={org} value={org}>{org}</option>
                                        ))}
                                    </select>
                                    <FieldError error={getVisibleFieldError('sellerName')} />
                                </div>
                                </>
                                )}
                                </>
                                )}
                            </div>
                        </div>
                        )}

                        {/* 订单联系人选择 */}
                        {newOrderCustomer && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-3">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-2">
                                <Users className="w-4 h-4 text-teal-500"/> 订单联系人
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {/* 采购联系人 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">采购联系人 <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedPurchasingContactId}
                                            onChange={e => setSelectedPurchasingContactId(e.target.value)}
                                            onBlur={() => markFieldTouched('selectedPurchasingContactId')}
                                            className={`flex-1 px-3 py-2 border rounded-xl text-sm bg-white dark:bg-[#2C2C2E] text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition ${getVisibleFieldError('selectedPurchasingContactId') ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-white/10'}`}
                                        >
                                            <option value="">请选择采购联系人</option>
                                            {purchasingContacts.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}{c.isPrimary ? '（主要）' : ''}{c.position ? ` · ${c.position}` : ''}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => { setNewContactForm({ name: '', phone: '', email: '', position: '' }); setShowNewContactModal('Purchasing'); }}
                                            className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-bold text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl transition"
                                        >
                                            <Plus className="w-3.5 h-3.5"/>新建
                                        </button>
                                    </div>
                                    <FieldError error={getVisibleFieldError('selectedPurchasingContactId')} />
                                    {selectedPurchasingContactId && (() => {
                                        const c = purchasingContacts.find(x => x.id === selectedPurchasingContactId);
                                        if (!c) return null;
                                        return (
                                            <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs text-gray-600 dark:text-gray-300">
                                                {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-blue-500"/>{c.phone}</span>}
                                                {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-blue-500"/>{c.email}</span>}
                                                {!c.phone && !c.email && <span className="text-gray-400">暂无联系方式</span>}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* IT 联系人 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">IT 联系人 <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedItContactId}
                                            onChange={e => setSelectedItContactId(e.target.value)}
                                            onBlur={() => markFieldTouched('selectedItContactId')}
                                            className={`flex-1 px-3 py-2 border rounded-xl text-sm bg-white dark:bg-[#2C2C2E] text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition ${getVisibleFieldError('selectedItContactId') ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-white/10'}`}
                                        >
                                            <option value="">请选择 IT 联系人</option>
                                            {itContacts.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}{c.isPrimary ? '（主要）' : ''}{c.position ? ` · ${c.position}` : ''}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => { setNewContactForm({ name: '', phone: '', email: '', position: '' }); setShowNewContactModal('IT'); }}
                                            className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded-xl transition"
                                        >
                                            <Plus className="w-3.5 h-3.5"/>新建
                                        </button>
                                    </div>
                                    <FieldError error={getVisibleFieldError('selectedItContactId')} />
                                    {selectedItContactId && (() => {
                                        const c = itContacts.find(x => x.id === selectedItContactId);
                                        if (!c) return null;
                                        return (
                                            <div className="flex items-center gap-3 px-3 py-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/40 rounded-xl text-xs text-gray-600 dark:text-gray-300">
                                                {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-purple-500"/>{c.phone}</span>}
                                                {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-purple-500"/>{c.email}</span>}
                                                {!c.phone && !c.email && <span className="text-gray-400">暂无联系方式</span>}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        )}

                        {/* 关联合同 - 官网订单和自成交订单不需要选择合同 */}
                        {orderSource !== 'OnlineStore' && buyerType !== 'SelfDeal' && <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ScrollText className="w-4 h-4 text-blue-500"/> 关联合同
                                    {linkedContractIds.length > 0 && (
                                        <span className="text-sm font-normal text-gray-400 ml-1">({linkedContractIds.length}/5)</span>
                                    )}
                                </h4>
                                {linkedContractIds.length > 0 && linkedContractIds.length < 5 && (
                                    <button
                                        onClick={() => setIsContractPickerOpen(true)}
                                        className="flex items-center gap-1.5 text-sm font-medium text-[#0071E3] hover:text-blue-700 transition"
                                    >
                                        <Plus className="w-4 h-4"/> 添加合同
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {linkedContractIds.map(cid => {
                                    const c = contracts.find(ct => ct.id === cid);
                                    return (
                                        <div key={cid} className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                                            <ScrollText className="w-4 h-4 text-[#0071E3] shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c?.name || cid}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{c?.code}{c?.contractType ? ` · ${c.contractType}` : ''}</div>
                                            </div>
                                            <button
                                                onClick={() => setLinkedContractIds(prev => prev.filter(id => id !== cid))}
                                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition shrink-0"
                                            >
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    );
                                })}
                                {linkedContractIds.length === 0 && (
                                    <button
                                        onClick={() => setIsContractPickerOpen(true)}
                                        className="w-full p-4 bg-white dark:bg-[#2C2C2E] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-sm text-gray-400 dark:text-gray-500 hover:border-[#0071E3] dark:hover:border-[#0A84FF] hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition flex items-center justify-center gap-2"
                                    >
                                        <ScrollText className="w-4 h-4"/> 点击选择关联合同（选填，最多 5 个）
                                    </button>
                                )}
                                {linkedContractIds.length === 5 && (
                                    <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1 pl-1">
                                        <span>已达到最多 5 个合同的上限</span>
                                    </p>
                                )}
                            </div>
                        </div>}
                    </div>
  );
};

export default memoWithIgnoreCallbacks(Step2BasicInfo);
