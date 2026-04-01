import React, { useState } from 'react';
import { FileText, Plus, Edit3, Trash2, X, Link as LinkIcon, Calendar, Tag, ExternalLink } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

interface PolicyItem {
  id: string;
  year: string;
  category: '产品政策' | '价格政策';
  name: string;
  link: string;
}

const initialPolicies: PolicyItem[] = [
  { id: 'p1', year: '2026', category: '产品政策', name: 'WPS365 政务产品采购政策（2026版）', link: 'https://example.com/policy/wps365-procurement-2026.pdf' },
  { id: 'p2', year: '2026', category: '价格政策', name: '云服务产品定价与折扣管理办法', link: 'https://example.com/policy/cloud-pricing-rule.pdf' },
  { id: 'p3', year: '2025', category: '产品政策', name: '渠道合作与授权合规指引', link: 'https://example.com/policy/channel-compliance-guide.pdf' },
  { id: 'p4', year: '2025', category: '价格政策', name: '教育行业专项优惠政策', link: 'https://example.com/policy/edu-discount-2025.pdf' },
  { id: 'p5', year: '2026', category: '产品政策', name: '信创产品替换迁移指导方案', link: 'https://example.com/policy/xinchuang-migration-2026.pdf' },
  { id: 'p6', year: '2024', category: '产品政策', name: 'WPS365 企业版产品白皮书', link: 'https://example.com/policy/wps365-enterprise-whitepaper.pdf' },
  { id: 'p7', year: '2026', category: '价格政策', name: '大客户阶梯定价管理规范', link: 'https://example.com/policy/key-account-pricing-2026.pdf' },
  { id: 'p8', year: '2025', category: '产品政策', name: '金融行业安全合规认证产品清单', link: 'https://example.com/policy/finance-compliance-products.pdf' },
];

const yearOptions = ['2028', '2027', '2026', '2025', '2024', '2023', '2022', '2021'];

const ProductPolicyManager: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyItem[]>(initialPolicies);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString());
  const [formCategory, setFormCategory] = useState<'产品政策' | '价格政策'>('产品政策');
  const [formName, setFormName] = useState('');
  const [formLink, setFormLink] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setFormYear(new Date().getFullYear().toString());
    setFormCategory('产品政策');
    setFormName('');
    setFormLink('');
    setShowModal(true);
  };

  const openEdit = (item: PolicyItem) => {
    setEditingId(item.id);
    setFormYear(item.year);
    setFormCategory(item.category);
    setFormName(item.name);
    setFormLink(item.link);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formLink.trim()) return;
    if (editingId) {
      setPolicies(prev => prev.map(p => p.id === editingId ? { ...p, year: formYear, category: formCategory, name: formName.trim(), link: formLink.trim() } : p));
    } else {
      setPolicies(prev => [{ id: `p${Date.now()}`, year: formYear, category: formCategory, name: formName.trim(), link: formLink.trim() }, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('确认删除该条政策？')) return;
    setPolicies(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto space-y-4 animate-page-enter pb-2">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">产品政策</h1>
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">年度产品政策，点击链接可直接访问</span>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-sm font-bold transition shadow-apple">
            <Plus className="w-4 h-4" /> 上传政策
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="unified-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <colgroup>
              <col style={{ width: 60 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 140 }} />
              <col style={{ minWidth: 200 }} />
              <col style={{ minWidth: 180 }} />
              <col style={{ width: 110 }} />
            </colgroup>
            <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E]">
              <tr>
                <th className="pl-6 pr-2 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">#</th>
                <th className="px-4 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">所属年份</th>
                <th className="px-4 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">政策分类</th>
                <th className="px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">文档名称</th>
                <th className="px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">文档链接</th>
                <th className="px-4 py-2.5 pr-6 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E] text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {policies.map((item, idx) => (
                <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0">
                  <td className="pl-6 pr-2 py-2.5 text-gray-400 dark:text-gray-500 font-mono text-xs tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {item.year}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {item.category === '产品政策' ? (
                      <span className="unified-tag-blue">{item.category}</span>
                    ) : (
                      <span className="unified-tag-orange">{item.category}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-gray-900 dark:text-white break-words" title={item.name}>{item.name}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#0071E3] dark:text-[#0A84FF] hover:underline break-all"
                      title={item.link}
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.link}</span>
                    </a>
                  </td>
                  <td className="px-4 py-2.5 pr-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition" title="编辑">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition" title="删除">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-16 text-center text-gray-400 dark:text-gray-500 text-sm">暂无产品政策数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>共 {policies.length} 条</span>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[500] animate-fade-in" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-[501] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-[480px] max-w-full animate-fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {editingId ? '编辑政策文件' : '上传政策文件'}
                </h4>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> 所属年份</label>
                  <select value={formYear} onChange={e => setFormYear(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition">
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1"><Tag className="w-3 h-3" /> 政策分类</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value as '产品政策' | '价格政策')} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition">
                    <option value="产品政策">产品政策</option>
                    <option value="价格政策">价格政策</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1"><FileText className="w-3 h-3" /> 文档名称</label>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="请输入政策文档名称" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3" /> 文档链接</label>
                  <input type="url" value={formLink} onChange={e => setFormLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition">取消</button>
                <button onClick={handleSubmit} disabled={!formName.trim() || !formLink.trim()} className="px-6 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-sm font-bold transition shadow-apple disabled:opacity-50 disabled:cursor-not-allowed">
                  确认提交
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default ProductPolicyManager;
