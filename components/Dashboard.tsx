import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Order, OrderStatus } from '../types';
import { Activity, DollarSign, Package, Users, Sparkles, RefreshCw } from 'lucide-react';
import { generateBusinessInsight } from '../services/geminiService';

interface DashboardProps {
  orders: Order[];
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, totalRevenue, totalOrders, totalCustomers }) => {
  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  const data = [
    { name: '1月', revenue: 4000 },
    { name: '2月', revenue: 3000 },
    { name: '3月', revenue: 2000 },
    { name: '4月', revenue: 2780 },
    { name: '5月', revenue: 1890 },
    { name: '6月', revenue: 2390 },
    { name: '7月', revenue: 3490 },
  ];

  // Simple calculation for "top product" placeholder
  const topCategory = "电子产品"; 

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const result = await generateBusinessInsight(totalRevenue, totalOrders, topCategory);
    setInsight(result);
    setLoadingInsight(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">仪表盘</h1>
          <p className="text-gray-500">欢迎回来，以下是今日的业务概况。</p>
        </div>
        <button 
            onClick={handleGenerateInsight}
            disabled={loadingInsight}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition disabled:opacity-50"
        >
            {loadingInsight ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loadingInsight ? "正在分析数据..." : "询问 AI 分析师"}
        </button>
      </div>

      {insight && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-indigo-900">AI 商业洞察</h3>
                    <div className="text-indigo-800 text-sm whitespace-pre-line mt-1">{insight}</div>
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="总收入" value={`¥${totalRevenue.toLocaleString()}`} icon={<DollarSign className="text-green-600" />} color="bg-green-100" />
        <StatCard title="总订单数" value={totalOrders.toString()} icon={<Package className="text-blue-600" />} color="bg-blue-100" />
        <StatCard title="活跃客户" value={totalCustomers.toString()} icon={<Users className="text-purple-600" />} color="bg-purple-100" />
        <StatCard title="平均客单价" value={`¥${(totalOrders > 0 ? totalRevenue / totalOrders : 0).toFixed(2)}`} icon={<Activity className="text-orange-600" />} color="bg-orange-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">收入趋势</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `¥${value}`} />
                <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#4f46e5' }}
                    formatter={(value: number) => [`¥${value}`, '收入']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">销售销量</h3>
           <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value: number) => [`¥${value}`, '销售额']}
                />
                <Bar dataKey="revenue" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 transition hover:-translate-y-1 hover:shadow-md">
    <div className={`p-3 rounded-lg ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
    </div>
  </div>
);

export default Dashboard;