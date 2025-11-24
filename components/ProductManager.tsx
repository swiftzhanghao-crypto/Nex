
import React, { useState } from 'react';
import { Product, LicenseOption, InstallPackage } from '../types';
import { Plus, Edit, Trash2, Search, Sparkles, Loader2, Tag, Box, ArrowUpCircle, ArrowDownCircle, Archive, Eye, ShieldCheck, X, Download, Laptop } from 'lucide-react';
import { generateProductDescription, suggestCategory } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface ProductManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, setProducts }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    sku: '',
    description: '',
    status: 'OnShelf',
    licenseOptions: [],
    installPackages: []
  });
  
  // License Option State for adding new ones
  const [newLicense, setNewLicense] = useState<Partial<LicenseOption>>({
      name: '',
      price: 0,
      type: 'PerUser'
  });

  // Install Package State for adding new ones
  const [newPackage, setNewPackage] = useState<Partial<InstallPackage>>({
      name: '',
      version: '',
      os: 'Windows'
  });

  const [generatingAI, setGeneratingAI] = useState(false);
  const [suggestingCat, setSuggestingCat] = useState(false);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData(product);
    } else {
      setEditingId(null);
      setFormData({ 
          name: '', 
          category: '', 
          price: 0, 
          stock: 0, 
          sku: `SKU-${Date.now()}`, 
          description: '', 
          status: 'OnShelf',
          licenseOptions: [],
          installPackages: []
        });
    }
    setIsModalOpen(true);
    setNewLicense({ name: '', price: 0, type: 'PerUser' });
    setNewPackage({ name: '', version: '', os: 'Windows' });
  };

  const handleSave = () => {
    if (!formData.name) return;

    // Set the display price to the lowest license option if available, otherwise keep user input
    let finalPrice = formData.price || 0;
    if (formData.licenseOptions && formData.licenseOptions.length > 0) {
        finalPrice = Math.min(...formData.licenseOptions.map(o => o.price));
    }

    const finalData = { ...formData, price: finalPrice };

    if (editingId) {
      setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...finalData } as Product : p));
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        ...finalData as Product
      };
      setProducts(prev => [...prev, newProduct]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个产品吗？')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleStatus = (product: Product) => {
    const newStatus = product.status === 'OnShelf' ? 'OffShelf' : 'OnShelf';
    const actionName = newStatus === 'OnShelf' ? '上架' : '下架';
    
    if (confirm(`确定要${actionName} "${product.name}" 吗？`)) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.name) return alert("请先输入产品名称。");
    setGeneratingAI(true);
    
    // Parallel execution for category and description
    const descriptionPromise = generateProductDescription(
        formData.name || '', 
        formData.category || '通用', 
        '高效, 专业, 智能, 灵活授权'
    );

    // Only suggest category if empty
    if (!formData.category) {
        setSuggestingCat(true);
        const cat = await suggestCategory(formData.name);
        setFormData(prev => ({...prev, category: cat}));
        setSuggestingCat(false);
    }

    const desc = await descriptionPromise;
    setFormData(prev => ({ ...prev, description: desc }));
    setGeneratingAI(false);
  };

  const handleAddLicense = () => {
      if(!newLicense.name || !newLicense.price) return;
      const option: LicenseOption = {
          id: `opt-${Date.now()}`,
          name: newLicense.name,
          price: Number(newLicense.price),
          type: newLicense.type as any || 'PerUser'
      };
      setFormData(prev => ({
          ...prev,
          licenseOptions: [...(prev.licenseOptions || []), option]
      }));
      setNewLicense({ name: '', price: 0, type: 'PerUser' });
  };

  const handleRemoveLicense = (id: string) => {
      setFormData(prev => ({
          ...prev,
          licenseOptions: prev.licenseOptions?.filter(l => l.id !== id)
      }));
  };

  const handleAddPackage = () => {
      if(!newPackage.name || !newPackage.version) return;
      const pkg: InstallPackage = {
          id: `pkg-${Date.now()}`,
          name: newPackage.name,
          version: newPackage.version,
          os: newPackage.os || 'Windows'
      };
      setFormData(prev => ({
          ...prev,
          installPackages: [...(prev.installPackages || []), pkg]
      }));
      setNewPackage({ name: '', version: '', os: 'Windows' });
  };

  const handleRemovePackage = (id: string) => {
      setFormData(prev => ({
          ...prev,
          installPackages: prev.installPackages?.filter(p => p.id !== id)
      }));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">产品管理</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> 添加产品
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索 WPS 产品或类别..." 
            className="bg-transparent border-none outline-none flex-1 text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium text-sm">
              <tr>
                <th className="p-4">产品名称</th>
                <th className="p-4">状态</th>
                <th className="p-4">类别</th>
                <th className="p-4">价格方案</th>
                <th className="p-4">安装包</th>
                <th className="p-4">库存</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className={`hover:bg-gray-50 transition group ${product.status === 'OffShelf' ? 'bg-gray-50/50' : ''}`}>
                  <td className="p-4">
                    <button 
                      onClick={() => navigate(`/products/${product.id}`)}
                      className={`font-medium hover:underline text-left ${product.status === 'OffShelf' ? 'text-gray-500' : 'text-indigo-600'}`}
                    >
                      {product.name}
                    </button>
                    <div className="text-xs text-gray-400">{product.sku}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        product.status === 'OnShelf' 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-200 text-gray-600 border border-gray-300'
                    }`}>
                        {product.status === 'OnShelf' ? <ArrowUpCircle className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                        {product.status === 'OnShelf' ? '已上架' : '已下架'}
                    </span>
                  </td>
                  <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">{product.category}</span></td>
                  <td className="p-4 text-gray-700">
                      {product.licenseOptions && product.licenseOptions.length > 0 ? (
                          <div>
                              <span className="font-medium text-indigo-600">¥{Math.min(...product.licenseOptions.map(o => o.price)).toLocaleString()}</span>
                              <span className="text-xs text-gray-500 ml-1">起</span>
                              <div className="text-xs text-gray-400">{product.licenseOptions.length} 种授权方式</div>
                          </div>
                      ) : (
                          <span>¥{product.price.toFixed(2)}</span>
                      )}
                  </td>
                   <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <Download className="w-3 h-3" />
                          {product.installPackages?.length || 0}
                      </span>
                   </td>
                  <td className="p-4">
                    <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => navigate(`/products/${product.id}`)}
                        title="查看详情"
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                       >
                         <Eye className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => handleToggleStatus(product)}
                        title={product.status === 'OnShelf' ? "下架产品" : "上架产品"}
                        className={`p-2 rounded-full transition ${
                            product.status === 'OnShelf' 
                            ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50' 
                            : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {product.status === 'OnShelf' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleOpenModal(product)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">暂无产品。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl m-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? '编辑产品' : '新增产品'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">上下架状态</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${formData.status === 'OnShelf' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input 
                                type="radio" 
                                name="status" 
                                checked={formData.status === 'OnShelf'} 
                                onChange={() => setFormData({...formData, status: 'OnShelf'})}
                                className="hidden"
                            />
                            <ArrowUpCircle className="w-4 h-4" />
                            <span className="font-medium">立即上架</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${formData.status === 'OffShelf' ? 'bg-gray-100 border-gray-500 text-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input 
                                type="radio" 
                                name="status" 
                                checked={formData.status === 'OffShelf'} 
                                onChange={() => setFormData({...formData, status: 'OffShelf'})}
                                className="hidden"
                            />
                            <Archive className="w-4 h-4" />
                            <span className="font-medium">暂不上架 (放入仓库)</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Box className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder="例如：WPS 365"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                        type="text" 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder={suggestingCat ? "AI 正在推测..." : "例如：企业服务"}
                        />
                    </div>
                </div>
                
                {(!formData.licenseOptions || formData.licenseOptions.length === 0) && (
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">单一价格 (¥)</label>
                    <input 
                        type="number" 
                        value={formData.price} 
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">库存数量</label>
                  <input 
                    type="number" 
                    value={formData.stock} 
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* License Options Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" /> 
                      授权方式与定价
                  </h4>
                  
                  {/* List existing options */}
                  <div className="space-y-2 mb-4">
                    {formData.licenseOptions && formData.licenseOptions.length > 0 ? (
                        formData.licenseOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                                <div>
                                    <div className="font-medium text-sm text-gray-800">{opt.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {opt.type === 'PerUser' ? '按人计费' : opt.type === 'FlatRate' ? '整体售卖' : opt.type === 'Subscription' ? '订阅制' : '永久授权'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-indigo-600">¥{opt.price}</span>
                                    <button onClick={() => handleRemoveLicense(opt.id)} className="text-red-400 hover:text-red-600 p-1">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic">暂无特定授权方式，将使用单一价格。</p>
                    )}
                  </div>

                  {/* Add new option */}
                  <div className="flex flex-col md:flex-row gap-2 items-end bg-white p-3 rounded border border-dashed border-gray-300">
                      <div className="flex-1 w-full">
                          <label className="text-xs text-gray-500 block mb-1">方案名称</label>
                          <input 
                            type="text" 
                            placeholder="如: 企业版 5人包"
                            value={newLicense.name}
                            onChange={e => setNewLicense({...newLicense, name: e.target.value})}
                            className="w-full border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-indigo-500"
                          />
                      </div>
                      <div className="w-full md:w-32">
                           <label className="text-xs text-gray-500 block mb-1">类型</label>
                           <select 
                            value={newLicense.type}
                            onChange={e => setNewLicense({...newLicense, type: e.target.value as any})}
                            className="w-full border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-indigo-500"
                           >
                               <option value="PerUser">按用户</option>
                               <option value="FlatRate">打包/一口价</option>
                               <option value="Subscription">订阅制</option>
                               <option value="Perpetual">永久授权</option>
                           </select>
                      </div>
                       <div className="w-full md:w-24">
                          <label className="text-xs text-gray-500 block mb-1">价格 (¥)</label>
                          <input 
                            type="number" 
                            value={newLicense.price}
                            onChange={e => setNewLicense({...newLicense, price: parseFloat(e.target.value)})}
                            className="w-full border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-indigo-500"
                          />
                      </div>
                      <button 
                        onClick={handleAddLicense}
                        disabled={!newLicense.name || !newLicense.price}
                        className="w-full md:w-auto px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition text-sm font-medium disabled:opacity-50"
                      >
                          添加方案
                      </button>
                  </div>
              </div>

              {/* Install Packages Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-600" /> 
                      安装包管理
                  </h4>
                  
                  {/* List existing packages */}
                  <div className="space-y-2 mb-4">
                    {formData.installPackages && formData.installPackages.length > 0 ? (
                        formData.installPackages.map((pkg, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                                <div>
                                    <div className="font-medium text-sm text-gray-800">{pkg.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                       <span className="bg-gray-100 px-1.5 rounded">{pkg.os}</span>
                                       <span>v{pkg.version}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleRemovePackage(pkg.id)} className="text-red-400 hover:text-red-600 p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic">暂无安装包信息。</p>
                    )}
                  </div>

                  {/* Add new package */}
                  <div className="flex flex-col md:flex-row gap-2 items-end bg-white p-3 rounded border border-dashed border-gray-300">
                      <div className="flex-1 w-full">
                          <label className="text-xs text-gray-500 block mb-1">安装包名称</label>
                          <input 
                            type="text" 
                            placeholder="如: Windows 64位安装包"
                            value={newPackage.name}
                            onChange={e => setNewPackage({...newPackage, name: e.target.value})}
                            className="w-full border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-indigo-500"
                          />
                      </div>
                      <div className="w-full md:w-32">
                           <label className="text-xs text-gray-500 block mb-1">系统</label>
                           <select 
                            value={newPackage.os}
                            onChange={e => setNewPackage({...newPackage, os: e.target.value})}
                            className="w-full border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-indigo-500"
                           >
                               <option value="Windows">Windows</option>
                               <option value="macOS">macOS</option>
                               <option value="Linux">Linux</option>
                               <option value="Android">Android</option>
                               <option value="iOS">iOS</option>
                           </select>
                      </div>
                       <div className="w-full md:w-24">
                          <label className="text-xs text-gray-500 block mb-1">版本</label>
                          <input 
                            type="text" 
                            placeholder="v1.0"
                            value={newPackage.version}
                            onChange={e => setNewPackage({...newPackage, version: e.target.value})}
                            className="w-full border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-indigo-500"
                          />
                      </div>
                      <button 
                        onClick={handleAddPackage}
                        disabled={!newPackage.name || !newPackage.version}
                        className="w-full md:w-auto px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition text-sm font-medium disabled:opacity-50"
                      >
                          添加
                      </button>
                  </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-medium text-gray-700">描述</label>
                    <button 
                        type="button"
                        onClick={handleAIGenerate}
                        disabled={generatingAI || !formData.name}
                        className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 transition"
                    >
                        {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {generatingAI ? '生成中...' : 'AI 自动填充'}
                    </button>
                </div>
                <textarea 
                    rows={4}
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                    placeholder="输入产品描述..."
                ></textarea>
                <p className="text-xs text-gray-500 mt-1 text-right">由 Gemini 2.5 Flash 提供支持</p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition font-medium">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md">保存产品</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
