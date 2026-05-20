import React from 'react';
import { Briefcase, X, Search } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import type { Opportunity, Product } from '../../../types';

export interface OpportunityPickerModalProps {
  handleOpportunityChange: (oppId: string) => void;
  isOppPickerOpen: boolean;
  oppPickerSearch: string;
  opportunities: Opportunity[];
  products: Product[];
  setIsOppPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setOppPickerSearch: React.Dispatch<React.SetStateAction<string>>;
}

const OpportunityPickerModal: React.FC<OpportunityPickerModalProps> = ({
  handleOpportunityChange,
  isOppPickerOpen,
  oppPickerSearch,
  opportunities,
  products,
  setIsOppPickerOpen,
  setOppPickerSearch,
}) => {
  if (!isOppPickerOpen) return null;
  return (
            <ModalPortal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fade-in">
                <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-6xl max-h-[80vh] flex flex-col border-white/10 animate-modal-enter">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5 shrink-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-500"/> 选择商机
                        </h3>
                        <button onClick={() => { setIsOppPickerOpen(false); setOppPickerSearch(''); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 transition">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-3 shrink-0">
                        <Search className="w-4 h-4 text-gray-400 shrink-0"/>
                        <input
                            type="text"
                            placeholder="搜索商机名称、客户名称或商机编号..."
                            className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
                            value={oppPickerSearch}
                            onChange={e => setOppPickerSearch(e.target.value)}
                            autoFocus
                        />
                        {oppPickerSearch && (
                            <button onClick={() => setOppPickerSearch('')} className="text-gray-400 hover:text-gray-600 transition">
                                <X className="w-4 h-4"/>
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="unified-table-header sticky top-0">
                                <tr>
                                    <th className="p-4 pl-5 whitespace-nowrap">商机编号</th>
                                    <th className="p-4 whitespace-nowrap">商机名称</th>
                                    <th className="p-4 whitespace-nowrap">客户名称</th>
                                    <th className="p-4 whitespace-nowrap">产品名称/授权类型</th>
                                    <th className="p-4 whitespace-nowrap">所属部门</th>
                                    <th className="p-4 whitespace-nowrap">商机阶段</th>
                                    <th className="p-4 whitespace-nowrap">最终成交金额</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {opportunities
                                    .filter(o =>
                                        !oppPickerSearch ||
                                        o.name.toLowerCase().includes(oppPickerSearch.toLowerCase()) ||
                                        o.customerName.toLowerCase().includes(oppPickerSearch.toLowerCase()) ||
                                        o.id.toLowerCase().includes(oppPickerSearch.toLowerCase())
                                    )
                                    .map(o => (
                                        <tr
                                            key={o.id}
                                            onClick={() => {
                                                handleOpportunityChange(o.id);
                                                setIsOppPickerOpen(false);
                                                setOppPickerSearch('');
                                            }}
                                            className="cursor-pointer hover:bg-blue-50/60 dark:hover:bg-white/[0.06] transition-colors group"
                                        >
                                            <td className="p-4 pl-5 text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap text-xs">{o.id}</td>
                                            <td className="p-4 max-w-[200px]">
                                                <div className="font-medium text-gray-900 dark:text-white group-hover:text-[#0071E3] dark:group-hover:text-[#FF2D55] transition-colors line-clamp-2">{o.name}</div>
                                            </td>
                                            <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{o.customerName}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400 max-w-[240px]">
                                                {o.products && o.products.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {o.products.map((p, pi) => (
                                                            <span key={pi} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[11px] leading-tight">
                                                                <span className="font-medium text-gray-700 dark:text-gray-300">{p.productName}</span>
                                                                {p.skuName && <span className="text-gray-400">/{p.skuName}</span>}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs">{o.productType || '-'}</div>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs">{o.department || '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                                                    o.stage === '赢单' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    o.stage === '输单' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' :
                                                    o.stage === '需求判断' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    o.stage === '确认商机' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                    o.stage === '确认渠道' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                }`}>{o.stage}</span>
                                            </td>
                                            <td className="p-4 text-gray-900 dark:text-white whitespace-nowrap font-medium">
                                                {o.finalUserRevenue != null ? `${o.finalUserRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元` : o.amount != null ? `${o.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                {opportunities.filter(o =>
                                    !oppPickerSearch ||
                                    o.name.toLowerCase().includes(oppPickerSearch.toLowerCase()) ||
                                    o.customerName.toLowerCase().includes(oppPickerSearch.toLowerCase())
                                ).length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-10 text-center text-sm text-gray-400 dark:text-gray-500">
                                            未找到匹配的商机
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </ModalPortal>
  );
};

export default OpportunityPickerModal;
