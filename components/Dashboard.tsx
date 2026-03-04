
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingCart, Target, ArrowUpRight, ArrowDownRight, 
  DollarSign, Package, Activity, Calendar
} from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock data for charts
  const salesData = [
    { name: '1月', value: 4000, orders: 240 },
    { name: '2月', value: 3000, orders: 198 },
    { name: '3月', value: 2000, orders: 150 },
    { name: '4月', value: 2780, orders: 210 },
    { name: '5月', value: 1890, orders: 120 },
    { name: '6月', value: 2390, orders: 180 },
    { name: '7月', value: 3490, orders: 250 },
  ];

  const statusData = [
    { name: '已交付', value: 400, color: '#10B981' },
    { name: '待审批', value: 300, color: '#F59E0B' },
    { name: '待付款', value: 300, color: '#3B82F6' },
    { name: '已取消', value: 200, color: '#EF4444' },
  ];

  const productData = [
    { name: 'WPS 365 标准版', value: 540 },
    { name: 'WPS 365 高级版', value: 320 },
    { name: '私有云部署包', value: 120 },
    { name: 'WebOffice SDK', value: 210 },
    { name: 'WPS 2019 专业版', value: 450 },
  ];

  const stats = [
    { label: '总销售额', value: '¥1,284,500', icon: DollarSign, trend: '+12.5%', isUp: true, color: 'blue' },
    { label: '活跃客户', value: '1,240', icon: Users, trend: '+5.2%', isUp: true, color: 'emerald' },
    { label: '订单总量', value: '856', icon: ShoppingCart, trend: '-2.4%', isUp: false, color: 'amber' },
    { label: '商机转化率', value: '24.8%', icon: Target, trend: '+1.2%', isUp: true, color: 'violet' },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">数据看板</h1>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
          <button className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">今日</button>
          <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition">本周</button>
          <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition">本月</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-gray-200 dark:border-white/10 shadow-apple hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.trend}
                {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-apple">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">销售趋势</h3>
            </div>
            <select className="text-xs bg-gray-50 dark:bg-white/5 border-none rounded-lg px-2 py-1 focus:ring-0">
              <option>最近7个月</option>
              <option>最近12个月</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0071E3" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#9CA3AF'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#9CA3AF'}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
                <Area type="monotone" dataKey="value" stroke="#0071E3" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-apple">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">订单状态分布</h3>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {statusData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-apple">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-violet-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">热门商品排行</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={120}
                  tick={{fontSize: 12, fill: '#4B5563'}}
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-apple">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">近期业务动态</h3>
            </div>
            <button className="text-xs text-blue-600 hover:underline">查看全部</button>
          </div>
          <div className="space-y-4">
            {[
              { user: '李娜', action: '创建了新商机', target: '中核集团WPS升级项目', time: '10分钟前', type: 'opp' },
              { user: '张伟', action: '审批通过了订单', target: 'S00089231', time: '2小时前', type: 'order' },
              { user: '王强', action: '确认了回款', target: '¥120,000 (信达发展)', time: '4小时前', type: 'payment' },
              { user: '系统', action: '同步了新线索', target: '来自官网咨询 (12条)', time: '昨天', type: 'leads' },
              { user: '赵敏', action: '生成了授权码', target: '华兴科技 (500用户)', time: '昨天', type: 'license' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition group">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-500">
                  {activity.user[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-bold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{activity.target}</p>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
