
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Order, User, Enterprise, ContactInfo, CustomerType, CustomerLevel, CustomerContact, ContactRole } from '../types';
import { ArrowLeft, Building2, User as UserIcon, MapPin, Phone, Mail, CreditCard, History, Briefcase, Save, Edit2, Shield, Truck, FileText, Monitor, X, Plus, Trash2, Building, Calendar, Bell, Clock, Users, CheckSquare, Tag, ArrowUpCircle, Archive } from 'lucide-react';

interface CustomerDetailsProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  orders: Order[];
  users: User[];
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customers, setCustomers, orders, users }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const customer = customers.find(c => c.id === id);
  const [selectedOwnerId, setSelectedOwnerId] = useState(customer?.ownerId || '');
  
  // Edit States
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingBasic, setIsEditingBasic] = useState(false);

  // Contact Management State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<CustomerContact>({
      id: '',
      name: '',
      phone: '',
      email: '',
      position: '',
      roles: [],
      isPrimary: false
  });

  // Forms
  const [infoForm, setInfoForm] = useState<{
      address: string;
      shippingAddress: string;
      taxId: string;
      title: string;
      bankName: string;
      accountNumber: string;
      registerAddress: string;
      registerPhone: string;
  }>({
      address: '',
      shippingAddress: '',
      taxId: '',
      title: '',
      bankName: '',
      accountNumber: '',
      registerAddress: '',
      registerPhone: ''
  });

  const [basicForm, setBasicForm] = useState<{
      companyName: string;
      status: 'Active' | 'Inactive';
      level: CustomerLevel;
      customerType: CustomerType;
      industry: string;
      region: string;
  }>({
      companyName: '',
      status: 'Active',
      level: 'B',
      customerType: 'Enterprise',
      industry: '',
      region: ''
  });

  const [newEnterprise, setNewEnterprise] = useState<Partial<Enterprise>>({
      id: '',
      name: ''
  });

  const customerOrders = orders.filter(o => o.customerId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const salesUsers = users.filter(u => u.role === 'Sales' || u.role === 'Admin');

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

  // --- Handlers ---
  const handleSaveOwner = () => {
      const owner = users.find(u => u.id === selectedOwnerId);
      const updatedCustomer = { 
          ...customer, 
          ownerId: selectedOwnerId,
          ownerName: owner ? owner.name : undefined 
      };
      setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
      setIsEditingOwner(false);
  };

  const handleEditInfo = () => {
      setInfoForm({
          address: customer.address || '',
          shippingAddress: customer.shippingAddress || '',
          taxId: customer.billingInfo?.taxId || '',
          title: customer.billingInfo?.title || '',
          bankName: customer.billingInfo?.bankName || '',
          accountNumber: customer.billingInfo?.accountNumber || '',
          registerAddress: customer.billingInfo?.registerAddress || '',
          registerPhone: customer.billingInfo?.registerPhone || ''
      });
      setIsEditingInfo(true);
  };

  const handleSaveInfo = () => {
      const updatedCustomer: Customer = {
          ...customer,
          address: infoForm.address,
          shippingAddress: infoForm.shippingAddress,
          billingInfo: {
              taxId: infoForm.taxId,
              title: infoForm.title,
              bankName: infoForm.bankName,
              accountNumber: infoForm.accountNumber,
              registerAddress: infoForm.registerAddress,
              registerPhone: infoForm.registerPhone
          }
      };
      setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
      setIsEditingInfo(false);
  };

  const handleEditBasic = () => {
      setBasicForm({
          companyName: customer.companyName,
          status: customer.status,
          level: customer.level,
          customerType: customer.customerType,
          industry: customer.industry,
          region: customer.region
      });
      setIsEditingBasic(true);
  };

  const handleSaveBasic = () => {
      const updatedCustomer: Customer = {
          ...customer,
          companyName: basicForm.companyName,
          status: basicForm.status,
          level: basicForm.level,
          customerType: basicForm.customerType,
          industry: basicForm.industry,
          region: basicForm.region
      };
      setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
      setIsEditingBasic(false);
  };

  const handleAddContact = () => {
      setEditingContactId(null);
      setContactForm({
          id: `ct-${Date.now()}`,
          name: '',
          phone: '',
          email: '',
          position: '',
          roles: ['Purchasing'], 
          isPrimary: false
      });
      setIsContactModalOpen(true);
  };

  const handleEditContact = (contact: CustomerContact) => {
      setEditingContactId(contact.id);
      setContactForm({ ...contact });
      setIsContactModalOpen(true);
  };

  const handleDeleteContact = (contactId: string) => {
      if (confirm('确定要删除此联系人吗？')) {
          const updatedContacts = customer.contacts.filter(c => c.id !== contactId);
          const updatedCustomer = { ...customer, contacts: updatedContacts };
          setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
      }
  };

  const handleSaveContact = () => {
      if (!contactForm.name) return;

      let updatedContacts = [...customer.contacts];
      
      if (contactForm.isPrimary) {
          updatedContacts = updatedContacts.map(c => ({ ...c, isPrimary: false }));
      }

      if (editingContactId) {
          updatedContacts = updatedContacts.map(c => c.id === editingContactId ? contactForm : c);
      } else {
          updatedContacts.push(contactForm);
      }

      if (updatedContacts.length === 1) {
          updatedContacts[0].isPrimary = true;
      }

      const updatedCustomer = { ...customer, contacts: updatedContacts };
      setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
      setIsContactModalOpen(false);
  };

  const toggleRole = (role: ContactRole) => {
      if (contactForm.roles.includes(role)) {
          setContactForm({ ...contactForm, roles: contactForm.roles.filter(r => r !== role) });
      } else {
          setContactForm({ ...contactForm, roles: [...contactForm.roles, role] });
      }
  };

  const handleAddEnterprise = () => {
      if (!newEnterprise.name || !newEnterprise.id) return;
      
      const updatedEnterprises = [...(customer.enterprises || []), newEnterprise as Enterprise];
      const updatedCustomer = { ...customer, enterprises: updatedEnterprises };
      
      setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
      setNewEnterprise({ id: '', name: '' });
  };

  const handleRemoveEnterprise = (entId: string) => {
      const updatedEnterprises = (customer.enterprises || []).filter(e => e.id !== entId);
      const updatedCustomer = { ...customer, enterprises: updatedEnterprises };
      setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
  };

  const handleSetFollowUp = () => {
      if (customerOrders.length === 0) {
          alert("该客户暂无订单记录，无法计算基于订单的回访日期。");
          return;
      }
      const lastOrder = customerOrders[0];
      const lastOrderDate = new Date(lastOrder.date);
      const nextDate = new Date(lastOrderDate);
      nextDate.setDate(lastOrderDate.getDate() + 30);
      const updatedCustomer = { ...customer, nextFollowUpDate: nextDate.toISOString() };
      setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
  };

  const getOrderStatusColor = (status: string) => {
    if (status === '已送达') return 'bg-green-100 text-green-700';
    if (status === '已取消') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getLevelBadgeColor = (level: string) => {
      switch(level) {
          case 'KA': return 'bg-purple-600 text-white';
          case 'A': return 'bg-indigo-500 text-white';
          case 'B': return 'bg-blue-500 text-white';
          default: return 'bg-gray-500 text-white';
      }
  };

  const ownerUser = users.find(u => u.id === customer.ownerId);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Unified Header (ProductDetails Style) */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md text-white">
        <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 overflow-hidden shrink-0">
                  {customer.logo ? (
                      <img src={customer.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                      <Building2 className="w-8 h-8 text-white" />
                  )}
              </div>
              <div>
                  <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold tracking-tight">{customer.companyName}</h1>
                      <div className={`px-2 py-0.5 rounded text-xs font-bold border border-white/20 backdrop-blur-md ${getLevelBadgeColor(customer.level)}`}>
                          {customer.level}
                      </div>
                      <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-md flex items-center gap-1 ${customer.status === 'Active' ? 'bg-green-500/30 text-green-100 border-green-400/50' : 'bg-gray-500/30 text-gray-200 border-gray-400/50'}`}>
                          {customer.status === 'Active' ? <ArrowUpCircle className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                          {customer.status === 'Active' ? '合作中' : '已暂停'}
                      </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-indigo-100 text-sm">
                      <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> ID: {customer.id}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded">
                          <Building className="w-3.5 h-3.5" /> {customer.industry}
                      </span>
                      <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {customer.region}
                      </span>
                  </div>
              </div>
        </div>
        <div className="flex gap-3">
              <button 
                  onClick={() => navigate('/customers')}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg transition backdrop-blur-md border border-white/30 font-medium"
              >
                  <ArrowLeft className="w-4 h-4" /> 返回列表
              </button>
              <button 
                  onClick={handleSetFollowUp}
                  className="flex items-center gap-2 bg-white text-indigo-700 text-sm px-4 py-2 rounded-lg hover:bg-indigo-50 transition shadow-lg font-bold border border-white"
              >
                  <Clock className="w-4 h-4" /> 
                  {customer.nextFollowUpDate ? `下次跟进: ${new Date(customer.nextFollowUpDate).toLocaleDateString()}` : '设置订单回访'}
              </button>
        </div>
      </div>

      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content (Left) */}
              <div className="lg:col-span-2 space-y-6">
                  
                  {/* Basic Info Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <Building className="w-4 h-4 text-indigo-600" /> 基本信息
                          </h3>
                          <button onClick={isEditingBasic ? handleSaveBasic : handleEditBasic} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                              {isEditingBasic ? <Save className="w-4 h-4"/> : <Edit2 className="w-4 h-4"/>}
                              {isEditingBasic ? '保存' : '编辑'}
                          </button>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                          {isEditingBasic ? (
                              <>
                                <div>
                                      <label className="text-xs text-gray-500 mb-1 block">企业名称</label>
                                      <input value={basicForm.companyName} onChange={e => setBasicForm({...basicForm, companyName: e.target.value})} className="w-full border p-1.5 rounded text-sm" />
                                </div>
                                <div>
                                      <label className="text-xs text-gray-500 mb-1 block">所属行业</label>
                                      <input value={basicForm.industry} onChange={e => setBasicForm({...basicForm, industry: e.target.value})} className="w-full border p-1.5 rounded text-sm" />
                                </div>
                                <div>
                                      <label className="text-xs text-gray-500 mb-1 block">客户类型</label>
                                      <select value={basicForm.customerType} onChange={e => setBasicForm({...basicForm, customerType: e.target.value as CustomerType})} className="w-full border p-1.5 rounded text-sm bg-white">
                                          <option value="Enterprise">企业</option>
                                          <option value="Government">政府</option>
                                          <option value="Education">教育</option>
                                          <option value="Partner">合作伙伴</option>
                                          <option value="SMB">中小企业</option>
                                      </select>
                                </div>
                                <div>
                                      <label className="text-xs text-gray-500 mb-1 block">客户等级</label>
                                      <select value={basicForm.level} onChange={e => setBasicForm({...basicForm, level: e.target.value as CustomerLevel})} className="w-full border p-1.5 rounded text-sm bg-white">
                                          <option value="KA">KA</option>
                                          <option value="A">A 级</option>
                                          <option value="B">B 级</option>
                                          <option value="C">C 级</option>
                                      </select>
                                </div>
                                <div>
                                      <label className="text-xs text-gray-500 mb-1 block">区域/城市</label>
                                      <input value={basicForm.region} onChange={e => setBasicForm({...basicForm, region: e.target.value})} className="w-full border p-1.5 rounded text-sm" />
                                </div>
                                <div>
                                      <label className="text-xs text-gray-500 mb-1 block">状态</label>
                                      <select value={basicForm.status} onChange={e => setBasicForm({...basicForm, status: e.target.value as any})} className="w-full border p-1.5 rounded text-sm bg-white">
                                          <option value="Active">合作中</option>
                                          <option value="Inactive">暂停/非活跃</option>
                                      </select>
                                </div>
                              </>
                          ) : (
                              <>
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-500">客户类型</div>
                                    <div className="text-sm font-medium text-gray-800">{customer.customerType}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-500">所属行业</div>
                                    <div className="text-sm font-medium text-gray-800">{customer.industry}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-500">区域</div>
                                    <div className="text-sm font-medium text-gray-800 flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {customer.region}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-500">办公地址</div>
                                    <div className="text-sm font-medium text-gray-800">{customer.address}</div>
                                </div>
                              </>
                          )}
                      </div>
                  </div>

                  {/* Unified Contacts Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <Users className="w-4 h-4 text-indigo-600" /> 联系人 ({customer.contacts.length})
                          </h3>
                          <button onClick={handleAddContact} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                              <Plus className="w-4 h-4"/> 添加
                          </button>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {customer.contacts.map(contact => (
                              <div key={contact.id} className={`p-4 rounded-lg border flex flex-col gap-2 relative group hover:shadow-md transition ${contact.isPrimary ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200 bg-white'}`}>
                                  <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                              {contact.name.substring(0, 1)}
                                          </div>
                                          <div>
                                              <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                  {contact.name}
                                                  {contact.isPrimary && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded">主要</span>}
                                              </div>
                                              <div className="text-xs text-gray-500">{contact.position || '职位未知'}</div>
                                          </div>
                                      </div>
                                      <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                                          <button onClick={() => handleEditContact(contact)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                                          <button onClick={() => handleDeleteContact(contact.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                      <div className="flex items-center gap-2 text-xs text-gray-600">
                                          <Phone className="w-3 h-3 text-gray-400" /> {contact.phone}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600">
                                          <Mail className="w-3 h-3 text-gray-400" /> {contact.email}
                                      </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                      {contact.roles.map(role => (
                                          <span key={role} className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600">
                                              {role === 'Purchasing' ? '采购' : role === 'IT' ? '技术' : role === 'Finance' ? '财务' : role === 'Management' ? '管理' : '其他'}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          ))}
                          {customer.contacts.length === 0 && (
                              <div className="col-span-2 text-center py-6 text-gray-400 text-sm">暂无联系人信息</div>
                          )}
                      </div>
                  </div>

                  {/* Order History */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <History className="w-4 h-4 text-indigo-600" /> 历史订单 ({customerOrders.length})
                          </h3>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 text-gray-500">
                                  <tr>
                                      <th className="p-4 font-medium">订单号</th>
                                      <th className="p-4 font-medium">日期</th>
                                      <th className="p-4 font-medium">包含产品</th>
                                      <th className="p-4 font-medium">金额</th>
                                      <th className="p-4 font-medium">状态</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {customerOrders.map(order => (
                                      <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="hover:bg-gray-50 cursor-pointer transition">
                                          <td className="p-4 font-mono text-indigo-600 hover:underline">{order.id}</td>
                                          <td className="p-4 text-gray-600">{new Date(order.date).toLocaleDateString()}</td>
                                          <td className="p-4 text-gray-800">
                                              {order.items[0].productName}
                                              {order.items.length > 1 && <span className="text-xs text-gray-400 ml-1">等{order.items.length}件</span>}
                                          </td>
                                          <td className="p-4 font-medium">¥{order.total.toLocaleString()}</td>
                                          <td className="p-4">
                                              <span className={`px-2 py-0.5 rounded text-xs ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                                          </td>
                                      </tr>
                                  ))}
                                  {customerOrders.length === 0 && (
                                      <tr><td colSpan={5} className="p-6 text-center text-gray-400">暂无历史订单</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>

              {/* Sidebar (Right) */}
              <div className="space-y-6">
                  
                  {/* Engagement / Follow Up */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                       <div className="p-4 border-b border-gray-100 bg-gray-50">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <Bell className="w-4 h-4 text-indigo-600" /> 客户跟进
                          </h3>
                       </div>
                       <div className="p-4">
                           {customer.nextFollowUpDate ? (
                               <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                                   <div className="text-xs text-blue-500 uppercase font-bold tracking-wider mb-1">下次计划跟进</div>
                                   <div className="text-xl font-bold text-blue-900">{new Date(customer.nextFollowUpDate).toLocaleDateString()}</div>
                                   <div className="text-xs text-blue-400 mt-2">
                                       基于上一笔订单 ({customerOrders[0]?.id}) 自动计算
                                   </div>
                               </div>
                           ) : (
                               <div className="text-center py-4 text-gray-400 text-sm">
                                   <p>暂无跟进计划</p>
                                   <button onClick={handleSetFollowUp} className="text-indigo-600 hover:underline mt-2 text-xs">基于订单自动设置</button>
                               </div>
                           )}
                       </div>
                  </div>

                  {/* Owner Info */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-indigo-600" /> 销售归属
                          </h3>
                          {!isEditingOwner && (
                              <button onClick={() => setIsEditingOwner(true)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                                  变更
                              </button>
                          )}
                      </div>
                      <div className="p-4">
                          {isEditingOwner ? (
                              <div className="space-y-3">
                                  <select 
                                      className="w-full border p-2 rounded text-sm outline-none focus:border-indigo-500"
                                      value={selectedOwnerId}
                                      onChange={(e) => setSelectedOwnerId(e.target.value)}
                                  >
                                      <option value="">-- 选择销售负责人 --</option>
                                      {salesUsers.map(u => (
                                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                      ))}
                                  </select>
                                  <div className="flex gap-2">
                                      <button onClick={handleSaveOwner} className="flex-1 bg-indigo-600 text-white py-1.5 rounded text-xs">保存</button>
                                      <button onClick={() => setIsEditingOwner(false)} className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded text-xs">取消</button>
                                  </div>
                              </div>
                          ) : (
                              <div className="flex items-center gap-3">
                                  <img 
                                      src={ownerUser?.avatar || `https://ui-avatars.com/api/?name=${ownerUser?.name || 'Unassigned'}`} 
                                      className="w-10 h-10 rounded-full border" 
                                      alt=""
                                  />
                                  <div>
                                      <div className="font-bold text-gray-800 text-sm">{ownerUser?.name || '未分配'}</div>
                                      <div className="text-xs text-gray-500">{ownerUser?.email || '-'}</div>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Financial/Billing Info */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-indigo-600" /> 财务/开票信息
                          </h3>
                          <button onClick={isEditingInfo ? handleSaveInfo : handleEditInfo} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                              {isEditingInfo ? '保存' : '编辑'}
                          </button>
                      </div>
                      <div className="p-4 text-sm space-y-3">
                          {isEditingInfo ? (
                               <div className="space-y-2">
                                   <input placeholder="税号" value={infoForm.taxId} onChange={e => setInfoForm({...infoForm, taxId: e.target.value})} className="w-full border p-1.5 rounded text-xs" />
                                   <input placeholder="抬头" value={infoForm.title} onChange={e => setInfoForm({...infoForm, title: e.target.value})} className="w-full border p-1.5 rounded text-xs" />
                                   <input placeholder="开户行" value={infoForm.bankName} onChange={e => setInfoForm({...infoForm, bankName: e.target.value})} className="w-full border p-1.5 rounded text-xs" />
                                   <input placeholder="账号" value={infoForm.accountNumber} onChange={e => setInfoForm({...infoForm, accountNumber: e.target.value})} className="w-full border p-1.5 rounded text-xs" />
                                   <input placeholder="注册地址" value={infoForm.registerAddress} onChange={e => setInfoForm({...infoForm, registerAddress: e.target.value})} className="w-full border p-1.5 rounded text-xs" />
                                   <input placeholder="注册电话" value={infoForm.registerPhone} onChange={e => setInfoForm({...infoForm, registerPhone: e.target.value})} className="w-full border p-1.5 rounded text-xs" />
                               </div>
                          ) : (
                              <>
                                <div>
                                    <div className="text-xs text-gray-500">纳税人识别号</div>
                                    <div className="font-mono text-gray-700">{customer.billingInfo?.taxId || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">开票抬头</div>
                                    <div className="text-gray-700">{customer.billingInfo?.title || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">开户行及账号</div>
                                    <div className="text-gray-700">{customer.billingInfo?.bankName}</div>
                                    <div className="font-mono text-xs text-gray-600">{customer.billingInfo?.accountNumber}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">注册地址及电话</div>
                                    <div className="text-gray-700 text-xs">{customer.billingInfo?.registerAddress}</div>
                                    <div className="text-gray-700 text-xs">{customer.billingInfo?.registerPhone}</div>
                                </div>
                              </>
                          )}
                      </div>
                  </div>

                   {/* Enterprise / Tenants */}
                   <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-indigo-600" /> 关联企业/租户
                          </h3>
                      </div>
                      <div className="p-4">
                          <div className="space-y-2 mb-4">
                              {customer.enterprises?.map((ent, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                                      <div>
                                          <div className="font-medium text-sm text-gray-800">{ent.name}</div>
                                          <div className="text-xs text-gray-400 font-mono">ID: {ent.id}</div>
                                      </div>
                                      <button onClick={() => handleRemoveEnterprise(ent.id)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                                  </div>
                              ))}
                              {(!customer.enterprises || customer.enterprises.length === 0) && (
                                  <div className="text-xs text-gray-400 text-center py-2">无关联租户信息</div>
                              )}
                          </div>
                          <div className="flex gap-2">
                              <input 
                                  placeholder="租户 ID" 
                                  className="w-1/3 border p-1.5 rounded text-xs outline-none"
                                  value={newEnterprise.id}
                                  onChange={e => setNewEnterprise({...newEnterprise, id: e.target.value})}
                              />
                              <input 
                                  placeholder="租户名称" 
                                  className="flex-1 border p-1.5 rounded text-xs outline-none"
                                  value={newEnterprise.name}
                                  onChange={e => setNewEnterprise({...newEnterprise, name: e.target.value})}
                              />
                              <button 
                                  onClick={handleAddEnterprise}
                                  disabled={!newEnterprise.id || !newEnterprise.name}
                                  className="bg-indigo-50 text-indigo-600 px-2 rounded hover:bg-indigo-100 disabled:opacity-50"
                              >
                                  <Plus className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Contact Modal */}
      {isContactModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-enter">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="text-xl font-bold text-gray-800">{editingContactId ? '编辑联系人' : '添加联系人'}</h3>
                      <button onClick={() => setIsContactModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                          <input 
                              type="text" 
                              value={contactForm.name} 
                              onChange={e => setContactForm({...contactForm, name: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
                          <input 
                              type="text" 
                              value={contactForm.position} 
                              onChange={e => setContactForm({...contactForm, position: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                              <input 
                                  type="text" 
                                  value={contactForm.phone} 
                                  onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                              <input 
                                  type="email" 
                                  value={contactForm.email} 
                                  onChange={e => setContactForm({...contactForm, email: e.target.value})}
                                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">角色标签 (可多选)</label>
                          <div className="flex flex-wrap gap-2">
                              {['Purchasing', 'IT', 'Finance', 'Management', 'Other'].map((role) => (
                                  <button
                                      key={role}
                                      onClick={() => toggleRole(role as ContactRole)}
                                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1 ${
                                          contactForm.roles.includes(role as ContactRole)
                                          ? 'bg-indigo-600 text-white border-indigo-600'
                                          : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                                      }`}
                                  >
                                      {contactForm.roles.includes(role as ContactRole) && <CheckSquare className="w-3 h-3" />}
                                      {role === 'Purchasing' ? '采购' : role === 'IT' ? '技术' : role === 'Finance' ? '财务' : role === 'Management' ? '管理' : '其他'}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                          <input 
                              type="checkbox" 
                              id="isPrimary"
                              checked={contactForm.isPrimary}
                              onChange={e => setContactForm({...contactForm, isPrimary: e.target.checked})}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <label htmlFor="isPrimary" className="text-sm text-gray-700 select-none">设为主要联系人</label>
                      </div>
                  </div>
                  <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                      <button onClick={() => setIsContactModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition font-medium">取消</button>
                      <button 
                          onClick={handleSaveContact} 
                          disabled={!contactForm.name}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md disabled:opacity-50"
                      >
                          保存联系人
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CustomerDetails;
