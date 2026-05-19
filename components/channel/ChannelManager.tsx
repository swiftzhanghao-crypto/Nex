import React, { useState } from 'react';
import { Search, X, Plus, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { channelApi } from '../../services/api';
import { Channel, ChannelType } from '../../types';
import Pagination from '../common/Pagination';

interface ChannelFormData {
  name: string;
  type: ChannelType;
  level: 'Tier1' | 'Tier2' | 'Tier3';
  contactName: string;
  contactPhone: string;
  email: string;
  region: string;
  status: 'Active' | 'Inactive';
  agreementDate: string;
}

const emptyForm: ChannelFormData = {
  name: '',
  type: 'Distributor',
  level: 'Tier1',
  contactName: '',
  contactPhone: '',
  email: '',
  region: '',
  status: 'Active',
  agreementDate: '',
};

const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  Distributor: '分销商',
  Reseller: '经销商',
  SI: '系统集成商',
  ISV: '独立软件开发商',
};

const LEVEL_LABELS: Record<string, string> = {
  Tier1: '一级',
  Tier2: '二级',
  Tier3: '三级',
};

const ChannelManager: React.FC = () => {
  const { channels, refreshChannels } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [form, setForm] = useState<ChannelFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.province || c.region).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const safeCurrentPage = Math.min(currentPage, Math.max(1, Math.ceil(filteredChannels.length / itemsPerPage)));
  const currentChannels = filteredChannels.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const openCreate = () => {
    setEditingChannel(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setForm({
      name: channel.name,
      type: channel.type,
      level: channel.level,
      contactName: channel.contactName || '',
      contactPhone: channel.contactPhone || '',
      email: channel.email || '',
      region: channel.region || '',
      status: channel.status,
      agreementDate: channel.agreementDate || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingChannel) {
        await channelApi.update(editingChannel.id, form);
      } else {
        await channelApi.create(form);
      }
      await refreshChannels();
      setShowModal(false);
    } catch (e) {
      console.error('Save channel failed:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof ChannelFormData>(key: K, value: ChannelFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="page-container animate-page-enter h-full flex flex-col gap-4 min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">渠道管理</h1>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-full sm:w-[320px] focus-within:border-blue-400 dark:focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition shadow-apple">
            <div className="relative flex-1 flex items-center min-w-0">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
              <input
                type="text"
                placeholder="搜索渠道编号、名称或省份…"
                className="w-full h-full pl-8 pr-8 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={openCreate}
            className="h-9 px-4 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-sm font-semibold hover:bg-blue-600 dark:hover:bg-blue-500 active:bg-blue-700 transition shadow-apple flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            新增渠道
          </button>
        </div>
      </div>

      <div className="unified-card overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E] sticky top-0 z-10">
              <tr>
                <th className="pl-6 pr-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">渠道编号</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">渠道名称</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">类型</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">级别</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">所在省份</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">最新签约情况</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">状态</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {currentChannels.map(channel => (
                <tr
                  key={channel.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <td className="pl-6 pr-4 py-3 text-sm font-mono font-bold whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/channels/${channel.id}`)}
                      className="text-[#0071E3] dark:text-[#0A84FF] hover:underline cursor-pointer"
                    >
                      {channel.id}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 dark:text-white">{channel.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {CHANNEL_TYPE_LABELS[channel.type] || channel.type || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {LEVEL_LABELS[channel.level] || channel.level || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {channel.province || channel.region || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm ${
                      channel.contractStatus === '已签约'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {channel.contractStatus || '未签约'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm ${
                      channel.status === 'Active'
                        ? 'text-gray-900 dark:text-white'
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      {channel.status === 'Active' ? '正常' : '已终止'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(channel); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    >
                      <Pencil className="w-3 h-3" />
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
              {currentChannels.length === 0 && (
                <tr><td colSpan={8} className="p-12 text-center text-gray-400">暂无渠道数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safeCurrentPage}
          size={itemsPerPage}
          total={filteredChannels.length}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ── 新增/编辑渠道弹窗 ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingChannel ? '编辑渠道' : '新增渠道'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">渠道名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="请输入渠道名称"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">渠道类型</label>
                  <select
                    value={form.type}
                    onChange={e => updateField('type', e.target.value as ChannelType)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                  >
                    {Object.entries(CHANNEL_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">渠道级别</label>
                  <select
                    value={form.level}
                    onChange={e => updateField('level', e.target.value as 'Tier1' | 'Tier2' | 'Tier3')}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                  >
                    {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">联系人</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={e => updateField('contactName', e.target.value)}
                    placeholder="联系人姓名"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">联系电话</label>
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={e => updateField('contactPhone', e.target.value)}
                    placeholder="联系电话"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">邮箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="渠道商邮箱"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">所在区域</label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={e => updateField('region', e.target.value)}
                    placeholder="省份/区域"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">签约日期</label>
                  <input
                    type="date"
                    value={form.agreementDate}
                    onChange={e => updateField('agreementDate', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">状态</label>
                <select
                  value={form.status}
                  onChange={e => updateField('status', e.target.value as 'Active' | 'Inactive')}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition"
                >
                  <option value="Active">正常</option>
                  <option value="Inactive">已终止</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="h-9 px-4 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name.trim()}
                className="h-9 px-5 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-sm font-semibold hover:bg-blue-600 dark:hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-apple"
              >
                {submitting ? '保存中…' : editingChannel ? '保存修改' : '创建渠道'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelManager;
