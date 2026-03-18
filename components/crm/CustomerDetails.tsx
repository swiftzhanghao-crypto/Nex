
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Enterprise, CustomerType, CustomerLevel, CustomerContact, ContactRole, OrderStatus } from '../../types';
import { ArrowLeft, Building2, MapPin, Phone, Mail, CreditCard, History, Briefcase, Save, Edit2, X, Plus, Trash2, Building, Bell, Clock, Users, CheckSquare, Tag, ArrowUpCircle, Archive, Target, ShoppingCart } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';

const statusMap: Record<string, string> = {
    [OrderStatus.PENDING_APPROVAL]: '待审批',
    [OrderStatus.PENDING_CONFIRM]: '待确认',
    [OrderStatus.PROCESSING_PROD]: '备货中',
    [OrderStatus.PENDING_PAYMENT]: '待支付',
    [OrderStatus.SHIPPED]: '已发货',
    [OrderStatus.DELIVERED]: '已完成',
    [OrderStatus.CANCELLED]: '已取消',
    [OrderStatus.REFUND_PENDING]: '退款中',
    [OrderStatus.REFUNDED]: '已退款',
};

const roleLabel = (r: string) =>
    r === 'Purchasing' ? '采购' : r === 'IT' ? '技术' : r === 'Finance' ? '财务' : r === 'Management' ? '管理' : '其他';

