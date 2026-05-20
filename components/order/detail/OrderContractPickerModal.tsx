import React from 'react';
import { ScrollText, Search, X, CheckCircle } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import type { Order, Contract } from '../../../types';

export type OrderContractPickerModalProps = {
    contracts: Contract[];
    selectedOrder: Order;
    tempLinkedContractIds: string[];
    contractPickerSearch: string;
    onSearchChange: (v: string) => void;
    onToggleContract: (id: string) => void;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
};

export const OrderContractPickerModal: React.FC<OrderContractPickerModalProps> = ({
    contracts,
    selectedOrder,
    tempLinkedContractIds,
    contractPickerSearch,
    onSearchChange,
    onToggleContract,
    onClose,
    onConfirm,
}) => (
          <ModalPortal>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fade-in">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col border-white/10 animate-modal-enter">
                  <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5 shrink-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <ScrollText className="w-5 h-5 text-blue-500"/> 选择关联合同
                          <span className="text-sm font-normal text-gray-400">（已选 {tempLinkedContractIds.length}/5）</span>
                      </h3>
                      <button onClick={() => onClose()} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 transition">
                          <X className="w-5 h-5"/>
                      </button>
                  </div>
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-3 shrink-0">
                      <Search className="w-4 h-4 text-gray-400 shrink-0"/>
                      <input
                          type="text"
                          placeholder="搜索合同名称、编号、甲方或乙方..."
                          className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
                          value={contractPickerSearch}
                          onChange={e => onSearchChange(e.target.value)}
                          autoFocus
                      />
                      {contractPickerSearch && (
                          <button onClick={() => onSearchChange('')} className="text-gray-400 hover:text-gray-600 transition">
                              <X className="w-4 h-4"/>
                          </button>
                      )}
                  </div>
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                      <table className="w-full text-left text-sm">
                          <thead className="unified-table-header sticky top-0">
                              <tr>
                                  <th className="p-4 pl-5 whitespace-nowrap">合同名称</th>
                                  <th className="p-4 whitespace-nowrap">合同编号</th>
                                  <th className="p-4 whitespace-nowrap">合同类型</th>
                                  <th className="p-4 whitespace-nowrap">甲方</th>
                                  <th className="p-4 whitespace-nowrap text-right">签约金额</th>
                                  <th className="p-4 whitespace-nowrap">签署日期</th>
                                  <th className="p-4 whitespace-nowrap">状态</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                              {(() => {
                                  const q = contractPickerSearch.toLowerCase();
                                  const filtered = contracts.filter(c =>
                                      !q ||
                                      c.name.toLowerCase().includes(q) ||
                                      c.code.toLowerCase().includes(q) ||
                                      (c.partyA || '').toLowerCase().includes(q) ||
                                      (c.partyB || '').toLowerCase().includes(q)
                                  );
                                  if (filtered.length === 0) return (
                                      <tr>
                                          <td colSpan={7} className="p-10 text-center text-sm text-gray-400 dark:text-gray-500">
                                              未找到匹配的合同
                                          </td>
                                      </tr>
                                  );
                                  const statusLabel: Record<string, string> = {
                                      PENDING_BUSINESS: '待商务审核', PENDING: '待审核',
                                      VERIFIED: '已审核', APPROVED: '已批准', REJECTED: '已拒绝',
                                  };
                                  const statusTagClass: Record<string, string> = {
                                      PENDING_BUSINESS: 'unified-tag-yellow !rounded-full',
                                      PENDING: 'unified-tag-blue !rounded-full',
                                      VERIFIED: 'unified-tag-indigo !rounded-full',
                                      APPROVED: 'unified-tag-green !rounded-full',
                                      REJECTED: 'unified-tag-red !rounded-full',
                                  };
                                  return filtered.map(c => {
                                      const isSelected = tempLinkedContractIds.includes(c.id);
                                      const isDisabled = !isSelected && tempLinkedContractIds.length >= 5;
                                      return (
                                          <tr
                                              key={c.id}
                                              onClick={() => {
                                                  if (isDisabled) return;
                                                  if (isSelected) {
                                                      onToggleContract(c.id);
                                                  } else {
                                                      onToggleContract(c.id);
                                                  }
                                              }}
                                              className={`transition-colors ${
                                                  isDisabled
                                                      ? 'opacity-40 cursor-not-allowed'
                                                      : isSelected
                                                      ? 'bg-blue-50/80 dark:bg-blue-900/20 cursor-pointer'
                                                      : 'hover:bg-blue-50/60 dark:hover:bg-white/[0.06] cursor-pointer group'
                                              }`}
                                          >
                                              <td className="p-4 pl-5 max-w-[220px]">
                                                  <div className={`font-medium truncate flex items-center gap-2 ${isSelected ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-900 dark:text-white group-hover:text-[#0071E3] dark:group-hover:text-[#0A84FF]'} transition-colors`}>
                                                      {isSelected && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                                                      {c.name}
                                                  </div>
                                                  {c.externalCode && <div className="text-xs text-gray-400 font-mono mt-0.5">{c.externalCode}</div>}
                                              </td>
                                              <td className="p-4 text-gray-600 dark:text-gray-300 font-mono whitespace-nowrap">{c.code}</td>
                                              <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{c.contractType}</td>
                                              <td className="p-4 text-gray-700 dark:text-gray-300 max-w-[160px]">
                                                  <div className="truncate">{c.partyA || '-'}</div>
                                              </td>
                                              <td className="p-4 text-right whitespace-nowrap font-mono text-gray-700 dark:text-gray-300">
                                                  {c.amount != null ? `¥${c.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                              </td>
                                              <td className="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                  {c.signDate ? new Date(c.signDate).toLocaleDateString('zh-CN') : '-'}
                                              </td>
                                              <td className="p-4 whitespace-nowrap">
                                                  <span className={statusTagClass[c.verifyStatus] || 'unified-tag-gray !rounded-full'}>
                                                      {statusLabel[c.verifyStatus] || c.verifyStatus}
                                                  </span>
                                              </td>
                                          </tr>
                                      );
                                  });
                              })()}
                          </tbody>
                      </table>
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between shrink-0">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                          {tempLinkedContractIds.length === 0 ? '点击行选择合同' : `已选 ${tempLinkedContractIds.length} 个合同`}
                      </span>
                      <button
                          onClick={async () => {
                              await onConfirm();
                          }}
                          className="unified-button-primary bg-[#0071E3] text-sm"
                      >
                          确定
                      </button>
                  </div>
              </div>
          </div>
          </ModalPortal>
);
