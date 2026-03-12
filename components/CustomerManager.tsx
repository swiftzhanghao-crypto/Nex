
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, User, CustomerType, CustomerLevel, CustomerContact, ContactRole } from '../types';
import { Search, Eye, Plus, X } from 'lucide-react';
import ModalPortal from './ModalPortal';

interface CustomerManagerProps {
  customers: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>; 
  users?: User[]; 
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, setCustomers, users }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
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
          case 'KA': return 'unified-tag-indigo';
          case 'A': return 'unified-tag-blue';
          case 'B': return 'unified-tag-gray';
          default: return 'unified-tag-gray';
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
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter pb-2">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">客户信息</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-full sm:w-[320px] focus-within:border-blue-400 dark:focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition shadow-apple">
                <div className="relative flex-1 flex items-center min-w-0">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
                    <input
                        type="text"
                        placeholder="搜索公司、行业或联系人…"
                        className="w-full h-full pl-8 pr-8 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
            <button
                onClick={() => setSearchTerm('')}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition shadow-apple"
                title="清空搜索"
            >
                <X className="w-4 h-4" />
            </button>
            {setCustomers && (
                <button onClick={() => setIsCreateOpen(true)} className="unified-button-primary">
                    <Plus className="w-4 h-4" /> 新增客户
                </button>
            )}
        </div>
      </div>

      <div className="unified-card overflow-hidden mt-4">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 unified-table-header bg-gray-50 dark:bg-[#1C1C1E] shadow-apple">
              <tr>
                <th className="pl-6 pr-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">企业名称 / 行业</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">客户类型</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">主要联系人</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">归属销售</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">合作状态</th>
                <th className="px-4 py-3 text-right pr-6 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {currentCustomers.map(customer => {
                const primaryContact = getPrimaryContact(customer);
                return (
                  <tr
                      key={customer.id}
                      className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td className="pl-6 pr-4 py-3">
                      <div className="flex items-center gap-3">
                          <div>
                              <div className="font-bold text-gray-900 dark:text-white group-hover:text-[#0071E3] dark:group-hover:text-[#0A84FF] transition flex items-center gap-2">
                                  {customer.companyName}
                                  <span className={`${getLevelBadge(customer.level)} !rounded-lg`}>{customer.level}</span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{customer.region} | {customer.industry}</div>
                          </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                       <span className="unified-tag-gray !rounded-lg">{customer.customerType}</span>
                    </td>
                    <td className="px-4 py-3">
                      {primaryContact ? (
                          <>
                            <div className="font-medium text-gray-700 dark:text-gray-200">{primaryContact.name}</div>
                            <div className="text-xs text-gray-400">{primaryContact.phone}</div>
                          </>
                      ) : (
                          <span className="text-gray-400 text-sm italic">无联系人</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                       {customer.ownerName ? (
                           <div className="flex items-center gap-2">
                               <img
                                  src={getOwnerAvatar(customer.ownerId) || `https://api.dicebear.com/9.x/avataaars/svg?seed=${customer.ownerName}`}
                                  className="w-7 h-7 rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-800 object-cover"
                                  alt=""
                               />
                               <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{customer.ownerName}</span>
                           </div>
                       ) : (
                           <span className="text-sm text-gray-400 italic">未分配</span>
                       )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                          customer.status === 'Active'
                          ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                          : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                      }`}>
                          {customer.status === 'Active' ? '合作中' : '已暂停'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right pr-6">
                      <button
                          onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customers/${customer.id}`);
                          }}
                          className="p-2 text-gray-400 hover:text-[#0071E3] dark:hover:text-[#0A84FF] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      >
                          <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {currentCustomers.length === 0 && (
                  <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-400">暂无客户数据</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5 shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{filteredCustomers.length}</span> 条</span>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">每页</span>
                    <select
                        value={itemsPerPage}
                        onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="unified-card h-7 pl-2 pr-6 text-xs font-medium text-gray-700 dark:text-gray-200 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 outline-none appearance-none cursor-pointer hover:border-[#0071E3]/50 transition"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                    >
                        {[20, 50, 100].map(n => <option key={n} value={n}>{n} 条</option>)}
                    </select>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">第 {currentPage} / {totalPages} 页</span>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">上一页</button>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">下一页</button>
                </div>
            </div>
        </div>
      </div>

      {isCreateOpen && (

          <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl flex flex-col animate-modal-enter -white/10">
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">新增企业客户</h3>
                      <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">企业名称</label>
                              <input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2.5 outline-none text-gray-900 dark:text-white" placeholder="请输入完整公司名" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所属行业</label>
                              <input value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2.5 outline-none text-gray-900 dark:text-white" placeholder="如: 互联网, 金融" />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户类型</label>
                              <select value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value as CustomerType})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2.5 outline-none text-gray-900 dark:text-white">
                                  <option value="Enterprise">企业 (Enterprise)</option>
                                  <option value="SMB">中小企业 (SMB)</option>
                                  <option value="Government">政府 (Government)</option>
                                  <option value="Education">教育 (Education)</option>
                                  <option value="Partner">合作伙伴 (Partner)</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户等级</label>
                              <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as CustomerLevel})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2.5 outline-none text-gray-900 dark:text-white">
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
                              <input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2.5 outline-none text-gray-900 dark:text-white" placeholder="省/市" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">详细地址</label>
                              <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2.5 outline-none text-gray-900 dark:text-white" placeholder="办公地址" />
                          </div>
                      </div>

                      <div className="border-t border-gray-100 dark:border-white/10 pt-4">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">首要联系人</h4>
                          <div className="grid grid-cols-3 gap-4">
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">姓名</label>
                                  <input value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2 text-sm outline-none text-gray-900 dark:text-white" />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">电话</label>
                                  <input value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2 text-sm outline-none text-gray-900 dark:text-white" />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">邮箱</label>
                                  <input value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full border border-gray-300 dark:border-white/10 bg-white dark:bg-black rounded-lg p-2 text-sm outline-none text-gray-900 dark:text-white" />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                      <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition font-medium">取消</button>
                      <button onClick={handleCreate} disabled={!formData.companyName} className="unified-button-primary bg-[#0071E3] dark:bg-[#FF2D55] hover: shadow-apple disabled:opacity-50">创建客户</button>
                  </div>
              </div>
          </div>
          </ModalPortal>

      )}
    </div>
  );
};

export default CustomerManager;
