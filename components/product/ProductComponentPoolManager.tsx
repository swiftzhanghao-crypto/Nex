import React from 'react';
import { ListTree } from 'lucide-react';

const ProductComponentPoolManager: React.FC = () => {
  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">组件池</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理产品组件清单</p>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400 dark:text-gray-600 gap-4">
        <ListTree className="w-14 h-14 opacity-20" />
        <p className="text-base font-semibold">组件池</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">该模块正在建设中</p>
      </div>
    </div>
  );
};

export default ProductComponentPoolManager;
