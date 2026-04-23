
import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Upload, Edit, Users, RefreshCw, Settings, ChevronLeft, ChevronRight, ChevronDown, Copy } from 'lucide-react';

interface Lead {
  id: string;
  companyName: string;
  linkedEnterprise: string;
  source1: string;
  source2: string;
  source3: string;
  contactName: string;
  contactTitle: string;
  salesOwner: string;
}

const generateMockLeads = (): Lead[] => {
  const enterprises = ['-', '标讯', '-'];
  const source1List = ['官网', '标讯'];
  const source2List = ['搜狗', '千里马', '搜狗'];
  const contacts = [
    { name: '测试A006', title: '-' },
    { name: '测试A029', title: '-' },
    { name: '测试A047', title: '-' },
    { name: '测试A069', title: '-' },
    { name: '李工', title: '-' },
    { name: '测试A005', title: '-' },
    { name: '测试A034', title: '-' },
    { name: '测试A035', title: '-' },
    { name: '测试A055', title: '-' },
    { name: '测试A086', title: '-' },
    { name: '测试A012', title: '-' },
    { name: '测试A042', title: '-' },
  ];
  const owners = ['韩浩君', '编辑', '韩浩君', '碎领', '韩浩君', '碎源', '碎领', '韩浩君', '韩浩君', '韩浩君', '碎源', '韩浩君'];

  const rows: Lead[] = [
    { id: '11', companyName: '测试1111', linkedEnterprise: '-', source1: '官网', source2: 'MQL', source3: '999', contactName: '3333333333', contactTitle: '-', salesOwner: '韩浩君' },
    { id: '17', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试339', contactName: '测试A006', contactTitle: '-', salesOwner: '韩浩君' },
    { id: '36', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试362', contactName: '测试A029', contactTitle: '-', salesOwner: '韩浩君' },
    { id: '54', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试380', contactName: '测试A047', contactTitle: '-', salesOwner: '碎领' },
    { id: '76', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试402', contactName: '测试A069', contactTitle: '-', salesOwner: '碎源' },
    { id: '5000017', companyName: '深圳市金星世纪...', linkedEnterprise: '标讯', source1: '千里马', source2: 'SZGX2025042004200...', source3: '', contactName: '李工', contactTitle: '-', salesOwner: '碎领' },
    { id: '16', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试338', contactName: '测试A005', contactTitle: '-', salesOwner: '韩浩君' },
    { id: '41', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试367', contactName: '测试A034', contactTitle: '-', salesOwner: '韩浩君' },
    { id: '42', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试368', contactName: '测试A035', contactTitle: '-', salesOwner: '韩浩君' },
    { id: '62', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试388', contactName: '测试A055', contactTitle: '-', salesOwner: '韩浩君' },
    { id: '93', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试419', contactName: '测试A086', contactTitle: '-', salesOwner: '碎源' },
    { id: '19', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试345', contactName: '测试A012', contactTitle: '-', salesOwner: '韩浩君' },
    { id: '49', companyName: '测试导入041600...', linkedEnterprise: '-', source1: '官网', source2: '搜狗', source3: '测试375', contactName: '测试A042', contactTitle: '-', salesOwner: '韩浩君' },
  ];

  const extra: Lead[] = [];
  for (let i = 0; i < 264; i++) {
    const idx = i % contacts.length;
    extra.push({
      id: String(100 + i),
      companyName: `测试导入041600...`,
      linkedEnterprise: enterprises[i % enterprises.length],
      source1: source1List[i % source1List.length],
      source2: source2List[i % source2List.length],
      source3: `测试${400 + i}`,
      contactName: contacts[idx].name,
      contactTitle: contacts[idx].title,
      salesOwner: owners[idx],
    });
  }

  return [...rows, ...extra];
};

const ALL_LEADS = generateMockLeads();
const TOTAL = ALL_LEADS.length;

const LeadsManager: React.FC = () => {
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataScope, setDataScope] = useState('所有数据');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const totalPages = Math.ceil(TOTAL / pageSize);
  const pageLeads = useMemo(
    () => ALL_LEADS.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === pageLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageLeads.map(l => l.id)));
    }
  };
  const isAllSelected = pageLeads.length > 0 && selectedIds.size === pageLeads.length;

  const goPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    setSelectedIds(new Set());
  };

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 3) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="p-5 lg:p-6 max-w-[1800px] mx-auto space-y-4 animate-fade-in h-[calc(100vh-64px)] flex flex-col">
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">线索管理</h1>

      {/* Filter bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">数据范围</span>
          <div className="relative">
            <select
              value={dataScope}
              onChange={e => setDataScope(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <option>所有数据</option>
              <option>我的线索</option>
              <option>我的部门</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <Filter className="w-3.5 h-3.5" />
          {showFilter ? '收起筛选' : '展开筛选'}
        </button>
      </div>

      {/* Expandable filter area */}
      {showFilter && (
        <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 p-4 shrink-0 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">线索公司名称</label>
              <input className="w-full px-3 py-1.5 text-sm bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg outline-none" placeholder="请输入" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">一级来源</label>
              <select className="w-full px-3 py-1.5 text-sm bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg outline-none">
                <option value="">全部</option>
                <option>官网</option>
                <option>标讯</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">联系人姓名</label>
              <input className="w-full px-3 py-1.5 text-sm bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg outline-none" placeholder="请输入" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">销售归口</label>
              <input className="w-full px-3 py-1.5 text-sm bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg outline-none" placeholder="请输入" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button className="px-3 py-1.5 text-xs border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition">重置</button>
            <button className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">查询</button>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              共 <strong className="text-blue-600 dark:text-blue-400">{TOTAL}</strong> 条数据
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> 新增线索
            </button>
            <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> 批量导入线索
            </button>
            <button className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-medium hover:bg-cyan-700 transition flex items-center gap-1.5">
              <Edit className="w-3.5 h-3.5" /> 批量编辑
            </button>
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> 分配
            </button>
            <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> 同步销售员
            </button>
            <div className="ml-auto">
              <button className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" /> 表头设置
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">线索ID</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">线索公司名称</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">关联企业</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">一级来源</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">二级来源</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">三级来源</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">联系人姓名</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">联系人职务</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">销售归口</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-sm">
              {pageLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs">{lead.id}</a>
                      <button className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" title="复制">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-800 dark:text-gray-200 max-w-[160px] truncate">{lead.companyName}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{lead.linkedEnterprise}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{lead.source1}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 max-w-[140px] truncate">{lead.source2}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{lead.source3}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-800 dark:text-gray-200">{lead.contactName}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{lead.contactTitle}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{lead.salesOwner}</td>
                  <td className="px-3 py-2.5">
                    <button className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-medium">编辑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); setSelectedIds(new Set()); }}
              className="px-2 py-1 text-xs bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-md outline-none text-gray-600 dark:text-gray-400"
            >
              {[10, 15, 20, 50].map(n => <option key={n} value={n}>{n}条/页</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">···</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goPage(p as number)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition ${
                    currentPage === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsManager;
