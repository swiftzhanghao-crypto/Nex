
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Order, OrderStatus } from '../types';
import { Activity, DollarSign, ShoppingCart, TrendingUp, Clock, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { generateBusinessInsight } from '../services/geminiService';

interface DashboardProps {
  orders: Order[];
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
}

const COLORS = ['#0071E3', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#8E8E93'];
const COLORS_DARK = ['#FF2D55', '#32D74B', '#FF9F0A', '#FF453A', '#BF5AF2', '#8E8E93'];

const Dashboard: React.FC<DashboardProps> = ({ orders, totalRevenue, totalOrders, totalCustomers }) => {
  const navigate = useNavigate();
  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  // --- Data Aggregation ---
  const revenueData = useMemo(() => {
    // 1. Generate last 6 months labels in chronological order
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleString('zh-CN', { month: 'short' }));
    }

    // 2. Aggregate data
    const dataMap: Record<string, number> = {};
    months.forEach(m => dataMap[m] = 0);

    orders.forEach(order => {
        if (order.status !== OrderStatus.CANCELLED) {
            const date = new Date(order.date);
            const key = date.toLocaleString('zh-CN', { month: 'short' });
            if (dataMap[key] !== undefined) {
                dataMap[key] += order.total;
            }
        }
    });

    // 3. Map back to array to guarantee order
    return months.map(name => ({ name, revenue: dataMap[name] || 0 }));
  }, [orders]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
        counts[order.status] = (counts[order.status] || 0) + 1;
    });
    const simpleData = [
        { name: '已完成/送达', value: (counts[OrderStatus.DELIVERED] || 0) + (counts[OrderStatus.SHIPPED] || 0) },
        { name: '处理中/生产', value: (counts[OrderStatus.PROCESSING_PROD] || 0) + (counts[OrderStatus.PENDING_CONFIRM] || 0) },
        { name: '待审批/支付', value: (counts[OrderStatus.PENDING_APPROVAL] || 0) + (counts[OrderStatus.PENDING_PAYMENT] || 0) },
        { name: '已取消', value: counts[OrderStatus.CANCELLED] || 0 },
    ];
    return simpleData.filter(d => d.value > 0);
  }, [orders]);

  const topCategories = useMemo(() => {
     const cats: Record<string, number> = {};
     orders.forEach(o => {
         o.items.forEach(item => {
             const cat = item.productName.includes('WPS') ? '办公软件' : 
                         item.productName.includes('PDF') ? '工具软件' : 
                         item.productName.includes('会员') ? '增值服务' : '其他';
             cats[cat] = (cats[cat] || 0) + item.quantity;
         });
     });
     return Object.entries(cats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);
  }, [orders]);

  const recentOrders = useMemo(() => {
      return [...orders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
  }, [orders]);

  const topCategoryName = topCategories.length > 0 ? topCategories[0].name : "通用";
  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const result = await generateBusinessInsight(totalRevenue, totalOrders, topCategoryName);
    setInsight(result);
    setLoadingInsight(false);
  };

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING_APPROVAL || o.status === OrderStatus.PENDING_PAYMENT).length;

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">仪表盘</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">商业概览与核心指标。</p>
        </div>
        <button 
            onClick={handleGenerateInsight}
            disabled={loadingInsight}
            className="flex items-center gap-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white px-5 py-2.5 rounded-full shadow-lg hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition disabled:opacity-50 text-sm font-medium"
        >
            {loadingInsight ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loadingInsight ? "分析中..." : "AI 商业洞察"}
        </button>
      </div>

      {/* AI Insight Panel */}
      {insight && (
        <div className="bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-3xl shadow-apple animate-modal-enter relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.1]">
                <Sparkles className="w-64 h-64 rotate-12 text-black dark:text-white" />
            </div>
            <div className="relative z-10 flex gap-5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0071E3] to-purple-600 dark:from-[#FF2D55] dark:to-orange-500 flex items-center justify-center shadow-md shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">AI 分析摘要</h3>
                    <div className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm">{insight}</div>
                </div>
            </div>
        </div>
      )}

      {/* KPI Cards - Bento Grid Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
            title="总收入" 
            value={`¥${totalRevenue.toLocaleString()}`} 
            icon={<DollarSign className="w-6 h-6 text-white" />} 
            trend="+12.5%" 
            trendUp={true}
            color="bg-[#0071E3] dark:bg-[#FF2D55]"
        />
        <StatCard 
            title="总订单数" 
            value={totalOrders.toString()} 
            icon={<ShoppingCart className="w-6 h-6 text-white" />} 
            trend="+5.2%" 
            trendUp={true}
            color="bg-[#34C759] dark:bg-[#32D74B]"
        />
        <StatCard 
            title="待处理" 
            value={pendingCount.toString()} 
            icon={<Clock className="w-6 h-6 text-white" />} 
            trend="需关注" 
            trendUp={false}
            color="bg-[#FF9500] dark:bg-[#FF9F0A]"
        />
        <StatCard 
            title="平均客单价" 
            value={`¥${avgOrderValue.toFixed(0)}`} 
            icon={<Activity className="w-6 h-6 text-white" />} 
            trend="+2.1%" 
            trendUp={true}
            color="bg-[#AF52DE] dark:bg-[#BF5AF2]"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 flex flex-col">
          <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">收入趋势</h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-white/10 dark:text-gray-300 px-3 py-1 rounded-full">近6个月</span>
          </div>
          <div className="flex-1 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-color)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--chart-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-white/10" vertical={false} />
                <XAxis dataKey="name" stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `¥${value/1000}k`} />
                <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontSize: '12px', color: 'var(--tooltip-text)' }}
                    itemStyle={{ color: 'var(--chart-color)', fontWeight: 600 }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                />
                <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--chart-color)" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{ r: 5, strokeWidth: 0, fill: 'var(--chart-color)' }}
                    className="stroke-[#0071E3] dark:stroke-[#FF2D55] fill-[#0071E3] dark:fill-[#FF2D55]"
                    style={{
                        '--chart-color': 'currentColor' 
                    } as React.CSSProperties}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 tracking-tight">订单状态</h3>
          <div className="flex-1 min-h-[320px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={6}
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={document.documentElement.classList.contains('dark') ? COLORS_DARK[index % COLORS_DARK.length] : COLORS[index % COLORS.length]} 
                        strokeWidth={0} 
                    />
                  ))}
                </Pie>
                <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} formatter={(value) => <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tighter">{totalOrders}</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-1">总订单</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100/50 dark:border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">最新交易</h3>
                <button onClick={() => navigate('/orders')} className="text-[#0071E3] dark:text-[#FF2D55] text-sm hover:underline flex items-center gap-1 font-medium">
                    查看全部 <ArrowRight className="w-3 h-3" />
                </button>
            </div>
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 pl-6 font-medium">订单号</th>
                            <th className="p-4 font-medium">客户</th>
                            <th className="p-4 font-medium">金额</th>
                            <th className="p-4 font-medium">状态</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50 dark:divide-white/5">
                        {recentOrders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                                <td className="p-4 pl-6 font-medium text-gray-900 dark:text-gray-200">{order.id}</td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">{order.customerName}</td>
                                <td className="p-4 font-semibold text-gray-900 dark:text-gray-200">¥{order.total.toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                                        order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        order.status === OrderStatus.PENDING_PAYMENT ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden flex flex-col">
             <div className="p-6 border-b border-gray-100/50 dark:border-white/10">
                <h3 className="font-bold text-gray-900 dark:text-white">热销类别</h3>
            </div>
            <div className="p-6 space-y-5">
                {topCategories.map((cat, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/10 flex items-center justify-center font-bold text-gray-400 text-xs shadow-inner">
                            {index + 1}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between mb-1.5">
                                <span className="font-medium text-gray-900 dark:text-gray-200 text-sm">{cat.name}</span>
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{cat.value} 件</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className="h-1.5 rounded-full transition-all duration-1000" 
                                    style={{ 
                                        width: `${(cat.value / topCategories[0].value) * 100}%`,
                                        backgroundColor: document.documentElement.classList.contains('dark') ? COLORS_DARK[index % COLORS_DARK.length] : COLORS[index % COLORS.length]
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, trend, trendUp }: any) => (
  <div className="p-6 rounded-3xl shadow-apple bg-white dark:bg-[#1C1C1E] border border-gray-100/50 dark:border-white/10 transition duration-300 hover:shadow-apple-hover flex flex-col justify-between h-[160px] group">
    <div className="flex justify-between items-start">
        <div className={`p-3 rounded-2xl ${color} shadow-lg shadow-gray-200 dark:shadow-none transition-transform group-hover:scale-105`}>
            {icon}
        </div>
        {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                trendUp 
                ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>
                {trendUp ? <TrendingUp className="w-3 h-3" /> : null}
                <span>{trend}</span>
            </div>
        )}
    </div>
    
    <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</h4>
        <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</div>
    </div>
  </div>
);

export default Dashboard;