const CustomerDetails: React.FC = () => {
  const { customers, setCustomers, orders, users } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const customer = customers.find(c => c.id === id);
  const [selectedOwnerId, setSelectedOwnerId] = useState(customer?.ownerId || '');

  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<CustomerContact>({
      id: '', name: '', phone: '', email: '', position: '', roles: [], isPrimary: false
  });

  const [infoForm, setInfoForm] = useState({
      address: '', shippingAddress: '', taxId: '', title: '',
      bankName: '', accountNumber: '', registerAddress: '', registerPhone: ''
  });
  const [basicForm, setBasicForm] = useState<{
      companyName: string; status: 'Active' | 'Inactive'; level: CustomerLevel;
      customerType: CustomerType; industry: string; region: string;
  }>({ companyName: '', status: 'Active', level: 'B', customerType: 'Enterprise', industry: '', region: '' });
  const [newEnterprise, setNewEnterprise] = useState<Partial<Enterprise>>({ id: '', name: '' });

  const customerOrders = orders.filter(o => o.customerId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const salesUsers = users.filter(u => u.role === 'Sales' || u.role === 'Admin');

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-gray-400 text-lg">未找到客户信息</div>
        <button onClick={() => navigate('/customers')} className="text-[#0071E3] hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回客户列表
        </button>
      </div>
    );
  }

  const handleSaveOwner = () => {
      const owner = users.find(u => u.id === selectedOwnerId);
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, ownerId: selectedOwnerId, ownerName: owner?.name } : c));
      setIsEditingOwner(false);
  };
  const handleEditInfo = () => {
      setInfoForm({
          address: customer.address || '', shippingAddress: customer.shippingAddress || '',
          taxId: customer.billingInfo?.taxId || '', title: customer.billingInfo?.title || '',
          bankName: customer.billingInfo?.bankName || '', accountNumber: customer.billingInfo?.accountNumber || '',
          registerAddress: customer.billingInfo?.registerAddress || '', registerPhone: customer.billingInfo?.registerPhone || ''
      });
      setIsEditingInfo(true);
  };
  const handleSaveInfo = () => {
      setCustomers(prev => prev.map(c => c.id === customer.id ? {
          ...c, address: infoForm.address, shippingAddress: infoForm.shippingAddress,
          billingInfo: { taxId: infoForm.taxId, title: infoForm.title, bankName: infoForm.bankName, accountNumber: infoForm.accountNumber, registerAddress: infoForm.registerAddress, registerPhone: infoForm.registerPhone }
      } : c));
      setIsEditingInfo(false);
  };
  const handleEditBasic = () => {
      setBasicForm({ companyName: customer.companyName, status: customer.status, level: customer.level, customerType: customer.customerType, industry: customer.industry, region: customer.region });
      setIsEditingBasic(true);
  };
  const handleSaveBasic = () => {
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, ...basicForm } : c));
      setIsEditingBasic(false);
  };
  const handleAddContact = () => {
      setEditingContactId(null);
      setContactForm({ id: `ct-${Date.now()}`, name: '', phone: '', email: '', position: '', roles: ['Purchasing'], isPrimary: false });
      setIsContactModalOpen(true);
  };
  const handleEditContact = (contact: CustomerContact) => { setEditingContactId(contact.id); setContactForm({ ...contact }); setIsContactModalOpen(true); };
  const handleDeleteContact = (contactId: string) => {
      if (confirm('确定要删除此联系人吗？')) {
          setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, contacts: c.contacts.filter(ct => ct.id !== contactId) } : c));
      }
  };
  const handleSaveContact = () => {
      if (!contactForm.name) return;
      let contacts = [...customer.contacts];
      if (contactForm.isPrimary) contacts = contacts.map(c => ({ ...c, isPrimary: false }));
      if (editingContactId) contacts = contacts.map(c => c.id === editingContactId ? contactForm : c);
      else contacts.push(contactForm);
      if (contacts.length === 1) contacts[0].isPrimary = true;
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, contacts } : c));
      setIsContactModalOpen(false);
  };
  const toggleRole = (role: ContactRole) => {
      setContactForm(f => ({ ...f, roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role] }));
  };
  const handleAddEnterprise = () => {
      if (!newEnterprise.name || !newEnterprise.id) return;
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, enterprises: [...(c.enterprises || []), newEnterprise as Enterprise] } : c));
      setNewEnterprise({ id: '', name: '' });
  };
  const handleRemoveEnterprise = (entId: string) => {
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, enterprises: (c.enterprises || []).filter(e => e.id !== entId) } : c));
  };
  const handleSetFollowUp = () => {
      if (customerOrders.length === 0) { alert('该客户暂无订单记录，无法计算基于订单的回访日期。'); return; }
      const next = new Date(customerOrders[0].date);
      next.setDate(next.getDate() + 30);
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, nextFollowUpDate: next.toISOString() } : c));
  };

  const ownerUser = users.find(u => u.id === customer.ownerId);
  const totalOrderAmount = customerOrders.reduce((s, o) => s + o.total, 0);

  const levelColors: Record<string, string> = {
      KA: 'bg-purple-100 text-purple-700 border-purple-200',
      A: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      B: 'bg-blue-100 text-[#0071E3] border-blue-200',
      C: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const typeLabel: Record<string, string> = {
      Enterprise: '企业', Government: '政府', Education: '教育', Partner: '合作伙伴', SMB: '中小企业'
  };

  /* ── shared card header style ── */
  const CardHeader = ({ icon: Icon, color, title, action }: { icon: React.ElementType; color: string; title: string; action?: React.ReactNode }) => (
      <div className="border-b border-gray-100 dark:border-white/10 pb-2.5 flex items-center justify-between">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon className={`w-5 h-5 ${color}`} /> {title}
          </h4>
          {action}
      </div>
  );

  const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
      <div className="flex items-start gap-8 py-3 border-b border-gray-50 dark:border-white/5 last:border-0">
          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-28 shrink-0 whitespace-nowrap">{label}</span>
          <div className="text-sm font-medium text-gray-900 dark:text-white flex-1">{children}</div>
      </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto w-full animate-page-enter pb-20 space-y-0">

      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/customers')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition">
                      <ArrowLeft className="w-5 h-5" />
                  </button>
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-2xl bg-[#0071E3]/10 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/30 overflow-hidden">
                      {customer.logo
                          ? <img src={customer.logo} alt="" className="w-full h-full object-cover" />
                          : <Building2 className="w-5 h-5 text-[#0071E3]" />}
                  </div>
                  <div>
                      <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight">{customer.companyName}</h1>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${levelColors[customer.level] || levelColors.C}`}>{customer.level}</span>
                          <span className={`unified-tag-xs ${customer.status === 'Active' ? 'unified-tag-blue' : 'unified-tag-gray'} flex items-center gap-1`}>
                              {customer.status === 'Active' ? <ArrowUpCircle className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                              {customer.status === 'Active' ? '合作中' : '已暂停'}
                          </span>
                          <span className="hidden sm:inline text-xs text-gray-400 font-mono">ID: {customer.id}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" />{customer.industry}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{customer.region}</span>
                          <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" />{customerOrders.length} 笔订单</span>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                  <button onClick={handleSetFollowUp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 text-sm font-medium transition">
                      <Clock className="w-4 h-4" />
                      {customer.nextFollowUpDate ? `跟进: ${new Date(customer.nextFollowUpDate).toLocaleDateString()}` : '设置回访'}
                  </button>
              </div>
          </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
              { label: '历史订单', value: customerOrders.length, suffix: '笔', icon: ShoppingCart, color: 'text-[#0071E3]', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: '累计消费', value: `¥${totalOrderAmount.toLocaleString()}`, suffix: '', icon: CreditCard, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: '联系人', value: customer.contacts.length, suffix: '位', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: '关联租户', value: (customer.enterprises || []).length, suffix: '个', icon: Building2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          ].map((s, i) => (
              <div key={i} className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${s.bg}`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{s.label}</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{s.value}<span className="text-sm font-normal text-gray-400 ml-0.5">{s.suffix}</span></div>
                  </div>
              </div>
          ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Left (2/3) */}
          <div className="md:col-span-2 space-y-4">

              {/* 基本信息 */}
              <div className="unified-card dark:bg-[#1C1C1E] p-5 border-gray-100/50 dark:border-white/10 space-y-0">
                  <CardHeader icon={Building} color="text-[#0071E3]" title="基本信息" action={
                      <button onClick={isEditingBasic ? handleSaveBasic : handleEditBasic} className="flex items-center gap-1 text-sm font-medium text-[#0071E3] hover:text-blue-700 transition">
                          {isEditingBasic ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                          {isEditingBasic ? '保存' : '编辑'}
                      </button>
                  } />
                  {isEditingBasic ? (
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                              { label: '企业名称', key: 'companyName', type: 'input' },
                              { label: '所属行业', key: 'industry', type: 'input' },
                              { label: '区域/城市', key: 'region', type: 'input' },
                          ].map(f => (
                              <div key={f.key}>
                                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                                  <input value={(basicForm as any)[f.key]} onChange={e => setBasicForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2 text-sm outline-none focus:border-[#0071E3]" />
                              </div>
                          ))}
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">客户类型</label>
                              <select value={basicForm.customerType} onChange={e => setBasicForm(p => ({ ...p, customerType: e.target.value as CustomerType }))} className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2 text-sm outline-none focus:border-[#0071E3]">
                                  {Object.entries(typeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">客户等级</label>
                              <select value={basicForm.level} onChange={e => setBasicForm(p => ({ ...p, level: e.target.value as CustomerLevel }))} className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2 text-sm outline-none focus:border-[#0071E3]">
                                  {['KA', 'A', 'B', 'C'].map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">状态</label>
                              <select value={basicForm.status} onChange={e => setBasicForm(p => ({ ...p, status: e.target.value as 'Active' | 'Inactive' }))} className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2 text-sm outline-none focus:border-[#0071E3]">
                                  <option value="Active">合作中</option>
                                  <option value="Inactive">暂停/非活跃</option>
                              </select>
                          </div>
                          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                              <button onClick={() => setIsEditingBasic(false)} className="px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition">取消</button>
                              <button onClick={handleSaveBasic} className="unified-button-primary bg-[#0071E3]">保存</button>
                          </div>
                      </div>
                  ) : (
                      <div>
                          <FieldRow label="客户类型">{typeLabel[customer.customerType] || customer.customerType}</FieldRow>
                          <FieldRow label="所属行业">{customer.industry || '-'}</FieldRow>
                          <FieldRow label="区域">{customer.region || '-'}</FieldRow>
                          <FieldRow label="办公地址">{customer.address || '-'}</FieldRow>
                      </div>
                  )}
              </div>

              {/* 联系人 */}
              <div className="unified-card dark:bg-[#1C1C1E] p-5 border-gray-100/50 dark:border-white/10">
                  <CardHeader icon={Users} color="text-purple-500" title={`联系人（${customer.contacts.length}）`} action={
                      <button onClick={handleAddContact} className="flex items-center gap-1 text-sm font-medium text-[#0071E3] hover:text-blue-700 transition">
                          <Plus className="w-4 h-4" /> 添加
                      </button>
                  } />
                  <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {customer.contacts.map(contact => (
                          <div key={contact.id} className={`p-4 rounded-2xl border flex flex-col gap-2 relative group hover:shadow-apple transition ${contact.isPrimary ? 'border-blue-200 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-900/10' : 'border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5'}`}>
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2.5">
                                      <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${contact.name}`} className="w-9 h-9 rounded-full bg-white border border-gray-200 dark:border-white/10" alt={contact.name} />
                                      <div>
                                          <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                                              {contact.name}
                                              {contact.isPrimary && <span className="unified-button-primary text-[10px] bg-[#0071E3]">主要</span>}
                                          </div>
                                          <div className="text-xs text-gray-400">{contact.position || '职位未知'}</div>
                                      </div>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                                      <button onClick={() => handleEditContact(contact)} className="p-1.5 text-gray-400 hover:text-[#0071E3] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"><Edit2 className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => handleDeleteContact(contact.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                              </div>
                              <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><Phone className="w-3 h-3" />{contact.phone || '-'}</div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><Mail className="w-3 h-3" />{contact.email || '-'}</div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                  {contact.roles.map(r => (
                                      <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400">{roleLabel(r)}</span>
                                  ))}
                              </div>
                          </div>
                      ))}
                      {customer.contacts.length === 0 && (
                          <div className="col-span-2 text-center py-8 text-sm text-gray-400 dark:text-gray-500 italic">暂无联系人信息</div>
                      )}
                  </div>
              </div>

              {/* 历史订单 */}
              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                  <div className="p-5 border-b border-gray-100 dark:border-white/10">
                      <CardHeader icon={History} color="text-indigo-500" title={`历史订单（${customerOrders.length}）`} />
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="unified-table-header">
                              <tr>
                                  <th className="px-5 py-3">订单编号</th>
                                  <th className="px-5 py-3">下单日期</th>
                                  <th className="px-5 py-3">包含产品</th>
                                  <th className="px-5 py-3 text-right">金额</th>
                                  <th className="px-5 py-3">状态</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                              {customerOrders.map(order => (
                                  <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition text-sm">
                                      <td className="px-5 py-3 font-bold font-mono text-[#0071E3] dark:text-[#0A84FF] hover:underline">{order.id}</td>
                                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{new Date(order.date).toLocaleDateString()}</td>
                                      <td className="px-5 py-3 text-gray-800 dark:text-gray-200">
                                          {order.items[0].productName}
                                          {order.items.length > 1 && <span className="text-xs text-gray-400 ml-1">等 {order.items.length} 件</span>}
                                      </td>
                                      <td className="px-5 py-3 text-right font-medium text-red-600 dark:text-red-400 font-mono">¥{order.total.toLocaleString()}</td>
                                      <td className="px-5 py-3">
                                          <span className={`unified-tag-xs ${order.status === OrderStatus.DELIVERED ? 'unified-tag-green' : order.status === OrderStatus.CANCELLED ? 'unified-tag-gray' : 'unified-tag-blue'}`}>
                                              {statusMap[order.status] || order.status}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                              {customerOrders.length === 0 && (
                                  <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 italic text-sm">暂无历史订单</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>

          {/* Right (1/3) */}
          <div className="space-y-4">

              {/* 跟进计划 */}
              <div className="unified-card dark:bg-[#1C1C1E] p-5 border-gray-100/50 dark:border-white/10 space-y-3">
                  <CardHeader icon={Bell} color="text-amber-500" title="客户跟进" />
                  {customer.nextFollowUpDate ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 text-center space-y-1">
                          <div className="text-xs text-[#0071E3] dark:text-blue-400 font-bold uppercase tracking-wider">下次计划跟进</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{new Date(customer.nextFollowUpDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">基于订单 {customerOrders[0]?.id} 自动计算</div>
                      </div>
                  ) : (
                      <div className="text-center py-4 space-y-2">
                          <div className="text-sm text-gray-400">暂无跟进计划</div>
                          <button onClick={handleSetFollowUp} className="text-xs text-[#0071E3] hover:underline">基于订单自动设置</button>
                      </div>
                  )}
              </div>

              {/* 销售归属 */}
              <div className="unified-card dark:bg-[#1C1C1E] p-5 border-gray-100/50 dark:border-white/10 space-y-3">
                  <CardHeader icon={Briefcase} color="text-[#0071E3]" title="销售归属" action={
                      !isEditingOwner && (
                          <button onClick={() => setIsEditingOwner(true)} className="text-xs font-medium text-[#0071E3] hover:text-blue-700 transition">变更</button>
                      )
                  } />
                  {isEditingOwner ? (
                      <div className="space-y-2 pt-1">
                          <select value={selectedOwnerId} onChange={e => setSelectedOwnerId(e.target.value)} className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2 text-sm outline-none focus:border-[#0071E3]">
                              <option value="">-- 选择销售负责人 --</option>
                              {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}（{u.role}）</option>)}
                          </select>
                          <div className="flex gap-2">
                              <button onClick={handleSaveOwner} className="unified-button-primary -1 bg-[#0071E3]">保存</button>
                              <button onClick={() => setIsEditingOwner(false)} className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 py-1.5 rounded-xl text-sm hover:bg-gray-200 transition">取消</button>
                          </div>
                      </div>
                  ) : (
                      <div className="flex items-center gap-3 pt-1">
                          <img src={ownerUser?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${ownerUser?.name || 'Unassigned'}`} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10" alt="" />
                          <div>
                              <div className="font-bold text-gray-900 dark:text-white text-sm">{ownerUser?.name || '未分配'}</div>
                              <div className="text-xs text-gray-400">{ownerUser?.email || '-'}</div>
                          </div>
                      </div>
                  )}
              </div>

              {/* 财务/开票信息 */}
              <div className="unified-card dark:bg-[#1C1C1E] p-5 border-gray-100/50 dark:border-white/10 space-y-0">
                  <CardHeader icon={CreditCard} color="text-green-500" title="财务/开票信息" action={
                      <button onClick={isEditingInfo ? handleSaveInfo : handleEditInfo} className="flex items-center gap-1 text-sm font-medium text-[#0071E3] hover:text-blue-700 transition">
                          {isEditingInfo ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                          {isEditingInfo ? '保存' : '编辑'}
                      </button>
                  } />
                  {isEditingInfo ? (
                      <div className="pt-3 space-y-2">
                          {[
                              ['税号', 'taxId'], ['开票抬头', 'title'], ['开户行', 'bankName'],
                              ['账号', 'accountNumber'], ['注册地址', 'registerAddress'], ['注册电话', 'registerPhone']
                          ].map(([label, key]) => (
                              <input key={key} placeholder={label} value={(infoForm as any)[key]} onChange={e => setInfoForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2 text-xs outline-none focus:border-[#0071E3]" />
                          ))}
                          <div className="flex gap-2 pt-1">
                              <button onClick={() => setIsEditingInfo(false)} className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 py-1.5 rounded-xl text-xs hover:bg-gray-200 transition">取消</button>
                              <button onClick={handleSaveInfo} className="unified-button-primary -1 bg-[#0071E3]">保存</button>
                          </div>
                      </div>
                  ) : (
                      <div>
                          <FieldRow label="税号"><span className="font-mono">{customer.billingInfo?.taxId || '-'}</span></FieldRow>
                          <FieldRow label="开票抬头">{customer.billingInfo?.title || '-'}</FieldRow>
                          <FieldRow label="开户行">{customer.billingInfo?.bankName || '-'}</FieldRow>
                          <FieldRow label="账号"><span className="font-mono text-xs">{customer.billingInfo?.accountNumber || '-'}</span></FieldRow>
                          <FieldRow label="注册地址"><span className="text-xs">{customer.billingInfo?.registerAddress || '-'}</span></FieldRow>
                          <FieldRow label="注册电话">{customer.billingInfo?.registerPhone || '-'}</FieldRow>
                      </div>
                  )}
              </div>

              {/* 关联企业/租户 */}
              <div className="unified-card dark:bg-[#1C1C1E] p-5 border-gray-100/50 dark:border-white/10 space-y-3">
                  <CardHeader icon={Building2} color="text-indigo-500" title="关联企业/租户" />
                  <div className="space-y-2">
                      {(customer.enterprises || []).map((ent, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/10">
                              <div>
                                  <div className="font-medium text-sm text-gray-800 dark:text-white">{ent.name}</div>
                                  <div className="text-xs text-gray-400 font-mono">ID: {ent.id}</div>
                              </div>
                              <button onClick={() => handleRemoveEnterprise(ent.id)} className="text-gray-300 hover:text-red-500 transition p-1"><X className="w-4 h-4" /></button>
                          </div>
                      ))}
                      {(!customer.enterprises || customer.enterprises.length === 0) && (
                          <div className="text-xs text-gray-400 text-center py-2 italic">无关联租户信息</div>
                      )}
                  </div>
                  <div className="flex gap-2">
                      <input placeholder="租户 ID" className="w-1/3 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2 rounded-xl text-xs outline-none focus:border-[#0071E3]" value={newEnterprise.id} onChange={e => setNewEnterprise(p => ({ ...p, id: e.target.value }))} />
                      <input placeholder="租户名称" className="flex-1 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2 rounded-xl text-xs outline-none focus:border-[#0071E3]" value={newEnterprise.name} onChange={e => setNewEnterprise(p => ({ ...p, name: e.target.value }))} />
                      <button onClick={handleAddEnterprise} disabled={!newEnterprise.id || !newEnterprise.name} className="unified-button-primary bg-[#0071E3] disabled:opacity-40">
                          <Plus className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* ── Contact Modal ── */}
      {isContactModalOpen && (

          <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-lg border-gray-200/50 dark:border-white/10 animate-modal-enter">
                  <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingContactId ? '编辑联系人' : '添加联系人'}</h3>
                      <button onClick={() => setIsContactModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-5 space-y-4">
                      {[
                          { label: '姓名 *', key: 'name', required: true },
                          { label: '职位', key: 'position' },
                      ].map(f => (
                          <div key={f.key}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                              <input value={(contactForm as any)[f.key]} onChange={e => setContactForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-[#0071E3]" />
                          </div>
                      ))}
                      <div className="grid grid-cols-2 gap-4">
                          {[{ label: '电话', key: 'phone' }, { label: '邮箱', key: 'email' }].map(f => (
                              <div key={f.key}>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                                  <input value={(contactForm as any)[f.key]} onChange={e => setContactForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-[#0071E3]" />
                              </div>
                          ))}
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">角色标签（可多选）</label>
                          <div className="flex flex-wrap gap-2">
                              {(['Purchasing', 'IT', 'Finance', 'Management', 'Other'] as ContactRole[]).map(role => (
                                  <button key={role} onClick={() => toggleRole(role)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1 ${contactForm.roles.includes(role) ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-[#0071E3]'}`}>
                                      {contactForm.roles.includes(role) && <CheckSquare className="w-3 h-3" />}
                                      {roleLabel(role)}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <input type="checkbox" id="isPrimary" checked={contactForm.isPrimary} onChange={e => setContactForm(p => ({ ...p, isPrimary: e.target.checked }))} className="rounded text-[#0071E3] w-4 h-4" />
                          <label htmlFor="isPrimary" className="text-sm text-gray-700 dark:text-gray-300 select-none">设为主要联系人</label>
                      </div>
                  </div>
                  <div className="p-5 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2">
                      <button onClick={() => setIsContactModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition">取消</button>
                      <button onClick={handleSaveContact} disabled={!contactForm.name} className="unified-button-primary bg-[#0071E3] disabled:opacity-40">保存联系人</button>
                  </div>
              </div>
          </div>
          </ModalPortal>

      )}
    </div>
  );
};

export default CustomerDetails;
