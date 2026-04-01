
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/layout/Layout';
import ProductManager from './components/product/ProductManager';
import OrderManager from './components/order/OrderManager';
import CustomerManager from './components/crm/CustomerManager';
import UserManager from './components/system/UserManager';
import OrganizationManager from './components/system/OrganizationManager';
import ChannelManager from './components/channel/ChannelManager';
import OpportunityManager from './components/crm/OpportunityManager';
import ProductDetails from './components/product/ProductDetails';
import OrderDetails from './components/order/OrderDetails';
import CustomerDetails from './components/crm/CustomerDetails';
import MerchandiseDetails from './components/product/MerchandiseDetails';
import ChannelDetails from './components/channel/ChannelDetails';

import LeadsManager from './components/crm/LeadsManager';
import Dashboard from './components/layout/Dashboard';
import ProductPreview from './components/product/ProductPreview';
import ProductCenter from './components/product/ProductCenter';
import ContractManager from './components/order/ContractManager';
import RemittanceManager from './components/order/RemittanceManager';
import InvoiceManager from './components/order/InvoiceManager';
import PerformanceManager from './components/performance/PerformanceManager';
import AuthorizationManager from './components/order/AuthorizationManager';
import DeliveryInfoManager from './components/order/DeliveryInfoManager';
import OperationsManager from './components/operations/OperationsManager';
import OpsEnterpriseManager from './components/operations/OpsEnterpriseManager';
import OpsDashboard from './components/operations/OpsDashboard';
import ProductComponentPoolManager from './components/product/ProductComponentPoolManager';
import ProductPackageManager from './components/product/ProductPackageManager';
import ProductLicenseTemplateManager from './components/product/ProductLicenseTemplateManager';
import ProductAttrConfigManager from './components/product/ProductAttrConfigManager';
import LicenseTypeManager from './components/product/LicenseTypeManager';
import DeliveryMethodConfig from './components/system/DeliveryMethodConfig';
import SalesOrgConfig from './components/system/SalesOrgConfig';
import ProductMsrpManager from './components/product/ProductMsrpManager';
import ProductChannelPriceManager from './components/product/ProductChannelPriceManager';
import ProductPolicyManager from './components/product/ProductPolicyManager';

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route path="/product-center" element={<ProductCenter />} />
        <Route path="/product-policy" element={<ProductPolicyManager />} />
        <Route path="/catalog/:id/preview" element={<ProductPreview />} />
        <Route path="/products" element={<ProductManager />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/merchandises/:id" element={<MerchandiseDetails />} />

        <Route path="/orders" element={<OrderManager />} />
        <Route path="/orders/:id" element={<OrderDetails />} />

        <Route path="/customers" element={<CustomerManager />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />

        <Route path="/users" element={<UserManager defaultTab="USERS" />} />
        <Route path="/roles" element={<UserManager defaultTab="ROLES" />} />
        <Route path="/organization" element={<OrganizationManager />} />
        <Route path="/system/license-types" element={<LicenseTypeManager />} />
        <Route path="/system/delivery-methods" element={<DeliveryMethodConfig />} />
        <Route path="/system/sales-org" element={<SalesOrgConfig />} />

        <Route path="/channels" element={<ChannelManager />} />
        <Route path="/channels/:id" element={<ChannelDetails />} />

        <Route path="/opportunities" element={<OpportunityManager />} />

        <Route path="/contracts" element={<ContractManager />} />
        <Route path="/remittances" element={<RemittanceManager />} />
        <Route path="/invoices" element={<InvoiceManager />} />

        <Route path="/performance" element={<PerformanceManager />} />
        <Route path="/authorizations" element={<AuthorizationManager />} />
        <Route path="/delivery-info" element={<DeliveryInfoManager />} />

        <Route path="/leads" element={<LeadsManager />} />

        {/* 产品管理子路由 */}
        <Route path="/product-manage/component-pool" element={<ProductComponentPoolManager />} />
        <Route path="/product-manage/packages" element={<ProductPackageManager />} />
        <Route path="/product-manage/license-templates" element={<ProductLicenseTemplateManager />} />
        <Route path="/product-manage/attr-config" element={<ProductAttrConfigManager />} />

        {/* 产品报价子路由 */}
        <Route path="/product-pricing/msrp" element={<ProductMsrpManager />} />
        <Route path="/product-pricing/channel" element={<ProductChannelPriceManager />} />

        {/* 运营中心 */}
        <Route path="/wps-ops" element={<OperationsManager />} />
        <Route path="/ops/dashboard" element={<OpsDashboard />} />
        <Route path="/ops/enterprise" element={<OpsEnterpriseManager />} />
        <Route path="/ops/*" element={<OperationsManager />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;
