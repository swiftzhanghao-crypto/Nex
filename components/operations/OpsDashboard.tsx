
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Pencil, Trash2, Download, ArrowDownUp, TrendingDown, TrendingUp, ChevronDown } from 'lucide-react';

// ── 数据生成 ──────────────────────────────────────────────
function generateSeries(startDate: Date, days: number, startVal: number, targetGrowth: number) {
    const actual: { date: string; value: number }[] = [];
    const target: { date: string; value: number }[] = [];
    const forecast: { date: string; value: number }[] = [];
    let v = startVal;
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
        v = v + (Math.random() - 0.48) * 600 + (i < 300 ? 30 : -20);
        v = Math.max(0, v);
        actual.push({ date: dateStr, value: Math.round(v) });
        target.push({ date: dateStr, value: Math.round(startVal + (targetGrowth / days) * i) });
        forecast.push({ date: dateStr, value: Math.round(startVal * 0.6 + (targetGrowth * 0.9 / days) * i) });
    }
    return { actual, target, forecast };
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
function fmtDate(d: string) {
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}
function weekday(d: string) {
    return WEEKDAYS[new Date(fmtDate(d)).getDay()];
}

interface MetricCard {
    id: string;
    title: string;
    dimension: string;
    targetTotal: number;
    series: ReturnType<typeof generateSeries>;
    dateRange: [string, string];
}

function makeCard(id: string, title: string, dim: string, start: Date, days: number, startVal: number, target: number): MetricCard {
    return {
        id, title, dimension: dim, targetTotal: target,
        series: generateSeries(start, days, startVal, target),
        dateRange: [
            start.toISOString().slice(0, 10),
            new Date(start.getTime() + days * 86400000).toISOString().slice(0, 10),
        ],
    };
}

const INITIAL_CARDS: MetricCard[] = [
    makeCard('c1', '企业月活3人及以上活跃用户数', 'kk', new Date('2022-01-01'), 572, 1000, 111111),
    makeCard('c2', '新增企业数（月）', '月度', new Date('2023-01-01'), 365, 2000, 50000),
];

// ── SVG 折线图 ─────────────────────────────────────────────
interface ChartProps {
    card: MetricCard;
}

