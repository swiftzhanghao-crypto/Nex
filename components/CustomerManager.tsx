
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, User, CustomerType, CustomerLevel, CustomerContact, ContactRole } from '../types';
import { Search, Eye, Plus, X } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>; 
  users?: User[]; 
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, setCustomers, users }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Customer Form State
  const initialFormState = {
      companyName: '',
      industry: '',
      customerType: 'Enterprise' as CustomerType,
      level: 'B' as CustomerLevel,
      region: '',
      address: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      contactRole: 'Purchasing' as ContactRole
  };
  const [formData, setFormData] = useState(initialFormState);

  const filteredCustomers = customers.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contacts.some(contact => contact.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getOwnerAvatar = (ownerId?: string) => {
      const user = users?.find(u => u.id === ownerId);
      return user?.avatar;
  };

  const getLevelBadge = (level: string) => {
      switch(level) {
          case 'KA': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
          case 'A': return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';
          case 'B': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
          default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
      }
  };

  const getPrimaryContact = (customer: Customer) => {
      return customer.contacts.find(c => c.isPrimary) || customer.contacts.find(c => c.roles.includes('Purchasing')) || customer.contacts[0];
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleCreate = () => {
      if (!setCustomers || !formData.companyName) return;
      const newId = `C${Date.now()}`;
      const initialContact: CustomerContact = {
          id: `ct-${Date.now()}`,
          name: formData.contactName || 'Contact',
          phone: formData.contactPhone,
          email: formData.contactEmail,
          roles: [formData.contactRole],
          isPrimary: true,
          position: '主要联系人'
      };
      const newCustomer: Customer = {
          id: newId,
          companyName: formData.companyName,
          industry: formData.industry,
          customerType: formData.customerType,
          level: formData.level,
          region: formData.region,
          address: formData.address,
          shippingAddress: formData.address,
          status: 'Active',
          logo: `https://ui-avatars.com/api/?name=${formData.companyName.substring(0, 2)}&background=random&color=fff`,
          contacts: [initialContact],
          billingInfo: { taxId: '', title: formData.companyName, bankName: '', accountNumber: '', registerAddress: formData.address, registerPhone: '' },
          enterprises: []
      };
      setCustomers(prev => [newCustomer, ...prev]);
      setIsCreateOpen(false);
      setFormData(initialFormState);
      navigate(`/customers/${newId}`);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">企业客户管理</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理客户档案、查看财务信息及历史订单。</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white dark:bg-[#1C1C1E] p-2.5 rounded-sm shadow-sm border border-gray-100 dark:border-white/10 flex items-center gap-3 flex-1 md:w-64">
                <Search className="w-5 h-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="搜索公司、行业或联系人..." 
                    className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {setCustomers && (
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#0071E3] dark:bg-[#FF2D55] text-white px-4 py-2.5 rounded-sm flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-sm whitespace-nowrap text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> 新增客户
                </button>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 dark:bg-white/5 backdrop-blur border-b border-gray-200/50 dark:border-white/10 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase">
              <tr>
                <th className="p-4 pl-6">企业名称 / 行业</th>
                <th className="p-4">客户类型</th>
                <th className="p-4">主要联系人</th>
                <th className="p-4">归属销售</th>
                <th className="p-4">合作状态</th>
                <th className="p-4 text-right pr-6">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-base">
              {currentCustomers.map(customer => {
                const primaryContact = getPrimaryContact(customer);
                return (
                  <tr 
                      key={customer.id} 
                      className="group cursor-pointer hover:bg-gray-100/80 dark:hover:bg-white/[0.08] even:bg-gray-50/50 dark:even:bg-white/[0.02] transition-colors"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                          {/* Logo removed as requested */}
                          <div>
                              <div className="font-bold text-gray-800 dark:text-white group-hover:text-[#0071E3] dark:group-hover:text-[#FF2D55] transition flex items-center gap-2 text-base">
                                  {customer.companyName}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${getLevelBadge(customer.level)}`}>{customer.level}</span>
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{customer.region} | {customer.industry}</div>
                          </div>
                      </div>
                    </td>
                    <td className="p-4">
                       <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/10 px-2 py-1 rounded-sm">{customer.customerType}</span>
                    </td>
                    <td className="p-4">
                      {primaryContact ? (
                          <>
                            <div className="font-medium text-gray-700 dark:text-gray-200 text-sm">{primaryContact.name}</div>
                            <div className="text-sm text-gray-400 flex flex-col">
                                <span>{primaryContact.phone}</span>
                            </div>
                          </>
                      ) : (
                          <span className="text-gray-400 text-sm italic">无联系人</span>
                      )}
                    </td>
                    <td className="p-4">
                       {customer.ownerName ? (
                           <div className="flex items-center gap-2">
                               <img 
                                  src={getOwnerAvatar(customer.ownerId) || `https://api.dicebear.com/9.x/avataaars/svg?seed=${customer.ownerName}`} 
                                  className="w-7 h-7 rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-800"
                                  alt=""
                               />
                               <span className="text-sm text-gray-700 dark:text-gray-300">{customer.ownerName}</span>
                           </div>
                       ) : (
                           <span className="text-sm text-gray-400 italic">未分配</span>
                       )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium border ${
                          customer.status === 'Active' 
                          ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                          : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
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
                          className="p-2 text-gray-400 hover:text-[#0071E3] dark:hover:text-[#FF2D55] hover:bg-blue-50 dark:hover:bg-white/10 rounded-md transition"
                      >
                          <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {currentCustomers.length === 0 && (
                  <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 text-base">未找到符合条件的客户。</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    共 {filteredCustomers.length} 条数据
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-sm font-medium"
                    >
                        上一页
                    </button>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        第 {currentPage} 页 / 共 {totalPages} 页
                    </div>
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-sm font-medium"
                    >
                        下一页
                    </button>
                </div>
            </div>
        )}
      </div>

      {isCreateOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-modal-enter border border-white/10">
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">新增企业客户</h3>
                      <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">企业名称</label>
                              <input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white" placeholder="请输入完整公司名" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所属行业</label>
                              <input value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white" placeholder="如: 互联网, 金融" />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户类型</label>
                              <select value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value as CustomerType})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white">
                                  <option value="Enterprise">企业 (Enterprise)</option>
                                  <option value="SMB">中小企业 (SMB)</option>
                                  <option value="Government">政府 (Government)</option>
                                  <option value="Education">教育 (Education)</option>
                                  <option value="Partner">合作伙伴 (Partner)</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户等级</label>
                              <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as CustomerLevel})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white">
                                  <option value="KA">KA (Key Account)</option>
                                  <option value="A">A 级</option>
                                  <option value="B">B 级</option>
                                  <option value="C">C 级</option>
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所在区域</label>
                              <input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white" placeholder="省/市" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">详细地址</label>
                              <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2.5 outline-none text-gray-900 dark:text-white" placeholder="办公地址" />
                          </div>
                      </div>

                      <div className="border-t border-gray-100 dark:border-white/10 pt-4">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">首要联系人</h4>
                          <div className="grid grid-cols-3 gap-4">
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">姓名</label>
                                  <input value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2 text-sm outline-none text-gray-900 dark:text-white" />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">电话</label>
                                  <input value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2 text-sm outline-none text-gray-900 dark:text-white" />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">邮箱</label>
                                  <input value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-sm p-2 text-sm outline-none text-gray-900 dark:text-white" />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                      <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition font-medium">取消</button>
                      <button onClick={handleCreate} disabled={!formData.companyName} className="px-4 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-md hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition font-medium shadow-md disabled:opacity-50">创建客户</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CustomerManager;
