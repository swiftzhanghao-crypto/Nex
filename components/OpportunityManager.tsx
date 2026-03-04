
import React, { useState } from 'react';
import { Opportunity, OpportunityStage, Customer } from '../types';
import { Search, Plus, Target, DollarSign, Calendar, ChevronRight, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OpportunityManagerProps {
  opportunities: Opportunity[];
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  customers: Customer[];
}

const OpportunityManager: React.FC<OpportunityManagerProps> = ({ opportunities, setOpportunities, customers }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [formData, setFormData] = useState<Partial<Opportunity>>({
      name: '',
      customerId: '',
      expectedRevenue: 0,
      stage: 'New',
      probability: 10,
      closeDate: ''
  });

  const filtered = opportunities.filter(o => 
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleSave = () => {
      if (!formData.name || !formData.customerId) return;
      
      const customer = customers.find(c => c.id === formData.customerId);
      const newOpp: Opportunity = {
          id: `OPP${Date.now()}`,
          name: formData.name,
          customerId: formData.customerId,
          customerName: customer?.companyName || 'Unknown',
          expectedRevenue: Number(formData.expectedRevenue),
          stage: formData.stage as OpportunityStage,
          probability: Number(formData.probability),
          closeDate: formData.closeDate || new Date().toISOString(),
          ownerId: 'u1', 
          ownerName: 'Current User',
          createdAt: new Date().toISOString()
      };
      
      setOpportunities(prev => [newOpp, ...prev]);
      setIsModalOpen(false);
      setFormData({ name: '', customerId: '', expectedRevenue: 0, stage: 'New', probability: 10, closeDate: '' });
  };

  const getStageColor = (stage: OpportunityStage) => {
      switch(stage) {
          case 'New': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
          case 'Qualification': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
          case 'Proposal': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
          case 'Negotiation': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
          case 'Closed Won': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
          case 'Closed Lost': return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">商机管理</h1>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-[#0071E3] dark:bg-[#FF2D55] text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-sm">
                <Plus className="w-4 h-4" /> 新建商机
            </button>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="搜索商机名称或客户..." 
                    className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80 dark:bg-white/5 backdrop-blur border-b border-gray-200/50 dark:border-white/10 text-gray-400 dark:text-gray-500 font-medium text-xs uppercase">
                        <tr>
                            <th className="p-4 pl-6">商机名称</th>
                            <th className="p-4">客户</th>
                            <th className="p-4">阶段</th>
                            <th className="p-4">预计金额</th>
                            <th className="p-4">赢单率</th>
                            <th className="p-4">预计成交</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {currentItems.map(opp => (
                            <tr 
                                key={opp.id} 
                                className="group cursor-pointer hover:bg-gray-100/80 dark:hover:bg-white/[0.08] even:bg-gray-50/50 dark:even:bg-white/[0.02] transition-colors"
                                onClick={() => navigate(`/opportunities/${opp.id}`)}
                            >
                                <td className="p-4 pl-6">
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">{opp.name}</div>
                                    <div className="text-xs text-gray-400 font-mono mt-0.5">{opp.id}</div>
                                </td>
                                <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{opp.customerName}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStageColor(opp.stage)}`}>{opp.stage}</span>
                                </td>
                                <td className="p-4 font-bold text-gray-900 dark:text-white text-sm">¥{opp.expectedRevenue.toLocaleString()}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: `${opp.probability}%` }}></div>
                                        </div>
                                        {opp.probability}%
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{new Date(opp.closeDate).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        共 {filtered.length} 条数据
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium"
                        >
                            上一页
                        </button>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            第 {currentPage} 页 / 共 {totalPages} 页
                        </div>
                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            )}
            </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-modal-enter border border-white/10">
                    <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-white/5">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">新建商机</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">商机名称</label>
                            <input value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black rounded-xl p-3 text-sm outline-none text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">客户</label>
                             <select value={formData.customerId} onChange={e=>setFormData({...formData, customerId:e.target.value})} className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black rounded-xl p-3 text-sm outline-none text-gray-900 dark:text-white">
                                 <option value="">-- 选择客户 --</option>
                                 {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                             </select>
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">预计金额</label>
                            <input type="number" value={formData.expectedRevenue} onChange={e=>setFormData({...formData, expectedRevenue:Number(e.target.value)})} className="w-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black rounded-xl p-3 text-sm outline-none text-gray-900 dark:text-white" />
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-sm font-medium">取消</button>
                        <button onClick={handleSave} className="px-5 py-2.5 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-md text-sm font-medium">保存</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default OpportunityManager;
