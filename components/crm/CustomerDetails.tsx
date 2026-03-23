
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Phone, Mail, CreditCard, Building, Users, Plus, X, MapPin, Trash2, FileText, UserCircle, CheckSquare, Pencil } from 'lucide-react';
import { CustomerContact, ContactRole } from '../../types';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';

const CustomerDetails: React.FC = () => {
  const { customers, setCustomers, users, currentUser } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const customer = customers.find(c => c.id === id);

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

  const roleLabel = (r: string) =>
      r === 'Purchasing' ? '采购' : r === 'IT' ? 'IT' : r === 'Finance' ? '财务' : r === 'Management' ? '管理' : '其他';

  const [activeTab, setActiveTab] = useState<'info' | 'org' | 'contacts' | 'address' | 'invoice'>('info');

  interface ShippingAddress {
      id: string; receiver: string; country: string; province: string; city: string;
      detail: string; phone: string; email: string; creator: string;
  }
  const [addresses, setAddresses] = useState<ShippingAddress[]>(() => [
      { id: 'addr-1', receiver: '陈经理', country: '中国', province: customer.province || '北京市', city: customer.city || customer.region || '北京市', detail: customer.address || '高新区科技路100号', phone: customer.contacts[0]?.phone || '13900001000', email: customer.contacts[0]?.email || '', creator: customer.ownerName || '系统' },
  ]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const emptyAddr = { receiver: '', country: '中国', province: '', city: '', detail: '', phone: '', email: '' };
  const [addrForm, setAddrForm] = useState(emptyAddr);
  const openAddAddress = () => {
      setAddrForm(emptyAddr);
      setIsEditingAddress(false);
      setEditingAddressId(null);
      setIsAddressModalOpen(true);
  };
  const openEditAddress = (addr: { id: string; receiver: string; country: string; province: string; city: string; detail: string; phone: string; email: string; creator: string }) => {
      setAddrForm({ receiver: addr.receiver, country: addr.country, province: addr.province, city: addr.city, detail: addr.detail, phone: addr.phone, email: addr.email });
      setIsEditingAddress(true);
      setEditingAddressId(addr.id);
      setIsAddressModalOpen(true);
  };
  const handleSaveAddress = () => {
      if (!addrForm.receiver || !addrForm.phone || !addrForm.province || !addrForm.city || !addrForm.detail) return;
      if (isEditingAddress && editingAddressId) {
          setAddresses(prev => prev.map(a => a.id === editingAddressId ? { ...a, ...addrForm } : a));
      } else {
          setAddresses(prev => [...prev, { ...addrForm, id: `addr-${Date.now()}`, creator: currentUser?.name || '当前用户' }]);
      }
      setIsAddressModalOpen(false);
  };

  const [isLinkEnterpriseOpen, setIsLinkEnterpriseOpen] = useState(false);
  const [linkEnterpriseId, setLinkEnterpriseId] = useState('');
  const [linkEnterpriseName, setLinkEnterpriseName] = useState('');
  const handleLinkEnterprise = () => {
      if (!linkEnterpriseId.trim()) return;
      const today = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '-');
      const newEnt = { id: linkEnterpriseId.trim(), name: linkEnterpriseName.trim() || linkEnterpriseId.trim(), createdAt: today, source: '渠道人员创建' as const };
      const enterprises = [...(customer.enterprises || []), newEnt];
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, enterprises } : c));
      setLinkEnterpriseId('');
      setLinkEnterpriseName('');
      setIsLinkEnterpriseOpen(false);
  };

  const [isCreateEnterpriseOpen, setIsCreateEnterpriseOpen] = useState(false);
  const emptyEnt = { name: '', industry: '', province: '', contact: '', phone: '' };
  const [createEntForm, setCreateEntForm] = useState(emptyEnt);
  const handleCreateEnterprise = () => {
      if (!createEntForm.name.trim()) return;
      const newId = (600000000 + Math.floor(Math.random() * 999999)).toString();
      const today = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '-');
      const newEnt = { id: newId, name: createEntForm.name.trim(), createdAt: today, source: '客户创建' as const };
      const enterprises = [...(customer.enterprises || []), newEnt];
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, enterprises } : c));
      setCreateEntForm(emptyEnt);
      setIsCreateEnterpriseOpen(false);
  };

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceFormTouched, setInvoiceFormTouched] = useState(false);
  const emptyInvoice = { invoiceType: '增值税专用发票' as '增值税普通发票' | '增值税专用发票', title: customer.companyName, taxId: '', registerAddress: '', registerPhone: '', accountNumber: '', bankName: '' };
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const handleSaveInvoice = () => {
      setInvoiceFormTouched(true);
      const { taxId, registerAddress, registerPhone, accountNumber, bankName } = invoiceForm;
      if (!taxId || !registerAddress || !registerPhone || !accountNumber || !bankName) return;
      const billingInfo = { ...invoiceForm };
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, billingInfo } : c));
      setIsInvoiceModalOpen(false);
      setInvoiceFormTouched(false);
  };

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const emptyContact: CustomerContact = { id: '', name: '', phone: '', email: '', position: '', roles: ['Purchasing'], isPrimary: false };
  const [contactForm, setContactForm] = useState<CustomerContact>(emptyContact);
  const toggleRole = (role: ContactRole) => {
      setContactForm(f => ({ ...f, roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role] }));
  };
  const openAddContact = () => {
      setContactForm(emptyContact);
      setIsEditingContact(false);
      setIsContactModalOpen(true);
  };
  const openEditContact = (contact: CustomerContact) => {
      setContactForm({ ...contact });
      setIsEditingContact(true);
      setIsContactModalOpen(true);
  };
  const handleSaveContact = () => {
      if (!contactForm.name || !contactForm.phone || !contactForm.email || contactForm.roles.length === 0) return;
      let contacts = [...customer.contacts];
      if (isEditingContact) {
          if (contactForm.isPrimary) contacts = contacts.map(c => ({ ...c, isPrimary: c.id === contactForm.id }));
          contacts = contacts.map(c => c.id === contactForm.id ? { ...contactForm } : c);
      } else {
          const newContact: CustomerContact = {
              ...contactForm,
              id: `ct-${Date.now()}`,
              creatorId: currentUser.id,
              creatorName: currentUser.name,
              createdAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '-'),
          };
          if (newContact.isPrimary) contacts = contacts.map(c => ({ ...c, isPrimary: false }));
          contacts.push(newContact);
          if (contacts.length === 1) contacts[0].isPrimary = true;
      }
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, contacts } : c));
      setIsContactModalOpen(false);
  };

  const ownerUser = users.find(u => u.id === customer.ownerId);

  const levelColors: Record<string, string> = {
      KA: 'bg-purple-100 text-purple-700 border-purple-200',
      A: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      B: 'bg-blue-100 text-[#0071E3] border-blue-200',
      C: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const typeLabel: Record<string, string> = {
      Enterprise: '企业', Government: '政府', Education: '教育', Partner: '合作伙伴', SMB: '中小企业',
  };
  const getTypeDisplay = (t: string) => typeLabel[t] || t;

  return (
    <div className="max-w-[2400px] mx-auto w-full animate-page-enter pb-20">

      {/* ── Sticky Header + Tabs ── */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 px-4 md:px-6 pt-4 flex flex-col">
          <div className="flex items-center gap-4 pb-3">
              <button onClick={() => navigate('/customers')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 shrink-0">
                  <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="shrink-0">
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{customer.companyName}</h1>
                  <span className="text-xs text-gray-400 font-mono mt-0.5 block">{customer.id}</span>
              </div>
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar pt-2 border-b border-gray-200 dark:border-white/10">
              {([
                  { id: 'info' as const, label: '客户信息' },
                  { id: 'org' as const, label: '组织信息' },
                  { id: 'contacts' as const, label: '联系人信息' },
                  { id: 'address' as const, label: '收货地址' },
                  { id: 'invoice' as const, label: '发票信息' },
              ]).map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-5 py-2 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                          activeTab === tab.id
                              ? 'text-[#0071E3] dark:text-[#0A84FF] border-[#0071E3] dark:border-[#0A84FF]'
                              : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                  >
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      <div className="p-4 lg:p-6 space-y-4">

      {/* ── Tab: 客户信息 ── */}
      {activeTab === 'info' && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 基本信息 (span 2) */}
          <div className="md:col-span-2 unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-[#0071E3]" />
                  <h4 className="text-base font-bold text-gray-800 dark:text-white">基本信息</h4>
              </div>
              <div className="grid grid-cols-3 gap-0">
                  {[
                      { label: '客户编号', value: customer.id, mono: true },
                      { label: '客户名称', value: customer.companyName },
                      { label: '报备标签', value: customer.reportTag || '-' },
                      { label: '客户属性', value: customer.customerAttribute || '-' },
                      { label: '客户类型', value: typeLabel[customer.customerType] || customer.customerType },
                      { label: '行业条线', value: customer.industryLine || customer.industry || '-' },
                      { label: '行业推广类', value: customer.industryPromotionType || '-' },
                      { label: '客户级别', value: customer.customerGrade || customer.level },
                      { label: '上级单位', value: customer.parentOrg || '-' },
                      { label: '层级维度关注一级单位', value: customer.levelFocusUnit || '-' },
                      { label: '监管机构', value: customer.supervisoryOrg || '-' },
                      { label: '所在国家', value: customer.country || '-' },
                      { label: '所在省份', value: customer.province || '-' },
                      { label: '所在城市', value: customer.city || customer.region || '-' },
                      { label: '所在区县', value: customer.district || '-' },
                      { label: '公司地址', value: customer.address || '-' },
                      { label: '公司电话', value: customer.companyPhone || '-' },
                      { label: '创建时间', value: customer.createdAt || '-' },
                  ].map((field, idx) => (
                      <div key={idx} className="px-5 py-3 border-b border-gray-100/80 dark:border-white/5">
                          <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">{field.label}</div>
                          <div className={`text-sm text-gray-900 dark:text-white ${field.mono ? 'font-mono' : ''}`}>{field.value}</div>
                      </div>
                  ))}
              </div>
          </div>

          {/* 归属信息 (span 1) */}
          <div className="md:col-span-1 unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden self-start">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <UserCircle className="w-4.5 h-4.5 text-indigo-500" />
                  <h4 className="text-base font-bold text-gray-800 dark:text-white">归属信息</h4>
              </div>
              <div className="divide-y divide-gray-100/80 dark:divide-white/5">
                  {[
                      { label: '客户所有人', value: ownerUser?.name || '未分配', avatar: ownerUser?.avatar || (ownerUser ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${ownerUser.name}` : '') },
                      { label: '客户所属部门', value: customer.customerDepartment || '-' },
                      { label: '客户所属经销商', value: customer.dealerName || '-' },
                  ].map((item, idx) => (
                      <div key={idx} className="px-5 py-3.5">
                          <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">{item.label}</div>
                          <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                              {item.avatar && <img src={item.avatar} className="w-5 h-5 rounded-full" alt="" />}
                              <span>{item.value}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
      )}

      {/* ── Tab: 组织信息 ── */}
      {activeTab === 'org' && (
      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#0071E3]" />
                  <span className="text-base font-bold text-gray-800 dark:text-white">关联企业</span>
                  <span className="text-xs text-gray-400">（共 {(customer.enterprises || []).length} 个）</span>
              </div>
              <div className="flex items-center gap-2">
                  <button
                      onClick={() => { setLinkEnterpriseId(''); setLinkEnterpriseName(''); setIsLinkEnterpriseOpen(true); }}
                      className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border border-[#0071E3] text-[#0071E3] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition font-medium"
                  >
                      <Plus className="w-3.5 h-3.5" /> 关联企业
                  </button>
                  <button
                      onClick={() => { setCreateEntForm(emptyEnt); setIsCreateEnterpriseOpen(true); }}
                      className="flex items-center gap-1.5 bg-[#0071E3] text-white text-xs px-3.5 py-2 rounded-xl hover:bg-blue-700 transition"
                  >
                      <Plus className="w-3.5 h-3.5" /> 创建企业
                  </button>
              </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(customer.enterprises || []).length === 0 ? (
                  <div className="md:col-span-3 unified-card dark:bg-[#1C1C1E] p-10 text-center text-sm text-gray-400">暂无关联企业，点击右上角添加。</div>
              ) : (
                  (customer.enterprises || []).map(ent => (
                      <div key={ent.id} className="md:col-span-1 unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden self-start">
                          <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{ent.name}</span>
                              {ent.source && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${ent.source === '客户创建' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30' : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30'}`}>
                                      {ent.source}
                                  </span>
                              )}
                          </div>
                          <div className="divide-y divide-gray-100/80 dark:divide-white/5">
                              <div className="px-5 py-3">
                                  <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">企业 ID</div>
                                  <div className="text-sm font-mono text-gray-900 dark:text-white flex items-center gap-2">
                                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" /><span>{ent.id}</span>
                                  </div>
                              </div>
                              {ent.createdAt && (
                                  <div className="px-5 py-3 bg-gray-50/60 dark:bg-white/[0.02]">
                                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                                          <span>创建时间：<span className="text-gray-600 dark:text-gray-300 font-medium">{ent.createdAt}</span></span>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
      )}

      {/* ── 关联企业弹窗 ── */}
      {isLinkEnterpriseOpen && (
          <ModalPortal>
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-modal-enter">
                      <div className="flex items-center justify-between mb-5">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#0071E3]" /> 关联企业
                          </h3>
                          <button onClick={() => setIsLinkEnterpriseOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-3">
                          <div>
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">企业 ID <span className="text-red-500">*</span></label>
                              <input
                                  value={linkEnterpriseId}
                                  onChange={e => setLinkEnterpriseId(e.target.value)}
                                  placeholder="输入企业 ID，例：600000100"
                                  className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-[#0071E3] dark:text-white font-mono"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">企业名称</label>
                              <input
                                  value={linkEnterpriseName}
                                  onChange={e => setLinkEnterpriseName(e.target.value)}
                                  placeholder="选填，不填则以 ID 展示"
                                  className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-[#0071E3] dark:text-white"
                              />
                          </div>
                      </div>
                      <div className="flex gap-2 mt-5">
                          <button onClick={() => setIsLinkEnterpriseOpen(false)} className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition">取消</button>
                          <button onClick={handleLinkEnterprise} disabled={!linkEnterpriseId.trim()} className="flex-1 bg-[#0071E3] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">确认关联</button>
                      </div>
                  </div>
              </div>
          </ModalPortal>
      )}

      {/* ── 创建企业弹窗 ── */}
      {isCreateEnterpriseOpen && (
          <ModalPortal>
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-modal-enter">
                      <div className="flex items-center justify-between mb-5">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#0071E3]" /> 创建企业
                          </h3>
                          <button onClick={() => setIsCreateEnterpriseOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-3">
                          {[
                              { label: '企业名称', key: 'name', placeholder: '请输入企业名称', required: true },
                              { label: '所属行业', key: 'industry', placeholder: '例：互联网' },
                              { label: '所在省份', key: 'province', placeholder: '例：北京市' },
                              { label: '联系人',   key: 'contact', placeholder: '企业联系人姓名' },
                              { label: '联系电话', key: 'phone',   placeholder: '联系人电话' },
                          ].map(f => (
                              <div key={f.key}>
                                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                                  <input
                                      value={(createEntForm as any)[f.key]}
                                      onChange={e => setCreateEntForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      placeholder={f.placeholder}
                                      className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-[#0071E3] dark:text-white"
                                  />
                              </div>
                          ))}
                      </div>
                      <div className="flex gap-2 mt-5">
                          <button onClick={() => setIsCreateEnterpriseOpen(false)} className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition">取消</button>
                          <button onClick={handleCreateEnterprise} disabled={!createEntForm.name.trim()} className="flex-1 bg-[#0071E3] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">创建并关联</button>
                      </div>
                  </div>
              </div>
          </ModalPortal>
      )}

      {/* ── Tab: 联系人信息 ── */}
      {activeTab === 'contacts' && (
      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0071E3]" />
                  <span className="text-base font-bold text-gray-800 dark:text-white">联系人信息</span>
                  <span className="text-xs text-gray-400">（共 {customer.contacts.length} 人）</span>
              </div>
              <button onClick={openAddContact} className="flex items-center gap-1.5 bg-[#0071E3] text-white text-xs px-3.5 py-2 rounded-xl hover:bg-blue-700 transition">
                  <Plus className="w-3.5 h-3.5" /> 添加联系人
              </button>
          </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {customer.contacts.length === 0 ? (
              <div className="md:col-span-3 unified-card dark:bg-[#1C1C1E] p-10 text-center text-sm text-gray-400">暂无联系人信息，点击右上角"添加联系人"。</div>
          ) : (
              customer.contacts.map(contact => (
                  <div key={contact.id} className="md:col-span-1 unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden self-start">
                      <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{contact.name}</span>
                              {contact.isPrimary && (
                                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold border border-amber-200">主联系人</span>
                              )}
                          </div>
                          <div className="flex items-center gap-2">
                              {contact.roles.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                      {contact.roles.map(r => (
                                          <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] border border-blue-100 dark:border-blue-800/30 font-medium">{roleLabel(r)}</span>
                                      ))}
                                  </div>
                              )}
                              <button
                                  onClick={() => openEditContact(contact)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#0071E3] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                  title="编辑联系人"
                              >
                                  <Pencil className="w-3.5 h-3.5" />
                              </button>
                          </div>
                      </div>
                      <div className="divide-y divide-gray-100/80 dark:divide-white/5">
                          {contact.phone && (
                              <div className="px-5 py-3">
                                  <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">电话</div>
                                  <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                      <Phone className="w-3.5 h-3.5 text-gray-400" /><span>{contact.phone}</span>
                                  </div>
                              </div>
                          )}
                          {contact.email && (
                              <div className="px-5 py-3">
                                  <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">邮箱</div>
                                  <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                      <Mail className="w-3.5 h-3.5 text-gray-400" /><span className="truncate">{contact.email}</span>
                                  </div>
                              </div>
                          )}
                          {contact.creatorName && (
                              <div className="px-5 py-3 bg-gray-50/60 dark:bg-white/[0.02]">
                                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                                      <span>创建人：<span className="text-gray-600 dark:text-gray-300 font-medium">{contact.creatorName}</span></span>
                                      {contact.createdAt && <span>{contact.createdAt}</span>}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              ))
          )}
      </div>

      {isContactModalOpen && (
          <ModalPortal>
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-md p-6 animate-modal-enter">
                      <div className="flex items-center justify-between mb-5">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">{isEditingContact ? '编辑联系人' : '添加联系人'}</h3>
                          <button onClick={() => setIsContactModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-3">
                          {[
                              { label: '姓名', key: 'name', placeholder: '联系人姓名', required: true },
                              { label: '手机/电话', key: 'phone', placeholder: '联系电话', required: true },
                              { label: '邮箱', key: 'email', placeholder: '工作邮箱', required: true },
                          ].map(f => (
                              <div key={f.key}>
                                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                                  <input
                                      value={(contactForm as any)[f.key]}
                                      onChange={e => setContactForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      placeholder={f.placeholder}
                                      className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-[#0071E3] dark:text-white"
                                  />
                              </div>
                          ))}
                          <div>
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">联系人类型（可多选）<span className="text-red-500 ml-0.5">*</span></label>
                              <div className="flex flex-wrap gap-2">
                                  {(['Purchasing', 'IT'] as ContactRole[]).map(role => (
                                      <button key={role} type="button" onClick={() => toggleRole(role)}
                                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all duration-150 font-medium ${contactForm.roles.includes(role) ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-[#0071E3]'}`}>
                                          {contactForm.roles.includes(role) && <CheckSquare className="w-3 h-3" />} {roleLabel(role)}
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <div className="flex items-center gap-2 py-1">
                              <input type="checkbox" id="isPrimary" checked={contactForm.isPrimary} onChange={e => setContactForm(f => ({ ...f, isPrimary: e.target.checked }))} className="rounded" />
                              <label htmlFor="isPrimary" className="text-sm text-gray-700 dark:text-gray-300 select-none">设为主联系人</label>
                          </div>
                      </div>
                      <div className="flex gap-2 mt-5">
                          <button onClick={() => setIsContactModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition">取消</button>
                          <button onClick={handleSaveContact} disabled={!contactForm.name || !contactForm.phone || !contactForm.email || contactForm.roles.length === 0} className="flex-1 bg-[#0071E3] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">保存</button>
                      </div>
                  </div>
              </div>
          </ModalPortal>
      )}
      </div>
      )}

      {/* ── Tab: 收货地址 ── */}
      {activeTab === 'address' && (
      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#0071E3]" />
                  <span className="text-base font-bold text-gray-800 dark:text-white">收货地址</span>
                  <span className="text-xs text-gray-400">（共 {addresses.length} 条）</span>
              </div>
              <button onClick={openAddAddress} className="flex items-center gap-1.5 bg-[#0071E3] text-white text-xs px-3.5 py-2 rounded-xl hover:bg-blue-700 transition">
                  <Plus className="w-3.5 h-3.5" /> 添加收货地址
              </button>
          </div>
          <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[900px]">
                      <thead>
                          <tr className="border-b border-gray-200/50 dark:border-white/10 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-[#1C1C1E]">
                              <th className="px-4 py-3 font-semibold">收货人</th>
                              <th className="px-4 py-3 font-semibold">国家</th>
                              <th className="px-4 py-3 font-semibold">省份</th>
                              <th className="px-4 py-3 font-semibold">城市</th>
                              <th className="px-4 py-3 font-semibold">详细地址</th>
                              <th className="px-4 py-3 font-semibold">手机号码</th>
                              <th className="px-4 py-3 font-semibold">邮箱地址</th>
                              <th className="px-4 py-3 font-semibold">创建人</th>
                              <th className="px-4 py-3 font-semibold text-center">操作</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100/50 dark:divide-white/5">
                          {addresses.length === 0 ? (
                              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">暂无数据</td></tr>
                          ) : (
                              addresses.map(addr => (
                                  <tr key={addr.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors">
                                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{addr.receiver}</td>
                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{addr.country}</td>
                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{addr.province}</td>
                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{addr.city}</td>
                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{addr.detail}</td>
                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{addr.phone}</td>
                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{addr.email || '-'}</td>
                                      <td className="px-4 py-3 text-gray-400 text-xs">{addr.creator}</td>
                                      <td className="px-4 py-3 text-center whitespace-nowrap">
                                          <div className="flex items-center justify-center gap-1">
                                              <button onClick={() => openEditAddress(addr)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-[#0071E3] transition" title="编辑">
                                                  <Pencil className="w-3.5 h-3.5" />
                                              </button>
                                              <button onClick={() => setAddresses(prev => prev.filter(a => a.id !== addr.id))} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition" title="删除">
                                                  <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {isAddressModalOpen && (
              <ModalPortal>
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-lg p-6 animate-modal-enter">
                          <div className="flex items-center justify-between mb-5">
                              <h3 className="text-base font-bold text-gray-900 dark:text-white">{isEditingAddress ? '编辑收货地址' : '添加收货地址'}</h3>
                              <button onClick={() => setIsAddressModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4" /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                              {[
                                  { label: '收货人', key: 'receiver', required: true, span: 1 },
                                  { label: '手机号码', key: 'phone', required: true, span: 1 },
                                  { label: '国家', key: 'country', span: 1 },
                                  { label: '省份', key: 'province', required: true, span: 1 },
                                  { label: '城市', key: 'city', required: true, span: 1 },
                                  { label: '邮箱地址', key: 'email', span: 1 },
                                  { label: '详细地址', key: 'detail', required: true, span: 2 },
                              ].map(f => (
                                  <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                                      <input
                                          value={(addrForm as any)[f.key]}
                                          onChange={e => setAddrForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                          className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 text-sm outline-none focus:border-[#0071E3] dark:text-white"
                                      />
                                  </div>
                              ))}
                          </div>
                          <div className="flex gap-2 mt-5">
                              <button onClick={() => setIsAddressModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition">取消</button>
                              <button
                                  onClick={handleSaveAddress}
                                  disabled={!addrForm.receiver || !addrForm.phone || !addrForm.province || !addrForm.city || !addrForm.detail}
                                  className="flex-1 bg-[#0071E3] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                              >保存</button>
                          </div>
                      </div>
                  </div>
              </ModalPortal>
          )}
      </div>
      )}

      {/* ── Tab: 发票信息 ── */}
      {activeTab === 'invoice' && (
      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0071E3]" />
                  <span className="text-base font-bold text-gray-800 dark:text-white">发票信息</span>
              </div>
              <button
                  onClick={() => { setInvoiceForm({ ...emptyInvoice, title: customer.companyName }); setInvoiceFormTouched(false); setIsInvoiceModalOpen(true); }}
                  className="flex items-center gap-1.5 bg-[#0071E3] text-white text-xs px-3.5 py-2 rounded-xl hover:bg-blue-700 transition"
              >
                  <Plus className="w-3.5 h-3.5" /> 添加发票信息
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {!customer.billingInfo?.taxId ? (
                  <div className="md:col-span-3 unified-card dark:bg-[#1C1C1E] p-10 text-center text-sm text-gray-400">暂无发票信息，点击右上角"添加发票信息"。</div>
              ) : (
                  <div className="md:col-span-1 unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden self-start">
                      <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                          <h4 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-green-500" /> 财务/开票信息
                          </h4>
                          {customer.billingInfo?.invoiceType && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium border bg-blue-50 text-[#0071E3] border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30">{customer.billingInfo.invoiceType}</span>
                          )}
                      </div>
                      <div className="divide-y divide-gray-100/80 dark:divide-white/5">
                          {[
                              { label: '开票抬头', value: customer.billingInfo?.title || '-' },
                              { label: '税号', value: customer.billingInfo?.taxId || '-', mono: true },
                              { label: '单位地址', value: customer.billingInfo?.registerAddress || '-' },
                              { label: '电话号码', value: customer.billingInfo?.registerPhone || '-' },
                              { label: '银行账户', value: customer.billingInfo?.accountNumber || '-', mono: true },
                              { label: '开户银行', value: customer.billingInfo?.bankName || '-' },
                          ].map((item, idx) => (
                              <div key={idx} className="px-5 py-3.5">
                                  <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">{item.label}</div>
                                  <div className={`text-sm text-gray-900 dark:text-white ${item.mono ? 'font-mono' : ''}`}>{item.value}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>
      )}

      {/* ── 添加发票信息弹窗 ── */}
      {isInvoiceModalOpen && (
          <ModalPortal>
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-md animate-modal-enter overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/10">
                          <button onClick={() => setIsInvoiceModalOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 transition">
                              <ArrowLeft className="w-4 h-4" />
                          </button>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">添加发票</h3>
                      </div>
                      <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                          {/* 提示 */}
                          <div className="flex gap-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-3.5">
                              <span className="text-[#0071E3] mt-0.5 shrink-0">ℹ</span>
                              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">请准确填写开票信息，如因填写信息错误而造成开票错误，需自行承担相关责任。另外，请确保银行账户信息已添加为【银行账号】信息，否则无法正常开发票。</p>
                          </div>
                          {/* 发票类型 */}
                          <div>
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">发票类型：</label>
                              <div className="flex items-center gap-6">
                                  {(['增值税普通发票', '增值税专用发票'] as const).map(type => (
                                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                                          <input
                                              type="radio"
                                              name="invoiceType"
                                              checked={invoiceForm.invoiceType === type}
                                              onChange={() => setInvoiceForm(f => ({ ...f, invoiceType: type }))}
                                              className="accent-[#0071E3] w-4 h-4"
                                          />
                                          <span className={`text-sm ${invoiceForm.invoiceType === type ? 'text-[#0071E3] font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{type}</span>
                                      </label>
                                  ))}
                              </div>
                          </div>
                          {/* 名称（只读） */}
                          <div>
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">名称：</label>
                              <input
                                  value={invoiceForm.title}
                                  readOnly
                                  className="w-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 rounded-xl p-2.5 text-sm text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
                              />
                          </div>
                          {/* 必填字段 */}
                          {[
                              { label: '税号', key: 'taxId', placeholder: '请输入纳税人识别号' },
                              { label: '单位地址', key: 'registerAddress', placeholder: '请输入单位地址信息' },
                              { label: '电话号码', key: 'registerPhone', placeholder: '请输入电话号码' },
                              { label: '银行账户', key: 'accountNumber', placeholder: '请输入银行账户号码' },
                              { label: '开户银行', key: 'bankName', placeholder: '请输入开户银行名称' },
                          ].map(f => {
                              const val = (invoiceForm as any)[f.key];
                              const invalid = invoiceFormTouched && !val;
                              return (
                                  <div key={f.key}>
                                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                          <span className="text-red-500 mr-0.5">*</span>{f.label}：
                                      </label>
                                      <input
                                          value={val}
                                          onChange={e => setInvoiceForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                          placeholder={f.placeholder}
                                          className={`w-full border rounded-xl p-2.5 text-sm outline-none transition bg-white dark:bg-white/5 dark:text-white ${invalid ? 'border-red-400 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-[#0071E3]'}`}
                                      />
                                      {invalid && <p className="text-xs text-red-500 mt-1">必填字段</p>}
                                  </div>
                              );
                          })}
                      </div>
                      <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10">
                          <button
                              onClick={handleSaveInvoice}
                              className="w-28 bg-[#0071E3] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                          >
                              确定
                          </button>
                      </div>
                  </div>
              </div>
          </ModalPortal>
      )}

      </div>
    </div>
  );
};

export default CustomerDetails;
