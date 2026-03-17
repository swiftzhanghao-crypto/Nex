
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import Layout from './components/Layout';
import ProductManager from './components/ProductManager';
import OrderManager from './components/OrderManager';
import CustomerManager from './components/CustomerManager';
import UserManager from './components/UserManager';
import OrganizationManager from './components/OrganizationManager';
import ChannelManager from './components/ChannelManager';
import OpportunityManager from './components/OpportunityManager';
import ProductDetails from './components/ProductDetails';
import OrderDetails from './components/OrderDetails';
import CustomerDetails from './components/CustomerDetails';
import MerchandiseDetails from './components/MerchandiseDetails';
import ChannelDetails from './components/ChannelDetails';
import OpportunityDetails from './components/OpportunityDetails';
import LeadsManager from './components/LeadsManager';
import Dashboard from './components/Dashboard';
import ProductPreview from './components/ProductPreview';
import ProductCenter from './components/ProductCenter';
import ContractManager from './components/ContractManager';
import RemittanceManager from './components/RemittanceManager';
import InvoiceManager from './components/InvoiceManager';
import PerformanceManager from './components/PerformanceManager';
import AuthorizationManager from './components/AuthorizationManager';
import DeliveryInfoManager from './components/DeliveryInfoManager';

import {
    initialProducts, initialMerchandises, initialAtomicCapabilities,
    initialProductRights, initialRightPackages, initialLicenseDefs,
    initialDepartments, initialRoles, initialUsers, initialChannels,
    initialStandaloneEnterprises,
} from './data/staticData';
import {
    generateCustomers, generateOpportunities, generateOrders,
    generateContracts, generateRemittances, generateInvoices,
    generatePerformances, generateAuthorizations, generateDeliveryInfos,
} from './data/generators';

function App() {
  const [atomicCapabilities, setAtomicCapabilities] = useState(initialAtomicCapabilities);
  const [productRights, setProductRights] = useState(initialProductRights);
  const [rightPackages, setRightPackages] = useState(initialRightPackages);
  const [licenseDefs, setLicenseDefs] = useState(initialLicenseDefs);
  const [products, setProducts] = useState(initialProducts);
  const [merchandises, setMerchandises] = useState(initialMerchandises);
  const [departments, setDepartments] = useState(initialDepartments);
  const [roles, setRoles] = useState(initialRoles);
  const [users, setUsers] = useState(initialUsers);
  const [channels, setChannels] = useState(initialChannels);
  const [standaloneEnterprises] = useState(initialStandaloneEnterprises);

  const [currentUser, setCurrentUser] = useState(users[0]);

  const [customers, setCustomers] = useState(() => generateCustomers(users));
  const [opportunities, setOpportunities] = useState<ReturnType<typeof generateOpportunities>>([]);
  const [orders, setOrders] = useState<ReturnType<typeof generateOrders>>([]);

  const [contracts] = useState(() => generateContracts());
  const [remittances] = useState(() => generateRemittances());
  const [invoices] = useState(() => generateInvoices());
  const [performances] = useState(() => generatePerformances());
  const [authorizations] = useState(() => generateAuthorizations());
  const [deliveryInfos] = useState(() => generateDeliveryInfos());

  useEffect(() => {
    if (customers.length > 0) {
      setOpportunities(generateOpportunities(customers));
    }
  }, [customers]);

  useEffect(() => {
    if (customers.length === 0 || opportunities.length === 0 || products.length === 0 || channels.length === 0) return;
    setOrders(generateOrders({ customers, products, users, merchandises, opportunities, channels }));
  }, [customers, products, users, merchandises, opportunities, channels]);

  return (
    <Router>
      <Layout currentUser={currentUser} users={users} setCurrentUser={setCurrentUser} roles={roles}>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route path="/product-center" element={<ProductCenter products={products} currentUser={currentUser} roles={roles} />} />
          <Route path="/catalog/:id/preview" element={<ProductPreview products={products} currentUser={currentUser} roles={roles} />} />
          <Route path="/products" element={
            <ProductManager
                products={products} setProducts={setProducts}
                atomicCapabilities={atomicCapabilities} setAtomicCapabilities={setAtomicCapabilities}
                productRights={productRights} setProductRights={setProductRights}
                rightPackages={rightPackages} setRightPackages={setRightPackages}
                licenseDefs={licenseDefs} setLicenseDefs={setLicenseDefs}
                currentUser={currentUser} roles={roles}
            />
          } />
          <Route path="/products/:id" element={<ProductDetails products={products} setProducts={setProducts} rightPackages={rightPackages} licenseDefs={licenseDefs} />} />
          <Route path="/merchandises/:id" element={<MerchandiseDetails merchandises={merchandises} setMerchandises={setMerchandises} products={products} />} />

          <Route path="/orders" element={
            <OrderManager
                orders={orders} setOrders={setOrders}
                products={products}
                customers={customers}
                currentUser={currentUser}
                users={users}
                departments={departments}
                opportunities={opportunities}
                channels={channels}
                roles={roles}
                standaloneEnterprises={standaloneEnterprises}
            />
          } />
          <Route path="/orders/:id" element={
            <OrderDetails
                orders={orders} setOrders={setOrders} products={products}
                customers={customers} users={users} departments={departments}
                currentUser={currentUser} opportunities={opportunities}
                roles={roles}
            />
          } />

          <Route path="/customers" element={<CustomerManager customers={customers} setCustomers={setCustomers} users={users} />} />
          <Route path="/customers/:id" element={<CustomerDetails customers={customers} setCustomers={setCustomers} orders={orders} users={users} />} />

          <Route path="/users" element={<UserManager users={users} setUsers={setUsers} departments={departments} roles={roles} setRoles={setRoles} channels={channels} defaultTab="USERS" />} />
          <Route path="/roles" element={<UserManager users={users} setUsers={setUsers} departments={departments} roles={roles} setRoles={setRoles} channels={channels} defaultTab="ROLES" />} />
          <Route path="/organization" element={<OrganizationManager departments={departments} setDepartments={setDepartments} users={users} />} />

          <Route path="/channels" element={<ChannelManager channels={channels} setChannels={setChannels} />} />
          <Route path="/channels/:id" element={<ChannelDetails channels={channels} setChannels={setChannels} />} />

          <Route path="/opportunities" element={<OpportunityManager opportunities={opportunities} setOpportunities={setOpportunities} customers={customers} />} />
          <Route path="/opportunities/:id" element={<OpportunityDetails opportunities={opportunities} setOpportunities={setOpportunities} customers={customers} />} />

          <Route path="/contracts" element={<ContractManager contracts={contracts} />} />
          <Route path="/remittances" element={<RemittanceManager remittances={remittances} />} />
          <Route path="/invoices" element={<InvoiceManager invoices={invoices} />} />

          <Route path="/performance" element={<PerformanceManager performances={performances} />} />
          <Route path="/authorizations" element={<AuthorizationManager authorizations={authorizations} />} />
          <Route path="/delivery-info" element={<DeliveryInfoManager deliveryInfos={deliveryInfos} />} />

          <Route path="/leads" element={<LeadsManager />} />

          <Route path="/wps-ops" element={
            <div className="p-12 text-center">
              <Activity className="w-16 h-16 text-blue-500 mx-auto mb-4 opacity-20" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">WPS 运营中心</h2>
              <p className="text-gray-500 mt-2">该模块正在建设中，敬请期待。</p>
            </div>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
