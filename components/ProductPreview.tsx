import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import {
  Zap, FileText, Download, Tag,
  Monitor, HardDrive, Globe, MemoryStick,
  Key, ChevronRight, ChevronLeft,
  ArrowLeft, Users, Landmark, Handshake, Info, Package
} from 'lucide-react';

interface ProductPreviewProps {
  products: Product[];
}

const sectionNavItems = [
  { label: '组件信息', id: 'components-section' },
  { label: '授权类型', id: 'license-section' },
  { label: '资料',     id: 'docs-section' },
  { label: '售卖范围', id: 'scope-section' },
  { label: '权益管控', id: 'rights-section' },
  { label: '交付信息', id: 'delivery-section' },
];

const ProductPreview: React.FC<ProductPreviewProps> = ({ products }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const product = products.find(p => p.id === id) || products[0];

  // License carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateCarousel = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateCarousel();
    el.addEventListener('scroll', updateCarousel);
    window.addEventListener('resize', updateCarousel);
    return () => {
      el.removeEventListener('scroll', updateCarousel);
      window.removeEventListener('resize', updateCarousel);
    };
  }, [updateCarousel, product]);

  const carouselScroll = (dir: 'left' | 'right') =>
    carouselRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });

  // Section scroll
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(sectionNavItems[0].id);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const handleScroll = () => {
      const top = container.scrollTop + 60;
      for (const nav of [...sectionNavItems].reverse()) {
        const el = container.querySelector(`#${nav.id}`) as HTMLElement | null;
        if (el && el.offsetTop <= top) { setActiveSection(nav.id); break; }
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const container = contentRef.current;
    const el = container?.querySelector(`#${sectionId}`) as HTMLElement | null;
    if (!container || !el) return;
    container.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' });
    setActiveSection(sectionId);
  };

  if (!product) {
    return <div className="p-10 text-center text-gray-500">Product Not Found</div>;
  }

  const pricingOptions = product.skus[0]?.pricingOptions ?? [];

  const getTagClass = (tag: string) => {
    const t = tag.toUpperCase();
    if (t.includes('IM'))   return 'unified-tag-blue';
    if (t.includes('AI'))   return 'unified-tag-indigo';
    if (t.includes('生态')) return 'unified-tag-green';
    return 'unified-tag-gray';
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black">

      {/* ── Header + Tabs（整体 sticky 顶栏，与订单详情一致） ── */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 px-4 md:px-6 pt-4 flex flex-col shrink-0">

        {/* 标题行 */}
        <div className="flex flex-row justify-between items-center gap-4 pb-3">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-[#2B5AED]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate">{product.name}</h1>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono hidden sm:inline">{product.id}</span>
                  <span className="unified-tag-blue shrink-0">标准版</span>
                  <span className={`shrink-0 ${product.status === 'OnShelf' ? 'unified-tag-green' : 'unified-tag-gray'}`}>
                    {product.status === 'OnShelf' ? '在架' : '已下架'}
                  </span>
                  {product.tags?.map(tag => (
                    <span key={tag} className={`shrink-0 ${getTagClass(tag)}`}>
                      <Tag className="w-3 h-3" />{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 导航行 */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-white/10">
          {sectionNavItems.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`relative px-5 py-2 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  isActive
                    ? 'text-[#0071E3] dark:text-[#0A84FF] border-[#0071E3] dark:border-[#0A84FF]'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 可滚动内容区 ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
          {/* Scrollable content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto">
            <div className="px-8 py-6 space-y-8">

              {/* 组件信息 */}
              <section id="components-section">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#2B5AED]" /> 组件信息
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {(product.composition && product.composition.length > 0
                    ? product.composition
                    : [
                        { id: 'x1', name: 'WPS Office 专业版', type: 'Component' as const },
                        { id: 'x2', name: 'WPS云文档',         type: 'Service' as const },
                        { id: 'x3', name: 'WPS会议',           type: 'Service' as const },
                        { id: 'x4', name: 'WPS表单',           type: 'Service' as const },
                        { id: 'x5', name: 'WPS轻文档',         type: 'Service' as const },
                        { id: 'x6', name: 'WPS稻壳模板',       type: 'Service' as const },
                      ]
                  ).map(c => (
                    <div key={c.id} className={`px-4 py-2 rounded-lg border text-sm font-semibold ${
                      c.type === 'Feature'
                        ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/50'
                        : c.type === 'Service'
                        ? 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800/50'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/50'
                    }`}>
                      {c.name}
                    </div>
                  ))}
                </div>
              </section>

              {/* 授权类型 */}
              <section id="license-section">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#2B5AED]" /> 授权类型
                </h2>

                <div className="relative">
                  {canLeft && (
                    <button
                      onClick={() => carouselScroll('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-9 h-9 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-full shadow-apple flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  <div ref={carouselRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                    {pricingOptions.length > 0 ? pricingOptions.map(option => (
                      <div
                        key={option.id}
                        className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-apple border border-gray-100 dark:border-gray-800 hover:border-[#2B5AED]/40 hover:shadow-apple transition-all shrink-0 w-[320px]"
                      >
                        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100 dark:border-white/5">
                          <h3 className="text-base font-bold text-[#2B5AED]">
                            {option.license.type === 'Subscription' ? '用户订阅许可' :
                             option.license.type === 'Perpetual'    ? '永久授权'     :
                             option.license.type === 'FlatRate'     ? '固定价授权'   : '数量授权'}
                          </h3>
                          <span className="unified-tag-blue">已启用</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: '定价周期', value: option.license.periodUnit === 'Year' || option.license.periodUnit === 'Month' ? '周期性' : '一次性' },
                            { label: '购买单位', value: option.license.scope.includes('User') ? '用户' : option.license.scope.includes('Device') ? '设备' : '平台' },
                            { label: '辅助单位', value: option.license.scope.includes('User') ? '用户' : option.license.scope.includes('Device') ? '设备' : '平台' },
                          ].map(({ label, value }) => (
                            <div key={label} className="space-y-1">
                              <div className="text-xs uppercase text-gray-400 font-bold tracking-wider">{label}</div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                          <span className={option.license.type === 'Subscription' ? 'unified-tag-green' : 'unified-tag-orange'}>
                            {option.license.type === 'Subscription' ? '标准在售' : '非标在售'}
                          </span>
                          <span className="text-base font-bold text-[#2B5AED]">¥ {option.price.toLocaleString()}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="flex-1 text-center py-12 text-gray-500 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        暂无授权类型
                      </div>
                    )}
                  </div>

                  {canRight && (
                    <button
                      onClick={() => carouselScroll('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-9 h-9 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-full shadow-apple flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </section>

              {/* 资料 */}
              <section id="docs-section">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2B5AED]" /> 资料
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {[
                    { title: 'WPS365产品白皮书', tag: '白皮书', date: '2025-10-15' },
                    { title: '企业部署指南',     tag: '指南',   date: '2025-09-22' },
                    { title: '用户操作手册',     tag: '手册',   date: '2025-08-30' },
                    { title: '管理员培训视频',   tag: '视频',   date: '2025-07-18' },
                  ].map((doc, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-apple border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-apple transition-shadow cursor-pointer">
                      <div className="min-w-0 mr-3">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">{doc.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-[#2B5AED] px-2 py-0.5 rounded">{doc.tag}</span>
                          <span className="text-xs text-gray-400">{doc.date}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#2B5AED]">
                        <Download className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 售卖范围 */}
              <section id="scope-section">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#2B5AED]" /> 售卖范围
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: '可以售卖的客户',    Icon: Users,     dotColor: 'bg-blue-500',   bgColor: 'bg-blue-50 dark:bg-blue-900/20',     textColor: 'text-blue-600',   items: ['华兴科技有限公司', '信达发展有限公司', '中科网络信息有限公司'] },
                    { title: '可以售卖的销售组织', Icon: Landmark,  dotColor: 'bg-green-500',  bgColor: 'bg-green-50 dark:bg-green-900/20',   textColor: 'text-green-600',  items: ['珠海金山办公软件有限公司', '湖南金山办公软件有限公司', '武汉金山办公软件有限公司'] },
                    { title: '可以售卖的经销商',   Icon: Handshake, dotColor: 'bg-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-600', items: ['伟仕佳杰（重庆）科技有限公司', '神州数码（中国）有限公司', '联想（北京）有限公司'] },
                  ].map(({ title, Icon, dotColor, bgColor, textColor, items }) => (
                    <div key={title} className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-apple border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bgColor} ${textColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
                      </div>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <div className={`w-1 h-1 rounded-full ${dotColor} shrink-0`} />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 权益管控 */}
              <section id="rights-section">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#2B5AED]" /> 权益管控
                </h2>
                <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-apple border border-gray-100 dark:border-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {[{ name: 'WPS 365政务版办公平台（标准版）', value: '云办公（私有云）' }].map((right, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#2B5AED]/30 transition-colors">
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{right.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{right.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400 flex items-start gap-2 italic">
                      <Info className="w-3.5 h-3.5 text-[#2B5AED] shrink-0 mt-0.5" />
                      公有云权益随发货自动下发至企业账号下；私有云授权管控请在OA完成申请lic文件，在客户部署环境下完成激活！
                    </p>
                  </div>
                </div>
              </section>

              {/* 交付信息 */}
              <section id="delivery-section" className="pb-8">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MemoryStick className="w-4 h-4 text-[#2B5AED]" /> 交付信息
                </h2>
                <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-xl shadow-apple border border-gray-100 dark:border-gray-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#2B5AED]" /> 安装包下载
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {product.installPackages && product.installPackages.length > 0 ? (
                        product.installPackages.map(pkg => (
                          <div key={pkg.id} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#2B5AED]/30 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#2B5AED]">
                                <HardDrive className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{pkg.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">版本：{pkg.version}</div>
                              </div>
                            </div>
                            <a href={pkg.url} target="_blank" rel="noopener noreferrer"
                              className="p-2 shrink-0 text-gray-400 hover:text-[#2B5AED] hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all ml-2">
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 py-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                          暂无安装包信息
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
      </div>
    </div>
  );
};

export default ProductPreview;
