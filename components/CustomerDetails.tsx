
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Order } from '../types';
import { ArrowLeft, Building2, User, MapPin, Phone, Mail, CreditCard, History, FileText, Package } from 'lucide-react';

interface CustomerDetailsProps {
  customers: Customer[];
  orders: Order[];
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customers, orders }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const customer = customers.find(c => c.id === id);
  
  // Filter orders for this customer
  const customerOrders = orders.filter(o => o.customerId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalSpent = customerOrders.reduce((acc, curr) => acc + curr.total, 0);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-gray-400 text-lg">未找到客户信息</div>
        <button 
          onClick={() => navigate('/customers')}
          className="text-indigo-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> 返回客户列表
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Active': return 'bg-green-100 text-green-700 border-green-200';
          default: return 'bg-gray-100 text-gray-600 border-gray-200';
      }
  };

  const getOrderStatusColor = (status: string) => {
    if (status === '已送达') return 'bg-green-100 text-green-700';
    if (status === '已取消') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
            <button 
                onClick={() => navigate('/customers')}
                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                     <img src={customer.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {customer.companyName}
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(customer.status)}`}>
                            {customer.status === 'Active' ? '合作中' : '已暂停'}
                        </span>
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {customer.industry}</span>
                        <span className="bg-gray-300 w-1 h-1 rounded-full"></span>
                        <span>ID: {customer.id}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Info */}
            <div className="space-y-6">
                {/* Contact Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-600" /> 联系人信息
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                {customer.contactPerson.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{customer.contactPerson}</div>
                                <div className="text-sm text-gray-500">{customer.position}</div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-50 space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {customer.email}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {customer.phone}
                            </div>
                            <div className="flex items-start gap-3 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                {customer.address}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-600" /> 银行/票务信息
                    </h3>
                    {customer.bankInfo ? (
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 text-sm space-y-3">
                             <div>
                                <div className="text-xs text-orange-600/70 mb-0.5">开户银行</div>
                                <div className="font-medium text-gray-800">{customer.bankInfo.bankName}</div>
                             </div>
                             <div>
                                <div className="text-xs text-orange-600/70 mb-0.5">账户名称</div>
                                <div className="font-medium text-gray-800">{customer.bankInfo.accountName}</div>
                             </div>
                             <div>
                                <div className="text-xs text-orange-600/70 mb-0.5">银行账号</div>
                                <div className="font-mono font-medium text-gray-800 text-base">{customer.bankInfo.accountNumber}</div>
                             </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-sm">
                            暂无银行信息
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: History */}
            <div className="lg:col-span-2 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-sm text-gray-500 mb-1">累计消费金额</div>
                        <div className="text-2xl font-bold text-gray-900">¥{totalSpent.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-sm text-gray-500 mb-1">累计订单数</div>
                        <div className="text-2xl font-bold text-gray-900">{customerOrders.length}</div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-600" /> 历史订单
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="p-3 pl-4">订单号</th>
                                    <th className="p-3">日期</th>
                                    <th className="p-3">商品摘要</th>
                                    <th className="p-3 text-right">金额</th>
                                    <th className="p-3 text-center">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customerOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="p-3 pl-4 font-medium text-indigo-600">{order.id}</td>
                                        <td className="p-3 text-gray-600">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-gray-600 max-w-xs truncate">
                                            {order.items.map(i => i.productName).join(', ')}
                                        </td>
                                        <td className="p-3 text-right font-medium">¥{order.total.toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {customerOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400">暂无订单记录</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CustomerDetails;
