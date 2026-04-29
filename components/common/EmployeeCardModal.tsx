import React, { useState, useMemo } from 'react';
import { User, RoleDefinition, Department } from '../../types';
import { X, MapPin, Briefcase, GraduationCap, FileText, BarChart3, Star, Clock, Monitor, TrendingUp } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface EmployeeCardModalProps {
  user: User;
  roles: RoleDefinition[];
  departments: Department[];
  users: User[];
  onClose: () => void;
}

type TabId = 'work' | 'personal' | 'contract' | 'perf' | 'rating' | 'attendance' | 'asset' | 'biz';

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const EmployeeCardModal: React.FC<EmployeeCardModalProps> = ({ user, roles, departments, users, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('biz');
  const [showAiSummary, setShowAiSummary] = useState(false);

  const seed = useMemo(() => user.accountId ? parseInt(user.accountId, 10) || hashSeed(user.name) : hashSeed(user.name), [user]);

  const primaryRoleId = user.roles?.[0];
  const roleDef = primaryRoleId ? roles.find(r => r.id === primaryRoleId) : undefined;

  const getDeptPath = (deptId?: string): string => {
    if (!deptId) return '—';
    const parts: string[] = [];
    let cur = deptId;
    while (cur) {
      const d = departments.find(dd => dd.id === cur);
      if (!d) break;
      parts.unshift(d.name);
      cur = d.parentId || '';
    }
    return parts.join(' / ') || '—';
  };

  const positionMap: Record<string, string> = {
    Admin: '系统管理员', Sales: '销售经理', Business: '商务经理', Technical: '技术工程师',
    FinanceManager: '财务经理', ProductManager: '产品经理', SalesRep: '销售代表', ChannelManager: '渠道经理',
  };
  const position = (primaryRoleId && positionMap[primaryRoleId]) || roleDef?.name || '员工';

  const cities = ['北京市', '珠海市', '武汉市', '长沙市', '成都市', '上海市', '深圳市'];
  const city = cities[seed % cities.length];

  const entryYear = 2020 + (seed % 6);
  const entryMonth = ((seed % 12) + 1).toString().padStart(2, '0');
  const entryDay = ((seed % 28) + 1).toString().padStart(2, '0');
  const entryDate = `${entryYear}-${entryMonth}-${entryDay}`;
  const confirmDate = `${entryYear + 1}-${entryMonth}-${entryDay}`;
  const seniority = new Date().getFullYear() - entryYear;

  const sequenceMap: Record<string, string> = {
    Admin: '管理 - 综合', Sales: '销售 - 政企销售', Business: '商务 - 运营', Technical: '产研 - 研发',
    FinanceManager: '职能 - 财务', ProductManager: '产研 - 产品', SalesRep: '销售 - 直销', ChannelManager: '销售 - 渠道',
  };
  const sequence = (primaryRoleId && sequenceMap[primaryRoleId]) || '产研 - 产品';

  const companies = ['北京金山办公软件股份有限公司', '珠海金山办公软件股份有限公司', '武汉金山办公软件有限公司'];
  const company = companies[seed % companies.length];

  const hrbps = ['李红梅', '王丽华', '张晓敏', '刘芳', '陈雪'];
  const hrbp = hrbps[seed % hrbps.length];

  const supervisors = users.filter(u => u.id !== user.id && u.departmentId === user.departmentId);
  const supervisor = supervisors.length > 0 ? supervisors[seed % supervisors.length]?.name : '—';
  const mentors = ['赵六', '孙七', '周八', '吴九', '钱十'];
  const mentor = mentors[seed % mentors.length];

  // biz data
  const r = (min: number, max: number) => {
    const v = min + ((seed * 7 + min * 13) % ((max - min) * 100)) / 100;
    return Number(v.toFixed(2));
  };
  const ri = (min: number, max: number) => min + (seed % (max - min + 1));
  const revenue = r(50, 400);
  const revLastYear = r(20, 80);
  const revGrowth = Number((((revenue - revLastYear) / revLastYear) * 100).toFixed(1));
  const pipeline = r(200, 1200);
  const pipelineCount = ri(10, 60);
  const renewalDue = r(100, 700);
  const renewalUnpaid = r(50, 500);
  const renewalOverdue = r(10, 200);
  const visitYear = ri(20, 80);
  const visitQuarter = ri(10, 40);
  const visitMonth = ri(3, 18);
  const visitWeek = ri(1, 10);
  const closedCustomers = ri(100, 2000);
  const totalCustomers = closedCustomers + ri(50, 300);
  const closeRate = Number(((closedCustomers / totalCustomers) * 100).toFixed(1));

  const productLines = useMemo(() => {
    const pls = [
      { name: 'Win端', revenue: r(10, 80) },
      { name: 'WPS365公有云', revenue: r(0.5, 10) },
      { name: '私有云单品', revenue: r(10, 100) },
      { name: '信创端', revenue: r(30, 200) },
      { name: '其他软件', revenue: r(0.5, 15) },
    ];
    const total = pls.reduce((s, p) => s + p.revenue, 0);
    return pls.map(p => ({ ...p, pct: Number(((p.revenue / total) * 100).toFixed(1)) }));
  }, [seed]);

  const top3 = [
    { name: '北京市机关事务管理局', tier: 'S0公司级战略客户', amount: r(200, 1000) },
    { name: '北京市东城区机关事务服务中心', tier: 'S0公司级战略客户', amount: r(100, 400) },
    { name: '北京市大数据中心', tier: 'S0公司级战略客户', amount: r(50, 300) },
  ];

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'work', label: '工作信息', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'personal', label: '个人信息', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'contract', label: '合同信息', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'perf', label: '绩效信息', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'rating', label: '评级记录', icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'attendance', label: '考勤信息', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'asset', label: '办公资产', icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'biz', label: '业务信息', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  const InfoRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className="flex items-start gap-3 py-2">
      <span className="w-[140px] shrink-0 text-sm text-gray-500">{label}</span>
      <span className={`text-sm flex-1 min-w-0 break-words ${highlight ? 'text-blue-600 cursor-pointer hover:underline' : 'text-gray-800'}`}>{value || '—'}</span>
    </div>
  );

  const MetricCard: React.FC<{ title: string; value: string; details?: { l: string; v: string; color?: string }[] }> = ({ title, value, details }) => (
    <div className="bg-white rounded-lg border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
      <div className="text-xs text-gray-500 mb-1.5">{title}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {details?.map((d, i) => (
        <div key={i} className="flex justify-between text-[11px] mt-1 px-1">
          <span className="text-gray-400">{d.l}</span>
          <span className={d.color || 'text-gray-600'}>{d.v}</span>
        </div>
      ))}
    </div>
  );

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[600] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <div
          className="relative bg-[#f0f2f5] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
          style={{ animation: 'empCardIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}
        >
          {/* Top banner */}
          <div className="bg-gradient-to-r from-[#546DFB] to-[#00BFFF] px-8 py-6 flex items-center gap-5 relative shrink-0">
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10">
              <X className="w-4 h-4" />
            </button>
            <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const t = e.currentTarget;
                  t.style.display = 'none';
                  const f = t.nextElementSibling as HTMLElement;
                  if (f) f.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-400 items-center justify-center text-white text-2xl font-bold" style={{ display: 'none' }}>
                {user.name.slice(0, 1)}
              </div>
            </div>
            <div className="text-white flex-1 min-w-0">
              <div className="text-[22px] font-semibold mb-1">{user.name}</div>
              <div className="text-sm opacity-95 leading-relaxed">
                {position} | {city} | {user.userType === 'Internal' ? '正式员工' : '外部协作'} | {user.email}
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="bg-white px-8 flex border-b border-gray-200 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3.5 text-sm font-medium relative transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-500'}`}
              >
                {tab.icon} {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t" />}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-8 py-6">

              {/* ===== 业务信息 ===== */}
              {activeTab === 'biz' && (
                <div className="space-y-5 animate-fade-in">
                  {/* AI 总结弹窗 */}
                  {showAiSummary && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center" onClick={() => setShowAiSummary(false)}>
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ animation: 'empCardIn 0.2s ease' }} />
                      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[560px] max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: 'empCardIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                          <span className="text-lg font-semibold text-gray-900">✨ AI 总结</span>
                          <button onClick={() => setShowAiSummary(false)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
                          <p className="text-base font-semibold text-gray-900 leading-relaxed pb-4 border-b border-gray-100">
                            {revGrowth > 0 ? '营管净收入同比增长显著' : '营管净收入同比有所下滑'}，{renewalOverdue > 50 ? '续费超期未续需重点跟进' : '续费情况整体可控'}。
                          </p>
                          <div>
                            <div className="text-sm font-semibold text-gray-800 mb-2">关键亮点</div>
                            <ul className="space-y-1.5 text-sm text-gray-700 leading-relaxed list-disc pl-5">
                              <li>营管净收入{revenue}万，同比{revGrowth > 0 ? '↑' : '↓'}{Math.abs(revGrowth)}%{revGrowth > 50 ? '，增速显著' : ''}。</li>
                              <li>进行中商机{pipeline}万（{pipelineCount}个），储备充足。</li>
                              <li>已成交客户{closedCustomers.toLocaleString()}，成交率{closeRate}%，客户质量良好。</li>
                            </ul>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-red-700 mb-2">风险 / 待改进</div>
                            <ul className="space-y-1.5 text-sm text-gray-600 leading-relaxed list-disc pl-5">
                              <li>未续费{renewalUnpaid}万，其中超期{renewalOverdue}万，建议优先跟进超期客户。</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">信息概览</h3>
                        <span className="text-xs text-gray-400 mt-0.5">数据更新：{new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} 14:30</span>
                      </div>
                      <button onClick={() => setShowAiSummary(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:opacity-85 transition">
                        <span className="text-amber-400">★</span> AI总结
                      </button>
                    </div>
                    <div className="grid grid-cols-5 gap-4 mb-5">
                      <MetricCard title="营管净收入" value={`${revenue}万`} details={[
                        { l: '同比增长率', v: `${revGrowth > 0 ? '+' : ''}${revGrowth}%`, color: revGrowth >= 0 ? 'text-green-600' : 'text-red-500' },
                        { l: '去年同期', v: `${revLastYear}万` },
                      ]} />
                      <MetricCard title="进行中商机" value={`${pipeline}万`} details={[
                        { l: '商机数量', v: String(pipelineCount) },
                      ]} />
                      <MetricCard title="应续金额" value={`${renewalDue}万`} />
                      <MetricCard title="未续费金额" value={`${renewalUnpaid}万`} details={[
                        { l: '超期未续', v: `${renewalOverdue}万` },
                      ]} />
                      <MetricCard title="本年拜访客户量" value={String(visitYear)} details={[
                        { l: '本季', v: String(visitQuarter) },
                        { l: '本月', v: String(visitMonth) },
                        { l: '本周', v: String(visitWeek) },
                      ]} />
                    </div>
                    <div className="grid grid-cols-[3fr_1fr] gap-4">
                      <div className="bg-white rounded-lg border border-gray-100 p-4">
                        <div className="text-xs font-medium text-gray-500 mb-3">名下客户近三年累计产出 Top3</div>
                        <table className="w-full text-xs">
                          <thead><tr className="border-b border-gray-100"><th className="text-left py-2 font-medium text-gray-500">客户全称</th><th className="text-left py-2 font-medium text-gray-500">客户分层</th><th className="text-right py-2 font-medium text-gray-500">订单总金额</th></tr></thead>
                          <tbody>
                            {top3.map((c, i) => (
                              <tr key={i} className="border-b border-gray-50 last:border-0">
                                <td className="py-2 text-gray-800">{c.name}</td>
                                <td className="py-2 text-gray-600">{c.tier}</td>
                                <td className="py-2 text-right font-medium text-gray-800">{c.amount}万</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <MetricCard title="已成交客户" value={closedCustomers.toLocaleString()} details={[
                        { l: '名下客户数', v: totalCustomers.toLocaleString() },
                        { l: '成交率', v: `${closeRate}%` },
                      ]} />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-100 p-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">本年各产品线业绩完成</h4>
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-gray-100"><th className="text-left py-2 font-medium text-gray-500">产品条线</th><th className="text-right py-2 font-medium text-gray-500">年度营管净收入</th><th className="text-right py-2 font-medium text-gray-500">占比</th></tr></thead>
                      <tbody>
                        {productLines.map(pl => (
                          <tr key={pl.name} className="border-b border-gray-50"><td className="py-2 text-gray-800">{pl.name}</td><td className="py-2 text-right">{pl.revenue}万</td><td className="py-2 text-right text-gray-500">{pl.pct}%</td></tr>
                        ))}
                        <tr className="font-semibold bg-gray-50"><td className="py-2 text-gray-800">合计</td><td className="py-2 text-right">{productLines.reduce((s, p) => s + p.revenue, 0).toFixed(2)}万</td><td className="py-2 text-right text-gray-500">100%</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===== 工作信息 ===== */}
              {activeTab === 'work' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-white rounded-lg border border-gray-100 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">基本信息</h3>
                    <div className="grid grid-cols-2 gap-x-12">
                      <div>
                        <InfoRow label="员工号" value={user.accountId || '—'} />
                        <InfoRow label="部门全路径" value={getDeptPath(user.departmentId)} />
                        <InfoRow label="岗位" value={position} />
                        <InfoRow label="公司" value={company} />
                        <InfoRow label="是否二次入职" value={seed % 5 === 0 ? '是' : '否'} />
                        <InfoRow label="司龄 (年)" value={String(seniority)} />
                        <InfoRow label="HRBP" value={hrbp} highlight />
                        <InfoRow label="转正日期" value={confirmDate} />
                      </div>
                      <div>
                        <InfoRow label="人员类别" value={user.userType === 'Internal' ? '正式员工' : '外部协作'} />
                        <InfoRow label="族群序列" value={sequence} />
                        <InfoRow label="实际工作地" value={city} />
                        <InfoRow label="入职日期" value={entryDate} />
                        <InfoRow label="首次加入金山日期" value={entryDate} />
                        <InfoRow label="直接上级" value={supervisor} highlight />
                        <InfoRow label="是否转正" value="是" />
                        <InfoRow label="指导人" value={mentor} highlight />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-100 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">任职记录</h3>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-200 text-gray-600"><th className="text-left py-3 font-semibold">开始日期</th><th className="text-left py-3 font-semibold">变动原因</th><th className="text-left py-3 font-semibold">员工类别</th><th className="text-left py-3 font-semibold">族群序列</th><th className="text-left py-3 font-semibold">岗位</th><th className="text-left py-3 font-semibold">部门</th></tr></thead>
                      <tbody>
                        <tr className="border-b border-gray-100 text-gray-700"><td className="py-3">{new Date().getFullYear()}-03-01</td><td>岗位调动</td><td>正式员工</td><td>{sequence}</td><td>{position}</td><td className="max-w-[200px] truncate">{getDeptPath(user.departmentId)}</td></tr>
                        <tr className="border-b border-gray-100 text-gray-700"><td className="py-3">{entryDate}</td><td>新入职</td><td>正式员工</td><td>{sequence}</td><td>{position}</td><td className="max-w-[200px] truncate">{getDeptPath(user.departmentId)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===== 个人信息 ===== */}
              {activeTab === 'personal' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-white rounded-lg border border-gray-100 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">基本信息</h3>
                    <div className="grid grid-cols-2 gap-x-12">
                      <div>
                        <InfoRow label="出生日期" value={`${1985 + (seed % 10)}-${entryMonth}-${entryDay}`} />
                        <InfoRow label="性别" value={seed % 3 === 0 ? '女' : '男'} />
                        <InfoRow label="民族" value="汉族" />
                        <InfoRow label="政治面貌" value={seed % 4 === 0 ? '中共党员' : '群众'} />
                        <InfoRow label="户口性质" value="城镇" />
                        <InfoRow label="最高学历" value={seed % 3 === 0 ? '硕士' : '本科'} />
                        <InfoRow label="参加工作日期" value={`${2008 + (seed % 8)}-07-01`} />
                        <InfoRow label="兴趣爱好" value="高尔夫、行业峰会、商业阅读" />
                        <InfoRow label="职业期望" value="销售管理方向深耕" />
                      </div>
                      <div>
                        <InfoRow label="年龄" value={String(new Date().getFullYear() - (1985 + (seed % 10)))} />
                        <InfoRow label="国籍/地区" value="中国" />
                        <InfoRow label="婚姻状况" value={seed % 3 === 0 ? '已婚' : '未婚'} />
                        <InfoRow label="籍贯" value={city} />
                        <InfoRow label="户口所在地" value={city} />
                        <InfoRow label="最高学位" value={seed % 3 === 0 ? '硕士' : '学士'} />
                        <InfoRow label="工龄(年)" value={String(new Date().getFullYear() - (2008 + (seed % 8)))} />
                        <InfoRow label="专业技能" value="客户关系管理、商务谈判、大客户开拓" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-100 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">学历信息</h3>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-200 text-gray-500"><th className="text-left py-3 font-medium">入学时间</th><th className="text-left py-3 font-medium">毕业时间</th><th className="text-left py-3 font-medium">学校</th><th className="text-left py-3 font-medium">学历</th><th className="text-left py-3 font-medium">学位</th><th className="text-left py-3 font-medium">专业</th></tr></thead>
                      <tbody>
                        <tr className="border-b border-gray-100 text-gray-700"><td className="py-3">{2004 + (seed % 4)}-09-01</td><td>{2008 + (seed % 4)}-06-30</td><td>北京理工大学</td><td>本科</td><td>学士</td><td>市场营销</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-100 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">履历信息</h3>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-200 text-gray-500"><th className="text-left py-3 font-medium">开始日期</th><th className="text-left py-3 font-medium">结束日期</th><th className="text-left py-3 font-medium">在职时长 (年)</th><th className="text-left py-3 font-medium">工作单位</th><th className="text-left py-3 font-medium">岗位</th><th className="text-left py-3 font-medium">离职原因</th></tr></thead>
                      <tbody>
                        <tr className="border-b border-gray-100 text-gray-700"><td className="py-3">{2008 + (seed % 8)}-07-01</td><td>{entryYear}-05-31</td><td>{entryYear - (2008 + (seed % 8))}</td><td>北京某某科技有限公司</td><td>销售专员</td><td>加入金山</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===== 合同信息 ===== */}
              {activeTab === 'contract' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-white rounded-lg border border-gray-100 p-6">
                    <div className="flex flex-wrap gap-8 items-center pb-4 mb-4 border-b border-gray-200 text-[15px] text-gray-900">
                      <span>{entryDate} 至 {entryYear + 3}-{entryMonth}-{entryDay}</span>
                      <span>固定期限</span>
                      <span>{company}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-16">
                      <div>
                        <InfoRow label="劳动合同类型" value="—" />
                        <InfoRow label="社保缴纳地" value={city} />
                      </div>
                      <div>
                        <InfoRow label="业务类型" value="新签" />
                        <InfoRow label="合同所在地" value={city} />
                      </div>
                    </div>
                    <InfoRow label="实际工作地" value={city} />
                  </div>
                </div>
              )}

              {/* ===== Placeholder tabs ===== */}
              {(activeTab === 'perf' || activeTab === 'rating' || activeTab === 'attendance' || activeTab === 'asset') && (
                <div className="bg-white rounded-lg border border-gray-100 p-12 text-center text-gray-400 animate-fade-in">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    {activeTab === 'perf' && <BarChart3 className="w-6 h-6 text-gray-300" />}
                    {activeTab === 'rating' && <Star className="w-6 h-6 text-gray-300" />}
                    {activeTab === 'attendance' && <Clock className="w-6 h-6 text-gray-300" />}
                    {activeTab === 'asset' && <Monitor className="w-6 h-6 text-gray-300" />}
                  </div>
                  <div className="text-sm">{tabs.find(t => t.id === activeTab)?.label}内容</div>
                  <div className="text-xs mt-1 text-gray-300">暂无数据</div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes empCardIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </ModalPortal>
  );
};

export default React.memo(EmployeeCardModal);
