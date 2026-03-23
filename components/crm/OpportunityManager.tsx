
import React, { useState } from 'react';
import { OpportunityStage } from '../../types';
import { Search, X } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const OpportunityManager: React.FC = () => {
  const { opportunities } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filtered = opportunities.filter(o => 
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const getStageColor = (stage: OpportunityStage) => {
      switch(stage) {
          case '需求判断': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
          case '确认商机': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
          case '确认渠道': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
          case '证实方案': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
          case '赢单': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
          case '输单': return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter pb-2 h-full flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">商机管理</h1>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-full sm:w-[320px] focus-within:border-blue-400 dark:focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition shadow-apple">
                    <div className="relative flex-1 flex items-center min-w-0">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
                        <input
                            type="text"
                            placeholder="搜索商机名称或客户…"
                            className="w-full h-full pl-8 pr-8 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="unified-card overflow-hidden mt-4 flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E] sticky top-0 z-10">
                        <tr>
                            <th className="pl-6 pr-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">商机编号</th>
                            <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">商机名称</th>
                            <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">客户名称</th>
                            <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">产品类型/授权方式</th>
                            <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">商机阶段</th>
                            <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">商机所属部门</th>
                            <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">商机金额</th>
                            <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">最终用户成交额</th>
                            <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">结单日期</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                        {currentItems.map(opp => (
                            <tr
                                key={opp.id}
                                className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0"
                            >
                                <td className="pl-6 pr-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">{opp.id}</td>
                                <td className="px-4 py-3 max-w-[200px]">
                                    <div className="font-medium text-gray-900 dark:text-white leading-snug">{opp.name}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{opp.customerName}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[220px]">
                                    <div className="line-clamp-2">{opp.productType || <span className="text-gray-300 dark:text-gray-600">—</span>}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap ${getStageColor(opp.stage)}`}>{opp.stage}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{opp.department || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{opp.amount != null ? `${opp.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元` : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{opp.finalUserRevenue != null ? `${opp.finalUserRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元` : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{new Date(opp.closeDate).toLocaleDateString('zh-CN')}</td>
                            </tr>
                        ))}
                        {currentItems.length === 0 && (
                            <tr><td colSpan={9} className="p-12 text-center text-gray-400">暂无商机数据</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5 shrink-0">
                <span className="text-xs text-gray-500 dark:text-gray-400">共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{filtered.length}</span> 条</span>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 dark:text-gray-500">第 {currentPage} / {totalPages} 页</span>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">上一页</button>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">下一页</button>
                    </div>
                </div>
            </div>
        </div>

    </div>
  );
};

export default OpportunityManager;
