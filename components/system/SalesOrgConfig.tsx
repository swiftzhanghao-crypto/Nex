
import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Building2, AlertCircle } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import Pagination from '../common/Pagination';
import { useAppContext } from '../../contexts/AppContext';
import type { SalesOrg } from '../../types';

const ORG_TYPES: SalesOrg['orgType'][] = ['金山', '数科'];

const SalesOrgConfig: React.FC = () => {
  const { salesOrganizations: orgs, setSalesOrganizations: setOrgs } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<SalesOrg | null>(null);
  const [editForm, setEditForm] = useState<SalesOrg | null>(null);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return orgs.filter(o => {
      if (q && !o.name.toLowerCase().includes(q) && !o.shortName.toLowerCase().includes(q) && !String(o.no).includes(q) && !o.financeCode.includes(q)) return false;
      if (filterType && o.orgType !== filterType) return false;
      if (filterStatus && o.status !== filterStatus) return false;
      return true;
    });
  }, [orgs, searchTerm, filterType, filterStatus]);

  const pagedData = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const pendingCount = orgs.filter(o => o.status === '待补充').length;

  const openDetail = (org: SalesOrg) => { setSelectedOrg(org); setShowDetailModal(true); };
  const openEdit = (org: SalesOrg) => { setEditForm(JSON.parse(JSON.stringify(org))); setShowEditModal(true); };

  const saveEdit = () => {
    if (!editForm) return;
    const isComplete = editForm.shortName.trim() && editForm.financeCode.trim();
    const updated: SalesOrg = { ...editForm, status: isComplete ? '正常' : '待补充' };
    setOrgs(prev => prev.map(o => o.id === updated.id ? updated : o));
    setShowEditModal(false);
    setEditForm(null);
    showToast('已保存');
  };

  return (
    <div className="page-container animate-page-enter">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500"/>销售组织配置
          </h1>
          <p className="text-xs text-gray-400 mt-1">管理全部销售组织信息，包括公司编码、简称等</p>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5"/>
            {pendingCount} 个组织待补充信息
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input
            type="text"
            placeholder="搜索组织名称、简称、编号..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-200 outline-none"
        >
          <option value="">全部类型</option>
          {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-[#1C1C1E] text-gray-700 dark:text-gray-200 outline-none"
        >
          <option value="">全部状态</option>
          <option value="正常">正常</option>
          <option value="待补充">待补充</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-black/20 text-xs text-gray-400 font-semibold">
              <th className="px-4 py-2.5 text-left w-[10%]">销售组织编号</th>
              <th className="px-4 py-2.5 text-left w-[26%]">销售组织名称</th>
              <th className="px-4 py-2.5 text-left w-[14%]">销售组织简称</th>
              <th className="px-4 py-2.5 text-center w-[14%]">公司编码(财务系统)</th>
              <th className="px-4 py-2.5 text-center w-[12%]">销售组织类型</th>
              <th className="px-4 py-2.5 text-center w-[10%]">状态</th>
              <th className="px-4 py-2.5 text-right w-[14%] pr-6">操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 && (
              <tr><td colSpan={7} className="py-16 text-center text-gray-400 text-sm">暂无匹配的销售组织</td></tr>
            )}
            {pagedData.map(org => (
              <tr key={org.id} className="border-t border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {org.status === '待补充' && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"/>}
                    <span className="text-[13px] text-gray-700 dark:text-gray-300 font-mono">{org.no}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-800 dark:text-gray-200">{org.name}</td>
                <td className="px-4 py-3 text-[13px] text-gray-700 dark:text-gray-300">{org.shortName || <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                <td className="px-4 py-3 text-center text-[13px] text-gray-700 dark:text-gray-300 font-mono">{org.financeCode || <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                <td className="px-4 py-3 text-center text-[13px] text-gray-700 dark:text-gray-300">{org.orgType}</td>
                <td className="px-4 py-3 text-center">
                  {org.status === '正常' ? (
                    <span className="text-[13px] text-gray-600 dark:text-gray-400">正常</span>
                  ) : (
                    <span className="text-[13px] text-amber-600 dark:text-amber-400 font-medium">待补充</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right pr-6">
                  {org.status === '正常' ? (
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openDetail(org)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">详情</button>
                      <button onClick={() => openEdit(org)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">编辑</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(org)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">去补充</button>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500"/>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <Pagination
            page={page}
            size={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onSizeChange={s => { setPageSize(s); setPage(1); }}
          />
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrg && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 w-[480px] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">销售组织详情</h3>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-4">
                {([
                  ['销售组织编号', String(selectedOrg.no)],
                  ['销售组织名称', selectedOrg.name],
                  ['销售组织简称', selectedOrg.shortName || '-'],
                  ['公司编码(财务系统)', selectedOrg.financeCode || '-'],
                  ['销售组织类型', selectedOrg.orgType],
                  ['状态', selectedOrg.status],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex items-start gap-4">
                    <span className="text-xs text-gray-400 w-32 shrink-0 pt-0.5 text-right">{label}</span>
                    <span className={`text-sm font-medium ${value === '待补充' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">关闭</button>
                <button onClick={() => { setShowDetailModal(false); openEdit(selectedOrg); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">编辑</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Edit Modal */}
      {showEditModal && editForm && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setShowEditModal(false); setEditForm(null); }}>
            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 w-[520px] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {editForm.status === '待补充' ? '补充组织信息' : '编辑销售组织'}
                </h3>
                <button onClick={() => { setShowEditModal(false); setEditForm(null); }} className="text-gray-400 hover:text-gray-600 transition"><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">销售组织编号</label>
                  <input disabled value={editForm.no} className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-gray-50 dark:bg-black/20 text-gray-500 dark:text-gray-400"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">销售组织名称</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-transparent text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                    销售组织简称
                    {!editForm.shortName.trim() && <span className="text-red-500 ml-1">*必填</span>}
                  </label>
                  <input
                    value={editForm.shortName}
                    onChange={e => setEditForm({ ...editForm, shortName: e.target.value })}
                    placeholder="请输入简称"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-transparent text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                    公司编码(财务系统)
                    {!editForm.financeCode.trim() && <span className="text-red-500 ml-1">*必填</span>}
                  </label>
                  <input
                    value={editForm.financeCode}
                    onChange={e => setEditForm({ ...editForm, financeCode: e.target.value })}
                    placeholder="请输入财务系统编码"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-transparent text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">销售组织类型</label>
                  <select
                    value={editForm.orgType}
                    onChange={e => setEditForm({ ...editForm, orgType: e.target.value as SalesOrg['orgType'] })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-transparent text-gray-800 dark:text-white outline-none"
                  >
                    {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => { setShowEditModal(false); setEditForm(null); }} className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">取消</button>
                <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">确定</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {toast && <div className="fixed bottom-7 right-7 bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm shadow-lg animate-fade-in z-50">{toast}</div>}
    </div>
  );
};

export default SalesOrgConfig;