const LineChart: React.FC<ChartProps> = ({ card }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);
    const W = 680, H = 240, PL = 58, PR = 12, PT = 12, PB = 36;
    const cw = W - PL - PR, ch = H - PT - PB;

    const { actual, target, forecast } = card.series;
    const n = actual.length;
    if (n === 0) return null;

    const allVals = [...actual.map(p => p.value), ...target.map(p => p.value)];
    const maxV = Math.max(...allVals) * 1.1;
    const minV = 0;
    const range = maxV - minV || 1;

    const px = (i: number) => PL + (i / (n - 1)) * cw;
    const py = (v: number) => PT + ch - ((v - minV) / range) * ch;

    const toPath = (pts: { value: number }[]) =>
        pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(p.value).toFixed(1)}`).join(' ');

    // x-axis labels – show ~8 evenly spaced dates
    const xLabels: number[] = [];
    const step = Math.floor(n / 7);
    for (let i = 0; i < n; i += step) xLabels.push(i);

    // y-axis ticks
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => minV + t * range);

    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = (e.clientX - rect.left) * (W / rect.width) - PL;
        const idx = Math.min(n - 1, Math.max(0, Math.round((mx / cw) * (n - 1))));
        setTooltip({ x: px(idx), y: py(actual[idx].value), idx });
    }, [n, actual, cw, px, py]);

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip(null)}
        >
            {/* y grid */}
            {yTicks.map((v, i) => (
                <g key={i}>
                    <line x1={PL} x2={W - PR} y1={py(v)} y2={py(v)} stroke="#e5e7eb" strokeWidth="0.5" />
                    <text x={PL - 6} y={py(v) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                        {v >= 10000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
                    </text>
                </g>
            ))}
            {/* x labels */}
            {xLabels.map(i => (
                <text key={i} x={px(i)} y={H - PB + 16} textAnchor="middle" fontSize="9" fill="#9ca3af">
                    {actual[i]?.date.slice(0, 8)}
                </text>
            ))}
            {/* forecast area */}
            <path d={`${toPath(forecast)} L ${px(n - 1)} ${H - PB} L ${PL} ${H - PB} Z`} fill="rgba(251,191,36,0.08)" />
            {/* lines */}
            <path d={toPath(forecast)} fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
            <path d={toPath(target)} fill="none" stroke="#EF4444" strokeWidth="1.5" />
            <path d={toPath(actual)} fill="none" stroke="#3B82F6" strokeWidth="2" />
            {/* tooltip */}
            {tooltip && actual[tooltip.idx] && (
                <>
                    <line x1={tooltip.x} x2={tooltip.x} y1={PT} y2={H - PB} stroke="#6b7280" strokeWidth="1" strokeDasharray="3 2" />
                    <circle cx={tooltip.x} cy={tooltip.y} r={4} fill="#3B82F6" stroke="#fff" strokeWidth="1.5" />
                    <rect x={Math.min(tooltip.x + 8, W - 140)} y={tooltip.y - 46} width={130} height={52} rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.10))" />
                    <text x={Math.min(tooltip.x + 14, W - 134)} y={tooltip.y - 30} fontSize="10" fill="#374151" fontWeight="600">
                        {fmtDate(actual[tooltip.idx].date)} 周{weekday(actual[tooltip.idx].date)}
                    </text>
                    <circle cx={Math.min(tooltip.x + 14, W - 134)} cy={tooltip.y - 14} r={3.5} fill="#3B82F6" />
                    <text x={Math.min(tooltip.x + 22, W - 126)} y={tooltip.y - 10} fontSize="10" fill="#374151">
                        实际值：{actual[tooltip.idx].value.toLocaleString()}
                    </text>
                    <circle cx={Math.min(tooltip.x + 14, W - 134)} cy={tooltip.y + 2} r={3.5} fill="#EF4444" />
                    <text x={Math.min(tooltip.x + 22, W - 126)} y={tooltip.y + 6} fontSize="10" fill="#374151">
                        目标值：{target[tooltip.idx].value.toLocaleString()}
                    </text>
                </>
            )}
            {/* legend */}
            <g transform={`translate(${PL + cw / 2 - 90}, ${H - 10})`}>
                <circle cx={0} cy={0} r={4} fill="#3B82F6" />
                <text x={8} y={4} fontSize="10" fill="#6b7280">实际值</text>
                <circle cx={52} cy={0} r={4} fill="#EF4444" />
                <text x={60} y={4} fontSize="10" fill="#6b7280">目标值</text>
                <circle cx={104} cy={0} r={4} fill="#F59E0B" />
                <text x={112} y={4} fontSize="10" fill="#6b7280">预测值</text>
            </g>
        </svg>
    );
};

// ── 指标卡片 ────────────────────────────────────────────────
const MetricCardView: React.FC<{ card: MetricCard; onDelete: () => void }> = ({ card, onDelete }) => {
    const { actual, target } = card.series;
    const last = actual[actual.length - 1]?.value ?? 0;
    const prev = actual[actual.length - 2]?.value ?? last;
    const prevWeek = actual[actual.length - 8]?.value ?? last;
    const dayDelta = last - prev;
    const dayPct = prev > 0 ? ((dayDelta / prev) * 100).toFixed(1) : '0.0';
    const weekDelta = last - prevWeek;
    const weekPct = prevWeek > 0 ? ((weekDelta / prevWeek) * 100).toFixed(1) : '0.0';
    const targetLast = target[target.length - 1]?.value ?? 1;
    const completionRate = targetLast > 0 ? ((last / targetLast) * 100).toFixed(1) : '0.0';
    const targetDev = targetLast > 0 ? (((last - targetLast) / targetLast) * 100).toFixed(1) : '0.0';
    const targetIncr = card.targetTotal - (target[0]?.value ?? 0);

    const DeltaTag: React.FC<{ v: number; pct: string }> = ({ v, pct }) => (
        <span className={`flex items-center gap-0.5 text-xs font-medium ${v >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {v >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Number(pct) >= 0 ? '+' : ''}{pct}%
        </span>
    );

    return (
        <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden">
            {/* 卡片头 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/10">
                <span className="text-sm font-bold text-gray-800 dark:text-white">{card.title}</span>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition"><ArrowDownUp className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#0071E3] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"><Download className="w-3.5 h-3.5" /></button>
                    <button className="flex items-center gap-1 text-xs text-[#0071E3] hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition font-medium">
                        <Pencil className="w-3 h-3" /> 编辑
                    </button>
                    <button onClick={onDelete} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium">
                        <Trash2 className="w-3 h-3" /> 删除
                    </button>
                </div>
            </div>

            <div className="flex">
                {/* 左侧数据面板 */}
                <div className="w-52 shrink-0 border-r border-gray-100 dark:border-white/10 p-4 space-y-0">
                    {/* 维度下拉 */}
                    <div className="mb-4">
                        <button className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 bg-white dark:bg-white/5 hover:border-[#0071E3] transition">
                            {card.dimension} <ChevronDown className="w-3 h-3 text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        <div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">实际完成值</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{last.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">日增量</span>
                            <span className={`text-xs font-semibold ${dayDelta >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500'}`}>{dayDelta >= 0 ? '+' : ''}{dayDelta.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">日环比</span>
                            <DeltaTag v={dayDelta} pct={dayPct} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">周增量</span>
                            <span className={`text-xs font-semibold ${weekDelta >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500'}`}>{weekDelta >= 0 ? '+' : ''}{weekDelta.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">周环比</span>
                            <DeltaTag v={weekDelta} pct={weekPct} />
                        </div>

                        <div className="border-t border-gray-100 dark:border-white/10 pt-2.5 space-y-2.5">
                            <div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">整体目标值</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{card.targetTotal.toLocaleString()}</div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">目标增量</span>
                                <span className="text-xs font-semibold text-gray-800 dark:text-white">{targetIncr.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-white/10 pt-2.5 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">实际完成率</span>
                                <span className={`text-xs font-bold ${Number(completionRate) >= 100 ? 'text-green-600' : 'text-gray-800 dark:text-white'}`}>{completionRate}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">目标偏差</span>
                                <span className={`text-xs font-bold ${Number(targetDev) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{Number(targetDev) >= 0 ? '+' : ''}{targetDev}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 右侧图表 */}
                <div className="flex-1 min-w-0 p-4">
                    <div className="flex justify-end mb-2 text-xs text-gray-400 dark:text-gray-500">
                        <span className="border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1 bg-white dark:bg-white/5">
                            📅 {card.dateRange[0]} — {card.dateRange[1]}
                        </span>
                    </div>
                    <div className="h-56">
                        <LineChart card={card} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── 新增指标弹窗 ────────────────────────────────────────────
const AddMetricModal: React.FC<{ onClose: () => void; onAdd: (title: string, dim: string, target: number) => void }> = ({ onClose, onAdd }) => {
    const [title, setTitle] = useState('');
    const [dim, setDim] = useState('全部');
    const [target, setTarget] = useState('');
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-modal-enter">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">新增指标</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-3">
                    {[
                        { label: '指标名称', value: title, set: setTitle, ph: '例：企业月活用户数', req: true },
                        { label: '维度', value: dim, set: setDim, ph: '例：kk', req: false },
                    ].map(f => (
                        <div key={f.label}>
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{f.label}{f.req && <span className="text-red-500 ml-0.5">*</span>}</label>
                            <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                                className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-[#0071E3] dark:text-white" />
                        </div>
                    ))}
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">整体目标值</label>
                        <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="例：111111"
                            className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-[#0071E3] dark:text-white" />
                    </div>
                </div>
                <div className="flex gap-2 mt-5">
                    <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition">取消</button>
                    <button onClick={() => { if (title.trim()) onAdd(title.trim(), dim, Number(target) || 100000); }}
                        disabled={!title.trim()}
                        className="flex-1 bg-[#0071E3] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                        新增
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── 主组件 ─────────────────────────────────────────────────
const OpsDashboard: React.FC = () => {
    const [cards, setCards] = useState<MetricCard[]>(INITIAL_CARDS);
    const [showAdd, setShowAdd] = useState(false);

    const handleAdd = (title: string, dim: string, target: number) => {
        const id = `c${Date.now()}`;
        setCards(prev => [...prev, makeCard(id, title, dim, new Date('2023-01-01'), 365, 3000, target)]);
        setShowAdd(false);
    };

    return (
        <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter h-full flex flex-col">
            {/* 顶部 */}
            <div className="flex items-center gap-4 shrink-0 mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">指标看板</h1>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-1.5 bg-[#0071E3] text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition font-medium shadow-apple"
                >
                    <Plus className="w-4 h-4" /> 新增指标
                </button>
            </div>

            {/* 指标卡片列表 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pb-4">
                {cards.length === 0 && (
                    <div className="unified-card dark:bg-[#1C1C1E] p-16 text-center text-gray-400">
                        <p className="text-sm">暂无指标，点击"新增指标"添加</p>
                    </div>
                )}
                {cards.map(card => (
                    <MetricCardView
                        key={card.id}
                        card={card}
                        onDelete={() => setCards(prev => prev.filter(c => c.id !== card.id))}
                    />
                ))}
            </div>

            {showAdd && <AddMetricModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
        </div>
    );
};

export default OpsDashboard;
