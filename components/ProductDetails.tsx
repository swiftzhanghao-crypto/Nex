
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, InstallPackage, CpuArchitecture, ProductSku, LicenseTemplateConfig } from '../types';
import { ArrowLeft, Package, Tag, Box, CreditCard, Activity, Archive, ArrowUpCircle, ShieldCheck, Download, Monitor, Smartphone, Laptop, Edit3, Save, X, Plus, Cpu, HardDrive, Trash2, List, Check } from 'lucide-react';

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
  
  // SKU Management State
  const [newSku, setNewSku] = useState<Partial<ProductSku>>({ name: '', price: 0, stock: 0, description: '', code: '' });
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  const [tempSkuData, setTempSkuData] = useState<ProductSku | null>(null);

  useEffect(() => { if (product) setFormData(product); }, [product]);
  if (!product || !formData) return <div>Not Found</div>;

  const handleSave = () => { if(!formData)return; setProducts(prev=>prev.map(p=>p.id===formData.id?formData:p)); setIsEditing(false); };
  const handleCancel = () => { setFormData(product); setIsEditing(false); setEditingSkuId(null); };
  
  // SKU Handlers
  const handleAddSku = () => {
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
      
      const sku: ProductSku = { 
          id: `sku-${Date.now()}`, 
          name: newSku.name || '新规格', 
          code: newSkuCode, 
          price: Number(newSku.price), 
          stock: Number(newSku.stock || 0), 
          description: newSku.description 
      };
      
      setFormData(prev => prev ? ({ ...prev, skus: [...(prev.skus || []), sku] }) : null);
      setNewSku({ name: '', price: 0, stock: 0, description: '', code: '' });
  };

  const handleRemoveSku = (skuId: string) => {
      if(confirm('确定要删除此 SKU 吗？')) {
        setFormData(prev => prev ? ({ ...prev, skus: prev.skus.filter(s=>s.id !== skuId) }) : null);
      }
  };

  const startEditSku = (sku: ProductSku) => {
      setEditingSkuId(sku.id);
      setTempSkuData({ ...sku });
  };

  const saveSku = () => {
      if (!tempSkuData || !formData) return;
      setFormData({
          ...formData,
          skus: formData.skus.map(s => s.id === tempSkuData.id ? tempSkuData : s)
      });
      setEditingSkuId(null);
      setTempSkuData(null);
  };

  const cancelEditSku = () => {
      setEditingSkuId(null);
      setTempSkuData(null);
  };
  
  const minPrice = formData.skus && formData.skus.length > 0 ? Math.min(...formData.skus.map(s => s.price)) : 0;
  const totalStock = formData.skus ? formData.skus.reduce((acc, sku) => acc + sku.stock, 0) : 0;

  const renderView = () => (
    <div className="flex flex-col h-full bg-[#F5F5F7]">
      {/* Sticky Header - Apple Pro Style */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
               <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">{formData.name}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${formData.status === 'OnShelf' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {formData.status === 'OnShelf' ? '销售中' : '已下架'}
                    </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{formData.category} · {formData.skus.length} SKU</div>
            </div>
          </div>
          <button 
              onClick={() => setIsEditing(true)}
              className="px-5 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition shadow-sm"
          >
              编辑
          </button>
      </div>

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Key Stats */}
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-3xl shadow-apple border border-gray-100/50">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">参考价格</div>
              <div className="text-3xl font-bold text-[#0071E3] tracking-tight">
                  ¥{minPrice.toLocaleString()} <span className="text-sm text-gray-400 font-normal">起</span>
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl shadow-apple border border-gray-100/50">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">总库存</div>
              <div className={`text-2xl font-bold ${totalStock < 20 ? 'text-orange-500' : 'text-gray-900'}`}>
                {totalStock} <span className="text-sm font-normal text-gray-500">件</span>
              </div>
            </div>

            {/* Config Card */}
             <div className="p-6 bg-white rounded-3xl shadow-apple border border-gray-100/50">
                <div className="flex items-center gap-2 text-gray-900 mb-4 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#0071E3]" />
                    授权配置
                </div>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">显示期限</span>
                        <span className="font-medium text-gray-900">{formData.licenseTemplate?.showLicensePeriod ? '开启' : '关闭'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">显示范围</span>
                         <span className="font-medium text-gray-900">{formData.licenseTemplate?.showLicenseScope ? '开启' : '关闭'}</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-apple border border-gray-100/50 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">产品描述</h3>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                {formData.description || "暂无描述"}
              </div>
            </div>

            {/* SKU Table */}
            <div className="bg-white rounded-3xl shadow-apple border border-gray-100/50 overflow-hidden">
                <div className="p-6 border-b border-gray-100/50">
                    <h3 className="text-lg font-bold text-gray-900">产品规格 (SKUs)</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 text-gray-400">
                        <tr>
                            <th className="p-4 pl-6 font-medium">编码</th>
                            <th className="p-4 font-medium">名称</th>
                            <th className="p-4 font-medium">价格</th>
                            <th className="p-4 font-medium">库存</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {formData.skus.map((sku, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 group">
                                <td className="p-4 pl-6">
                                    <div className="font-mono text-gray-500">{sku.code}</div>
                                    <div className="text-xs text-gray-400 mt-1">{sku.description}</div>
                                </td>
                                <td className="p-4 font-medium text-gray-900">{sku.name}</td>
                                <td className="p-4 font-bold text-gray-900">¥{sku.price.toLocaleString()}</td>
                                <td className="p-4 text-gray-600">{sku.stock}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEdit = () => (
      <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">编辑产品</h2>
            <div className="flex gap-3">
                <button onClick={handleCancel} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition">取消</button>
                <button onClick={handleSave} className="px-4 py-2 bg-[#0071E3] text-white rounded-full text-sm font-medium hover:bg-blue-600 transition shadow-lg">保存</button>
            </div>
        </div>
        
        <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
            <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-400" /> 基本信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                        <input value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
                        <input value={formData.category} onChange={e=>setFormData({...formData,category:e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} rows={3} className="w-full p-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition resize-none" />
                </div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <List className="w-5 h-5 text-gray-400" /> 规格管理 (SKUs)
                    </h3>
                    <div className="text-xs text-gray-400">共 {formData.skus.length} 个规格</div>
                </div>
                
                <div className="space-y-4">
                    {formData.skus.map(sku => (
                        <div key={sku.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 transition hover:border-blue-100 hover:shadow-sm">
                            {editingSkuId === sku.id && tempSkuData ? (
                                <div className="space-y-4">
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                         <div className="col-span-2">
                                            <label className="text-xs text-gray-500 block mb-1">名称</label>
                                            <input value={tempSkuData.name} onChange={e=>setTempSkuData({...tempSkuData, name: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                                         </div>
                                         <div className="col-span-2">
                                            <label className="text-xs text-gray-500 block mb-1">编码</label>
                                            <input value={tempSkuData.code} onChange={e=>setTempSkuData({...tempSkuData, code: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none font-mono" />
                                         </div>
                                         <div>
                                            <label className="text-xs text-gray-500 block mb-1">价格 (¥)</label>
                                            <input type="number" value={tempSkuData.price} onChange={e=>setTempSkuData({...tempSkuData, price: parseFloat(e.target.value)})} className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                                         </div>
                                         <div>
                                            <label className="text-xs text-gray-500 block mb-1">库存</label>
                                            <input type="number" value={tempSkuData.stock} onChange={e=>setTempSkuData({...tempSkuData, stock: parseInt(e.target.value)})} className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                                         </div>
                                         <div className="col-span-2 md:col-span-2">
                                            <label className="text-xs text-gray-500 block mb-1">描述</label>
                                            <input value={tempSkuData.description || ''} onChange={e=>setTempSkuData({...tempSkuData, description: e.target.value})} className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                                         </div>
                                     </div>
                                     <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50">
                                         <button onClick={cancelEditSku} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">取消</button>
                                         <button onClick={saveSku} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"><Check className="w-3 h-3"/> 保存</button>
                                     </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                         <div className="flex items-center gap-2">
                                            <div className="font-bold text-sm text-gray-900">{sku.name}</div>
                                            <div className="text-xs font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">{sku.code}</div>
                                         </div>
                                         <div className="text-xs text-gray-500 mt-1">{sku.description || "无描述"}</div>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">¥{sku.price.toLocaleString()}</div>
                                            <div className={`text-xs font-medium ${sku.stock < 10 ? 'text-orange-500' : 'text-gray-500'}`}>库存: {sku.stock}</div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={()=>startEditSku(sku)} className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-blue-600 hover:border-blue-200 transition"><Edit3 className="w-3.5 h-3.5"/></button>
                                            <button onClick={()=>handleRemoveSku(sku.id)} className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-red-600 hover:border-red-200 transition"><Trash2 className="w-3.5 h-3.5"/></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add New SKU Form */}
                <div className="mt-6 bg-gray-50/50 p-5 rounded-2xl border border-dashed border-gray-300 hover:border-blue-300 transition group">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <Plus className="w-3 h-3" /> 添加新规格
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                         <div className="md:col-span-2">
                             <input placeholder="SKU 名称 (例如：企业版 10人)" value={newSku.name} onChange={e=>setNewSku({...newSku, name:e.target.value})} className="w-full p-2.5 bg-white rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                         </div>
                         <input placeholder="价格 (¥)" type="number" value={newSku.price || ''} onChange={e=>setNewSku({...newSku, price:parseFloat(e.target.value)})} className="p-2.5 bg-white rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                         <input placeholder="库存数量" type="number" value={newSku.stock || ''} onChange={e=>setNewSku({...newSku, stock:parseInt(e.target.value)})} className="p-2.5 bg-white rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                         <input placeholder="描述 (可选)" value={newSku.description || ''} onChange={e=>setNewSku({...newSku, description:e.target.value})} className="md:col-span-4 p-2.5 bg-white rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <button 
                        onClick={handleAddSku} 
                        disabled={!newSku.name || !newSku.price}
                        className="mt-4 w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                    >
                        添加 SKU
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-2">编码将自动生成，添加后可编辑。</p>
                </div>
            </div>
        </div>
      </div>
  );

  return isEditing ? renderEdit() : renderView();
};

export default ProductDetails;
