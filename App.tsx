
import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoginModal from './components/auth/LoginModal';

const SSOCallback = React.lazy(() => import('./components/auth/SSOCallback'));
const CrmXsyCallback = React.lazy(() => import('./components/auth/CrmXsyCallback'));

const Dashboard = React.lazy(() => import('./components/layout/Dashboard'));
const ProductCenter = React.lazy(() => import('./components/product/ProductCenter'));
const ProductManager = React.lazy(() => import('./components/product/ProductManager'));
const ProductCreateWizard = React.lazy(() => import('./components/product/ProductCreateWizard'));
const ProductDetails = React.lazy(() => import('./components/product/ProductDetails'));
const ProductPreview = React.lazy(() => import('./components/product/ProductPreview'));
const MerchandiseDetails = React.lazy(() => import('./components/product/MerchandiseDetails'));
const ProductPolicyManager = React.lazy(() => import('./components/product/ProductPolicyManager'));
const ProductComponentPoolManager = React.lazy(() => import('./components/product/ProductComponentPoolManager'));
const ProductPackageManager = React.lazy(() => import('./components/product/ProductPackageManager'));
const ProductLicenseTemplateManager = React.lazy(() => import('./components/product/ProductLicenseTemplateManager'));
const ProductServiceConfigManager = React.lazy(() => import('./components/product/ProductServiceConfigManager'));
const ProductAttrConfigManager = React.lazy(() => import('./components/product/ProductAttrConfigManager'));
const ProductMsrpManager = React.lazy(() => import('./components/product/ProductMsrpManager'));
const ProductChannelPriceManager = React.lazy(() => import('./components/product/ProductChannelPriceManager'));

const OrderManager = React.lazy(() => import('./components/order/OrderManager'));
const OrderDetails = React.lazy(() => import('./components/order/OrderDetails'));
const RenewalManager = React.lazy(() => import('./components/order/RenewalManager'));
const ContractManager = React.lazy(() => import('./components/order/ContractManager'));
const RemittanceManager = React.lazy(() => import('./components/order/RemittanceManager'));
const InvoiceManager = React.lazy(() => import('./components/order/InvoiceManager'));
const AcceptanceManager = React.lazy(() => import('./components/order/AcceptanceManager'));
const AuthorizationManager = React.lazy(() => import('./components/order/AuthorizationManager'));
const DeliveryInfoManager = React.lazy(() => import('./components/order/DeliveryInfoManager'));

const CustomerManager = React.lazy(() => import('./components/crm/CustomerManager'));
const CustomerDetails = React.lazy(() => import('./components/crm/CustomerDetails'));
const OpportunityManager = React.lazy(() => import('./components/crm/OpportunityManager'));
const LeadsManager = React.lazy(() => import('./components/crm/LeadsManager'));
const ReportsManager = React.lazy(() => import('./components/crm/ReportsManager'));
const ReportsDetail = React.lazy(() => import('./components/crm/ReportsDetail'));

const UserManager = React.lazy(() => import('./components/system/UserManager'));
const OrganizationManager = React.lazy(() => import('./components/system/OrganizationManager'));
const LicenseTypeManager = React.lazy(() => import('./components/product/LicenseTypeManager'));
const DeliveryMethodConfig = React.lazy(() => import('./components/system/DeliveryMethodConfig'));
const SalesOrgConfig = React.lazy(() => import('./components/system/SalesOrgConfig'));

const ChannelManager = React.lazy(() => import('./components/channel/ChannelManager'));
const ChannelDetails = React.lazy(() => import('./components/channel/ChannelDetails'));

const PerformanceManager = React.lazy(() => import('./components/performance/PerformanceManager'));

const OpsEnterpriseManager = React.lazy(() => import('./components/operations/OpsEnterpriseManager'));
const OpsDashboard = React.lazy(() => import('./components/operations/OpsDashboard'));

const CustomerInsight = React.lazy(() => import('./components/sab/CustomerInsight'));
const SABCustomerList = React.lazy(() => import('./components/sab/SABCustomerList'));
const SABCustomerDetail = React.lazy(() => import('./components/sab/SABCustomerDetail'));

const PageSpinner: React.FC = () => (
  <div className="h-full flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const OpsPlaceholder: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-4 animate-fade-in">
    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
      <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0 0l2.25-2.25M9.75 15l2.25 2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>
    </div>
    <p className="text-base font-medium">当前页面暂未开放</p>
    <p className="text-sm text-gray-400 dark:text-gray-600">该功能尚在规划中，敬请期待</p>
  </div>
);

const RequireAnyPermission: React.FC<{ permissions: string[]; children: React.ReactElement }> = ({ permissions, children }) => {
  const { currentUser, roles } = useAppContext();
  const currentUserRole = roles.find((r) => currentUser.roles?.includes(r.id));
  const rolePermissions = currentUserRole?.permissions || [];
  const canAccess = rolePermissions.includes('all') || permissions.some((p) => rolePermissions.includes(p));
  return canAccess ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <Layout>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="/crm-callback" element={<CrmXsyCallback />} />
          <Route path="/" element={<Dashboard />} />

          <Route path="/product-center" element={<ProductCenter />} />
          <Route path="/product-policy" element={<ProductPolicyManager />} />
          <Route path="/catalog/:id/preview" element={<ProductPreview />} />
          <Route path="/products" element={<ProductManager />} />
          <Route path="/products/create" element={<ProductCreateWizard />} />
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

          <Route path="/product-manage/component-pool" element={<ProductComponentPoolManager />} />
          <Route path="/product-manage/packages" element={<ProductPackageManager />} />
          <Route path="/product-manage/license-templates" element={<ProductLicenseTemplateManager />} />
          <Route path="/product-manage/service-config" element={<ProductServiceConfigManager />} />
          <Route path="/product-manage/attr-config" element={<ProductAttrConfigManager />} />

          <Route path="/product-pricing/msrp" element={<ProductMsrpManager />} />
          <Route path="/product-pricing/channel" element={<ProductChannelPriceManager />} />

          <Route path="/wps-ops" element={<Navigate to="/ops/dashboard" replace />} />
          <Route path="/ops/dashboard" element={<OpsDashboard />} />
          <Route path="/ops/enterprise" element={<OpsEnterpriseManager />} />
          <Route path="/ops/*" element={<OpsPlaceholder />} />

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
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router>
          <ErrorBoundary fallbackTitle="页面加载异常">
            <AppRoutes />
          </ErrorBoundary>
          <LoginModal />
        </Router>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
