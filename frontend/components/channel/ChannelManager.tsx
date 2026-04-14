import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';

const ChannelManager: React.FC = () => {
  const { channels } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.province || c.region).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredChannels.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentChannels = filteredChannels.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter pb-2 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">渠道管理</h1>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-full sm:w-[320px] focus-within:border-blue-400 dark:focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition shadow-apple">
            <div className="relative flex-1 flex items-center min-w-0">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
              <input
                type="text"
                placeholder="搜索渠道编号、名称或省份…"
                className="w-full h-full pl-8 pr-8 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); }}
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
                <th className="pl-6 pr-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">渠道编号</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">渠道名称</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">所在省份</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">最新签约情况</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">同步ERP状态</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {currentChannels.map(channel => (
                <tr
                  key={channel.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <td className="pl-6 pr-4 py-3 text-sm font-mono font-bold whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/channels/${channel.id}`)}
                      className="text-[#0071E3] dark:text-[#0A84FF] hover:underline cursor-pointer"
                    >
                      {channel.id}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 dark:text-white">{channel.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {channel.province || channel.region || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm ${
                      channel.contractStatus === '已签约'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {channel.contractStatus || '未签约'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm ${
                      channel.erpSyncStatus === '已同步'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {channel.erpSyncStatus || '未同步'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm ${
                      channel.status === 'Active'
                        ? 'text-gray-900 dark:text-white'
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      {channel.status === 'Active' ? '正常' : '已终止'}
                    </span>
                  </td>
                </tr>
              ))}
              {currentChannels.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center text-gray-400">暂无渠道数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400">共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{filteredChannels.length}</span> 条</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">第 {safeCurrentPage} / {totalPages} 页</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safeCurrentPage === 1} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">上一页</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">下一页</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelManager;
