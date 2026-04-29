
import React, { useState } from 'react';
import { Search, X, Building2, ChevronDown } from 'lucide-react';
import Pagination from '../common/Pagination';

interface OpsEnterprise {
    id: string;
    name: string;
    packageType: string;
    activatedUsers: number;
    activeUsersLast30d: number;
    superAdminId: string;
    superAdminName: string;
    registrationSource: string;
    createdAt: string;
}

const packageTypes = ['WPS 365 商业旗舰版', 'WPS 365 体验版', 'WPS 365 标准版', 'WPS 365 专业版'];
const registrationSources = ['wps365官网', 'plus官网-web端', '企业微信', '其它', '渠道注册', '管理员后台'];
const adminNames = ['张三', '李四', '王五', '赵六', '订单专项2', '陈七', '刘八', '孙九', '周十', 'admin'];

const mockEnterprises: OpsEnterprise[] = Array.from({ length: 60 }, (_, i) => ({
    id: String(600000000 + i * 1337 + 7522402).slice(0, 9),
    name: [
        '华兴科技有限公司', '信达发展有限公司', '中科贸易有限公司', '远洋网络有限公司',
        '天行信息有限公司', '博大实业有限公司', '瑞通科技有限公司', '金桥发展有限公司',
        '海纳网络有限公司', '智汇信息有限公司',
    ][i % 10] + (i > 9 ? ` ${Math.floor(i / 10)}` : ''),
    packageType: packageTypes[i % packageTypes.length],
    activatedUsers: Math.floor(Math.random() * 500),
    activeUsersLast30d: Math.floor(Math.random() * 300),
    superAdminId: String(286000000 + i * 173),
    superAdminName: adminNames[i % adminNames.length],
    registrationSource: registrationSources[i % registrationSources.length],
    createdAt: `2026-0${(i % 3) + 1}-${String((i % 28) + 1).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
}));

const sourceOptions = ['全部', ...registrationSources];
const packageOptions = ['全部', ...packageTypes];

const OpsEnterpriseManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('全部');
    const [packageFilter, setPackageFilter] = useState('全部');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [sourceOpen, setSourceOpen] = useState(false);
    const [packageOpen, setPackageOpen] = useState(false);

    const filtered = mockEnterprises.filter(e => {
        const q = searchTerm.toLowerCase();
        const matchSearch = !q || e.id.includes(q) || e.name.toLowerCase().includes(q) || e.superAdminId.includes(q) || e.superAdminName.toLowerCase().includes(q);
        const matchSource = sourceFilter === '全部' || e.registrationSource === sourceFilter;
        const matchPkg = packageFilter === '全部' || e.packageType === packageFilter;
        return matchSearch && matchSource && matchPkg;
    });

    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };

    return (
        <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter pb-2 h-full flex flex-col">
            {/* 顶部标题 + 搜索 + 筛选 */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">企业管理</h1>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                    {/* 搜索框 */}
                    <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-full sm:w-[320px] focus-within:border-blue-400 dark:focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition shadow-apple">
                        <div className="relative flex-1 flex items-center min-w-0">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
                            <input
                                type="text"
                                placeholder="搜索企业ID、名称、管理员…"
                                className="w-full h-full pl-8 pr-8 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                                value={searchTerm}
                                onChange={e => handleSearch(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => handleSearch('')} className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                    {/* 注册来源筛选 */}
                    <div className="relative">
                        <button
                            onClick={() => { setSourceOpen(v => !v); setPackageOpen(false); }}
                            className={`h-9 flex items-center gap-1.5 px-3 rounded-lg border text-xs font-medium transition shadow-apple ${sourceFilter !== '全部' ? 'bg-blue-50 border-blue-200 text-[#0071E3] dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}
                        >
                            注册来源{sourceFilter !== '全部' ? `：${sourceFilter}` : ''}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sourceOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {sourceOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setSourceOpen(false)} />
                                <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 py-1">
                                    {sourceOptions.map(s => (
                                        <button key={s} onClick={() => { setSourceFilter(s); setSourceOpen(false); setCurrentPage(1); }}
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${sourceFilter === s ? 'text-[#0071E3] bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    {/* 套餐类型筛选 */}
                    <div className="relative">
                        <button
                            onClick={() => { setPackageOpen(v => !v); setSourceOpen(false); }}
                            className={`h-9 flex items-center gap-1.5 px-3 rounded-lg border text-xs font-medium transition shadow-apple max-w-[180px] truncate ${packageFilter !== '全部' ? 'bg-blue-50 border-blue-200 text-[#0071E3] dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}
                        >
                            <span className="truncate">套餐{packageFilter !== '全部' ? `：${packageFilter}` : '类型'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${packageOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {packageOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setPackageOpen(false)} />
                                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 py-1">
                                    {packageOptions.map(p => (
                                        <button key={p} onClick={() => { setPackageFilter(p); setPackageOpen(false); setCurrentPage(1); }}
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${packageFilter === p ? 'text-[#0071E3] bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 表格卡片 */}
            <div className="unified-card overflow-hidden mt-4 flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E] sticky top-0 z-10">
                            <tr>
                                <th className="pl-6 pr-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">企业 ID</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">企业名称</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">套餐类型</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">已激活用户数<br/><span className="font-normal text-gray-400">（截至昨日）</span></th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">近30日活跃用户数</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">超级管理员 ID</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">超级管理员</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">注册来源</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">创建时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                            {paginated.map(ent => (
                                <tr key={ent.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0">
                                    <td className="pl-6 pr-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                                <Building2 className="w-3.5 h-3.5 text-[#0071E3]" />
                                            </div>
                                            <span className="text-sm font-bold font-mono text-[#0071E3] dark:text-[#0A84FF]">{ent.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 max-w-[200px]">
                                        <div className="font-medium text-gray-900 dark:text-white leading-snug line-clamp-2">{ent.name}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium border ${
                                            ent.packageType.includes('旗舰') ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/30' :
                                            ent.packageType.includes('专业') ? 'bg-blue-50 text-[#0071E3] border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30' :
                                            ent.packageType.includes('标准') ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30' :
                                            'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10'
                                        }`}>{ent.packageType}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        <span className="text-sm font-semibold text-gray-800 dark:text-white">{ent.activatedUsers}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        <span className="text-sm font-semibold text-gray-800 dark:text-white">{ent.activeUsersLast30d}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{ent.superAdminId}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{ent.superAdminName}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{ent.registrationSource}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{ent.createdAt}</span>
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center text-gray-400">暂无企业数据</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={currentPage}
                    size={itemsPerPage}
                    total={filtered.length}
                    onPageChange={setCurrentPage}
                    onSizeChange={s => { setItemsPerPage(s); setCurrentPage(1); }}
                />
            </div>
        </div>
    );
};

export default OpsEnterpriseManager;
