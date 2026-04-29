
import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Building2, AlertCircle } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import Pagination from '../common/Pagination';

interface SalesOrg {
  id: string;
  no: number;
  name: string;
  shortName: string;
  financeCode: string;
  orgType: '金山' | '数科';
  status: '正常' | '待补充';
}

const initialData: SalesOrg[] = [
  { id: 'so-43', no: 43, name: '苏州金山办公软件有限公司', shortName: '苏州金山', financeCode: '8795', orgType: '金山', status: '正常' },
  { id: 'so-42', no: 42, name: '贵州金山办公软件有限公司', shortName: '贵州金山', financeCode: '8792', orgType: '金山', status: '正常' },
  { id: 'so-37', no: 37, name: '陕西数科网维技术有限公司', shortName: '陕西数科', financeCode: '1014', orgType: '数科', status: '正常' },
  { id: 'so-38', no: 38, name: '山西数科网维技术有限公司', shortName: '', financeCode: '', orgType: '数科', status: '待补充' },
  { id: 'so-39', no: 39, name: '贵州数科网维技术有限公司', shortName: '贵州数科', financeCode: '8812', orgType: '数科', status: '正常' },
  { id: 'so-40', no: 40, name: '泸州金山办公数科网维技术有限公司', shortName: '泸州数科', financeCode: '8806', orgType: '数科', status: '正常' },
  { id: 'so-41', no: 41, name: '山东数科信创技术有限责任公司', shortName: '山东数科信创', financeCode: '2000', orgType: '数科', status: '正常' },
  { id: 'so-23', no: 23, name: '北京数科网维技术有限责任公司', shortName: '北京数科', financeCode: '8800', orgType: '数科', status: '正常' },
  { id: 'so-24', no: 24, name: '数科网维（上海）信息技术有限公司', shortName: '', financeCode: '', orgType: '数科', status: '待补充' },
  { id: 'so-25', no: 25, name: '广州数科网维技术有限公司', shortName: '广州数科', financeCode: '8805', orgType: '数科', status: '正常' },
  { id: 'so-26', no: 26, name: '深圳数科信创技术有限责任公司', shortName: '深圳数科', financeCode: '1003', orgType: '数科', status: '正常' },
  { id: 'so-27', no: 27, name: '天津数科网维技术有限公司', shortName: '天津数科', financeCode: '1004', orgType: '数科', status: '正常' },
  { id: 'so-28', no: 28, name: '湖南数科信创信息技术服务有限公司', shortName: '', financeCode: '', orgType: '数科', status: '待补充' },
  { id: 'so-29', no: 29, name: '湖北数科网维技术有限公司', shortName: '湖北数科', financeCode: '8804', orgType: '数科', status: '正常' },
  { id: 'so-30', no: 30, name: '河南数科网维科技有限公司', shortName: '', financeCode: '', orgType: '数科', status: '待补充' },
  { id: 'so-31', no: 31, name: '江西数科网维信息技术服务有限公司', shortName: '江西数科', financeCode: '8803', orgType: '数科', status: '正常' },
  { id: 'so-32', no: 32, name: '南昌数科网维技术有限公司', shortName: '南昌数科', financeCode: '8813', orgType: '数科', status: '正常' },
  { id: 'so-33', no: 33, name: '珠海金山办公软件有限公司', shortName: '珠海金山', financeCode: '8001', orgType: '金山', status: '正常' },
  { id: 'so-34', no: 34, name: '北京金山办公软件股份有限公司', shortName: '北京金山', financeCode: '8002', orgType: '金山', status: '正常' },
  { id: 'so-35', no: 35, name: '成都金山办公软件有限公司', shortName: '成都金山', financeCode: '8790', orgType: '金山', status: '正常' },
  { id: 'so-1', no: 1, name: '武汉金山办公软件有限公司', shortName: '武汉金山', financeCode: '8003', orgType: '金山', status: '正常' },
  { id: 'so-2', no: 2, name: '长沙金山办公软件有限公司', shortName: '长沙金山', financeCode: '8004', orgType: '金山', status: '正常' },
  { id: 'so-3', no: 3, name: '福建数科网维技术有限公司', shortName: '福建数科', financeCode: '8810', orgType: '数科', status: '正常' },
  { id: 'so-4', no: 4, name: '安徽数科网维技术有限公司', shortName: '安徽数科', financeCode: '8811', orgType: '数科', status: '正常' },
  { id: 'so-5', no: 5, name: '四川数科网维技术有限公司', shortName: '四川数科', financeCode: '8815', orgType: '数科', status: '正常' },
  { id: 'so-6', no: 6, name: '重庆数科网维技术有限公司', shortName: '重庆数科', financeCode: '8816', orgType: '数科', status: '正常' },
  { id: 'so-7', no: 7, name: '云南数科网维技术有限公司', shortName: '', financeCode: '', orgType: '数科', status: '待补充' },
  { id: 'so-8', no: 8, name: '辽宁数科网维技术有限公司', shortName: '辽宁数科', financeCode: '8818', orgType: '数科', status: '正常' },
  { id: 'so-9', no: 9, name: '吉林数科网维技术有限公司', shortName: '吉林数科', financeCode: '8819', orgType: '数科', status: '正常' },
  { id: 'so-10', no: 10, name: '黑龙江数科网维技术有限公司', shortName: '黑龙江数科', financeCode: '8820', orgType: '数科', status: '正常' },
  { id: 'so-11', no: 11, name: '甘肃数科网维技术有限公司', shortName: '', financeCode: '', orgType: '数科', status: '待补充' },
  { id: 'so-12', no: 12, name: '海南数科网维技术有限公司', shortName: '海南数科', financeCode: '8822', orgType: '数科', status: '正常' },
  { id: 'so-13', no: 13, name: '内蒙古数科网维技术有限公司', shortName: '内蒙古数科', financeCode: '8823', orgType: '数科', status: '正常' },
  { id: 'so-14', no: 14, name: '浙江数科网维技术有限公司', shortName: '浙江数科', financeCode: '8824', orgType: '数科', status: '正常' },
  { id: 'so-15', no: 15, name: '上海金山办公软件有限公司', shortName: '上海金山', financeCode: '8005', orgType: '金山', status: '正常' },
  { id: 'so-16', no: 16, name: '西安金山办公软件有限公司', shortName: '西安金山', financeCode: '8006', orgType: '金山', status: '正常' },
  { id: 'so-17', no: 17, name: '新疆数科网维技术有限公司', shortName: '', financeCode: '', orgType: '数科', status: '待补充' },
  { id: 'so-18', no: 18, name: '广西数科网维技术有限公司', shortName: '广西数科', financeCode: '8826', orgType: '数科', status: '正常' },
  { id: 'so-19', no: 19, name: '宁夏数科网维技术有限公司', shortName: '宁夏数科', financeCode: '8827', orgType: '数科', status: '正常' },
  { id: 'so-20', no: 20, name: '青海数科网维技术有限公司', shortName: '青海数科', financeCode: '8828', orgType: '数科', status: '正常' },
  { id: 'so-21', no: 21, name: '西藏数科网维技术有限公司', shortName: '', financeCode: '', orgType: '数科', status: '待补充' },
  { id: 'so-22', no: 22, name: '河北数科网维技术有限公司', shortName: '河北数科', financeCode: '8830', orgType: '数科', status: '正常' },
];

const ORG_TYPES: SalesOrg['orgType'][] = ['金山', '数科'];

const SalesOrgConfig: React.FC = () => {
  const [orgs, setOrgs] = useState<SalesOrg[]>(initialData);
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
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter">
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
