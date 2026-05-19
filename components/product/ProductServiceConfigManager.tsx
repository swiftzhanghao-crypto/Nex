import React, { useState, useMemo } from 'react';
import { Plus, Search, Download, X, ArrowLeft, Trash2 } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import Pagination from '../common/Pagination';

interface ServiceConfigRow {
  id: string;
  productLine: string;
  productType: string;
  skuName: string;
  activationMethod: string;
  status: '启用' | '停用';
  productId: string;
  skuId: string;
}

interface LinkedService {
  id: string;
  orderNature: string;
  requiredCategory: string;
  serviceLine: string;
  serviceType: string;
  serviceSpec: string;
  detailStatus: '启用' | '禁用';
  ruleCondition: string;
  ruleOperator: string;
  ruleValue: string;
  ruleValueEnd: string;
}

interface ServiceConfigForm {
  productLine: string;
  productType: string;
  skuName: string;
  activationMethod: string;
  status: '启用' | '停用';
  linkedServices: LinkedService[];
}

const ACTIVATION_METHODS = ['账号授权', '序列号', '在线激活', '加密锁', '账号+序列号'];
const ORDER_NATURES = ['新购', '增购', '续费', '升级'];
const REQUIRED_CATEGORIES = ['必选服务', '可选服务', '增值服务'];
const RULE_CONDITIONS = ['产品明细金额小计/授权或服务年限', '订单金额', '授权数量'];
const RULE_OPERATORS = ['小于', '大于', '大于等于', '小于等于', '等于', '介于'];

