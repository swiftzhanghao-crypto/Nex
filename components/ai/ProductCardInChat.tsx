import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Package, Tag } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

interface ProductCardInChatProps {
  productId: string;
  onClose?: () => void;
}

const getTagColor = (tag: string) => {
  const t = tag.toUpperCase();
  if (t.includes('IM')) return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30';
  if (t.includes('AI')) return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30';
  if (t.includes('生态')) return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30';
  return 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10';
};

const ProductCardInChat: React.FC<ProductCardInChatProps> = ({ productId, onClose }) => {
  const { filteredProducts: products } = useAppContext();
  const navigate = useNavigate();
  const product = products.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-white/10 px-4 py-3 max-w-md">
        <div className="text-xs text-gray-400">未找到产品 <span className="font-mono text-gray-600 dark:text-gray-300">{productId}</span></div>
      </div>
    );
  }

  const handleClick = () => {
    onClose?.();
    navigate(`/products/${product.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md cursor-pointer transition-all overflow-hidden max-w-md"
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-[#007AFF] dark:text-[#0A84FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                {product.name}
              </h3>
              {product.status === 'OffShelf' ? (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500">
                  已下架
                </span>
              ) : (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                  在架
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{product.id}</p>
          </div>
        </div>

        {/* SKU */}
        {product.skus && product.skus.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 font-medium shrink-0">规格</span>
            <div className="flex flex-wrap gap-1 min-w-0">
              {product.skus.slice(0, 3).map(sku => (
                <span key={sku.id} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-blue-50 text-[#007AFF] border border-blue-100 dark:bg-blue-900/20 dark:text-[#0A84FF] dark:border-blue-900/30">
                  {sku.name}
                </span>
              ))}
              {product.skus.length > 3 && (
                <span className="text-[10px] text-gray-400 self-center">+{product.skus.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {/* Components */}
        {product.composition && product.composition.length > 0 && (
          <div className="flex items-start gap-1.5">
            <span className="text-[10px] text-gray-400 font-medium shrink-0 mt-0.5">组件</span>
            <div className="flex flex-wrap gap-1 min-w-0">
              {product.composition.slice(0, 4).map(c => (
                <span
                  key={c.id}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                    c.type === 'Feature'
                      ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30'
                      : c.type === 'Service'
                      ? 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-900/30'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                  }`}
                >
                  {c.name}
                </span>
              ))}
              {product.composition.length > 4 && (
                <span className="text-[10px] text-gray-400 self-center">+{product.composition.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Tags + Arrow */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-white/5">
          <div className="flex flex-wrap gap-1">
            {product.tags?.map(tag => (
              <span key={tag} className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getTagColor(tag)}`}>
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardInChat;
