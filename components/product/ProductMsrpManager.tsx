import React from 'react';
import { Tag } from 'lucide-react';

const ProductMsrpManager: React.FC = () => {
  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">建议销售价</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理产品建议零售价格</p>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400 dark:text-gray-600 gap-4">
        <Tag className="w-14 h-14 opacity-20" />
        <p className="text-base font-semibold">建议销售价</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">该模块正在建设中</p>
      </div>
    </div>
  );
};

export default ProductMsrpManager;
