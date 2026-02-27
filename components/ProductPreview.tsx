import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { 
  Search, BookOpen, Zap, Shield, FileText, Download, 
  Monitor, Cpu, HardDrive, Globe, MemoryStick, Maximize,
  CheckCircle2, Phone, Mail, ChevronRight, Building2, Key, Bell,
  ArrowLeft, Users, Landmark, Handshake
} from 'lucide-react';

interface ProductPreviewProps {
  products: Product[];
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ products }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const product = products.find(p => p.id === id) || products[0];

  if (!product) {
    return <div className="p-10 text-center">Product Not Found</div>;
  }

  const navItems = [
    { label: '授权类型', id: 'license-section' },
    { label: '组件信息', id: 'components-section' },
    { label: '资料', id: 'docs-section' },
    { label: '售卖范围', id: 'scope-section' },
    { label: '交付信息', id: 'delivery-section' }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 130; // Increased offset for the combined sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const getTagColor = (tag: string) => {
    const t = tag.toUpperCase();
    if (t.includes('IM')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    if (t.includes('AI')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
    if (t.includes('生态')) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/5';
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#121212] font-sans overflow-y-auto">
      {/* Integrated Sticky Header & Navigation */}
      <div className="sticky top-0 z-20 bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Top Row: Product Info */}
        <div className="max-w-6xl mx-auto py-3 px-8 flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-between flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
              <div className="flex gap-2">
                <span className="bg-blue-50 dark:bg-blue-900/20 text-[#2B5AED] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-100 dark:border-blue-800">
                  规格：标准版
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                  product.status === 'OnShelf' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {product.status === 'OnShelf' ? '在架' : '退市'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {product.tags?.map(tag => (
                <span key={tag} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTagColor(tag)}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Navigation Tabs */}
        <div className="max-w-6xl mx-auto flex justify-center gap-8 pb-3 px-8 overflow-x-auto no-scrollbar">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => scrollToSection(item.id)}
              className="text-gray-500 dark:text-gray-400 hover:text-[#2B5AED] dark:hover:text-[#4D7BFF] text-xs font-bold whitespace-nowrap transition-colors relative group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2B5AED] transition-all group-hover:w-full"></span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-6 px-6 space-y-8">
        
        {/* 授权类型 */}
        <section id="license-section">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-[#2B5AED]" /> 授权类型
          </h2>
          <div className="relative">
            <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar -mx-2 px-2 snap-x">
              {product.skus[0]?.pricingOptions?.map((option, index) => (
                <div key={option.id} className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-[#2B5AED]/30 transition-all group min-w-[320px] md:min-w-[380px] snap-start">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 dark:border-white/5">
                    <h3 className="text-base font-bold text-[#2B5AED]">授权类型{index + 1}</h3>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">
                      已启用
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase text-gray-400 font-bold">授权类型</div>
                      <div className="text-sm text-gray-700 dark:text-gray-200">
                        {option.license.type === 'Subscription' ? '用户订阅许可' : 
                         option.license.type === 'Perpetual' ? '永久授权' : 
                         option.license.type === 'FlatRate' ? '固定价授权' : '数量授权'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase text-gray-400 font-bold">定价周期</div>
                      <div className="text-sm text-gray-700 dark:text-gray-200">
                        {option.license.periodUnit === 'Year' ? '周期性' : 
                         option.license.periodUnit === 'Month' ? '周期性' : '一次性'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase text-gray-400 font-bold">购买单位</div>
                      <div className="text-sm text-gray-700 dark:text-gray-200">
                        {option.license.scope.includes('User') ? '用户' : 
                         option.license.scope.includes('Device') ? '设备' : '平台'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase text-gray-400 font-bold">辅助单位</div>
                      <div className="text-sm text-gray-700 dark:text-gray-200">
                        {option.license.scope.includes('User') ? '用户' : 
                         option.license.scope.includes('Device') ? '设备' : '平台'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-bold">在售状态: 标准在售</span>
                    <span className="text-sm font-bold text-[#2B5AED]">¥ {option.price}</span>
                  </div>
                </div>
              ))}
              {(!product.skus[0]?.pricingOptions || product.skus[0].pricingOptions.length === 0) && (
                <div className="w-full text-center py-12 text-gray-500 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                  暂无授权类型
                </div>
              )}
            </div>
            {product.skus[0]?.pricingOptions && product.skus[0].pricingOptions.length > 2 && (
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md text-gray-400 animate-pulse pointer-events-none">
                <ChevronRight className="w-5 h-5" />
              </div>
            )}
          </div>
        </section>

        {/* 组件信息 */}
        <section id="components-section">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[#2B5AED]" /> 组件信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'WPS Office 专业版', desc: '包含文档、表格、演示三大核心组件' },
              { title: 'WPS云文档', desc: '1TB云存储空间，支持多人协作' },
              { title: 'WPS会议', desc: '在线会议和屏幕共享功能' },
              { title: 'WPS表单', desc: '在线表单创建和数据收集' },
              { title: 'WPS轻文档', desc: '轻量化的在线文档编辑工具' },
              { title: 'WPS稻壳模板', desc: '提供10万+专业模板资源' }
            ].map((comp, idx) => (
              <div key={idx} className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-bold text-[#2B5AED] mb-2">{comp.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{comp.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 资料 */}
        <section id="docs-section">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2B5AED]" /> 资料
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'WPS365产品白皮书', tag: '白皮书', date: '2025-10-15' },
              { title: '企业部署指南', tag: '指南', date: '2025-09-22' },
              { title: '用户操作手册', tag: '手册', date: '2025-08-30' },
              { title: '管理员培训视频', tag: '视频', date: '2025-07-18' }
            ].map((doc, idx) => (
              <div key={idx} className="bg-white dark:bg-[#1E1E1E] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{doc.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-[#2B5AED] px-2 py-0.5 rounded">{doc.tag}</span>
                    <span className="text-xs text-gray-400">{doc.date}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#2B5AED]">
                  <Download className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 售卖范围 */}
        <section id="scope-section">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#2B5AED]" /> 售卖范围
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 可以售卖的客户 */}
            <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#2B5AED]">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">可以售卖的客户</h3>
              </div>
              <div className="space-y-2">
                {['华兴科技有限公司', '信达发展有限公司', '中科网络信息有限公司'].map(customer => (
                  <div key={customer} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#2B5AED]" />
                    {customer}
                  </div>
                ))}
              </div>
            </div>

            {/* 可以售卖的销售组织 */}
            <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">可以售卖的销售组织</h3>
              </div>
              <div className="space-y-2">
                {[
                  '珠海金山办公软件有限公司',
                  '湖南金山办公软件有限公司',
                  '武汉金山办公软件有限公司'
                ].map(org => (
                  <div key={org} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-500" />
                    {org}
                  </div>
                ))}
              </div>
            </div>

            {/* 可以售卖的经销商 */}
            <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                  <Handshake className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">可以售卖的经销商</h3>
              </div>
              <div className="space-y-2">
                {[
                  '伟仕佳杰（重庆）科技有限公司',
                  '神州数码（中国）有限公司',
                  '联想（北京）有限公司'
                ].map(distributor => (
                  <div key={distributor} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-purple-500" />
                    {distributor}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 交付信息 */}
        <section id="delivery-section">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MemoryStick className="w-5 h-5 text-[#2B5AED]" /> 交付信息
          </h2>
          <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#2B5AED]" /> 安装包下载
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.installPackages && product.installPackages.length > 0 ? (
                    product.installPackages.map(pkg => (
                      <div key={pkg.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#2B5AED]/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#2B5AED]">
                            <HardDrive className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{pkg.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">版本: {pkg.version}</div>
                          </div>
                        </div>
                        <a 
                          href={pkg.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-[#2B5AED] hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"
                          title="点击下载"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      暂无安装包信息
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" /> 交付保障
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    所有安装包均经过安全扫描，确保无病毒、无插件。建议在正式环境部署前进行兼容性测试。
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-500" /> 更新说明
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    请关注产品动态，及时下载并更新至最新版本以获得最佳性能和安全性。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductPreview;
