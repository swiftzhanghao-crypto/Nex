import React, { useState } from 'react';
import {
  ChevronLeft, Package, Tag, Copy, Check, ChevronRight, Layers, Box, Shield,
  Globe, FileText, Building2, Cpu, Key, Download, HardDrive, Monitor, Eye,
  Users, LayoutGrid, Handshake, FileKey
} from 'lucide-react';
import { Product } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface MobileProductDetailProps {
  productId: string;
  onBack: () => void;
}

type ViewMode = 'catalog' | 'detail';

const MobileProductDetail: React.FC<MobileProductDetailProps> = ({ productId, onBack }) => {
  const { filteredProducts: products } = useAppContext();
  const product = products.find(p => p.id === productId);
  const [copiedId, setCopiedId] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [catalogSection, setCatalogSection] = useState<'components' | 'license' | 'docs' | 'scope' | 'delivery'>('components');
  const [detailSection, setDetailSection] = useState<'info' | 'skus' | 'components' | 'packages'>('info');

  if (!product) {
    return (
      <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-black">
        <div className="shrink-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.08]">
          <div className="flex items-center px-1 h-11">
            <button onClick={onBack} className="flex items-center text-[#007AFF] px-2 py-1 active:opacity-50">
              <ChevronLeft className="w-5 h-5" /><span className="text-[17px]">返回</span>
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[15px] text-gray-400">产品不存在</p>
        </div>
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(product.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const getTagColor = (tag: string) => {
    const t = tag.toUpperCase();
    if (t.includes('IM'))   return 'bg-blue-50 text-blue-600 border-blue-100';
    if (t.includes('AI'))   return 'bg-purple-50 text-purple-600 border-purple-100';
    if (t.includes('生态')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    return 'bg-gray-50 text-gray-500 border-gray-200';
  };

  const getCompColor = (type?: string) => {
    if (type === 'Feature') return 'bg-purple-50 text-purple-600 border-purple-100';
    if (type === 'Service') return 'bg-sky-50 text-sky-600 border-sky-100';
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  const pricingOptions = product.skus?.[0]?.pricingOptions ?? [];

  /* ── Detail view: basic info fields ── */
  const infoFields: { label: string; value: string | undefined; icon: React.ReactNode }[] = [
    { label: '产品分类', value: product.category, icon: <Layers className="w-4 h-4" /> },
    { label: '子分类', value: product.subCategory, icon: <ChevronRight className="w-4 h-4" /> },
    { label: '产品类型', value: product.productType, icon: <Box className="w-4 h-4" /> },
    { label: '产品大类', value: product.productClass, icon: <Shield className="w-4 h-4" /> },
    { label: '产品系列', value: product.productSeries, icon: <Globe className="w-4 h-4" /> },
    { label: '产品线', value: product.productLine, icon: <FileText className="w-4 h-4" /> },
    { label: '销售组织', value: product.salesOrgName, icon: <Building2 className="w-4 h-4" /> },
    { label: '线上交付', value: product.onlineDelivery, icon: <Cpu className="w-4 h-4" /> },
  ].filter(f => f.value);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-black" style={{ animation: 'mobileDetailIn 0.3s ease-out' }}>
      {/* ── Navigation Bar ── */}
      <div className="shrink-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.08] z-10">
        <div className="flex items-center justify-between px-1 h-11">
          <button onClick={onBack} className="flex items-center text-[#007AFF] px-2 py-1 active:opacity-50">
            <ChevronLeft className="w-5 h-5" /><span className="text-[17px]">产品</span>
          </button>
          <span className="text-[17px] font-semibold text-gray-900 dark:text-white absolute left-1/2 -translate-x-1/2 max-w-[180px] truncate pointer-events-none">
            {viewMode === 'catalog' ? '产品目录' : '产品详情'}
          </span>
          <div className="w-16" />
        </div>

        {/* View Mode Segmented Control */}
        <div className="px-4 pb-2">
          <div className="flex bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('catalog')}
              className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-all ${
                viewMode === 'catalog'
                  ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              目录详情
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-all ${
                viewMode === 'detail'
                  ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              产品详情
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ━━ Hero Card (shared) ━━ */}
        <div className="mx-4 mt-3 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-[#007AFF]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[17px] font-bold text-gray-900 dark:text-white leading-snug">{product.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={handleCopyId} className="flex items-center gap-1 active:opacity-50">
                    <span className="text-[12px] text-gray-400 font-mono">{product.id}</span>
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-300" />}
                  </button>
                </div>
              </div>
              {product.status === 'OffShelf'
                ? <span className="shrink-0 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-gray-100 text-gray-400">已下架</span>
                : <span className="shrink-0 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-600">在架</span>}
            </div>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map(tag => (
                  <span key={tag} className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${getTagColor(tag)}`}>
                    <Tag className="w-2.5 h-2.5" />{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ━━━ CATALOG VIEW ━━━ */}
        {viewMode === 'catalog' && (
          <>
            {/* Section Tabs */}
            <div className="px-4 pt-4 pb-1">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-0 min-w-max">
                  {([
                    { id: 'components' as const, label: '组件信息' },
                    { id: 'license' as const, label: '授权类型' },
                    { id: 'docs' as const, label: '资料' },
                    { id: 'scope' as const, label: '售卖范围' },
                    { id: 'delivery' as const, label: '交付物' },
                  ]).map(s => (
                    <button
                      key={s.id}
                      onClick={() => setCatalogSection(s.id)}
                      className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full mr-2 transition-all ${
                        catalogSection === s.id
                          ? 'bg-[#007AFF] text-white shadow-sm'
                          : 'bg-white dark:bg-[#2C2C2E] text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 pt-2">

              {/* ── 组件信息 ── */}
              {catalogSection === 'components' && (
                <div className="space-y-2" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
                  {(product.composition && product.composition.length > 0 ? product.composition : [
                    { id: 'x1', name: 'WPS Office 专业版', type: 'Component' as const },
                    { id: 'x2', name: 'WPS云文档', type: 'Service' as const },
                    { id: 'x3', name: 'WPS会议', type: 'Service' as const },
                    { id: 'x4', name: 'WPS表单', type: 'Service' as const },
                  ]).map(c => (
                    <div key={c.id} className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          c.type === 'Feature' ? 'bg-purple-50' : c.type === 'Service' ? 'bg-sky-50' : 'bg-emerald-50'
                        }`}>
                          <Monitor className={`w-4 h-4 ${
                            c.type === 'Feature' ? 'text-purple-500' : c.type === 'Service' ? 'text-sky-500' : 'text-emerald-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">{c.name}</h4>
                          {c.description && <p className="text-[12px] text-gray-400 mt-0.5 line-clamp-1">{c.description}</p>}
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCompColor(c.type)}`}>
                          {c.type === 'Feature' ? '功能' : c.type === 'Service' ? '服务' : '模块'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 授权类型 ── */}
              {catalogSection === 'license' && (
                <div className="space-y-3" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
                  {pricingOptions.length > 0 ? pricingOptions.map(option => (
                    <div key={option.id} className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[15px] font-bold text-[#007AFF]">{option.title}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600">已启用</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                        {[
                          { label: '定价周期', value: option.license.periodUnit === 'Year' || option.license.periodUnit === 'Month' ? '周期性' : '一次性' },
                          { label: '购买单位', value: option.license.scope.includes('User') ? '用户' : option.license.scope.includes('Device') ? '设备' : '平台' },
                          { label: '辅助单位', value: option.license.scope.includes('User') ? '用户' : '设备' },
                        ].map(f => (
                          <div key={f.label}>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{f.label}</p>
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white mt-0.5">{f.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          option.license.periodUnit !== 'Forever' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {option.license.periodUnit !== 'Forever' ? '周期性' : '非周期性'}
                        </span>
                        <span className="text-[17px] font-bold text-[#007AFF] tabular-nums">¥{option.price.toLocaleString()}</span>
                      </div>
                    </div>
                  )) : (
                    <EmptyState text="暂无授权类型" />
                  )}
                </div>
              )}

              {/* ── 资料 ── */}
              {catalogSection === 'docs' && (
                <div className="space-y-2" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
                  {[
                    { title: 'WPS365产品白皮书', tag: '白皮书', date: '2025-10-15' },
                    { title: '企业部署指南', tag: '指南', date: '2025-09-22' },
                    { title: '用户操作手册', tag: '手册', date: '2025-08-30' },
                    { title: '管理员培训视频', tag: '视频', date: '2025-07-18' },
                  ].map((doc, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-[#007AFF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">{doc.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#007AFF]">{doc.tag}</span>
                          <span className="text-[11px] text-gray-400">{doc.date}</span>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-gray-300 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* ── 售卖范围 ── */}
              {catalogSection === 'scope' && (
                <div className="space-y-3" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
                  {[
                    { title: '行业维度', Icon: LayoutGrid, color: 'orange', items: ['政府及公共事业', '金融行业', '医疗健康', '教育行业'] },
                    { title: '客户维度', Icon: Users, color: 'blue', items: ['华兴科技有限公司', '信达发展有限公司', '中科网络信息有限公司'] },
                    { title: '指定经销商', Icon: Handshake, color: 'purple', items: ['伟仕佳杰（重庆）科技有限公司', '神州数码（中国）有限公司'] },
                    { title: '指定销售组织', Icon: Building2, color: 'green', items: ['珠海金山办公软件有限公司', '武汉金山办公软件有限公司'] },
                  ].map(({ title, Icon, color, items }) => {
                    const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
                      orange: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-400' },
                      blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-400' },
                      purple: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-400' },
                      green:  { bg: 'bg-emerald-50',text: 'text-emerald-600',dot: 'bg-emerald-400' },
                    };
                    const c = colorMap[color] || colorMap.blue;
                    return (
                      <div key={title} className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <h4 className="text-[15px] font-bold text-gray-900 dark:text-white">{title}</h4>
                        </div>
                        <div className="space-y-2">
                          {items.map(item => (
                            <div key={item} className="flex items-center gap-2 text-[14px] text-gray-600 dark:text-gray-400">
                              <div className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
                              <span className="truncate">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── 交付物 ── */}
              {catalogSection === 'delivery' && (
                <div className="space-y-3" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
                  {/* Install Packages */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                      <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> 安装包下载
                      </h3>
                    </div>
                    {product.installPackages && product.installPackages.length > 0 ? (
                      <div className="divide-y divide-gray-50 dark:divide-white/5">
                        {product.installPackages.map(pkg => (
                          <div key={pkg.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                              <HardDrive className="w-4 h-4 text-[#007AFF]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">{pkg.name}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">版本：{pkg.version}</p>
                            </div>
                            <Download className="w-4 h-4 text-gray-300 shrink-0" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-[14px] text-gray-400">暂无安装包</div>
                    )}
                  </div>

                  {/* License Templates */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                      <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileKey className="w-3.5 h-3.5" /> 授权模板
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-white/5">
                      {[
                        { name: '企业端授权模板（标准版）', type: 'DOC' },
                        { name: '渠道分发授权模板', type: 'DOC' },
                        { name: 'OEM 合作授权模板', type: 'PDF' },
                      ].map((tpl, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                            <FileKey className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">{tpl.name}</p>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-500 mt-0.5 inline-block">{tpl.type}</span>
                          </div>
                          <Download className="w-4 h-4 text-gray-300 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ━━━ DETAIL VIEW ━━━ */}
        {viewMode === 'detail' && (
          <>
            {/* Section Tabs */}
            <div className="px-4 pt-4 pb-1">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-0 min-w-max">
                  {([
                    { id: 'info' as const, label: '基本信息', count: infoFields.length },
                    { id: 'skus' as const, label: '规格 SKU', count: product.skus?.length || 0 },
                    { id: 'components' as const, label: '组件构成', count: product.composition?.length || 0 },
                    { id: 'packages' as const, label: '安装包', count: product.installPackages?.length || 0 },
                  ]).map(s => (
                    <button
                      key={s.id}
                      onClick={() => setDetailSection(s.id)}
                      className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full mr-2 transition-all ${
                        detailSection === s.id
                          ? 'bg-[#007AFF] text-white shadow-sm'
                          : 'bg-white dark:bg-[#2C2C2E] text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {s.label}
                      {s.count > 0 && (
                        <span className={`ml-1 text-[11px] ${detailSection === s.id ? 'text-white/70' : 'text-gray-400'}`}>{s.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 pt-2">

              {/* Basic Info */}
              {detailSection === 'info' && (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] overflow-hidden" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
                  {infoFields.length > 0 ? infoFields.map((f, i) => (
                    <div key={f.label} className={`flex items-center justify-between px-4 py-3 ${i < infoFields.length - 1 ? 'border-b border-gray-100/80 dark:border-white/5' : ''}`}>
                      <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                        <span className="opacity-50">{f.icon}</span>
                        <span className="text-[14px]">{f.label}</span>
                      </div>
                      <span className="text-[14px] font-medium text-gray-900 dark:text-white max-w-[180px] text-right truncate">{f.value}</span>
                    </div>
                  )) : (
                    <div className="px-4 py-8 text-center text-[14px] text-gray-400">暂无基本信息</div>
                  )}
                </div>
              )}

              {/* SKUs */}
              {detailSection === 'skus' && (
                <div className="space-y-2" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
                  {product.skus && product.skus.length > 0 ? product.skus.map(sku => (
                    <div key={sku.id} className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white">{sku.name}</h4>
                          <p className="text-[12px] text-gray-400 font-mono mt-0.5">{sku.id}</p>
                        </div>
                        <span className="shrink-0 text-[15px] font-bold text-[#007AFF] tabular-nums">
                          ¥{(sku.price ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${sku.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {sku.status === 'Active' ? '启用' : '停用'}
                        </span>
                        {sku.code && <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-100">{sku.code}</span>}
                      </div>
                      {sku.description && <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">{sku.description}</p>}
                    </div>
                  )) : <EmptyState text="暂无规格数据" />}
                </div>
              )}

              {/* Components */}
              {detailSection === 'components' && (
                <div className="space-y-2" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
                  {product.composition && product.composition.length > 0 ? product.composition.map(c => (
                    <div key={c.id} className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.type === 'Feature' ? 'bg-purple-50' : c.type === 'Service' ? 'bg-sky-50' : 'bg-emerald-50'}`}>
                          <Layers className={`w-4 h-4 ${c.type === 'Feature' ? 'text-purple-500' : c.type === 'Service' ? 'text-sky-500' : 'text-emerald-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">{c.name}</h4>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCompColor(c.type)}`}>
                              {c.type === 'Feature' ? '功能' : c.type === 'Service' ? '服务' : '模块'}
                            </span>
                          </div>
                          <p className="text-[12px] text-gray-400 font-mono mt-0.5">{c.id}</p>
                          {c.description && <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">{c.description}</p>}
                        </div>
                      </div>
                    </div>
                  )) : <EmptyState text="暂无组件数据" />}
                </div>
              )}

              {/* Packages */}
              {detailSection === 'packages' && (
                <div className="space-y-2" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
                  {product.installPackages && product.installPackages.length > 0 ? product.installPackages.map(pkg => (
                    <div key={pkg.id} className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug">{pkg.name || pkg.deliveryItemName}</h4>
                          <p className="text-[12px] text-gray-400 font-mono mt-0.5">{pkg.id}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${pkg.enabled !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {pkg.enabled !== false ? '启用' : '停用'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {pkg.platform && <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">{pkg.platform}</span>}
                        {pkg.cpu && <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">{pkg.cpu}</span>}
                        {pkg.os && <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-orange-50 text-orange-600 border border-orange-100">{pkg.os}</span>}
                      </div>
                    </div>
                  )) : <EmptyState text="暂无安装包数据" />}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes mobileDetailIn {
          from { opacity: 0; transform: translateX(30%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes mobileSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] px-4 py-8 text-center text-[14px] text-gray-400">
    {text}
  </div>
);

export default MobileProductDetail;
