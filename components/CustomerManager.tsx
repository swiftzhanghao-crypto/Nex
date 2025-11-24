
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../types';
import { Search, Eye, Building2, Mail, Phone } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredCustomers = customers.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">企业客户管理</h2>
            <p className="text-gray-500 text-sm mt-1">管理客户档案、查看财务信息及历史订单。</p>
        </div>
        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 w-full md:w-80">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索公司、行业或联系人..." 
            className="bg-transparent border-none outline-none flex-1 text-gray-700 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 font-medium text-sm">
              <tr>
                <th className="p-4 border-b border-gray-100 pl-6">企业名称 / 行业</th>
                <th className="p-4 border-b border-gray-100">主要联系人</th>
                <th className="p-4 border-b border-gray-100">联系方式</th>
                <th className="p-4 border-b border-gray-100">合作状态</th>
                <th className="p-4 border-b border-gray-100 text-right pr-6">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map(customer => (
                <tr 
                    key={customer.id} 
                    className="hover:bg-gray-50 transition group cursor-pointer"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                            {customer.logo ? (
                                <img src={customer.logo} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-gray-800 group-hover:text-indigo-600 transition">{customer.companyName}</div>
                            <div className="text-xs text-gray-500">{customer.industry}</div>
                        </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-700">{customer.contactPerson}</div>
                    <div className="text-xs text-gray-400">{customer.position}</div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {customer.phone}
                        </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        customer.status === 'Active' 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                        {customer.status === 'Active' ? '合作中' : '已暂停'}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${customer.id}`);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                    >
                        <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                  <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">未找到符合条件的客户。</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerManager;
