
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Channel } from '../../types';
import { ArrowLeft, FileText, UserCircle, Edit2, Save, X } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

type TabKey = 'basic' | 'bank' | 'invoice' | 'shipping' | 'accounts' | 'debt';

const tabList: { id: TabKey; label: string }[] = [
  { id: 'basic', label: '基本信息' },
  { id: 'bank', label: '银行账号' },
  { id: 'invoice', label: '发票信息' },
  { id: 'shipping', label: '收货地址' },
  { id: 'accounts', label: '用户账号' },
  { id: 'debt', label: '欠款结算' },
];

const ChannelDetails: React.FC = () => {
  const { channels, setChannels } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const channel = channels.find(c => c.id === id);

  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Channel>>({});

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-gray-400 text-lg">未找到渠道信息</div>
        <button onClick={() => navigate('/channels')} className="text-[#0071E3] hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回渠道列表
        </button>
      </div>
    );
  }

  const handleEdit = () => { setFormData({ ...channel }); setIsEditing(true); };
  const handleSave = () => { setChannels(prev => prev.map(c => c.id === id ? { ...c, ...formData } as Channel : c)); setIsEditing(false); };
  const handleCancel = () => { setIsEditing(false); setFormData({}); };

  const editableKeys = new Set<keyof Channel>([
    'name', 'country', 'province', 'city', 'district', 'companyAddress',
    'companyPhone', 'companyEmail', 'companyZipCode', 'relatedParty',
    'rebate', 'parentChannel', 'firstLevelChannel', 'bChannelManager', 'gChannelManager',
  ]);

  const basicFields: { label: string; key: keyof Channel; mono?: boolean }[] = [
    { label: '渠道编号', key: 'id', mono: true },
    { label: '渠道编号(CRM)', key: 'crmId', mono: true },
    { label: '渠道名称', key: 'name' },
    { label: '所在国家', key: 'country' },
    { label: '所在省份', key: 'province' },
    { label: '所在城市', key: 'city' },
    { label: '所在区县', key: 'district' },
    { label: '公司地址', key: 'companyAddress' },
    { label: '公司电话', key: 'companyPhone' },
    { label: '公司邮箱', key: 'companyEmail' },
    { label: '公司邮编', key: 'companyZipCode' },
    { label: '关联方', key: 'relatedParty' },
    { label: '返利', key: 'rebate' },
    { label: '上级渠道', key: 'parentChannel' },
    { label: '一级渠道', key: 'firstLevelChannel' },
  ];

  const managerFields: { label: string; key: keyof Channel }[] = [
    { label: 'B端渠道经理', key: 'bChannelManager' },
    { label: 'G端渠道经理', key: 'gChannelManager' },
  ];

  const typeLabels: Record<string, string> = {
    Distributor: '经销商', Reseller: '分销商', SI: '集成商', ISV: 'ISV',
  };

  const emptyPlaceholder = (icon: string, title: string) => (
    <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
          <span className="text-xl">{icon}</span>
        </div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs mt-1">暂无数据</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-[2400px] mx-auto w-full animate-page-enter pb-20">

      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 px-4 md:px-6 pt-4 flex flex-col">
        <div className="flex items-center gap-4 pb-3">
          <button onClick={() => navigate('/channels')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{channel.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                channel.status === 'Active'
                  ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                  : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
              }`}>
                {channel.status === 'Active' ? '合作中' : '已终止'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/40">
                {typeLabels[channel.type] || channel.type}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/40">
                {channel.level}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-mono mt-0.5 block">{channel.id} · {channel.region}</span>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar pt-2 border-b border-gray-200 dark:border-white/10">
          {tabList.map(tab => (
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

      {/* Content */}
      <div className="p-4 lg:p-6 space-y-4">

        {/* Tab: 基本信息 */}
        {activeTab === 'basic' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 基本信息 (2/3) */}
          <div className="md:col-span-2 unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-[#0071E3]" />
                <h4 className="text-base font-bold text-gray-800 dark:text-white">基本信息</h4>
              </div>
              {!isEditing ? (
                <button onClick={handleEdit} className="flex items-center gap-1.5 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline">
                  <Edit2 className="w-3 h-3" /> 编辑基本信息
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <X className="w-3 h-3" /> 取消
                  </button>
                  <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0062CC] rounded-lg transition">
                    <Save className="w-3 h-3" /> 保存
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-0">
              {basicFields.map((field, idx) => {
                const val = String(channel[field.key] ?? '-');
                const canEdit = isEditing && editableKeys.has(field.key);
                return (
                  <div key={idx} className="px-5 py-3 border-b border-gray-100/80 dark:border-white/5">
                    <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">{field.label}</div>
                    {canEdit ? (
                      <input
                        className="w-full bg-transparent border-b border-[#0071E3] dark:border-[#0A84FF] outline-none text-sm py-0.5 text-gray-900 dark:text-white"
                        value={String(formData[field.key] ?? '')}
                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    ) : (
                      <div className={`text-sm text-gray-900 dark:text-white ${field.mono ? 'font-mono' : ''}`}>{val}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 渠道归属 (1/3) */}
          <div className="md:col-span-1 unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden self-start">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
              <UserCircle className="w-4.5 h-4.5 text-indigo-500" />
              <h4 className="text-base font-bold text-gray-800 dark:text-white">渠道归属</h4>
            </div>
            <div className="divide-y divide-gray-100/80 dark:divide-white/5">
              {managerFields.map((field, idx) => {
                const val = String(channel[field.key] ?? '-');
                const canEdit = isEditing && editableKeys.has(field.key);
                return (
                  <div key={idx} className="px-5 py-3.5">
                    <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">{field.label}</div>
                    {canEdit ? (
                      <input
                        className="w-full bg-transparent border-b border-[#0071E3] dark:border-[#0A84FF] outline-none text-sm py-0.5 text-gray-900 dark:text-white"
                        value={String(formData[field.key] ?? '')}
                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <span>{val}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="px-5 py-3.5">
                <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">渠道联系人</div>
                <div className="text-sm text-gray-900 dark:text-white">{channel.contactName}</div>
              </div>
              <div className="px-5 py-3.5">
                <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">联系电话</div>
                <div className="text-sm text-gray-900 dark:text-white font-mono">{channel.contactPhone}</div>
              </div>
              <div className="px-5 py-3.5">
                <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">联系邮箱</div>
                <div className="text-sm text-gray-900 dark:text-white">{channel.email}</div>
              </div>
              <div className="px-5 py-3.5">
                <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">签约日期</div>
                <div className="text-sm text-gray-900 dark:text-white">{channel.agreementDate}</div>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'bank' && emptyPlaceholder('🏦', '银行账号信息')}
        {activeTab === 'invoice' && emptyPlaceholder('🧾', '发票信息')}
        {activeTab === 'shipping' && emptyPlaceholder('📦', '收货地址')}
        {activeTab === 'accounts' && emptyPlaceholder('👤', '用户账号')}
        {activeTab === 'debt' && emptyPlaceholder('💰', '欠款结算')}

      </div>
    </div>
  );
};

export default ChannelDetails;
