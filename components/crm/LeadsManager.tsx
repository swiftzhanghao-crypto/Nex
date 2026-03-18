
import React, { useState } from 'react';
import { Target, Search, Filter, Plus, Clock, User, Building2, ChevronRight } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

const LeadsManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockLeads = [
    { id: 'L001', name: '某省政务云二期扩容', company: '省大数据中心', contact: '张主任', phone: '138****8888', source: '市场活动', status: '跟进中', date: '2024-03-01', amount: '¥2,000,000' },
    { id: 'L002', name: 'WPS AI 试点项目', company: '某大型国企', contact: '李经理', phone: '139****9999', source: '官网咨询', status: '初步对接', date: '2024-03-02', amount: '¥500,000' },
    { id: 'L003', name: '教育正版化采购', company: '市教育局', contact: '王老师', phone: '137****7777', source: '渠道报备', status: '方案建议', date: '2024-03-03', amount: '¥1,200,000' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">线索中心</h1>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="搜索线索、公司..."
              className="unified-card w-full pl-9 pr-4 py-2 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="unified-button-primary">
            <Plus className="w-4 h-4" /> 新增线索
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '本月新增线索', value: '128', change: '+12%', icon: Target, color: 'blue' },
          { label: '待跟进线索', value: '45', change: '-5%', icon: Clock, color: 'orange' },
          { label: '转化成功率', value: '24.5%', change: '+2.4%', icon: Building2, color: 'green' },
        ].map((stat, idx) => (
          <div key={idx} className="unified-card dark:bg-[#1C1C1E] p-6 border-gray-100 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">线索名称</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">公司/客户</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">线索来源</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">状态</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">预估金额</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {mockLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{lead.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{lead.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {lead.company.substring(0, 1)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{lead.company}</span>
                        <span className="text-[10px] text-gray-400">{lead.contact}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{lead.source}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                      ${lead.status === '跟进中' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 
                        lead.status === '初步对接' ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400' : 
                        'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'}
                    `}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{lead.amount}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-blue-600 transition">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadsManager;
