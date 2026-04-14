
import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { Package, CheckCircle, FileText, Truck, Disc, Search, ChevronRight, Clock, AlertCircle, CreditCard, CheckSquare, ClipboardCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';

const OperationsManager: React.FC = () => {
  const { orders, setOrders } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'AUTH' | 'PKG' | 'SHIP' | 'CD'>('AUTH');
  const [searchTerm, setSearchTerm] = useState('');

  // Overall workflow steps for visual context
  const mainSteps = [
    { id: 'PAYMENT', label: '支付', icon: CreditCard, status: 'Completed' },
    { id: 'APPROVAL', label: '审批', icon: FileText, status: 'Completed' },
    { id: 'CONFIRM', label: '确认', icon: CheckSquare, status: 'Completed' },
    { id: 'AUTH', label: '授权确认', icon: CheckCircle, status: activeTab === 'AUTH' ? 'Current' : 'Completed' },
    { id: 'PKG', label: '安装包核验', icon: FileText, status: activeTab === 'PKG' ? 'Current' : (['SHIP', 'CD'].includes(activeTab) ? 'Completed' : 'Locked') },
    { id: 'SHIP', label: '快递单填写', icon: Truck, status: activeTab === 'SHIP' ? 'Current' : (activeTab === 'CD' ? 'Completed' : 'Locked') },
    { id: 'CD', label: '光盘刻录', icon: Disc, status: activeTab === 'CD' ? 'Current' : 'Locked' },
    { id: 'SHIPPING', label: '发货', icon: Truck, status: 'Locked' },
    { id: 'ACCEPTANCE', label: '验收', icon: ClipboardCheck, status: 'Locked' },
  ];

  // Filter orders that are in PROCESSING_PROD status
  const processingOrders = orders.filter(o => o.status === OrderStatus.PROCESSING_PROD);

  // Filter based on active tab requirements
  const getTabOrders = () => {
    switch (activeTab) {
      case 'AUTH':
        return processingOrders.filter(o => !o.isAuthConfirmed);
      case 'PKG':
        return processingOrders.filter(o => o.isAuthConfirmed && !o.isPackageConfirmed);
      case 'SHIP':
        return processingOrders.filter(o => o.isPackageConfirmed && !o.isShippingConfirmed);
      case 'CD':
        return processingOrders.filter(o => o.isShippingConfirmed && !o.isCDBurned);
      default:
        return [];
    }
  };

  const filteredOrders = getTabOrders().filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = (orderId: string, action: 'AUTH' | 'PKG' | 'SHIP' | 'CD') => {
    const now = new Date().toISOString();
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const updated = { ...o };
        if (action === 'AUTH') {
          updated.isAuthConfirmed = true;
          updated.authConfirmedDate = now;
        } else if (action === 'PKG') {
          updated.isPackageConfirmed = true;
          updated.packageConfirmedDate = now;
        } else if (action === 'SHIP') {
          updated.isShippingConfirmed = true;
          updated.shippingConfirmedDate = now;
          updated.carrier = 'SF Express';
          updated.trackingNumber = `SF${Date.now()}`;
        } else if (action === 'CD') {
          updated.isCDBurned = true;
          updated.cdBurnedDate = now;
          // If all steps done, maybe auto-ship? 
          // The user didn't specify auto-ship, but usually CD burning is the last step before SHIPPED.
          // Let's keep it in PROCESSING_PROD until manual ship or we can auto-ship if it's the last step.
          // For now, let's just mark it done.
        }
        
        updated.approvalRecords = [{
          id: `op-${action.toLowerCase()}-${Date.now()}`,
          operatorId: 'u4', // Zhao Min (Technical)
          operatorName: '赵敏',
          operatorRole: 'Technical',
          actionType: `Stock Prep: ${action}`,
          result: 'Completed',
          timestamp: now,
          comment: `完成备货流程: ${action}`
        }, ...o.approvalRecords];
        
        return updated;
      }
      return o;
    });
    setOrders(updatedOrders);
  };

  const tabs = [
    { id: 'AUTH', label: '授权确认', icon: CheckCircle, count: processingOrders.filter(o => !o.isAuthConfirmed).length },
    { id: 'PKG', label: '安装包核验', icon: FileText, count: processingOrders.filter(o => o.isAuthConfirmed && !o.isPackageConfirmed).length },
    { id: 'SHIP', label: '快递单填写', icon: Truck, count: processingOrders.filter(o => o.isPackageConfirmed && !o.isShippingConfirmed).length },
    { id: 'CD', label: '光盘刻录', icon: Disc, count: processingOrders.filter(o => o.isShippingConfirmed && !o.isCDBurned).length },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* Overall Workflow Stepper */}
      <div className="unified-card dark:bg-[#1C1C1E] p-8 border-gray-100/50 dark:border-white/10 overflow-x-auto">
        <div className="flex justify-between items-start relative min-w-[700px]">
          <div className="absolute top-6 left-0 w-full h-1 bg-gray-100 dark:bg-white/10 -z-0 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: '60%' }}></div>
          </div>
          {mainSteps.map((step, idx) => (
            <div 
              key={step.id} 
              className={`flex flex-col items-center gap-3 relative z-10 flex-1 transition-all group ${
                step.status === 'Locked' ? 'opacity-40 grayscale' : ''
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-apple ${
                step.status === 'Completed' ? 'bg-green-500 text-white ring-4 ring-green-100 dark:ring-green-900/20' : 
                step.status === 'Current' ? 'bg-[#0071E3] dark:bg-[#0A84FF] text-white ring-8 ring-blue-100 dark:ring-blue-900/30 shadow-xl scale-110' : 
                'bg-white dark:bg-[#2C2C2E] border-2 border-gray-200 dark:border-gray-600 text-gray-400'
              }`}>
                {step.status === 'Locked' ? <Lock className="w-5 h-5" /> : <step.icon className="w-6 h-6" />}
              </div>
              <div className="text-center">
                <div className={`text-sm font-bold ${step.status === 'Completed' ? 'text-green-600' : step.status === 'Current' ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400'}`}>{step.label}</div>
                {step.status === 'Current' && (
                  <div className="unified-button-primary text-[10px] bg-[#0071E3] dark:bg-[#0A84FF] shadow-apple mt-1 animate-bounce">点击处理</div>
                )}
                {step.status === 'Completed' && (
                  <div className="text-[9px] text-gray-400 font-mono mt-0.5">
                    {new Date().toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">备货处理</h1>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="搜索订单或客户..."
              className="unified-card w-full pl-9 pr-4 py-2 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'AUTH' | 'PKG' | 'SHIP' | 'CD')}
              className={`relative p-4 rounded-2xl border transition-all duration-300 text-left group
                ${isActive 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-white dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 text-gray-500 hover:border-blue-300 dark:hover:border-blue-900'}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                    {tab.count}
                  </span>
                )}
              </div>
              <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{tab.label}</div>
              <div className={`text-[10px] mt-1 ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                {tab.id === 'AUTH' && '生成并确认产品授权码'}
                {tab.id === 'PKG' && '核对安装包版本及完整性'}
                {tab.id === 'SHIP' && '填写快递单及物流信息'}
                {tab.id === 'CD' && '刻录物理光盘介质'}
              </div>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Order List */}
      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">订单信息</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">客户名称</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">商品摘要</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">提单时间</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">#{order.id}</span>
                        <span className="text-[10px] text-gray-400">金额: ¥{order.total.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{order.customerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded text-[10px]">
                            {item.productName} x{item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(order.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
                        >
                          详情
                        </button>
                        <button 
                          onClick={() => handleAction(order.id, activeTab)}
                          className="unified-button-primary shadow-apple"
                        >
                          确认完成
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Package className="w-12 h-12 opacity-20" />
                      <p className="text-sm">暂无待处理订单</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperationsManager;
