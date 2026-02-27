
import React from 'react';
import { Activity, BarChart2, Zap, Settings, Globe, Server } from 'lucide-react';

const OperationsManager = () => {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">运营管理</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">WPS 365 平台运营数据监控与配置。</p>
        </div>
        <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> 系统运行正常
            </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-xl shadow-apple border border-gray-100/50 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Activity className="w-5 h-5"/></div>
                <h3 className="font-bold text-gray-900 dark:text-white">活跃用户 (DAU)</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">12,450</div>
            <div className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                <TrendingUpIcon className="w-3 h-3" /> 较昨日 +5.2%
            </div>
        </div>
        
        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-xl shadow-apple border border-gray-100/50 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><Zap className="w-5 h-5"/></div>
                <h3 className="font-bold text-gray-900 dark:text-white">API 调用量</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">1.2M</div>
            <div className="text-xs text-gray-500 mt-1">今日累计</div>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-xl shadow-apple border border-gray-100/50 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg"><Server className="w-5 h-5"/></div>
                <h3 className="font-bold text-gray-900 dark:text-white">租户实例</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">856</div>
            <div className="text-xs text-gray-500 mt-1">运行中</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-xl shadow-apple border border-gray-100/50 dark:border-white/10">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">运营配置</h3>
              <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-gray-400" />
                          <div className="text-sm font-medium dark:text-white">全站公告配置</div>
                      </div>
                      <button className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">管理</button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                          <Settings className="w-5 h-5 text-gray-400" />
                          <div className="text-sm font-medium dark:text-white">功能开关控制</div>
                      </div>
                      <button className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">配置</button>
                  </div>
              </div>
          </div>
          
          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-xl shadow-apple border border-gray-100/50 dark:border-white/10 flex items-center justify-center text-gray-400 text-sm">
              更多运营指标图表加载中...
          </div>
      </div>
    </div>
  );
};

const TrendingUpIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);

export default OperationsManager;
