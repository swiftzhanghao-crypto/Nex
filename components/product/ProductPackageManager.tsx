import React from 'react';
import InstallPackageManager from './InstallPackageManager';

const ProductPackageManager: React.FC = () => {
  return (
    <div className="h-full flex flex-col overflow-hidden animate-page-enter">
      <InstallPackageManager />
    </div>
  );
};

export default ProductPackageManager;