function createEmptyLinkedService(): LinkedService {
  return {
    id: `ls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    orderNature: '',
    requiredCategory: '',
    serviceLine: '',
    serviceType: '',
    serviceSpec: '',
    detailStatus: '启用',
    ruleCondition: '',
    ruleOperator: '',
    ruleValue: '',
    ruleValueEnd: '',
  };
}

const ProductServiceConfigManager: React.FC = () => {
  const { filteredProducts: products } = useAppContext();

  const [filterLine, setFilterLine] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSku, setFilterSku] = useState('');
  const [filterActivation, setFilterActivation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const itemsPerPage = 100;

  type ViewMode = 'list' | 'detail' | 'edit' | 'create';
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeRow, setActiveRow] = useState<ServiceConfigRow | null>(null);
  const [form, setForm] = useState<ServiceConfigForm>({ productLine: '', productType: '', skuName: '', activationMethod: '', status: '启用', linkedServices: [] });
  const [localRows, setLocalRows] = useState<ServiceConfigRow[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [linkedServiceSelected, setLinkedServiceSelected] = useState<Set<string>>(new Set());

  const baseRows: ServiceConfigRow[] = useMemo(() => {
    const rows: ServiceConfigRow[] = [];
    products.forEach(p => {
      const line = p.productLine || p.category || '未分类';
      const type = p.productType || p.subCategory || '未分类';
      if (p.skus && p.skus.length > 0) {
        p.skus.forEach(sku => {
          rows.push({
            id: `${p.id}__${sku.id}`,
            productLine: line,
            productType: type,
            skuName: sku.name,
            activationMethod: '-',
            status: sku.status === 'Active' ? '启用' : '停用',
            productId: p.id,
            skuId: sku.id,
          });
        });
      } else {
        rows.push({
          id: p.id,
          productLine: line,
          productType: type,
          skuName: '-',
          activationMethod: '-',
          status: p.status === 'OnShelf' ? '启用' : '停用',
          productId: p.id,
          skuId: '',
        });
      }
    });
    return rows;
  }, [products]);

  if (!initialized && baseRows.length > 0) {
    setLocalRows(baseRows);
    setInitialized(true);
  }

  const allRows = localRows.length > 0 ? localRows : baseRows;

  const productLines = useMemo(() => Array.from(new Set(allRows.map(r => r.productLine))).sort((a, b) => a.localeCompare(b, 'zh-Hans')), [allRows]);
  const productTypes = useMemo(() => {
    if (!filterLine) return Array.from(new Set(allRows.map(r => r.productType))).sort((a, b) => a.localeCompare(b, 'zh-Hans'));
    return Array.from(new Set(allRows.filter(r => r.productLine === filterLine).map(r => r.productType))).sort((a, b) => a.localeCompare(b, 'zh-Hans'));
  }, [allRows, filterLine]);

  const filtered = useMemo(() => {
    return allRows.filter(r => {
      if (filterLine && r.productLine !== filterLine) return false;
      if (filterType && r.productType !== filterType) return false;
      if (filterSku && !r.skuName.toLowerCase().includes(filterSku.toLowerCase())) return false;
      if (filterActivation && r.activationMethod !== filterActivation) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [allRows, filterLine, filterType, filterSku, filterActivation, filterStatus]);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearFilters = () => {
    setFilterLine(''); setFilterType(''); setFilterSku(''); setFilterActivation(''); setFilterStatus('');
    setCurrentPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    setSelectedIds(paginated.length > 0 && selectedIds.size === paginated.length ? new Set() : new Set(paginated.map(r => r.id)));
  };

  const openDetail = (row: ServiceConfigRow) => { setActiveRow(row); setViewMode('detail'); };
  const openEdit = (row: ServiceConfigRow) => {
    setActiveRow(row);
    setForm({
      productLine: row.productLine,
      productType: row.productType,
      skuName: row.skuName,
      activationMethod: row.activationMethod,
      status: row.status,
      linkedServices: generateMockLinkedServices(row),
    });
    setLinkedServiceSelected(new Set());
    setViewMode('edit');
  };
  const openCreate = () => {
    setActiveRow(null);
    setForm({ productLine: '', productType: '', skuName: '', activationMethod: '', status: '启用', linkedServices: [] });
    setLinkedServiceSelected(new Set());
    setViewMode('create');
  };
  const openCopy = (row: ServiceConfigRow) => {
    setActiveRow(null);
    setForm({
      productLine: row.productLine,
      productType: row.productType,
      skuName: row.skuName + ' (副本)',
      activationMethod: row.activationMethod,
      status: row.status,
      linkedServices: generateMockLinkedServices(row).map(ls => ({ ...ls, id: `ls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` })),
    });
    setLinkedServiceSelected(new Set());
    setViewMode('create');
  };
  const backToList = () => { setViewMode('list'); setActiveRow(null); };

  const handleSave = () => {
    if (viewMode === 'edit' && activeRow) {
      setLocalRows(prev => prev.map(r => r.id === activeRow.id ? { ...r, productLine: form.productLine, productType: form.productType, skuName: form.skuName, activationMethod: form.activationMethod, status: form.status } : r));
    } else if (viewMode === 'create') {
      const newRow: ServiceConfigRow = {
        id: `new_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        productLine: form.productLine,
        productType: form.productType,
        skuName: form.skuName,
        activationMethod: form.activationMethod,
        status: form.status,
        productId: '',
        skuId: '',
      };
      setLocalRows(prev => [newRow, ...prev]);
    }
    backToList();
  };

  const handleDelete = (row: ServiceConfigRow) => {
    if (!confirm(`确定删除该配置项？\n${row.productLine} / ${row.productType} / ${row.skuName}`)) return;
    setLocalRows(prev => prev.filter(r => r.id !== row.id));
  };

  const handleBatchStatus = (status: '启用' | '停用') => {
    if (selectedIds.size === 0) return;
    setLocalRows(prev => prev.map(r => selectedIds.has(r.id) ? { ...r, status } : r));
    setSelectedIds(new Set());
  };

  const updateFormField = <K extends keyof ServiceConfigForm>(key: K, value: ServiceConfigForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addLinkedService = () => {
    setForm(prev => ({ ...prev, linkedServices: [...prev.linkedServices, createEmptyLinkedService()] }));
  };

  const updateLinkedService = (id: string, field: keyof LinkedService, value: string) => {
    setForm(prev => ({
      ...prev,
      linkedServices: prev.linkedServices.map(ls => ls.id === id ? { ...ls, [field]: value } : ls),
    }));
  };

  const deleteLinkedServices = (ids: Set<string>) => {
    setForm(prev => ({ ...prev, linkedServices: prev.linkedServices.filter(ls => !ids.has(ls.id)) }));
    setLinkedServiceSelected(new Set());
  };

  const copyLinkedServices = (ids: Set<string>) => {
    const toCopy = form.linkedServices.filter(ls => ids.has(ls.id));
    const copies = toCopy.map(ls => ({ ...ls, id: `ls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }));
    setForm(prev => ({ ...prev, linkedServices: [...prev.linkedServices, ...copies] }));
    setLinkedServiceSelected(new Set());
  };

  // ── 列表视图 ──
  if (viewMode === 'list') {
    return (
      <div className="p-3 lg:p-4 max-w-[2400px] w-full mx-auto h-full flex flex-col gap-3 min-w-0 overflow-hidden animate-page-enter">
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">产品服务配置</h1>
          <button onClick={openCreate} className="h-8 px-4 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-sm font-semibold hover:bg-blue-600 dark:hover:bg-blue-500 active:bg-blue-700 transition shadow-apple flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> 新增
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] p-4 shrink-0 shadow-apple">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <FilterSelect label="产品条线" value={filterLine} onChange={v => { setFilterLine(v); setFilterType(''); }} options={productLines} />
            <FilterSelect label="产品类型" value={filterType} onChange={setFilterType} options={productTypes} disabled={!filterLine} />
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">产品规格</label>
              <input type="text" value={filterSku} onChange={e => setFilterSku(e.target.value)} placeholder="请输入" className="w-full h-8 px-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 transition placeholder:text-gray-400" />
            </div>
            <FilterSelect label="授权方式" value={filterActivation} onChange={setFilterActivation} options={ACTIVATION_METHODS} />
            <FilterSelect label="状态" value={filterStatus} onChange={setFilterStatus} options={['启用', '停用']} />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => setCurrentPage(1)} className="h-8 px-4 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-xs font-semibold hover:bg-blue-600 dark:hover:bg-blue-500 transition shadow-apple flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> 查询
            </button>
            <button onClick={clearFilters} className="h-8 px-4 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">清空</button>
          </div>
        </div>

        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => handleBatchStatus('启用')} className="h-7 px-3 rounded-md bg-[#0071E3] dark:bg-[#0A84FF] text-white text-xs font-medium hover:bg-blue-600 transition disabled:opacity-40" disabled={selectedIds.size === 0}>批量启用</button>
            <button onClick={() => handleBatchStatus('停用')} className="h-7 px-3 rounded-md bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition disabled:opacity-40" disabled={selectedIds.size === 0}>批量禁用</button>
            {selectedIds.size > 0 && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">已选 {selectedIds.size} 项</span>}
          </div>
          <button className="h-7 px-3 rounded-md border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-1">
            <Download className="w-3 h-3" /> 导出
          </button>
        </div>

        <div className="flex-1 min-h-0 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-apple overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-gray-50 dark:bg-[#2C2C2E] sticky top-0 z-10">
                <tr>
                  <th className="pl-4 pr-2 py-3 w-10 border-b border-gray-200/50 dark:border-white/10">
                    <input type="checkbox" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded border-gray-300" />
                  </th>
                  {['序号', '产品条线', '产品类型', '产品规格', '授权方式', '状态', '操作'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                {paginated.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="pl-4 pr-2 py-2.5">
                      <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} className="w-3.5 h-3.5 rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 font-mono text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-white font-medium whitespace-nowrap">{row.productLine}</td>
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.productType}</td>
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.skuName}</td>
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.activationMethod}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`text-xs font-medium ${row.status === '启用' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>{row.status}</span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openDetail(row)} className="text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline">详情</button>
                        <button onClick={() => openEdit(row)} className="text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline">编辑</button>
                        <button onClick={() => handleDelete(row)} className="text-xs font-medium text-red-500 hover:underline">删除</button>
                        <button onClick={() => openCopy(row)} className="text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline">复制</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={8} className="p-12 text-center text-gray-400 dark:text-gray-500">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 dark:border-white/10 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">共 {filtered.length} 条</span>
            <Pagination page={currentPage} size={itemsPerPage} total={filtered.length} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>
    );
  }

  // ── 详情视图 ──
  if (viewMode === 'detail' && activeRow) {
    const mockServices = generateMockLinkedServices(activeRow);
    return (
      <div className="p-3 lg:p-4 max-w-[2400px] w-full mx-auto h-full flex flex-col gap-4 min-w-0 overflow-hidden animate-page-enter">
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={backToList} className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">产品服务详情</h1>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 custom-scrollbar">
          {/* 基础信息 */}
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-apple overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">基础信息</h2>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoField label="产品条线" value={activeRow.productLine} />
              <InfoField label="产品类型" value={activeRow.productType} />
              <InfoField label="产品规格" value={activeRow.skuName} />
              <InfoField label="授权方式" value={activeRow.activationMethod} />
            </div>
          </div>

          {/* 关联服务 */}
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-apple overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">关联服务</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-[#2C2C2E]">
                  <tr>
                    {['#', '订购性质', '是否必选分类', '产品条线', '产品类型', '产品规格', '明细状态', '产品规则匹配条件'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {mockServices.length > 0 ? mockServices.map((svc, idx) => (
                    <tr key={svc.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-white whitespace-nowrap">{svc.orderNature}</td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{svc.requiredCategory}</td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{svc.serviceLine}</td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{svc.serviceType}</td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{svc.serviceSpec}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`text-xs font-medium ${svc.detailStatus === '启用' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>{svc.detailStatus}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[300px] truncate">
                        {formatRuleCondition(svc)}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-400 dark:text-gray-500 text-xs">暂无关联服务</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
          <button onClick={() => openEdit(activeRow)} className="h-9 px-5 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-sm font-semibold hover:bg-blue-600 transition shadow-apple">编辑</button>
          <button onClick={backToList} className="h-9 px-5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">返回</button>
        </div>
      </div>
    );
  }

  // ── 编辑/新增视图 ──
  if (viewMode === 'edit' || viewMode === 'create') {
    return (
      <div className="p-3 lg:p-4 max-w-[2400px] w-full mx-auto h-full flex flex-col gap-4 min-w-0 overflow-hidden animate-page-enter">
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={backToList} className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{viewMode === 'edit' ? '编辑产品服务' : '新增产品服务'}</h1>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 custom-scrollbar">
          {/* 基础信息 */}
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-apple overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">基础信息</h2>
            </div>
            <div className="px-5 py-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2 mb-4 text-xs text-amber-700 dark:text-amber-300">
                请注意修改基础信息的产品，需要与服务的销售组织存在交集，否则服务的产品规格将被清空
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300"><span className="text-red-500">*</span>产品条线</label>
                  <select value={form.productLine} onChange={e => updateFormField('productLine', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 transition">
                    <option value="">请选择</option>
                    {productLines.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300"><span className="text-red-500">*</span>产品类型</label>
                  <select value={form.productType} onChange={e => updateFormField('productType', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 transition">
                    <option value="">请选择</option>
                    {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300"><span className="text-red-500">*</span>产品规格</label>
                  <input type="text" value={form.skuName} onChange={e => updateFormField('skuName', e.target.value)} placeholder="请输入" className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 transition placeholder:text-gray-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">授权方式 <span className="text-gray-400 text-[10px]">(不选代表全部)</span></label>
                  <select value={form.activationMethod} onChange={e => updateFormField('activationMethod', e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 transition">
                    <option value="">请选择</option>
                    {ACTIVATION_METHODS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 关联服务 */}
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-apple overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">关联服务</h2>
              <div className="flex items-center gap-2">
                <button onClick={addLinkedService} className="h-7 px-3 rounded-md bg-[#0071E3] dark:bg-[#0A84FF] text-white text-xs font-medium hover:bg-blue-600 transition">添加</button>
                <button onClick={() => deleteLinkedServices(linkedServiceSelected)} disabled={linkedServiceSelected.size === 0} className="h-7 px-3 rounded-md border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:opacity-40">批量删除</button>
                <button onClick={() => copyLinkedServices(linkedServiceSelected)} disabled={linkedServiceSelected.size === 0} className="h-7 px-3 rounded-md border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:opacity-40">批量复制</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-[#2C2C2E]">
                  <tr>
                    <th className="pl-4 pr-2 py-2.5 w-10 border-b border-gray-200/50 dark:border-white/10">
                      <input type="checkbox" checked={form.linkedServices.length > 0 && linkedServiceSelected.size === form.linkedServices.length} onChange={() => setLinkedServiceSelected(form.linkedServices.length > 0 && linkedServiceSelected.size === form.linkedServices.length ? new Set() : new Set(form.linkedServices.map(ls => ls.id)))} className="w-3.5 h-3.5 rounded border-gray-300" />
                    </th>
                    {['序号', '订购性质', '是否必选分类', '产品条线', '产品类型', '产品规格', '明细状态', '产品规则匹配条件'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {form.linkedServices.length > 0 ? form.linkedServices.map((svc, idx) => (
                    <tr key={svc.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                      <td className="pl-4 pr-2 py-2">
                        <input type="checkbox" checked={linkedServiceSelected.has(svc.id)} onChange={() => {
                          setLinkedServiceSelected(prev => { const n = new Set(prev); n.has(svc.id) ? n.delete(svc.id) : n.add(svc.id); return n; });
                        }} className="w-3.5 h-3.5 rounded border-gray-300" />
                      </td>
                      <td className="px-3 py-2 text-gray-500 font-mono text-xs">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <select value={svc.orderNature} onChange={e => updateLinkedService(svc.id, 'orderNature', e.target.value)} className="h-7 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-xs text-gray-900 dark:text-white outline-none focus:border-blue-400 w-20">
                          <option value="">请选择</option>
                          {ORDER_NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={svc.requiredCategory} onChange={e => updateLinkedService(svc.id, 'requiredCategory', e.target.value)} className="h-7 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-xs text-gray-900 dark:text-white outline-none focus:border-blue-400 w-24">
                          <option value="">请选择</option>
                          {REQUIRED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={svc.serviceLine} onChange={e => updateLinkedService(svc.id, 'serviceLine', e.target.value)} className="h-7 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-xs text-gray-900 dark:text-white outline-none focus:border-blue-400 w-28">
                          <option value="">请选择</option>
                          {productLines.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={svc.serviceType} onChange={e => updateLinkedService(svc.id, 'serviceType', e.target.value)} className="h-7 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-xs text-gray-900 dark:text-white outline-none focus:border-blue-400 w-36">
                          <option value="">请选择</option>
                          {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={svc.serviceSpec} onChange={e => updateLinkedService(svc.id, 'serviceSpec', e.target.value)} placeholder="请选择" className="h-7 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-xs text-gray-900 dark:text-white outline-none focus:border-blue-400 w-28 placeholder:text-gray-400" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input type="radio" name={`status_${svc.id}`} checked={svc.detailStatus === '启用'} onChange={() => updateLinkedService(svc.id, 'detailStatus', '启用')} className="w-3 h-3" />
                            <span className="text-gray-700 dark:text-gray-300">启用</span>
                          </label>
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input type="radio" name={`status_${svc.id}`} checked={svc.detailStatus === '禁用'} onChange={() => updateLinkedService(svc.id, 'detailStatus', '禁用')} className="w-3 h-3" />
                            <span className="text-gray-700 dark:text-gray-300">禁用</span>
                          </label>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <select value={svc.ruleCondition} onChange={e => updateLinkedService(svc.id, 'ruleCondition', e.target.value)} className="h-7 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-[11px] text-gray-900 dark:text-white outline-none focus:border-blue-400 w-40">
                            <option value="">请选择条件</option>
                            {RULE_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select value={svc.ruleOperator} onChange={e => updateLinkedService(svc.id, 'ruleOperator', e.target.value)} className="h-7 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-[11px] text-gray-900 dark:text-white outline-none focus:border-blue-400 w-20">
                            <option value="">运算符</option>
                            {RULE_OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                          <input type="text" value={svc.ruleValue} onChange={e => updateLinkedService(svc.id, 'ruleValue', e.target.value)} placeholder="金额" className="h-7 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-[11px] text-gray-900 dark:text-white outline-none focus:border-blue-400 w-20 placeholder:text-gray-400" />
                          {svc.ruleOperator === '介于' && (
                            <input type="text" value={svc.ruleValueEnd} onChange={e => updateLinkedService(svc.id, 'ruleValueEnd', e.target.value)} placeholder="结束金额" className="h-7 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-[11px] text-gray-900 dark:text-white outline-none focus:border-blue-400 w-20 placeholder:text-gray-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={9} className="p-8 text-center text-gray-400 dark:text-gray-500 text-xs">暂无关联服务，点击"添加"按钮新增</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
          <button onClick={handleSave} disabled={!form.productLine || !form.productType || !form.skuName} className="h-9 px-5 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-sm font-semibold hover:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-apple">
            {viewMode === 'edit' ? '保存修改' : '确认新增'}
          </button>
          <button onClick={backToList} className="h-9 px-5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">取消</button>
        </div>
      </div>
    );
  }

  return null;
};

// ── 辅助组件 ──

function FilterSelect({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className="w-full h-8 px-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed">
        <option value="">请选择</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}:</span>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{value || '-'}</p>
    </div>
  );
}

function formatRuleCondition(svc: LinkedService): string {
  if (!svc.ruleCondition) return '-';
  let s = `${svc.ruleCondition} ${svc.ruleOperator}`;
  if (svc.ruleOperator === '介于') {
    s += ` ￥${Number(svc.ruleValue).toLocaleString()} ~ ￥${Number(svc.ruleValueEnd).toLocaleString()}`;
  } else if (svc.ruleValue) {
    s += ` ￥${Number(svc.ruleValue).toLocaleString()}`;
  }
  return s;
}

function generateMockLinkedServices(row: ServiceConfigRow): LinkedService[] {
  const natures = ['新购', '增购', '续费', '升级'];
  const services: LinkedService[] = [];
  natures.forEach((nature, i) => {
    services.push({
      id: `mock_${row.id}_${i}_a`,
      orderNature: nature,
      requiredCategory: '必选服务',
      serviceLine: row.productLine,
      serviceType: `${row.productLine}必选服务包`,
      serviceSpec: `${row.skuName}A包`,
      detailStatus: '启用',
      ruleCondition: '产品明细金额小计/授权或服务年限',
      ruleOperator: '小于',
      ruleValue: '1000000',
      ruleValueEnd: '',
    });
    services.push({
      id: `mock_${row.id}_${i}_b`,
      orderNature: nature,
      requiredCategory: '必选服务',
      serviceLine: row.productLine,
      serviceType: `${row.productLine}必选服务包`,
      serviceSpec: `${row.skuName}B包`,
      detailStatus: '启用',
      ruleCondition: '产品明细金额小计/授权或服务年限',
      ruleOperator: '介于',
      ruleValue: '1000000',
      ruleValueEnd: '5000000',
    });
  });
  return services;
}

export default ProductServiceConfigManager;
