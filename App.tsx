
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
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
import ReportsManager from './components/crm/ReportsManager';
import ReportsDetail from './components/crm/ReportsDetail';
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
import AcceptanceManager from './components/order/AcceptanceManager';
import RenewalManager from './components/order/RenewalManager';
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
import CustomerInsight from './components/sab/CustomerInsight';
import SABCustomerList from './components/sab/SABCustomerList';
import SABCustomerDetail from './components/sab/SABCustomerDetail';

const RequireAnyPermission: React.FC<{ permissions: string[]; children: React.ReactElement }> = ({ permissions, children }) => {
  const { currentUser, roles } = useAppContext();
  const currentUserRole = roles.find((r) => r.id === currentUser.role);
  const rolePermissions = currentUserRole?.permissions || [];
  const canAccess = rolePermissions.includes('all') || permissions.some((p) => rolePermissions.includes(p));
  return canAccess ? children : <Navigate to="/" replace />;
};

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

        <Route path="/orders" element={<ErrorBoundary fallbackTitle="订单列表加载异常"><OrderManager /></ErrorBoundary>} />
        <Route path="/orders/:id" element={<ErrorBoundary fallbackTitle="订单详情加载异常"><OrderDetails /></ErrorBoundary>} />
        <Route path="/renewals" element={<RenewalManager />} />

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

        <Route path="/reports" element={<ReportsManager />} />
        <Route path="/reports/:id" element={<ReportsDetail />} />

        <Route path="/contracts" element={<ContractManager />} />
        <Route path="/remittances" element={<RemittanceManager />} />
        <Route path="/invoices" element={<InvoiceManager />} />

        <Route path="/performance" element={<PerformanceManager />} />
        <Route path="/authorizations" element={<AuthorizationManager />} />
        <Route path="/delivery-info" element={<DeliveryInfoManager />} />
        <Route path="/acceptances" element={<AcceptanceManager />} />

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

        <Route path="/sab-insight" element={
          <RequireAnyPermission permissions={['sab_insight_view', 'customer_view']}>
            <CustomerInsight />
          </RequireAnyPermission>
        } />
        <Route path="/sab-insight/customer-list" element={
          <RequireAnyPermission permissions={['sab_insight_view', 'customer_view']}>
            <SABCustomerList />
          </RequireAnyPermission>
        } />
        <Route path="/sab-insight/customer/:id" element={
          <RequireAnyPermission permissions={['sab_insight_view', 'customer_view']}>
            <SABCustomerDetail />
          </RequireAnyPermission>
        } />

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
