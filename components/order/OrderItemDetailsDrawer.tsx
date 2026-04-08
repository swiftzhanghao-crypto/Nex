import React, { useState } from 'react';
import { OrderItem, Product, SubUnit } from '../../types';
import { X, Box, CreditCard, Truck, Package, Disc, AlertCircle, ShieldCheck, RefreshCcw, Building2 } from 'lucide-react';

interface Props {
  item: OrderItem | null;
  itemIndex: number;
  isClosing: boolean;
  onClose: () => void;
  products: Product[];
  selectedOrder: any;
}

const OrderItemDetailsDrawer: React.FC<Props> = ({ item, itemIndex, isClosing, onClose, products, selectedOrder }) => {
  const [itemDetailTab, setItemDetailTab] = useState<'INFO' | 'SUBUNIT'>('INFO');
  if (!item) return null;
  const selectedItemForDetails = item;
  const selectedItemIndex = itemIndex;
  const isItemDetailsClosing = isClosing;

  return (
    <>
          <div className="fixed inset-y-0 right-0 left-[240px] z-[70] flex justify-end">
              <div 
                  className={`absolute inset-0 bg-black/20 backdrop-blur-sm ${isItemDetailsClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`}
                  onClick={() => {
                      setTimeout(() => {
                          onClose();
                      }, 300);
                  }}
              />
              <div className={`w-full bg-white dark:bg-[#1C1C1E] h-full shadow-2xl flex flex-col relative z-10 ${isItemDetailsClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                  <div className="unified-card p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center dark:bg-[#1C1C1E] shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                              <Package className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                              <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">订单产品明细详情</h3>
                                  <span className="text-xl font-bold text-gray-500 dark:text-gray-400 font-mono">
                                      {selectedOrder.id}-{String(selectedItemIndex + 1).padStart(3, '0')}
                                  </span>
                              </div>
                          </div>
                      </div>
                      <button 
                          onClick={() => {
                              setTimeout(() => {
                                  onClose();
                              }, 300);
                          }} 
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                          <X className="w-6 h-6"/>
                      </button>
                  </div>
                  
                  <div className="border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#1C1C1E] shrink-0">
                      <div className="flex items-center gap-0.5 px-6">
                          {[
                              { id: 'INFO' as const, label: '明细信息', icon: Box },
                              { id: 'SUBUNIT' as const, label: '下级单位授权', icon: Building2 },
                          ].map(tab => (
                              <button
                                  key={tab.id}
                                  onClick={() => setItemDetailTab(tab.id)}
                                  className={`relative flex items-center gap-1.5 px-5 py-3 text-sm font-bold transition-all ${
                                      itemDetailTab === tab.id
                                          ? 'text-[#0071E3] dark:text-[#0A84FF]'
                                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                  }`}
                              >
                                  <tab.icon className="w-4 h-4" />
                                  {tab.label}
                                  {tab.id === 'SUBUNIT' && selectedItemForDetails.subUnits && selectedItemForDetails.subUnits.length > 0 && (
                                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">{selectedItemForDetails.subUnits.length}</span>
                                  )}
                                  {itemDetailTab === tab.id && (
                                      <span className="absolute bottom-0 left-5 right-5 h-[2px] bg-[#0071E3] dark:bg-[#0A84FF] rounded-full" />
                                  )}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/30 dark:bg-black/20">

                  {itemDetailTab === 'INFO' && (
                      <div className="grid grid-cols-3 gap-4">

                          <div className="col-span-2 space-y-4">

                              {/* 产品交易信息 */}
                              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <Box className="w-5 h-5 text-blue-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">产品交易信息</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const itemAmount = selectedItemForDetails.priceAtPurchase * selectedItemForDetails.quantity;
                                          const fmt = (n: number) => `¥${n.toLocaleString()}`;
                                          const fields = [
                                              { label: '产品名称', value: selectedItemForDetails.productName || '-', isAmount: false },
                                              { label: '产品规格', value: [selectedItemForDetails.skuName, selectedItemForDetails.skuCode].filter(Boolean).join('  ·  ') || '-', isAmount: false },
                                              { label: '授权类型', value: selectedItemForDetails.pricingOptionName || selectedItemForDetails.licenseType || '-', isAmount: false },
                                              { label: '产品类型', value: selectedItemForDetails.productType || '-', isAmount: false },
                                              { label: '数量', value: String(selectedItemForDetails.quantity), isAmount: false },
                                              { label: '单价', value: fmt(selectedItemForDetails.priceAtPurchase), isAmount: true },
                                              { label: '计价数量', value: String(selectedItemForDetails.quantity), isAmount: false },
                                              { label: '计价单价', value: selectedItemForDetails.pricingUnitPrice != null ? fmt(selectedItemForDetails.pricingUnitPrice) : '-', isAmount: true },
                                              { label: '产品金额', value: fmt(itemAmount), isAmount: true },
                                          ];
                                          return (
                                              <div className="grid grid-cols-2 gap-x-6">
                                                  {fields.map((f, idx) => (
                                                      <div key={idx} className={`flex items-start gap-4 py-3.5 ${idx < fields.length - 2 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{f.label}</span>
                                                          <span className={`text-sm font-medium flex-1 ${f.isAmount ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{f.value}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                              {/* 产品授权信息 */}
                              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <ShieldCheck className="w-5 h-5 text-purple-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">产品授权信息</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const fields = [
                                              { label: '被授权方', value: selectedItemForDetails.licensee || '-' },
                                              { label: '授权范围', value: selectedItemForDetails.licenseScope || '企业内部使用' },
                                              { label: '授权/服务期限', value: (selectedItemForDetails.licensePeriod && selectedItemForDetails.licensePeriod !== '永久') ? selectedItemForDetails.licensePeriod : '-' },
                                              { label: '授权开始计算', value: selectedItemForDetails.licenseStartMethod || '-' },
                                              { label: '授权截止日期', value: selectedItemForDetails.licenseEndDate || '-' },
                                              { label: '是否下级单位提供授权', value: selectedItemForDetails.subUnitLicenseAllowed == null ? '-' : selectedItemForDetails.subUnitLicenseAllowed ? '是' : '否' },
                                              { label: '升级保障期限', value: selectedItemForDetails.upgradeWarrantyPeriod || '-' },
                                              { label: '售后保障期限', value: selectedItemForDetails.afterSaleWarrantyPeriod || '1年' },
                                          ];
                                          return (
                                              <div className="grid grid-cols-2 gap-x-6">
                                                  {fields.map((f, idx) => (
                                                      <div key={idx} className={`flex items-start gap-4 py-3.5 ${idx < fields.length - 2 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{f.label}</span>
                                                          <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{f.value}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                              {/* 产品价格参考 */}
                              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <CreditCard className="w-5 h-5 text-green-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">产品价格参考</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const fields = [
                                              { label: '渠道等级', value: selectedItemForDetails.channelLevel || '-', isAmount: false },
                                              { label: '协议编号', value: selectedItemForDetails.agreementNo || '-', isAmount: false },
                                              { label: '匹配价格类型', value: selectedItemForDetails.matchedPriceType || '-', isAmount: false },
                                              { label: '匹配价格', value: selectedItemForDetails.matchedPrice != null ? `¥${selectedItemForDetails.matchedPrice.toLocaleString()}` : '-', isAmount: true },
                                              { label: '匹配价格ID', value: selectedItemForDetails.matchedPriceId || '-', isAmount: false },
                                              { label: '建议销售价', value: selectedItemForDetails.suggestedRetailPrice != null ? `¥${selectedItemForDetails.suggestedRetailPrice.toLocaleString()}` : '-', isAmount: true },
                                          ];
                                          return (
                                              <div className="grid grid-cols-2 gap-x-6">
                                                  {fields.map((f, idx) => (
                                                      <div key={idx} className={`flex items-start gap-4 py-3.5 ${idx < fields.length - 2 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{f.label}</span>
                                                          <span className={`text-sm font-medium flex-1 ${f.isAmount ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{f.value}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                          </div>

                          {/* 右侧小列 (1/3)：续费信息 + 产品交付信息 + 安装包 纵向排列 */}
                          <div className="space-y-4">

                              {/* 续费信息 */}
                              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <RefreshCcw className="w-5 h-5 text-green-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">续费信息</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const purchaseNatureLabel = (() => {
                                              switch (selectedItemForDetails.purchaseNature) {
                                                  case 'New': return '新购';
                                                  case 'Renewal': return '续费';
                                                  case 'AddOn': return '增购';
                                                  case 'Upgrade': return '升级';
                                                  default: return '-';
                                              }
                                          })();
                                          const purchaseNature365Label = (() => {
                                              switch (selectedItemForDetails.purchaseNature365) {
                                                  case 'New': return '新购';
                                                  case 'Renewal': return '续费';
                                                  case 'AddOn': return '增购';
                                                  case 'Upgrade': return '升级';
                                                  default: return '-';
                                              }
                                          })();
                                          const fields = [
                                              { label: '订购性质', value: purchaseNatureLabel },
                                              { label: '增续类型', value: selectedItemForDetails.renewalSubType || '-' },
                                              { label: '365 订购性质', value: purchaseNature365Label },
                                          ];
                                          return (
                                              <div className="divide-y divide-gray-50 dark:divide-white/5">
                                                  {fields.map((f, idx) => (
                                                      <div key={idx} className="flex items-center gap-8 py-3.5">
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{f.label}</span>
                                                          <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{f.value}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                              {/* 产品交付信息 */}
                              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <Truck className="w-5 h-5 text-indigo-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">产品交付信息</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const activationLabel = (() => {
                                              switch (selectedItemForDetails.activationMethod) {
                                                  case 'Account': return '账号激活';
                                                  case 'SerialKey': return '序列号激活';
                                                  case 'AccountAndSerialKey': return '账号+序列号';
                                                  case 'LicenseKey': return '授权码激活';
                                                  case 'Online': return '在线激活';
                                                  case 'Dongle': return '加密狗';
                                                  default: return '-';
                                              }
                                          })();
                                          const distMode = selectedItemForDetails.distributionMode
                                              || (selectedItemIndex % 2 === 0 ? '账号分发' : '兑换码分发');
                                          const enterpriseName = selectedItemForDetails.enterpriseName || selectedOrder.customerName;
                                          const enterpriseId = selectedItemForDetails.enterpriseId
                                              || String(parseInt(selectedOrder.id.replace(/\D/g, '').slice(-6) || '100000', 10) + 500000000).slice(0, 9);
                                          const fields = [
                                              { label: '分发模式', value: distMode },
                                              { label: '激活方式', value: activationLabel },
                                              { label: '企业名称', value: enterpriseName },
                                              { label: '企业ID', value: enterpriseId },
                                              { label: '供货组织信息', value: selectedItemForDetails.supplyOrgInfo || '-' },
                                          ];
                                          return (
                                              <div className="divide-y divide-gray-50 dark:divide-white/5">
                                                  {fields.map((f, idx) => (
                                                      <div key={idx} className="flex items-center gap-8 py-3.5">
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{f.label}</span>
                                                          <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{f.value}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                              {/* 交付物信息 */}
                              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <Disc className="w-5 h-5 text-blue-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">交付物信息</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const product = products.find(p => p.id === selectedItemForDetails.productId);
                                          const pkg = product?.installPackages?.[0];
                                          const itemPkgType = selectedItemForDetails.installPackageType;
                                          const itemPkgName = selectedItemForDetails.installPackageName;
                                          const itemPkgLink = selectedItemForDetails.installPackageLink;

                                          const activationLabel = (() => {
                                              switch (selectedItemForDetails.activationMethod) {
                                                  case 'Account': return '账号激活';
                                                  case 'SerialKey': return '序列号激活';
                                                  case 'AccountAndSerialKey': return '账号+序列号';
                                                  case 'LicenseKey': return '授权码激活';
                                                  case 'Online': return '在线激活';
                                                  case 'Dongle': return '加密狗';
                                                  default: return '-';
                                              }
                                          })();

                                          const rows: { label: string; value: string; isLink?: boolean }[] = [];

                                          rows.push({ label: '激活方式', value: activationLabel });
                                          rows.push({ label: '介质数量', value: String(selectedItemForDetails.mediaCount ?? 1) });
                                          rows.push({ label: '安装包类型', value: itemPkgType || '-' });
                                          rows.push({ label: '安装包名称', value: itemPkgName || pkg?.name || '-' });

                                          if (pkg) {
                                              rows.push(
                                                  { label: '安装包编号', value: pkg.id },
                                                  { label: 'CPU', value: pkg.cpu || '-' },
                                                  { label: '操作系统', value: pkg.os || '-' },
                                                  { label: '发布平台', value: pkg.platform || '-' },
                                                  { label: '安装包链接', value: pkg.url || '-', isLink: true },
                                                  { label: '安装包备注', value: pkg.remarks || '-' },
                                              );
                                          }

                                          if (itemPkgLink) {
                                              rows.push({ label: '定制安装包链接', value: itemPkgLink, isLink: true });
                                          }

                                          return (
                                              <div className="divide-y divide-gray-50 dark:divide-white/5">
                                                  {rows.map((row, i) => (
                                                      <div key={i} className="flex items-center gap-8 py-3.5">
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{row.label}</span>
                                                          {row.isLink && row.value !== '-' ? (
                                                              <a href={row.value} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline flex-1 truncate">{row.value}</a>
                                                          ) : row.label === '安装包类型' ? (
                                                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${row.value === '通用' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : row.value === '定制' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>{row.value}</span>
                                                          ) : row.label === '激活方式' ? (
                                                              <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/30">{row.value}</span>
                                                          ) : (
                                                              <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{row.value}</span>
                                                          )}
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                          </div>
                      </div>
                  )}

                  {itemDetailTab === 'SUBUNIT' && (
                      <div className="space-y-4">
                          {selectedItemForDetails.subUnitAuthMode && selectedItemForDetails.subUnitAuthMode !== 'none' ? (
                              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                          <Building2 className="w-5 h-5 text-indigo-500" />
                                          <h4 className="text-base font-semibold text-gray-900 dark:text-white">下级单位授权</h4>
                                      </div>
                                      <span className="text-xs px-3 py-1 rounded-lg font-bold border bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                                          {{ separate_auth_separate_eid: '授权分别呈现，企业ID分别管理', separate_auth_unified_eid: '授权分别呈现，企业ID统一管理', unified_auth_with_list: '授权和企业ID统一管理并提供下级清单' }[selectedItemForDetails.subUnitAuthMode] || selectedItemForDetails.subUnitAuthMode}
                                      </span>
                                  </div>
                                  {selectedItemForDetails.subUnits && selectedItemForDetails.subUnits.length > 0 ? (
                                      <div className="overflow-x-auto">
                                          <table className="w-full text-left text-sm">
                                              <thead><tr className="bg-indigo-50/50 dark:bg-indigo-900/10 text-xs text-indigo-700 dark:text-indigo-300 font-bold">
                                                  <th className="px-4 py-3 pl-5 text-center w-10">#</th>
                                                  <th className="px-4 py-3">单位名称</th>
                                                  <th className="px-4 py-3">企业ID</th>
                                                  <th className="px-4 py-3">企业名称</th>
                                                  <th className="px-4 py-3 text-center">授权数量</th>
                                                  <th className="px-4 py-3">IT联系人</th>
                                                  <th className="px-4 py-3">手机</th>
                                                  <th className="px-4 py-3">邮箱</th>
                                                  <th className="px-4 py-3">客户类型</th>
                                                  <th className="px-4 py-3">行业线</th>
                                                  <th className="px-4 py-3">卖方联系人</th>
                                              </tr></thead>
                                              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                                  {(selectedItemForDetails.subUnits as SubUnit[]).map((unit, ui) => (
                                                  <tr key={unit.id} className="text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                      <td className="px-4 py-3 pl-5 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{ui + 1}</span></td>
                                                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{unit.unitName || '-'}</td>
                                                      <td className="px-4 py-3 font-mono text-xs text-[#0071E3] dark:text-[#0A84FF] font-bold">{unit.enterpriseId || '-'}</td>
                                                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{unit.enterpriseName || '-'}</td>
                                                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-center">{unit.authCount || '-'}</td>
                                                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{unit.itContact || '-'}</td>
                                                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{unit.phone || '-'}</td>
                                                      <td className="px-4 py-3 text-gray-500 text-xs">{unit.email || '-'}</td>
                                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{unit.customerType || '-'}</td>
                                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{unit.industryLine || '-'}</td>
                                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{unit.sellerContact || '-'}</td>
                                                  </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  ) : (
                                      <div className="px-5 py-8 text-center text-gray-400 text-sm">暂无下级单位数据</div>
                                  )}
                                  {selectedItemForDetails.subUnits && selectedItemForDetails.subUnits.length > 0 && (
                                      <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                                          <span className="text-gray-500">共 {selectedItemForDetails.subUnits.length} 个下级单位</span>
                                          <span className={`font-bold ${(selectedItemForDetails.subUnits as SubUnit[]).reduce((s, u) => s + (parseInt(u.authCount) || 0), 0) === selectedItemForDetails.quantity ? 'text-green-600' : 'text-red-600'}`}>
                                              合计: {(selectedItemForDetails.subUnits as SubUnit[]).reduce((s, u) => s + (parseInt(u.authCount) || 0), 0)} / 明细数量: {selectedItemForDetails.quantity}
                                          </span>
                                      </div>
                                  )}
                              </div>
                          ) : (
                              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10">
                                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                                      <Building2 className="w-10 h-10 mb-3 opacity-30" />
                                      <p className="text-sm font-medium">该明细行未配置下级单位授权</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  </div>
              </div>
          </div>

    </>
  );
};

export default OrderItemDetailsDrawer;
