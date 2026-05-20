import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import type { AuthTypeData, Product } from '../../../types';

interface ProductAuthTypesSectionProps {
  product: Product;
  authTypes: AuthTypeData[];
}

function purchaseUnitFor(name: string): string {
  if (name.includes('场地') || name.includes('服务器')) return '台';
  if (name.includes('零售')) return '套';
  return '套';
}

function auxUnitFor(name: string): string {
  if (name.includes('用户')) return '用户数';
  if (name.includes('并发')) return '并发数';
  if (name.includes('场地')) return '点';
  if (name.includes('字数') || name.includes('额度')) return '额度';
  if (name.includes('次数') || name.includes('计次')) return '次';
  return '点';
}

const ProductAuthTypesSection: React.FC<ProductAuthTypesSectionProps> = ({ product, authTypes }) => {
  const productAuthTypes = useMemo(() => {
    const usedAuthNames = new Set<string>();
    const primarySku = product.skus?.[0];
    if (primarySku) {
      (primarySku.pricingOptions || []).forEach((opt) => {
        const label = opt.title || opt.name;
        if (label) usedAuthNames.add(label);
      });
    }
    return authTypes.filter((at) => usedAuthNames.has(at.name));
  }, [product.skus, authTypes]);

  return (
    <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">授权类型明细</h3>
        <span className="text-xs text-gray-400 ml-1">({productAuthTypes.length})</span>
      </div>
      {productAuthTypes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="unified-table-header">
              <tr>
                <th className="px-5 py-3 w-10">#</th>
                <th className="px-5 py-3">授权类型</th>
                <th className="px-5 py-3">定价周期</th>
                <th className="px-5 py-3">购买单位</th>
                <th className="px-5 py-3">辅助购买单位</th>
                <th className="px-5 py-3">渠道授权书模版</th>
                <th className="px-5 py-3">直签授权书模版</th>
                <th className="px-5 py-3">在售状态</th>
                <th className="px-5 py-3">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {productAuthTypes.map((at, idx) => {
                const channelTpl = `渠道授权书_${at.name}.docx`;
                const directTpl = `直签授权书_${at.name}.docx`;
                return (
                  <tr key={at.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{at.name}</td>
                    <td className="px-6 py-3 text-xs">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          at.period === '周期性'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {at.period}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{purchaseUnitFor(at.name)}</td>
                    <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{auxUnitFor(at.name)}</td>
                    <td className="px-6 py-3 text-xs">
                      <span
                        className="text-[#0071E3] dark:text-[#0A84FF] hover:underline cursor-pointer truncate max-w-[160px] block"
                        title={channelTpl}
                      >
                        {channelTpl}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <span
                        className="text-[#0071E3] dark:text-[#0A84FF] hover:underline cursor-pointer truncate max-w-[160px] block"
                        title={directTpl}
                      >
                        {directTpl}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                        标准在售
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                        启用
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <FileText className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <div className="text-sm text-gray-400 dark:text-gray-500">暂无关联的授权类型</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            在产品的授权方案中关联授权类型后，此处将自动展示
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAuthTypesSection;
