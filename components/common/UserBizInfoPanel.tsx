import React, { useMemo, useState } from 'react';
import { TrendingUp, BarChart3, RefreshCw, MapPin } from 'lucide-react';
import AISummaryModal from './AISummaryModal';

// ─── Business Info Demo Data (seeded by user name) ─────────────────
function hashStr(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
    return Math.abs(h);
}

export function useBizData(userName: string) {
    return useMemo(() => {
        const h = hashStr(userName);
        const r = (min: number, max: number, decimals = 2) => {
            const v = min + ((h * 7 + min * 13) % ((max - min) * 100)) / 100;
            return Number(v.toFixed(decimals));
        };
        const ri = (min: number, max: number) => min + (h % (max - min + 1));

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

        const qRevenue = r(40, 300);
        const mRevenue = r(1, 50);
        const qRevGrowth = r(-50, 200);
        const mRevGrowth = r(-90, 300);

        const productLines = [
            { name: 'Win端', revenue: r(10, 80), pct: 0 },
            { name: 'WPS365公有云', revenue: r(0.5, 10), pct: 0 },
            { name: '私有云单品', revenue: r(10, 100), pct: 0 },
            { name: '信创端', revenue: r(30, 200), pct: 0 },
            { name: '其他软件', revenue: r(0.5, 15), pct: 0 },
        ];
        const plTotal = productLines.reduce((s, p) => s + p.revenue, 0);
        productLines.forEach(p => { p.pct = Number(((p.revenue / plTotal) * 100).toFixed(1)); });

        const commitPipeline = r(100, 600);
        const uncommitPipeline = Number((pipeline - commitPipeline).toFixed(2));
        const wonAmount = r(50, 300);

        const renewPaid = Number((renewalDue - renewalUnpaid).toFixed(2));
        const renewNotDue = Number((renewalUnpaid - renewalOverdue).toFixed(2));

        const top3 = [
            { name: '北京市机关事务管理局', tier: 'S0公司级战略客户', amount: r(200, 1000) },
            { name: '北京市东城区机关事务服务中心', tier: 'S0公司级战略客户', amount: r(100, 400) },
            { name: '北京市大数据中心', tier: 'S0公司级战略客户', amount: r(50, 300) },
        ];

        return {
            revenue, revLastYear, revGrowth, pipeline, pipelineCount,
            renewalDue, renewalUnpaid, renewalOverdue, renewPaid, renewNotDue,
            visitYear, visitQuarter, visitMonth, visitWeek,
            closedCustomers, totalCustomers, closeRate,
            qRevenue, mRevenue, qRevGrowth, mRevGrowth,
            productLines, plTotal,
            commitPipeline, uncommitPipeline, wonAmount,
            top3,
        };
    }, [userName]);
}

export type BizData = ReturnType<typeof useBizData>;

// ─── Metric Card ────────────────────────────────────────────────────
const MetricCard: React.FC<{ title: string; value: string; valueClass?: string; details?: { label: string; val: string; color?: string }[]; className?: string }> = ({ title, value, valueClass, details, className }) => (
    <div className={`bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-100 dark:border-white/10 p-4 text-center hover:shadow-md transition-shadow ${className || ''}`}>
        <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</div>
        <div className={`text-[22px] font-bold ${valueClass || 'text-gray-900 dark:text-white'}`}>{value}</div>
        {details?.map((d, i) => (
            <div key={i} className="flex justify-between items-baseline text-xs mt-1.5 px-1">
                <span className="text-gray-500 dark:text-gray-400">{d.label}</span>
                <span className={d.color || 'text-gray-700 dark:text-gray-300'}>{d.val}</span>
            </div>
        ))}
    </div>
);

// ─── Simple Bar ─────────────────────────────────────────────────────
const HBar: React.FC<{ label: string; value: number; max: number; unit?: string }> = ({ label, value, max, unit = '万' }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="flex items-center gap-3 text-[13px]">
            <span className="w-28 shrink-0 text-gray-500 dark:text-gray-400 truncate text-right">{label}</span>
            <div className="flex-1 h-4 bg-gray-100 dark:bg-white/5 rounded overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
                <div className="h-full bg-blue-500 rounded" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-16 text-right text-gray-700 dark:text-gray-300 font-medium">{value}{unit}</span>
        </div>
    );
};

type BizSubTab = 'PERF' | 'PIPELINE' | 'RENEWAL' | 'VISIT';

interface Props {
    /** 直接传 user 即可，内部用 useBizData 生成 mock 数据 */
    user: { name: string };
}

/**
 * 用户详情中的「业务信息」Tab：从 UserDetailPanel 拆分出来，
 * 内部维护 sub tab、mock 数据与 AI 总结弹窗状态。父组件无需感知细节。
 */
