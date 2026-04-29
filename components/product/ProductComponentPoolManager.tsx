import React, { useState, useMemo, useCallback } from 'react';
import { Search, Filter, X, Plus, Copy, Pencil, Ban, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import type { AtomicCapability, ComponentNature, CapabilityType } from '../../types';
import ModalPortal from '../common/ModalPortal';
import Pagination from '../common/Pagination';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const NATURE_COLORS: Record<ComponentNature, string> = {
  '自有': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  '第三方采购': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  '第三方授权': 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const TYPE_LABELS: Record<CapabilityType, string> = {
  Component: '组件', Feature: '功能', Service: '服务',
};

const ProductComponentPoolManager: React.FC = () => {
  const { atomicCapabilities, setAtomicCapabilities } = useAppContext();

  const [searchText, setSearchText] = useState('');
  const [filterNature, setFilterNature] = useState<ComponentNature | ''>('');
  const [filterType, setFilterType] = useState<CapabilityType | ''>('');
  const [filterEnabled, setFilterEnabled] = useState<'' | 'enabled' | 'disabled'>('');
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<AtomicCapability | null>(null);
  const [editForm, setEditForm] = useState({ name: '', version: '', nature: '自有' as ComponentNature, type: 'Component' as CapabilityType, generateSerial: false, description: '' });

  const [toast, setToast] = useState('');
  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); }, []);

  const [sortAsc, setSortAsc] = useState(true);
  const sorted = useMemo(() =>
    [...atomicCapabilities].sort((a, b) => sortAsc ? (a.componentNo ?? 0) - (b.componentNo ?? 0) : (b.componentNo ?? 0) - (a.componentNo ?? 0)),
    [atomicCapabilities, sortAsc]
  );

  const filtered = useMemo(() => {
    return sorted.filter(c => {
      if (searchText && !c.name.toLowerCase().includes(searchText.toLowerCase()) && !String(c.componentNo ?? '').includes(searchText)) return false;
      if (filterNature && c.nature !== filterNature) return false;
      if (filterType && c.type !== filterType) return false;
      if (filterEnabled === 'enabled' && c.enabled !== true) return false;
      if (filterEnabled === 'disabled' && c.enabled !== false) return false;
      return true;
    });
  }, [sorted, searchText, filterNature, filterType, filterEnabled]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const pagedData = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeFilterCount = [filterNature, filterType, filterEnabled].filter(Boolean).length;

  const openAdd = () => {
    setEditItem(null);
    const maxNo = atomicCapabilities.reduce((m, c) => Math.max(m, c.componentNo ?? 0), 0);
    setEditForm({ name: '', version: '', nature: '自有', type: 'Component', generateSerial: false, description: '' });
    setEditModalOpen(true);
  };

  const openEdit = (item: AtomicCapability) => {
    setEditItem(item);
    setEditForm({
      name: item.name,
      version: item.version ?? '',
      nature: item.nature ?? '自有',
      type: item.type,
      generateSerial: item.generateSerial ?? false,
      description: item.description ?? '',
    });
    setEditModalOpen(true);
  };

  const handleSave = () => {
    if (!editForm.name.trim()) return;
    if (editItem) {
      setAtomicCapabilities(prev => prev.map(c =>
        c.id === editItem.id ? { ...c, name: editForm.name, version: editForm.version || '-', nature: editForm.nature, type: editForm.type, generateSerial: editForm.generateSerial, description: editForm.description } : c
      ));
      showToast('组件已更新');
    } else {
      const maxNo = atomicCapabilities.reduce((m, c) => Math.max(m, c.componentNo ?? 0), 0);
      const maxIdNum = atomicCapabilities.reduce((m, c) => { const n = parseInt(c.id.replace('AC', '')); return n > m ? n : m; }, 0);
      const newItem: AtomicCapability = {
        id: `AC${String(maxIdNum + 1).padStart(3, '0')}`,
        name: editForm.name,
        type: editForm.type,
        description: editForm.description,
        componentNo: maxNo + 1,
        version: editForm.version || '-',
        nature: editForm.nature,
        generateSerial: editForm.generateSerial,
        referencedByProduct: false,
        enabled: true,
      };
      setAtomicCapabilities(prev => [...prev, newItem]);
      showToast('组件已新增');
    }
    setEditModalOpen(false);
  };

  const handleToggleEnabled = (id: string) => {
    setAtomicCapabilities(prev => prev.map(c =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
    const target = atomicCapabilities.find(c => c.id === id);
    showToast(target?.enabled ? '已停用' : '已启用');
  };

  const handleCopy = (item: AtomicCapability) => {
    const maxNo = atomicCapabilities.reduce((m, c) => Math.max(m, c.componentNo ?? 0), 0);
    const maxIdNum = atomicCapabilities.reduce((m, c) => { const n = parseInt(c.id.replace('AC', '')); return n > m ? n : m; }, 0);
    const copied: AtomicCapability = {
      ...item,
      id: `AC${String(maxIdNum + 1).padStart(3, '0')}`,
      componentNo: maxNo + 1,
      name: `${item.name}（副本）`,
      referencedByProduct: false,
    };
    setAtomicCapabilities(prev => [...prev, copied]);
    showToast('已复制');
  };

  const clearFilters = () => {
    setFilterNature('');
    setFilterType('');
    setFilterEnabled('');
  };

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">组件池</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理产品组件清单，共 {atomicCapabilities.length} 个组件</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> 新增组件
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchText} onChange={e => { setSearchText(e.target.value); setPage(1); }} placeholder="搜索组件名称或编号…" className="w-full pl-9 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          {searchText && <button onClick={() => { setSearchText(''); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${activeFilterCount > 0 ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
          <Filter className="w-4 h-4" /> 筛选{activeFilterCount > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded-full">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-lg flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">组件性质</label>
            <select value={filterNature} onChange={e => { setFilterNature(e.target.value as ComponentNature | ''); setPage(1); }} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2C2C2E] text-sm text-gray-900 dark:text-white">
              <option value="">全部</option>
              <option value="自有">自有</option>
              <option value="第三方采购">第三方采购</option>
              <option value="第三方授权">第三方授权</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">组件类型</label>
            <select value={filterType} onChange={e => { setFilterType(e.target.value as CapabilityType | ''); setPage(1); }} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2C2C2E] text-sm text-gray-900 dark:text-white">
              <option value="">全部</option>
              <option value="Component">组件</option>
              <option value="Feature">功能</option>
              <option value="Service">服务</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">状态</label>
            <select value={filterEnabled} onChange={e => { setFilterEnabled(e.target.value as '' | 'enabled' | 'disabled'); setPage(1); }} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2C2C2E] text-sm text-gray-900 dark:text-white">
              <option value="">全部</option>
              <option value="enabled">已启用</option>
              <option value="disabled">已停用</option>
            </select>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">清除筛选</button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap cursor-pointer select-none hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => setSortAsc(!sortAsc)}>
                  <span className="inline-flex items-center gap-1">组件编号 <span className="text-[10px]">{sortAsc ? '↑' : '↓'}</span></span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">组件名称</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">主版本号</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">组件性质</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">是否生成序列号</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">是否被产品引用</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">状态</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400 dark:text-gray-500">暂无数据</td></tr>
              ) : pagedData.map(c => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-150">
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-mono">{c.componentNo ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900 dark:text-white font-medium">{c.name}</div>
                    {c.description && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-[260px] truncate">{c.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.version || '-'}</td>
                  <td className="px-4 py-3">
                    {c.nature ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${NATURE_COLORS[c.nature]}`}>{c.nature}</span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${c.generateSerial ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {c.generateSerial ? '是' : '否'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${c.referencedByProduct ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {c.referencedByProduct ? '是' : '否'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.enabled !== false ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.enabled !== false ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                      {c.enabled !== false ? '已启用' : '已停用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openEdit(c)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium transition-colors">编辑</button>
                      <button onClick={() => handleToggleEnabled(c.id)} className={`text-xs font-medium transition-colors ${c.enabled !== false ? 'text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300' : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'}`}>
                        {c.enabled !== false ? '停用' : '启用'}
                      </button>
                      <button onClick={() => handleCopy(c)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-medium transition-colors">复制</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={safePage}
          size={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onSizeChange={s => { setPageSize(s); setPage(1); }}
          sizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>

      {/* Edit/Add Modal */}
      {editModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4" onClick={() => setEditModalOpen(false)}>
            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{editItem ? '编辑组件' : '新增组件'}</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">组件名称 <span className="text-red-500">*</span></label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="请输入组件名称" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">主版本号</label>
                    <input value={editForm.version} onChange={e => setEditForm(f => ({ ...f, version: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="如 V7、SA" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">组件类型</label>
                    <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value as CapabilityType }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white">
                      <option value="Component">组件</option>
                      <option value="Feature">功能</option>
                      <option value="Service">服务</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">组件性质</label>
                    <select value={editForm.nature} onChange={e => setEditForm(f => ({ ...f, nature: e.target.value as ComponentNature }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white">
                      <option value="自有">自有</option>
                      <option value="第三方采购">第三方采购</option>
                      <option value="第三方授权">第三方授权</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm.generateSerial} onChange={e => setEditForm(f => ({ ...f, generateSerial: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">生成序列号</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">描述</label>
                  <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none" placeholder="组件描述（可选）" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">取消</button>
                <button onClick={handleSave} disabled={!editForm.name.trim()} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                  {editItem ? '保存' : '新增'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
};

export default ProductComponentPoolManager;
