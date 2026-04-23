import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Calendar, ChevronRight, TrendingUp, Users, Filter } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { User, WorkReport } from '../../types';

/** 基于 userId 确定性生成报告统计（保证多次渲染一致） */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface UserReportStats {
  weeklyCount: number;
  dailyCount: number;
  total: number;
  latestDate: string;
  latestType: '周报' | '日报';
}

function getUserReportStats(user: User): UserReportStats {
  const seed = hashCode(user.id);
  const weeklyCount = 6 + (seed % 10); // 6~15
  const dailyCount = 20 + (seed % 40); // 20~59
  const latestDaysAgo = seed % 7;
  const latest = new Date();
  latest.setDate(latest.getDate() - latestDaysAgo);
  const latestType: '周报' | '日报' = seed % 3 === 0 ? '周报' : '日报';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const latestDate = `${latest.getFullYear()}-${pad(latest.getMonth() + 1)}-${pad(latest.getDate())}`;
  return { weeklyCount, dailyCount, total: weeklyCount + dailyCount, latestDate, latestType };
}

function getRealReportStats(workReports: WorkReport[], userId: string): { weeklyCount: number; dailyCount: number; latestDate?: string; latestType?: '周报' | '日报' } {
  const userReports = workReports.filter(r => r.userId === userId);
  const weeklyCount = userReports.filter(r => r.type === '周报').length;
  const dailyCount = userReports.filter(r => r.type === '日报').length;
  if (userReports.length === 0) return { weeklyCount: 0, dailyCount: 0 };
  const latest = userReports.sort((a, b) => b.createdAt - a.createdAt)[0];
  return { weeklyCount, dailyCount, latestDate: latest.date, latestType: latest.type };
}

const ReportsManager: React.FC = () => {
  const { users, departments, workReports } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'weekly' | 'daily'>('all');

  const getDepartmentName = (deptId?: string) => departments.find(d => d.id === deptId)?.name || '—';

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (u.status !== 'Active') return false;
      if (searchTerm && !(
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.accountId.includes(searchTerm)
      )) return false;
      if (deptFilter && u.departmentId !== deptFilter) return false;
      return true;
    });
  }, [users, searchTerm, deptFilter]);

  const enrichedUsers = useMemo(() =>
    filteredUsers.map(u => {
      const mockStats = getUserReportStats(u);
      const realStats = getRealReportStats(workReports, u.id);
      const combined: UserReportStats = {
        weeklyCount: mockStats.weeklyCount + realStats.weeklyCount,
        dailyCount: mockStats.dailyCount + realStats.dailyCount,
        total: mockStats.total + realStats.weeklyCount + realStats.dailyCount,
        latestDate: realStats.latestDate && realStats.latestDate >= mockStats.latestDate
          ? realStats.latestDate : mockStats.latestDate,
        latestType: realStats.latestDate && realStats.latestDate >= mockStats.latestDate
          ? (realStats.latestType || mockStats.latestType) : mockStats.latestType,
      };
      return { user: u, stats: combined };
    }),
    [filteredUsers, workReports]
  );

  const aggStats = useMemo(() => {
    const totalReports = enrichedUsers.reduce((sum, e) => sum + e.stats.total, 0);
    const totalWeekly = enrichedUsers.reduce((sum, e) => sum + e.stats.weeklyCount, 0);
    const totalDaily = enrichedUsers.reduce((sum, e) => sum + e.stats.dailyCount, 0);
    return { totalReports, totalWeekly, totalDaily };
  }, [enrichedUsers]);

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto space-y-4 animate-page-enter relative h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">周报日报</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">按人员查看业务周报与日报提交情况</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 p-4">
          <div className="flex items-center gap-2 text-[11px] text-gray-400 uppercase font-semibold">
            <Users className="w-3.5 h-3.5" /> 活跃人员
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2 tabular-nums">{enrichedUsers.length}</div>
        </div>
        <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 p-4">
          <div className="flex items-center gap-2 text-[11px] text-gray-400 uppercase font-semibold">
            <FileText className="w-3.5 h-3.5" /> 总报告数
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2 tabular-nums">{aggStats.totalReports}</div>
        </div>
        <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 p-4">
          <div className="flex items-center gap-2 text-[11px] text-gray-400 uppercase font-semibold">
            <Calendar className="w-3.5 h-3.5" /> 周报
          </div>
          <div className="text-2xl font-bold text-[#0071E3] mt-2 tabular-nums">{aggStats.totalWeekly}</div>
        </div>
        <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 p-4">
          <div className="flex items-center gap-2 text-[11px] text-gray-400 uppercase font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> 日报
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2 tabular-nums">{aggStats.totalDaily}</div>
        </div>
      </div>

      {/* List Card */}
      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col animate-fade-in flex-1">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索人员姓名 / 邮箱 / 账号..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none dark:text-white"
          >
            <option value="">全部部门</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-0.5 border border-gray-200/60 dark:border-white/10">
            {([
              { id: 'all' as const, label: '全部' },
              { id: 'weekly' as const, label: '周报' },
              { id: 'daily' as const, label: '日报' },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  typeFilter === t.id
                    ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="unified-table-header sticky top-0 backdrop-blur">
              <tr>
                <th className="p-4 pl-6">人员</th>
                <th className="p-4">部门</th>
                <th className="p-4">账号 ID</th>
                <th className="p-4 text-center">周报</th>
                <th className="p-4 text-center">日报</th>
                <th className="p-4 text-center">合计</th>
                <th className="p-4">最新提交</th>
                <th className="p-4 text-right pr-6">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {enrichedUsers.map(({ user, stats }) => (
                <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
                        alt=""
                        className="w-9 h-9 rounded-full bg-gray-100"
                      />
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{getDepartmentName(user.departmentId)}</td>
                  <td className="p-4 font-mono text-gray-500 dark:text-gray-400">{user.accountId}</td>
                  <td className="p-4 text-center">
                    {typeFilter === 'daily' ? <span className="text-gray-300">—</span> : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0071E3] border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30 text-xs font-bold tabular-nums">
                        {stats.weeklyCount}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {typeFilter === 'weekly' ? <span className="text-gray-300">—</span> : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30 text-xs font-bold tabular-nums">
                        {stats.dailyCount}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center font-bold text-gray-900 dark:text-white tabular-nums">{stats.total}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-700 dark:text-gray-300 font-mono">{stats.latestDate}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        stats.latestType === '周报'
                          ? 'bg-blue-50 text-[#0071E3] dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      }`}>{stats.latestType}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <Link
                      to={`/reports/${user.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[#0071E3] hover:bg-[#0071E3]/10 rounded-lg text-sm font-medium transition"
                    >
                      查看详情 <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {enrichedUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 text-sm">暂无匹配人员</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsManager;
