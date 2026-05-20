import React from 'react';
import { X, Search } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import type { ConversionOrder } from '../../../types';

export interface ConversionPickerModalProps {
  availableConversionOrders: ConversionOrder[];
  conversionSearch: string;
  conversionSearchField: 'enterpriseName' | 'id';
  filteredConversionOrders: ConversionOrder[];
  isConversionPickerOpen: boolean;
  selectedConversionIds: string[];
  setConversionSearch: React.Dispatch<React.SetStateAction<string>>;
  setConversionSearchField: React.Dispatch<React.SetStateAction<'enterpriseName' | 'id'>>;
  setIsConversionPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedConversionIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const ConversionPickerModal: React.FC<ConversionPickerModalProps> = ({
  availableConversionOrders,
  conversionSearch,
  conversionSearchField,
  filteredConversionOrders,
  isConversionPickerOpen,
  selectedConversionIds,
  setConversionSearch,
  setConversionSearchField,
  setIsConversionPickerOpen,
  setSelectedConversionIds,
}) => {
  if (!isConversionPickerOpen) return null;
  return (
            <ModalPortal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fade-in">
                <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border-white/10 animate-modal-enter">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5 shrink-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">选择关联折算单</h3>
                        <button onClick={() => setIsConversionPickerOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 transition">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-3 shrink-0">
                        <select className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" value={conversionSearchField} onChange={e => setConversionSearchField(e.target.value as 'enterpriseName' | 'id')}>
                            <option value="enterpriseName">企业名称</option>
                            <option value="id">折算单号</option>
                        </select>
                        <div className="flex items-center gap-2 flex-1 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2">
                            <Search className="w-4 h-4 text-gray-400 shrink-0"/>
                            <input
                                type="text"
                                placeholder="请输入"
                                className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
                                value={conversionSearch}
                                onChange={e => setConversionSearch(e.target.value)}
                                autoFocus
                            />
                            {conversionSearch && (
                                <button onClick={() => setConversionSearch('')} className="text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4"/></button>
                            )}
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="unified-table-header sticky top-0">
                                <tr>
                                    <th className="p-4 pl-5 w-10">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-[#0071E3] rounded"
                                            checked={filteredConversionOrders.length > 0 && filteredConversionOrders.every(c => selectedConversionIds.includes(c.id))}
                                            ref={(el) => { if (el) el.indeterminate = filteredConversionOrders.some(c => selectedConversionIds.includes(c.id)) && !filteredConversionOrders.every(c => selectedConversionIds.includes(c.id)); }}
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    const newIds = new Set([...selectedConversionIds, ...filteredConversionOrders.map(c => c.id)]);
                                                    setSelectedConversionIds(Array.from(newIds));
                                                } else {
                                                    const removeIds = new Set(filteredConversionOrders.map(c => c.id));
                                                    setSelectedConversionIds(prev => prev.filter(id => !removeIds.has(id)));
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="p-4 whitespace-nowrap">折算单号</th>
                                    <th className="p-4 whitespace-nowrap text-center">折算金额</th>
                                    <th className="p-4 whitespace-nowrap">企业名称</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {filteredConversionOrders.length === 0 ? (
                                    <tr><td colSpan={4} className="p-10 text-center text-sm text-gray-400 dark:text-gray-500">未找到可用的折算单</td></tr>
                                ) : filteredConversionOrders.map(co => {
                                    const isSelected = selectedConversionIds.includes(co.id);
                                    return (
                                        <tr
                                            key={co.id}
                                            onClick={() => {
                                                if (isSelected) setSelectedConversionIds(prev => prev.filter(id => id !== co.id));
                                                else setSelectedConversionIds(prev => [...prev, co.id]);
                                            }}
                                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/80 dark:bg-blue-900/20' : 'hover:bg-blue-50/60 dark:hover:bg-white/[0.06]'}`}
                                        >
                                            <td className="p-4 pl-5"><input type="checkbox" className="w-4 h-4 accent-[#0071E3] rounded pointer-events-none" checked={isSelected} readOnly /></td>
                                            <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-300">{co.id}</td>
                                            <td className="p-4 text-center font-medium text-gray-900 dark:text-white">¥{co.amount.toLocaleString()}</td>
                                            <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{co.enterpriseName}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between shrink-0">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            折算总金额: <span className="text-amber-600 dark:text-amber-400">¥{selectedConversionIds.reduce((s, id) => s + (availableConversionOrders.find(c => c.id === id)?.amount ?? 0), 0).toLocaleString()}</span>
                        </span>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsConversionPickerOpen(false)} className="px-5 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition">取消</button>
                            <button onClick={() => setIsConversionPickerOpen(false)} className="unified-button-primary bg-[#0071E3] text-sm">确定</button>
                        </div>
                    </div>
                </div>
            </div>
            </ModalPortal>
  );
};

export default ConversionPickerModal;