const UserBizInfoPanel: React.FC<Props> = ({ user }) => {
    const userName = user.name;
    const biz = useBizData(userName);
    const [bizSubTab, setBizSubTab] = useState<BizSubTab>('PERF');
    const [showAiSummary, setShowAiSummary] = useState(false);

    const aiHeadline = `${biz.revGrowth > 0 ? '营管净收入同比增长显著' : '营管净收入同比有所下滑'}，${biz.renewalOverdue > 50 ? '续费超期未续需重点跟进' : '续费情况整体可控'}。`;
    const aiHighlights = [
        { text: `营管净收入${biz.revenue}万，同比${biz.revGrowth > 0 ? '↑' : '↓'}${Math.abs(biz.revGrowth)}%${biz.revGrowth > 50 ? '，增速显著' : ''}。` },
        { text: `进行中商机${biz.pipeline}万（${biz.pipelineCount}个），储备充足。` },
        { text: `已成交客户${biz.closedCustomers.toLocaleString()}，成交率${biz.closeRate}%，客户质量良好。` },
    ];
    const aiRisks = [
        { text: `未续费${biz.renewalUnpaid}万，其中超期${biz.renewalOverdue}万，建议优先跟进超期客户。` },
        { text: `月度营管净收入${biz.mRevenue}万，同比${biz.mRevGrowth > 0 ? '↑' : '↓'}${Math.abs(biz.mRevGrowth)}%，需关注月度业绩稳定性。` },
    ];

    return (
        <section className="animate-fade-in space-y-5">
            <AISummaryModal
                open={showAiSummary}
                onClose={() => setShowAiSummary(false)}
                headline={aiHeadline}
                highlights={aiHighlights}
                risks={aiRisks}
            />

            {/* 信息概览 */}
            <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-100 dark:border-white/10 p-6">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-white/10">
                    <div>
                        <h3 className="text-[17px] font-bold text-gray-900 dark:text-white">信息概览</h3>
                        <span className="text-xs text-gray-400 mt-0.5">数据更新：{new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} 14:30</span>
                    </div>
                    <button onClick={() => setShowAiSummary(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-[13px] font-medium hover:opacity-85 transition">
                        <span className="text-amber-400 dark:text-amber-500">★</span> AI总结
                    </button>
                </div>

                <div className="grid grid-cols-5 gap-3 mb-4">
                    <MetricCard title="营管净收入" value={`${biz.revenue}万`} details={[
                        { label: '同比增长率', val: `${biz.revGrowth > 0 ? '+' : ''}${biz.revGrowth}%`, color: biz.revGrowth >= 0 ? 'text-green-600' : 'text-red-500' },
                        { label: '去年同期', val: `${biz.revLastYear}万` },
                    ]} />
                    <MetricCard title="进行中商机" value={`${biz.pipeline}万`} details={[
                        { label: '商机数量', val: String(biz.pipelineCount) },
                    ]} />
                    <MetricCard title="应续金额" value={`${biz.renewalDue}万`} />
                    <MetricCard title="未续费金额" value={`${biz.renewalUnpaid}万`} details={[
                        { label: '超期未续金额', val: `${biz.renewalOverdue}万` },
                        { label: '未到期未续金额', val: `${biz.renewNotDue}万` },
                    ]} />
                    <MetricCard title="本年拜访客户量" value={String(biz.visitYear)} details={[
                        { label: '本季', val: String(biz.visitQuarter) },
                        { label: '本月', val: String(biz.visitMonth) },
                        { label: '本周', val: String(biz.visitWeek) },
                    ]} />
                </div>

                <div className="grid grid-cols-[3fr_1fr] gap-3">
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-white/10 p-4">
                        <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-3">名下客户近三年累计产出 Top3</div>
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/10">
                                    <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">客户全称</th>
                                    <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">客户分层</th>
                                    <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">订单总金额</th>
                                </tr>
                            </thead>
                            <tbody>
                                {biz.top3.map((c, i) => (
                                    <tr key={i} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                                        <td className="py-2 text-gray-800 dark:text-gray-200">{c.name}</td>
                                        <td className="py-2 text-gray-600 dark:text-gray-400">{c.tier}</td>
                                        <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-200">{c.amount}万</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <MetricCard title="已成交客户" value={biz.closedCustomers.toLocaleString()} details={[
                        { label: '名下客户数', val: biz.totalCustomers.toLocaleString() },
                        { label: '成交率', val: `${biz.closeRate}%` },
                    ]} />
                </div>
            </div>

            {/* 子 Tab */}
            <div className="flex gap-2.5 flex-wrap" role="tablist" aria-label="业务信息子分类">
                {([
                    { id: 'PERF' as const, icon: <BarChart3 className="w-4 h-4" />, label: '本年业绩完成情况' },
                    { id: 'PIPELINE' as const, icon: <TrendingUp className="w-4 h-4" />, label: '本年商机储备情况' },
                    { id: 'RENEWAL' as const, icon: <RefreshCw className="w-4 h-4" />, label: '续费明细' },
                    { id: 'VISIT' as const, icon: <MapPin className="w-4 h-4" />, label: '客户拜访' },
                ]).map(t => (
                    <button
                        key={t.id}
                        role="tab"
                        aria-selected={bizSubTab === t.id}
                        onClick={() => setBizSubTab(t.id)}
                        className={`px-4 py-2.5 rounded-lg text-[13px] font-semibold border flex items-center gap-2 transition ${bizSubTab === t.id ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {bizSubTab === 'PERF' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-3 gap-3">
                        <MetricCard title="年度营管净收入" value={`${biz.revenue}万`} details={[
                            { label: '同比增长率', val: `${biz.revGrowth > 0 ? '+' : ''}${biz.revGrowth}%`, color: biz.revGrowth >= 0 ? 'text-green-600' : 'text-red-500' },
                            { label: '去年同期', val: `${biz.revLastYear}万` },
                        ]} />
                        <MetricCard title="季度营管净收入" value={`${biz.qRevenue}万`} details={[
                            { label: '同比增长率', val: `${biz.qRevGrowth > 0 ? '+' : ''}${biz.qRevGrowth}%`, color: biz.qRevGrowth >= 0 ? 'text-green-600' : 'text-red-500' },
                        ]} />
                        <MetricCard title="月度营管净收入" value={`${biz.mRevenue}万`} details={[
                            { label: '同比增长率', val: `${biz.mRevGrowth > 0 ? '+' : ''}${biz.mRevGrowth}%`, color: biz.mRevGrowth >= 0 ? 'text-green-600' : 'text-red-500' },
                        ]} />
                    </div>

                    <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-100 dark:border-white/10 p-5">
                        <h4 className="text-[15px] font-bold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-white/10">本年各产品线业绩完成</h4>
                        <table className="w-full text-[13px]">
                            <thead><tr className="border-b border-gray-100 dark:border-white/10"><th className="text-left py-2 font-medium text-gray-500">产品条线</th><th className="text-right py-2 font-medium text-gray-500">年度营管净收入</th><th className="text-right py-2 font-medium text-gray-500">占比</th></tr></thead>
                            <tbody>
                                {biz.productLines.map(pl => (
                                    <tr key={pl.name} className="border-b border-gray-50 dark:border-white/5"><td className="py-2 text-gray-800 dark:text-gray-200">{pl.name}</td><td className="py-2 text-right text-gray-800 dark:text-gray-200">{pl.revenue}万</td><td className="py-2 text-right text-gray-500">{pl.pct}%</td></tr>
                                ))}
                                <tr className="font-bold bg-gray-50 dark:bg-white/5"><td className="py-2 text-gray-800 dark:text-gray-200">合计</td><td className="py-2 text-right text-gray-800 dark:text-gray-200">{biz.plTotal.toFixed(2)}万</td><td className="py-2 text-right text-gray-500">100%</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-100 dark:border-white/10 p-5">
                        <h4 className="text-[15px] font-bold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-white/10">本季各产品线业绩</h4>
                        <div className="space-y-3">
                            {[...biz.productLines].sort((a, b) => b.revenue - a.revenue).map((pl, _idx, arr) => (
                                <HBar key={pl.name} label={pl.name} value={pl.revenue} max={arr[0].revenue} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {bizSubTab === 'PIPELINE' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-4 gap-3">
                        <MetricCard title="本年进行中商机" value={`${biz.pipeline}万`} details={[{ label: '商机数量', val: String(biz.pipelineCount) }]} />
                        <MetricCard title="进行中承诺商机" value={`${biz.commitPipeline}万`} />
                        <MetricCard title="进行中非承诺商机" value={`${biz.uncommitPipeline}万`} />
                        <MetricCard title="本年赢单商机金额" value={`${biz.wonAmount}万`} valueClass="text-green-600" />
                    </div>

                    <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-100 dark:border-white/10 p-5">
                        <h4 className="text-[15px] font-bold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-white/10">本年各产品线进行中商机 承诺·非承诺</h4>
                        <table className="w-full text-[13px]">
                            <thead><tr className="border-b border-gray-100 dark:border-white/10"><th className="text-left py-2 font-medium text-gray-500">产品条线</th><th className="text-right py-2 font-medium text-gray-500">商机金额</th><th className="text-right py-2 font-medium text-gray-500">占比</th><th className="text-right py-2 font-medium text-gray-500">承诺商机</th><th className="text-right py-2 font-medium text-gray-500">非承诺商机</th></tr></thead>
                            <tbody>
                                {biz.productLines.map(pl => {
                                    const commit = Number((pl.revenue * 0.6).toFixed(2));
                                    const uncommit = Number((pl.revenue * 0.4).toFixed(2));
                                    return (
                                        <tr key={pl.name} className="border-b border-gray-50 dark:border-white/5"><td className="py-2 text-gray-800 dark:text-gray-200">{pl.name}</td><td className="py-2 text-right">{pl.revenue}万</td><td className="py-2 text-right text-gray-500">{pl.pct}%</td><td className="py-2 text-right">{commit}万</td><td className="py-2 text-right">{uncommit}万</td></tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {bizSubTab === 'RENEWAL' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-3 gap-3">
                        <MetricCard title="应续金额" value={`${biz.renewalDue}万`} />
                        <MetricCard title="已续费金额" value={`${biz.renewPaid}万`} />
                        <MetricCard title="未续费金额" value={`${biz.renewalUnpaid}万`} details={[
                            { label: '超期未续金额', val: `${biz.renewalOverdue}万` },
                            { label: '未到期未续金额', val: `${biz.renewNotDue}万` },
                        ]} />
                    </div>
                    <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-100 dark:border-white/10 p-5">
                        <h4 className="text-[15px] font-bold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-white/10">续费数据明细</h4>
                        <table className="w-full text-[13px]">
                            <thead><tr className="border-b border-gray-100 dark:border-white/10"><th className="text-left py-2 font-medium text-gray-500">产品条线</th><th className="text-right py-2 font-medium text-gray-500">应续金额</th><th className="text-right py-2 font-medium text-gray-500">已续费金额</th><th className="text-right py-2 font-medium text-gray-500">续费占比</th><th className="text-right py-2 font-medium text-gray-500">未续费金额</th></tr></thead>
                            <tbody>
                                {biz.productLines.map(pl => {
                                    const due = Number((pl.revenue * 1.2).toFixed(2));
                                    const paid = Number((pl.revenue * 0.3).toFixed(2));
                                    const pct = due > 0 ? Number(((paid / due) * 100).toFixed(1)) : 0;
                                    return (
                                        <tr key={pl.name} className="border-b border-gray-50 dark:border-white/5"><td className="py-2 text-gray-800 dark:text-gray-200">{pl.name}</td><td className="py-2 text-right">{due}万</td><td className="py-2 text-right">{paid}万</td><td className="py-2 text-right text-gray-500">{pct}%</td><td className="py-2 text-right">{(due - paid).toFixed(2)}万</td></tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {bizSubTab === 'VISIT' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-4 gap-3">
                        <MetricCard title="名下客户总量" value={biz.totalCustomers.toLocaleString()} />
                        <MetricCard title="本季度拜访客户量" value={String(biz.visitQuarter)} />
                        <MetricCard title="本月拜访客户量" value={String(biz.visitMonth)} />
                        <MetricCard title="本周拜访客户量" value={String(biz.visitWeek)} />
                    </div>
                    <div className="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-100 dark:border-white/10 p-5">
                        <h4 className="text-[15px] font-bold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-white/10">本周拜访客户明细数据</h4>
                        <table className="w-full text-[13px]">
                            <thead><tr className="border-b border-gray-100 dark:border-white/10"><th className="text-left py-2 font-medium text-gray-500">日期</th><th className="text-left py-2 font-medium text-gray-500">客户</th><th className="text-left py-2 font-medium text-gray-500">发布人</th><th className="text-left py-2 font-medium text-gray-500">位置详情</th><th className="text-left py-2 font-medium text-gray-500">记录</th></tr></thead>
                            <tbody>
                                {[
                                    { date: '04/21', customer: '北京经济技术开发区营商环境建设局', loc: '北京市大兴区荣华街道', note: '开发区管委会' },
                                    { date: '04/21', customer: '中共北京市大兴区委办公室', loc: '北京市大兴区观音寺街道', note: '大兴区委办' },
                                    { date: '04/22', customer: '北京市东城区政务服务和数据管理局', loc: '北京市东城区景山街道', note: '东城区委' },
                                    { date: '04/22', customer: '某市政务服务中心', loc: '北京市通州区潞邑街道', note: '线上会议' },
                                    { date: '04/23', customer: '北京市大数据中心', loc: '北京市西城区西长安街街道', note: '大数据中心拜访' },
                                ].slice(0, biz.visitWeek).map((v, i) => (
                                    <tr key={i} className="border-b border-gray-50 dark:border-white/5"><td className="py-2 text-gray-500">{v.date}</td><td className="py-2 text-gray-800 dark:text-gray-200">{v.customer}</td><td className="py-2 text-gray-600">{userName}</td><td className="py-2 text-gray-500 truncate max-w-[200px]">{v.loc}</td><td className="py-2 text-gray-600">{v.note}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
};

export default React.memo(UserBizInfoPanel);
