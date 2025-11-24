
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, InstallPackage, CpuArchitecture } from '../types';
import { ArrowLeft, Package, Tag, Box, CreditCard, Activity, Archive, ArrowUpCircle, ShieldCheck, Download, Monitor, Smartphone, Laptop, Edit3, Save, X, Plus, Cpu, HardDrive, Trash2 } from 'lucide-react';

interface ProductDetailsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ products, setProducts }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Product | null>(null);
  
  // State for new package entry in edit mode
  const [newPkg, setNewPkg] = useState<Partial<InstallPackage>>({
      name: '',
      version: '',
      os: 'Windows',
      cpuArchitecture: 'x86_64'
  });

  useEffect(() => {
      if (product) {
          setFormData(product);
      }
  }, [product]);

  if (!product || !formData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-gray-400 text-lg">未找到该产品信息</div>
        <button 
          onClick={() => navigate('/products')}
          className="text-indigo-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> 返回列表
        </button>
      </div>
    );
  }

  const handleSave = () => {
      if (!formData) return;
      setProducts(prev => prev.map(p => p.id === formData.id ? formData : p));
      setIsEditing(false);
  };

  const handleCancel = () => {
      setFormData(product);
      setIsEditing(false);
      setNewPkg({ name: '', version: '', os: 'Windows', cpuArchitecture: 'x86_64' });
  };

  const handleAddPackage = () => {
      if (!newPkg.name || !newPkg.version) return;
      const pkg: InstallPackage = {
          id: `pkg-${Date.now()}`,
          name: newPkg.name || '',
          version: newPkg.version || '',
          os: newPkg.os || 'Windows',
          cpuArchitecture: newPkg.cpuArchitecture as CpuArchitecture || 'x86_64'
      };
      setFormData(prev => prev ? ({
          ...prev,
          installPackages: [...(prev.installPackages || []), pkg]
      }) : null);
      setNewPkg({ name: '', version: '', os: 'Windows', cpuArchitecture: 'x86_64' });
  };

  const handleRemovePackage = (pkgId: string) => {
      setFormData(prev => prev ? ({
          ...prev,
          installPackages: prev.installPackages?.filter(p => p.id !== pkgId)
      }) : null);
  };

  const getOSIcon = (os: string) => {
      const lower = os.toLowerCase();
      if (lower.includes('win')) return <Monitor className="w-4 h-4" />;
      if (lower.includes('mac') || lower.includes('ios')) return <Laptop className="w-4 h-4" />;
      if (lower.includes('android') || lower.includes('phone')) return <Smartphone className="w-4 h-4" />;
      if (lower.includes('linux') || lower.includes('uos') || lower.includes('kylin') || lower.includes('deepin')) return <HardDrive className="w-4 h-4" />;
      return <Download className="w-4 h-4" />;
  };

  // Render View Mode
  const renderView = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Product Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{formData.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-indigo-100">
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-medium backdrop-blur-md">
                  {formData.sku}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Tag className="w-3.5 h-3.5" /> {formData.category}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm ${
                formData.status === 'OnShelf' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-500 text-gray-200'
              }`}>
                {formData.status === 'OnShelf' ? <ArrowUpCircle className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                {formData.status === 'OnShelf' ? '销售中' : '已下架'}
              </div>
              <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition backdrop-blur-md border border-white/30"
              >
                  <Edit3 className="w-3 h-3" /> 编辑产品信息
              </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Stats */}
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">参考价格</span>
              </div>
              <div className="text-3xl font-bold text-indigo-600">
                  {formData.licenseOptions && formData.licenseOptions.length > 0 
                      ? `¥${Math.min(...formData.licenseOptions.map(o => o.price)).toLocaleString()}`
                      : `¥${formData.price.toFixed(2)}`
                  }
                  {formData.licenseOptions && formData.licenseOptions.length > 0 && <span className="text-sm text-gray-400 font-normal ml-1">起</span>}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Box className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">库存状态</span>
              </div>
              <div className={`text-2xl font-bold ${formData.stock < 20 ? 'text-orange-500' : 'text-gray-800'}`}>
                {formData.stock} <span className="text-sm font-normal text-gray-500">件</span>
              </div>
              {formData.stock < 20 && (
                <div className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> 库存紧张
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Description */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">产品描述</h3>
              <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {formData.description || "暂无详细描述。"}
              </div>
            </div>

            {/* License Options List */}
            {formData.licenseOptions && formData.licenseOptions.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        可选授权方案
                    </h3>
                    <div className="space-y-3">
                        {formData.licenseOptions.map((option, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 transition">
                                <div>
                                    <div className="font-bold text-gray-800">{option.name}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                                            {option.type === 'PerUser' ? '按用户' : option.type === 'FlatRate' ? '整体/打包' : option.type === 'Subscription' ? '订阅制' : '永久授权'}
                                        </span>
                                        {option.description && <span>{option.description}</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-indigo-700">¥{option.price.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

             {/* Installation Packages List */}
             {formData.installPackages && formData.installPackages.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
                        <Download className="w-5 h-5 text-green-600" />
                        包含安装包
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {formData.installPackages.map((pkg, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:shadow-sm transition bg-gray-50">
                                <div className="p-2 bg-white rounded-full border border-gray-100 text-gray-600 mt-1">
                                    {getOSIcon(pkg.os)}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-800 text-sm">{pkg.name}</div>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        <div className="text-xs text-gray-500 bg-gray-200 px-1.5 rounded flex items-center gap-1">
                                            <span>OS: {pkg.os}</span>
                                        </div>
                                        {pkg.cpuArchitecture && (
                                            <div className="text-xs text-blue-600 bg-blue-50 px-1.5 rounded border border-blue-100 flex items-center gap-1">
                                                <Cpu className="w-3 h-3" />
                                                <span>{pkg.cpuArchitecture}</span>
                                            </div>
                                        )}
                                        <span className="text-xs text-gray-400 border px-1.5 rounded">v{pkg.version}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {!formData.installPackages?.length && (
                <div className="text-sm text-gray-400 italic">暂无安装包信息。</div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                 <span className="block text-xs text-blue-500 font-bold mb-1">适用场景</span>
                 <span className="text-sm text-blue-900">企业办公 / 个人效率 / 文档管理</span>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                 <span className="block text-xs text-purple-500 font-bold mb-1">交付方式</span>
                 <span className="text-sm text-purple-900">数字授权码 / 在线激活</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Edit Mode
  const renderEdit = () => (
      <div className="bg-white rounded-xl shadow-lg border border-indigo-200 overflow-hidden ring-4 ring-indigo-50/50">
        <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5" /> 编辑产品信息
            </h2>
            <div className="flex gap-3">
                <button 
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                    取消
                </button>
                <button 
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium flex items-center gap-2 shadow-sm"
                >
                    <Save className="w-4 h-4" /> 保存更改
                </button>
            </div>
        </div>

        <div className="p-8 space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU 编号</label>
                    <input 
                        type="text" 
                        value={formData.sku} 
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-mono bg-gray-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                    <input 
                        type="text" 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                    <input 
                        type="number" 
                        value={formData.stock} 
                        onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">产品描述</label>
                    <textarea 
                        rows={4}
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    ></textarea>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Install Package Management (Enhanced) */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-green-600" />
                    安装包管理 (支持信创环境)
                </h3>
                
                {/* Add New Package Form */}
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 mb-4">
                    <div className="text-sm font-bold text-green-800 mb-2">添加新安装包</div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-4">
                            <label className="block text-xs text-gray-500 mb-1">包名称</label>
                            <input 
                                type="text" 
                                placeholder="例如: WPS Office Linux (UOS)"
                                value={newPkg.name}
                                onChange={e => setNewPkg({...newPkg, name: e.target.value})}
                                className="w-full border border-green-200 rounded p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">版本号</label>
                            <input 
                                type="text" 
                                placeholder="v1.0.0"
                                value={newPkg.version}
                                onChange={e => setNewPkg({...newPkg, version: e.target.value})}
                                className="w-full border border-green-200 rounded p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none"
                            />
                        </div>
                         <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">操作系统</label>
                            <select 
                                value={newPkg.os}
                                onChange={e => setNewPkg({...newPkg, os: e.target.value})}
                                className="w-full border border-green-200 rounded p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none bg-white"
                            >
                                <option value="Windows">Windows</option>
                                <option value="macOS">macOS</option>
                                <option value="Linux">Linux (Generic)</option>
                                <option value="UOS">UOS (统信)</option>
                                <option value="Kylin">Kylin (麒麟)</option>
                                <option value="Deepin">Deepin (深度)</option>
                                <option value="Android">Android</option>
                                <option value="iOS">iOS</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs text-gray-500 mb-1">CPU 架构</label>
                            <select 
                                value={newPkg.cpuArchitecture}
                                onChange={e => setNewPkg({...newPkg, cpuArchitecture: e.target.value as CpuArchitecture})}
                                className="w-full border border-green-200 rounded p-2 text-sm focus:ring-1 focus:ring-green-500 outline-none bg-white"
                            >
                                <option value="x86_64">x86_64 (Intel/AMD)</option>
                                <option value="ARM64">ARM64 (Kunpeng/Apple Silicon)</option>
                                <option value="MIPS64">MIPS64 (Loongson Old)</option>
                                <option value="LoongArch">LoongArch (Loongson New)</option>
                                <option value="SW_64">SW_64 (Sunway)</option>
                                <option value="Universal">Universal</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <button 
                                onClick={handleAddPackage}
                                disabled={!newPkg.name || !newPkg.version}
                                className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Package List */}
                <div className="space-y-2">
                    {formData.installPackages?.map((pkg) => (
                        <div key={pkg.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                                    {getOSIcon(pkg.os)}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-800 text-sm">{pkg.name}</div>
                                    <div className="flex items-center gap-2 text-xs mt-1">
                                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 border border-gray-200">{pkg.os}</span>
                                        <span className="px-1.5 py-0.5 bg-blue-50 rounded text-blue-600 border border-blue-100 flex items-center gap-1">
                                            <Cpu className="w-3 h-3" /> {pkg.cpuArchitecture || 'x86_64'}
                                        </span>
                                        <span className="text-gray-400">v{pkg.version}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRemovePackage(pkg.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {(!formData.installPackages || formData.installPackages.length === 0) && (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm">
                            暂无安装包，请在上方添加。
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 mb-12">
      {/* Header / Breadcrumb */}
      <div className="flex justify-between items-center">
        <button 
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition group"
        >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">返回产品列表</span>
        </button>
      </div>

      {isEditing ? renderEdit() : renderView()}
    </div>
  );
};

export default ProductDetails;