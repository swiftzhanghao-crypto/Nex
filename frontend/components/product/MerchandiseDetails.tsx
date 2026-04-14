
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SalesMerchandise, SalesType } from '../../types';
import { ArrowLeft, ShoppingBag, Edit2, Save, Tag, Box, Layers } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';

const MerchandiseDetails: React.FC = () => {
  const { merchandises, setMerchandises, products } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const merchandise = merchandises.find(m => m.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<SalesMerchandise>>({});

  if (!merchandise) return <div className="p-10 text-center">商品未找到</div>;

  const handleEdit = () => {
    setFormData(merchandise);
    setIsEditing(true);
  };

  const handleSave = () => {
    setMerchandises(prev => prev.map(m => m.id === id ? { ...m, ...formData } as SalesMerchandise : m));
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400">
             <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
              <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{merchandise.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${merchandise.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                      {merchandise.status === 'Active' ? '上架中' : '已下架'}
                  </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                  <span className="font-mono">ID: {merchandise.id}</span>
              </div>
          </div>
        </div>
        <button 
            onClick={isEditing ? handleSave : handleEdit}
            className={`px-5 py-2 text-xs font-semibold rounded-full transition shadow-apple flex items-center gap-2
            ${isEditing ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80' : 'bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
            {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            {isEditing ? '保存' : '编辑'}
        </button>
      </div>

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <div className="unified-card dark:bg-[#1C1C1E] p-6 border-gray-100/50 dark:border-white/10">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-blue-500"/> 商品构成 (Items)
                    </h3>
                    <div className="space-y-4">
                        {merchandise.items.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <div className="p-2 bg-white dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/10 text-indigo-600 dark:text-indigo-400">
                                    <Box className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <div className="font-bold text-gray-900 dark:text-white">{item.productName}</div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">x {item.quantity}</div>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                        <Tag className="w-3 h-3" /> SKU: {item.skuName}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="unified-card dark:bg-[#1C1C1E] p-6 border-gray-100/50 dark:border-white/10">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">销售信息</h3>
                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">商品名称</label>
                                <input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full border rounded p-2 text-sm dark:bg-black dark:border-white/10 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">价格 (¥)</label>
                                <input type="number" value={formData.price} onChange={e=>setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full border rounded p-2 text-sm dark:bg-black dark:border-white/10 dark:text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">基准价格</span>
                                <span className="font-bold text-gray-900 dark:text-white">¥{merchandise.price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">定价策略</span>
                                <span className="text-sm text-gray-900 dark:text-white">{merchandise.pricingPolicy === 'Fixed' ? '固定一口价' : '允许议价'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">销售渠道</span>
                                <div className="flex gap-1">
                                    {merchandise.salesType.map(st => (
                                        <span key={st} className="text-xs bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{st === 'Direct' ? '直销' : '渠道'}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MerchandiseDetails;
