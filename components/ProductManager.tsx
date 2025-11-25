
import React, { useState } from 'react';
import { Product, ProductSku, InstallPackage } from '../types';
import { Plus, Trash2, Search, Sparkles, Loader2, Tag, Box, ArrowUpCircle, ArrowDownCircle, Archive, Eye, ShieldCheck, X, Download } from 'lucide-react';
import { generateProductDescription, suggestCategory } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface ProductManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, setProducts }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [tempStock, setTempStock] = useState<number>(0);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    description: '',
    status: 'OffShelf',
    skus: [],
    installPackages: []
  });
  
  const [generatingAI, setGeneratingAI] = useState(false);
  const [suggestingCat, setSuggestingCat] = useState(false);

  const handleOpenModal = () => {
    setFormData({ 
        name: '', 
        category: '', 
        description: '', 
        status: 'OffShelf', 
        skus: [],
        installPackages: []
      });
    setTempPrice(0);
    setTempStock(0);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    const maxId = products.reduce((max, p) => {
        const numStr = p.id.startsWith('P') ? p.id.substring(1) : p.id;
        const num = parseInt(numStr, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `P${(maxId + 1).toString().padStart(8, '0')}`;
    
    const allSkus = products.flatMap(p => p.skus);
    const maxSkuNum = allSkus.reduce((max, sku) => {
        if (sku.code.startsWith('SKU')) {
            const numStr = sku.code.substring(3);
            const num = parseInt(numStr, 10);
            return !isNaN(num) && num > max ? num : max;
        }
        return max;
    }, 0);
    const newSkuCode = `SKU${(maxSkuNum + 1).toString().padStart(8, '0')}`;

    const initialSku: ProductSku = {
        id: `sku-${Date.now()}`,
        code: newSkuCode,
        name: '标准版',
        price: tempPrice,
        stock: tempStock,
        description: '默认创建的基础规格'
    };

    const newProduct: Product = {
      id: newId,
      ...formData as Product,
      skus: [initialSku]
    };

    setProducts(prev => [...prev, newProduct]);
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
    
    const descriptionPromise = generateProductDescription(
        formData.name || '', 
        formData.category || '通用', 
        '高效, 专业, 智能, 灵活授权'
    );

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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  React.useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm]);

  const getPriceRange = (product: Product) => {
      if (product.skus.length === 0) return '¥0.00';
      const prices = product.skus.map(s => s.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (min === max) return `¥${min.toLocaleString()}`;
      return `¥${min.toLocaleString()} - ¥${max.toLocaleString()}`;
  };

  const getTotalStock = (product: Product) => {
      return product.skus.reduce((acc, sku) => acc + sku.stock, 0);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">产品管理</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">维护产品目录信息、价格策略及库存状态。</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="bg-[#0071E3] dark:bg-[#FF2D55] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> 新增产品
        </button>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索 WPS 产品或类别..." 
            className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase">
              <tr>
                <th className="p-4">产品名称 / ID</th>
                <th className="p-4">状态</th>
                <th className="p-4">类别</th>
                <th className="p-4">价格区间</th>
                <th className="p-4">安装包</th>
                <th className="p-4">总库存</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {currentProducts.map(product => (
                <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition group ${product.status === 'OffShelf' ? 'bg-gray-50/50 dark:bg-black/40' : ''}`}>
                  <td className="p-4">
                    <button 
                      onClick={() => navigate(`/products/${product.id}`)}
                      className={`font-medium text-sm hover:underline text-left ${product.status === 'OffShelf' ? 'text-gray-500 dark:text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                    >
                      {product.name}
                    </button>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{product.id}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        product.status === 'OnShelf' 
                        ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                        : 'bg-gray-200 text-gray-600 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                    }`}>
                        {product.status === 'OnShelf' ? <ArrowUpCircle className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                        {product.status === 'OnShelf' ? '已上架' : '已下架'}
                    </span>
                  </td>
                  <td className="p-4"><span className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium">{product.category}</span></td>
                  <td className="p-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {getPriceRange(product)}
                      <div className="text-xs text-gray-400 font-normal">{product.skus.length} 个 SKU</div>
                  </td>
                   <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Download className="w-3 h-3" />
                          {product.installPackages?.length || 0}
                      </span>
                   </td>
                  <td className="p-4">
                    <span className={`text-sm font-medium ${getTotalStock(product) < 10 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                      {getTotalStock(product)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                       <button 
                        onClick={() => navigate(`/products/${product.id}`)}
                        title="查看详情/编辑"
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition"
                       >
                         <Eye className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => handleToggleStatus(product)}
                        title={product.status === 'OnShelf' ? "下架产品" : "上架产品"}
                        className={`p-2 rounded-full transition ${
                            product.status === 'OnShelf' 
                            ? 'text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30' 
                            : 'text-green-500 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'
                        }`}
                      >
                        {product.status === 'OnShelf' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">暂无产品。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-sm"
                >
                    上一页
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    第 {currentPage} 页 / 共 {totalPages} 页
                </div>
                <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-sm"
                >
                    下一页
                </button>
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl shadow-2xl w-full max-w-3xl m-4 overflow-hidden flex flex-col max-h-[90vh] animate-modal-enter border border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">新增产品</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2">
                     <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                         <Archive className="w-4 h-4" />
                         新产品默认创建为“已下架”状态，并生成一个默认的标准 SKU。
                     </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">产品名称</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Box className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="pl-10 w-full border border-gray-300 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder="例如：WPS 365"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类别</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                        type="text" 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="pl-10 w-full border border-gray-300 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder={suggestingCat ? "AI 正在推测..." : "例如：企业服务"}
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">初始价格 (¥)</label>
                    <input 
                        type="number" 
                        value={tempPrice} 
                        onChange={(e) => setTempPrice(parseFloat(e.target.value))}
                        className="w-full border border-gray-300 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">将用于创建默认 SKU</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">初始库存</label>
                  <input 
                    type="number" 
                    value={tempStock} 
                    onChange={(e) => setTempStock(parseInt(e.target.value))}
                    className="w-full border border-gray-300 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">将用于创建默认 SKU</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">描述</label>
                    <button 
                        type="button"
                        onClick={handleAIGenerate}
                        disabled={generatingAI || !formData.name}
                        className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium disabled:opacity-50 transition"
                    >
                        {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {generatingAI ? '生成中...' : 'AI 自动填充'}
                    </button>
                </div>
                <textarea 
                    rows={4}
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                    placeholder="输入产品描述..."
                ></textarea>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">由 Gemini 2.5 Flash 提供支持</p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition font-medium">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-lg hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition font-medium shadow-md">创建产品</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
