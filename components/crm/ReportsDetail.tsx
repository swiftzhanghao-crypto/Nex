import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Search, ChevronRight, Mail, Phone, Building2, Copy, Check, X, Sparkles } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { User, WorkReport } from '../../types';
import ModalPortal from '../common/ModalPortal';

interface ReportItem {
  id: string;
  type: '周报' | '日报';
  title: string;
  date: string;
  weekRange?: string;
  summary: string;
  sections: { heading: string; bullets: string[] }[];
  source?: 'ai' | 'manual' | 'mock';
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function formatDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 基于 userId 生成确定性模拟报告列表 */
function generateMockReports(user: User): ReportItem[] {
  const seed = hashCode(user.id);
  const reports: ReportItem[] = [];
  const today = new Date();

  // 近 12 篇日报
  const dailyTarget = 12 + (seed % 6);
  let dailyMade = 0;
  let offset = 0;
  while (dailyMade < dailyTarget && offset < 90) {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    offset++;
    // 跳过周末（让数据更真实）
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const i = dailyMade;
    const visits = 1 + ((seed + i) % 4);
    const deals = ((seed + i * 3) % 5);
    reports.push({
      id: `daily-${user.id}-${i}`,
      type: '日报',
      title: `${formatDate(d)} 工作日报`,
      date: formatDate(d),
      summary: `今日拜访客户 ${visits} 家，推进商机 ${deals} 项`,
      sections: [
        {
          heading: '客户拜访',
          bullets: [
            `上午 · 走访${String.fromCharCode(65 + (seed + i) % 26)}公司，复盘上周合同交付进度`,
            `下午 · 跟进${String.fromCharCode(65 + (seed + i + 1) % 26)}集团需求，重点介绍新版产品方案`,
          ].slice(0, visits),
        },
        {
          heading: '成交与跟进',
          bullets: [
            `${String.fromCharCode(65 + (seed + i + 2) % 26)}公司合同已完成盖章，进入系统建档`,
            `${String.fromCharCode(65 + (seed + i + 3) % 26)}公司报价已提交，等待客户评估反馈`,
          ].slice(0, Math.max(1, deals)),
        },
        {
          heading: '明日计划',
          bullets: [
            `明日 9:00 前确认 ${String.fromCharCode(65 + (seed + i + 4) % 26)} 公司技术演示方案`,
            '整理本周商机清单，同步至团队',
          ],
        },
      ],
    });
    dailyMade++;
  }

  // 近 8 篇周报
  const weeklyCount = 4 + (seed % 6);
  for (let i = 0; i < weeklyCount; i++) {
    const end = new Date(today);
    end.setDate(end.getDate() - i * 7 - end.getDay());
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const signed = 2 + ((seed + i) % 4);
    const amount = (80 + ((seed + i * 17) % 200)).toFixed(0);
    reports.push({
      id: `weekly-${user.id}-${i}`,
      type: '周报',
      title: `${formatDate(start)} ~ ${formatDate(end)} 工作周报`,
      date: formatDate(end),
      weekRange: `${formatDate(start)} ~ ${formatDate(end)}`,
      summary: `新签合同 ${signed} 单，合同总额 ¥${amount} 万`,
      sections: [
        {
          heading: '本周成果',
          bullets: [
            `新签合同 ${signed} 单，合同总额 ¥${amount} 万，环比增长 ${12 + (seed + i) % 20}%`,
            `推进商机 ${6 + (seed + i) % 6} 项，其中 ${2 + (seed + i) % 3} 项进入报价阶段`,
            `完成客户拜访 ${10 + (seed + i * 2) % 10} 家，覆盖核心区域客户`,
          ],
        },
        {
          heading: '关键进展',
          bullets: [
            `${String.fromCharCode(65 + (seed + i) % 26)} 公司：完成二轮商务谈判，预计下周签约`,
            `${String.fromCharCode(65 + (seed + i + 1) % 26)} 集团：技术方案已通过内部评审，进入采购流程`,
            `${String.fromCharCode(65 + (seed + i + 2) % 26)} 股份：续费方案已提交，客户反馈积极`,
          ],
        },
        {
          heading: '下周计划',
          bullets: [
            `完成 ${String.fromCharCode(65 + (seed + i + 3) % 26)} 公司合同签订与首付款回收`,
            `组织 ${String.fromCharCode(65 + (seed + i + 4) % 26)} 集团技术演示与答疑`,
            '推进 3 家客户的增购方案',
          ],
        },
      ],
    });
  }

  // 按日期倒序
  return reports.sort((a, b) => (b.date < a.date ? -1 : 1));
}

function workReportToReportItem(wr: WorkReport): ReportItem {
  return {
    id: wr.id,
    type: wr.type,
    title: wr.title,
    date: wr.date,
    weekRange: wr.weekRange,
    summary: wr.summary,
    sections: wr.sections,
    source: wr.source,
  };
}

const ReportsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, departments, workReports } = useAppContext();

  const user = users.find(u => u.id === id);
  const reports = useMemo(() => {
    if (!user) return [];
    const mockReports = generateMockReports(user);
    const realReports = workReports
      .filter(wr => wr.userId === user.id)
      .map(workReportToReportItem);
    return [...realReports, ...mockReports].sort((a, b) => (b.date < a.date ? -1 : 1));
  }, [user, workReports]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'weekly' | 'daily'>('all');
  const [drawerReport, setDrawerReport] = useState<ReportItem | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const openDrawer = useCallback((report: ReportItem) => {
    setDrawerReport(report);
    setIsDrawerClosing(false);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerClosing(true);
    setTimeout(() => { setDrawerReport(null); setIsDrawerClosing(false); }, 280);
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (typeFilter === 'weekly' && r.type !== '周报') return false;
      if (typeFilter === 'daily' && r.type !== '日报') return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const combined = `${r.title} ${r.summary} ${r.sections.map(s => s.bullets.join(' ')).join(' ')}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }
      return true;
    });
  }, [reports, typeFilter, searchTerm]);

  const weeklyCount = reports.filter(r => r.type === '周报').length;
  const dailyCount = reports.filter(r => r.type === '日报').length;

  const handleCopy = (report: ReportItem) => {
    const text = `${report.title}\n\n${report.sections.map(s => `${s.heading}\n${s.bullets.map(b => `• ${b}`).join('\n')}`).join('\n\n')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(report.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  if (!user) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <button onClick={() => navigate('/reports')} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> 返回列表
        </button>
        <div className="unified-card dark:bg-[#1C1C1E] p-12 text-center text-gray-400">未找到该人员信息</div>
      </div>
    );
  }

  const dept = departments.find(d => d.id === user.departmentId);

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto space-y-4 animate-page-enter">
      {/* Breadcrumb */}
      <button onClick={() => navigate('/reports')} className="text-sm text-gray-500 hover:text-[#0071E3] flex items-center gap-1.5 transition">
        <ArrowLeft className="w-4 h-4" /> 返回周报日报列表
      </button>

      {/* User Header Card */}
      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 p-5">
        <div className="flex items-start gap-5">
          <img
            src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
            alt={user.name}
            className="w-20 h-20 rounded-2xl object-cover border border-gray-200 dark:border-white/10 shadow-sm shrink-0 bg-gray-100"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {user.status === 'Active' ? '在职' : '离线'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                {user.userType === 'Internal' ? '内部员工' : '外部协作'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user.email}</span>
              {user.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{user.phone}</span>}
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{dept?.name || '—'}</span>
              <span className="text-xs font-mono text-gray-400">{user.accountId}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#0071E3] tabular-nums">{weeklyCount}</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold mt-1">周报</div>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 tabular-nums">{dailyCount}</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold mt-1">日报</div>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{reports.length}</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold mt-1">合计</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="搜索报告标题或内容..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
          />
        </div>
        <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-0.5 border border-gray-200/60 dark:border-white/10">
          {([
            { id: 'all' as const, label: `全部 ${reports.length}` },
            { id: 'weekly' as const, label: `周报 ${weeklyCount}` },
            { id: 'daily' as const, label: `日报 ${dailyCount}` },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                typeFilter === t.id
                  ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >{t.label}</button>
          ))}
        </div>
        <div className="ml-auto text-xs text-gray-400">共 {filteredReports.length} 条</div>
      </div>

      {/* Reports Timeline */}
      <div className="space-y-2">
        {filteredReports.map(report => {
          const isWeekly = report.type === '周报';
          const isActive = drawerReport?.id === report.id;
          return (
            <button
              key={report.id}
              onClick={() => openDrawer(report)}
              className={`w-full unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 overflow-hidden flex items-center gap-4 px-5 py-4 text-left transition-all ${
                isActive
                  ? 'ring-2 ring-[#0071E3]/40 dark:ring-[#0A84FF]/40 bg-[#0071E3]/[0.03] dark:bg-[#0A84FF]/[0.03]'
                  : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.03]'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isWeekly
                  ? 'bg-blue-50 text-[#0071E3] dark:bg-blue-900/20 dark:text-blue-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
              }`}>
                {isWeekly ? <Calendar className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{report.title}</h3>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isWeekly
                      ? 'bg-blue-50 text-[#0071E3] dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                  }`}>{report.type}</span>
                  {report.source === 'ai' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{report.summary}</p>
              </div>
              <span className="text-xs font-mono text-gray-400 shrink-0">{report.date}</span>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          );
        })}
        {filteredReports.length === 0 && (
          <div className="unified-card dark:bg-[#1C1C1E] p-12 text-center text-gray-400 text-sm">
            {searchTerm || typeFilter !== 'all' ? '未找到匹配的报告' : '该人员暂无报告记录'}
          </div>
        )}
      </div>

      {/* ── Report Detail Drawer ── */}
      {drawerReport && (
        <ModalPortal>
          <div
            className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[400] ${isDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`}
            onClick={closeDrawer}
          />
          <div
            className={`fixed top-0 right-0 h-full z-[400] bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}
            style={{ width: 'min(640px, 100vw)' }}
          >
            {/* Drawer Header */}
            <div className="shrink-0 flex items-center justify-between px-6 h-16 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  drawerReport.type === '周报'
                    ? 'bg-blue-50 text-[#0071E3] dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                }`}>
                  {drawerReport.type === '周报' ? <Calendar className="w-4.5 h-4.5" /> : <FileText className="w-4.5 h-4.5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-bold text-gray-900 dark:text-white truncate">{drawerReport.title}</h2>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      drawerReport.type === '周报'
                        ? 'bg-blue-50 text-[#0071E3] dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                    }`}>{drawerReport.type}</span>
                    {drawerReport.source === 'ai' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800 flex items-center gap-0.5 shrink-0">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {drawerReport.weekRange || drawerReport.date}
                    {user && <span className="ml-2">{user.name}</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Summary */}
            <div className="shrink-0 px-6 py-4 bg-gray-50/60 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/10">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{drawerReport.summary}</p>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
              {drawerReport.sections.map((section, idx) => (
                <div key={idx}>
                  <h4 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200/60 dark:border-white/8 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#0071E3]/10 dark:bg-[#0A84FF]/10 text-[#0071E3] dark:text-[#0A84FF] text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    {section.heading}
                  </h4>
                  <ul className="space-y-2.5 pl-1">
                    {section.bullets.map((b, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2.5 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-[7px] shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.02]">
              <div className="text-xs text-gray-400">
                {drawerReport.sections.reduce((sum, s) => sum + s.bullets.length, 0)} 项内容
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(drawerReport)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 text-xs font-medium transition"
                >
                  {copiedId === drawerReport.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === drawerReport.id ? '已复制' : '复制内容'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default ReportsDetail;
