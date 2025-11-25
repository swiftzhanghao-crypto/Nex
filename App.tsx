
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrderManager from './components/OrderManager';
import OrderDetails from './components/OrderDetails';
import ProductManager from './components/ProductManager';
import CustomerManager from './components/CustomerManager';
import CustomerDetails from './components/CustomerDetails';
import ProductDetails from './components/ProductDetails';
import UserManager from './components/UserManager';
import OrganizationManager from './components/OrganizationManager';
import ChannelManager from './components/ChannelManager';
import ChannelDetails from './components/ChannelDetails';
import OpportunityManager from './components/OpportunityManager';
import OpportunityDetails from './components/OpportunityDetails';
import ProjectManager from './components/ProjectManager';
import ProjectDetails from './components/ProjectDetails';
import { Order, Product, Customer, OrderStatus, User, Department, ApprovalRecord, UserRole, CustomerType, CustomerLevel, OrderItem, Enterprise, CustomerContact, Channel, Opportunity, Project, OpportunityStage, ProjectStatus, ActivationMethod } from './types';

const App: React.FC = () => {
  // --- 1. Products Mock Data ---
  const [products, setProducts] = useState<Product[]>([
    { 
      id: 'P00000001', 
      name: 'WPS Office 年度超级会员', 
      category: '会员服务', 
      description: '尊享PDF转换、云空间扩容、无广告等特权。适合个人高效办公需求，支持多端同步。', 
      status: 'OnShelf',
      skus: [
        { id: 'sku1', code: 'SKU00000001', name: '个人年卡', price: 179.00, stock: 5000, description: '1年有效期' },
        { id: 'sku2', code: 'SKU00000002', name: '个人季卡', price: 59.00, stock: 2000, description: '3个月有效期' },
        { id: 'sku3', code: 'SKU00000003', name: '家庭版 (6人/年)', price: 399.00, stock: 500, description: '支持6个账号' }
      ],
      installPackages: [
          { id: 'p1', name: 'WPS Office for Windows', version: '12.8.0', os: 'Windows', cpuArchitecture: 'x86_64' },
          { id: 'p2', name: 'WPS Office for Mac (M1/M2)', version: '6.2.0', os: 'macOS', cpuArchitecture: 'ARM64' },
          { id: 'p3', name: 'WPS Office Mobile', version: 'Latest', os: 'Android/iOS', cpuArchitecture: 'Universal' }
      ],
      licenseTemplate: { showLicensePeriod: true, showLicenseScope: true }
    },
    { 
      id: 'P00000002', 
      name: 'WPS 365 商业版', 
      category: '企业服务', 
      description: '专为小微团队打造，包含在线协作文档、企业通讯录、基础管理后台，提升团队协作效率。', 
      status: 'OnShelf',
      skus: [
        { id: 'sku4', code: 'SKU00000004', name: '基础版 (5人团队包)', price: 999.00, stock: 200, description: '含5个账号' },
        { id: 'sku5', code: 'SKU00000005', name: '专业版 (每用户/年)', price: 365.00, stock: 1000, description: '增加高级安全管控' },
        { id: 'sku6', code: 'SKU00000006', name: '旗舰版 (包含AI能力)', price: 599.00, stock: 500, description: '含WPS AI企业版' }
      ],
      installPackages: [
          { id: 'p4', name: 'WPS 365 企业客户端 (Win)', version: '2.0.5', os: 'Windows', cpuArchitecture: 'x86_64' },
          { id: 'p5', name: 'WPS 365 企业客户端 (Mac)', version: '2.0.5', os: 'macOS', cpuArchitecture: 'ARM64' }
      ],
      licenseTemplate: { showLicensePeriod: true, showLicenseScope: true, customTerms: '仅限企业内部使用，禁止转售。' }
    },
    { 
      id: 'P00000003', name: 'WPS AI 会员', category: 'AI服务', description: '体验强大的WPS AI能力，包括智能写作、PPT一键生成。', status: 'OnShelf',
      skus: [{ id: 'sku7', code: 'SKU00000007', name: '连续包月', price: 29.90, stock: 10000 }, { id: 'sku8', code: 'SKU00000008', name: '年度会员', price: 299.00, stock: 5000 }]
    },
    { 
      id: 'P00000004', name: '金山文档企业版', category: '企业服务', description: '专注于即时协作的企业级文档解决方案。', status: 'OnShelf',
      skus: [{ id: 'sku9', code: 'SKU00000009', name: '团队标准版', price: 3600.00, stock: 50 }]
    },
    { 
      id: 'P00000010', 
      name: 'WPS Office 2019 信创版', 
      category: '信创产品', 
      description: '适配国产操作系统与芯片，符合国家信创标准，政企办公首选。', 
      status: 'OnShelf',
      skus: [
          { id: 'sku19', code: 'SKU00000019', name: '单机授权', price: 498.00, stock: 80 },
          { id: 'sku20', code: 'SKU00000020', name: '批量授权 (100点)', price: 39800.00, stock: 20 }
      ],
      installPackages: [
          { id: 'p9', name: 'WPS Linux (UOS)', version: '11.8.2.1', os: 'UOS', cpuArchitecture: 'ARM64' },
          { id: 'p12', name: 'WPS Windows 11 ARM', version: '12.0.1', os: 'Windows', cpuArchitecture: 'ARM64' }
      ]
    },
  ]);

  // --- 2. Departments Mock Data ---
  const [departments, setDepartments] = useState<Department[]>([
      { id: 'root', name: 'NexOrder 总部', description: '公司最高管理机构' },
      { id: 'c1', name: '研发中心', description: '负责全线产品研发', parentId: 'root' },
      { id: 'c2', name: '营销中心', description: '负责市场推广与销售', parentId: 'root' },
      { id: 'c3', name: '运营中心', description: '负责交付与服务', parentId: 'root' },
      { id: 'c4', name: '职能中心', description: '人财法', parentId: 'root' },
      { id: 'c2-d1', name: '国内销售部', description: '大陆地区业务', parentId: 'c2' },
      { id: 'c2-d2', name: '海外销售部', description: '国际化业务', parentId: 'c2' },
      { id: 'c2-d3', name: '品牌公关部', description: '市场活动', parentId: 'c2' },
      { id: 'c2-d1-r1', name: '华北区', description: '京津冀', parentId: 'c2-d1' }, 
      { id: 'c2-d1-r2', name: '华东区', description: '江浙沪', parentId: 'c2-d1' },
      { id: 'c2-d1-r3', name: '华南区', description: '广深', parentId: 'c2-d1' },
      { id: 'c2-d1-r1-t1', name: '北京销售组', description: '北京客户', parentId: 'c2-d1-r1' },
      { id: 'c3-d1', name: '商务部', description: '合同与流程', parentId: 'c3' },
      { id: 'c3-d2', name: '物流部', description: '发货与库存', parentId: 'c3' },
      { id: 'c1-d1', name: '技术支持部', description: '售前售后技术', parentId: 'c1' },
  ]);

  // --- 3. Users Mock Data ---
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: '张伟 (Admin)', email: 'zhangwei@nexorder.com', role: 'Admin', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=张伟&background=random', departmentId: 'root' },
    { id: 'u2', name: '李娜 (Sales)', email: 'lina@nexorder.com', role: 'Sales', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=李娜&background=random', departmentId: 'c2-d1-r1-t1' },
    { id: 'u3', name: '王强 (Business)', email: 'wangqiang@nexorder.com', role: 'Business', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=王强&background=random', departmentId: 'c3-d1' },
    { id: 'u4', name: '赵敏 (Technical)', email: 'zhaomin@nexorder.com', role: 'Technical', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=赵敏&background=random', departmentId: 'c1-d1' },
    { id: 'u5', name: '孙涛 (Logistics)', email: 'suntao@nexorder.com', role: 'Logistics', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=孙涛&background=random', departmentId: 'c3-d2' },
    { id: 'u6', name: '周杰 (Sales)', email: 'zhoujie@nexorder.com', role: 'Sales', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=周杰&background=random', departmentId: 'c2-d1-r2' },
    { id: 'u7', name: '吴刚 (Sales)', email: 'wugang@nexorder.com', role: 'Sales', status: 'Inactive', avatar: 'https://ui-avatars.com/api/?name=吴刚&background=random', departmentId: 'c2-d1-r3' },
    { id: 'u8', name: '郑华 (Finance)', email: 'zhenghua@nexorder.com', role: 'Business', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=郑华&background=random', departmentId: 'c4' },
  ]);
  const [currentUser, setCurrentUser] = useState<User>(users[0]);

  // --- 4. Customers Mock Data (Massive Generation) ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  useEffect(() => {
    const industries = ['互联网', '金融', '教育', '制造', '政府', '医疗', '零售'];
    const regions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉'];
    const types: CustomerType[] = ['Enterprise', 'SMB', 'Government', 'Education', 'Partner'];
    const levels: CustomerLevel[] = ['KA', 'A', 'B', 'C'];
    
    const initialCustomers: Customer[] = Array.from({ length: 60 }).map((_, i) => {
        const id = `C${(i + 1).toString().padStart(8, '0')}`;
        const name = `${['科技', '发展', '贸易', '网络', '信息', '实业'][i % 6]}有限公司`;
        const prefix = ['华兴', '信达', '中科', '远洋', '天行', '博大', '瑞通', '金桥', '海纳', '智汇'][i % 10];
        const companyName = `${prefix}${name}`;
        const owner = users.filter(u => u.role === 'Sales')[i % users.filter(u => u.role === 'Sales').length];
        
        return {
            id,
            companyName,
            industry: industries[i % industries.length],
            customerType: types[i % types.length],
            level: levels[i % levels.length],
            region: regions[i % regions.length],
            address: `${regions[i % regions.length]}市高新区科技路 ${100 + i} 号`,
            shippingAddress: `${regions[i % regions.length]}市高新区科技路 ${100 + i} 号`,
            status: Math.random() > 0.1 ? 'Active' : 'Inactive',
            logo: `https://ui-avatars.com/api/?name=${companyName.substring(0,2)}&background=random&color=fff`,
            contacts: [
                { id: `ct-${i}-1`, name: '陈经理', phone: `1390000${1000+i}`, email: `contact@${id.toLowerCase()}.com`, position: '采购经理', roles: ['Purchasing'], isPrimary: true },
                { id: `ct-${i}-2`, name: '张工', phone: `1380000${1000+i}`, email: `it@${id.toLowerCase()}.com`, position: 'IT负责人', roles: ['IT'] }
            ],
            billingInfo: {
                taxId: `91110108MA00${1000+i}`,
                title: companyName,
                bankName: '招商银行',
                accountNumber: `622202${10000000+i}`,
                registerAddress: `${regions[i % regions.length]}市`,
                registerPhone: `010-8888${1000+i}`
            },
            ownerId: owner.id,
            ownerName: owner.name,
            enterprises: [{ id: `ent-${i}`, name: `${companyName} Default Tenant` }]
        };
    });
    setCustomers(initialCustomers);
  }, [users]);

  // --- 5. Orders Mock Data (Massive Generation) ---
  const [orders, setOrders] = useState<Order[]>([]);
  
  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); }
      if (i < 3) result += '-';
    }
    return result;
  };

  useEffect(() => {
    if (customers.length === 0) return;

    const generateMockOrders = () => {
        const mockOrders: Order[] = [];
        const statuses = Object.values(OrderStatus);
        const productsList = products.filter(p => p.status === 'OnShelf');

        for (let i = 1; i <= 200; i++) {
            const customer = customers[i % customers.length];
            const product = productsList[i % productsList.length];
            const sku = product.skus[0];
            const quantity = Math.floor(Math.random() * 20) + 1;
            const total = sku.price * quantity;
            
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 180));
            const dateStr = date.toISOString();

            let status = statuses[i % statuses.length];
            if (i < 10) status = OrderStatus.PENDING_PAYMENT;
            else if (i < 20) status = OrderStatus.PENDING_APPROVAL;
            else if (i < 30) status = OrderStatus.DELIVERED;
            
            const isPaid = status !== OrderStatus.PENDING_PAYMENT && status !== OrderStatus.CANCELLED;
            const isApproved = status !== OrderStatus.PENDING_PAYMENT && status !== OrderStatus.PENDING_APPROVAL && status !== OrderStatus.CANCELLED;
            
            const approval: any = { salesApproved: false, businessApproved: false, financeApproved: false };
            const approvalRecords: ApprovalRecord[] = [];
            
            if (isApproved) {
                approval.salesApproved = true;
                approval.businessApproved = true;
                approval.financeApproved = true;
                approval.salesApprovedDate = dateStr; 
                
                approvalRecords.push({
                    id: `ar-${i}-1`, operatorId: 'u2', operatorName: '李娜 (Sales)', operatorRole: 'Sales', 
                    actionType: 'Sales Approval', result: 'Approved', timestamp: dateStr, comment: '符合销售政策'
                });
                approvalRecords.push({
                    id: `ar-${i}-2`, operatorId: 'u3', operatorName: '王强 (Business)', operatorRole: 'Business', 
                    actionType: 'Business Approval', result: 'Approved', timestamp: dateStr, comment: '合同条款确认无误'
                });
                approvalRecords.push({
                    id: `ar-${i}-3`, operatorId: 'u8', operatorName: '郑华 (Finance)', operatorRole: 'Business', 
                    actionType: 'Finance Approval', result: 'Approved', timestamp: dateStr, comment: '款项已到账'
                });
            }

            const item: OrderItem = {
                productId: product.id, productName: product.name,
                skuId: sku.id, skuCode: sku.code, skuName: sku.name,
                quantity, priceAtPurchase: sku.price,
                activationMethod: 'LicenseKey',
                deliveredContent: (status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED || status === OrderStatus.PROCESSING_PROD) 
                                  ? Array.from({length: quantity}).map(() => generateLicenseKey()) 
                                  : []
            };

            const salesRep = users.find(u => u.id === customer.ownerId);
            let salesDeptId, salesDeptName;
            if (salesRep && salesRep.departmentId) {
                const d = departments.find(dep => dep.id === salesRep.departmentId);
                if (d) { salesDeptId = d.id; salesDeptName = d.name; }
            }

            mockOrders.push({
                id: `S${i.toString().padStart(8, '0')}`,
                customerId: customer.id,
                customerName: customer.companyName,
                date: dateStr,
                status,
                total,
                items: [item],
                shippingAddress: customer.address,
                isPaid,
                isPackageConfirmed: status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED,
                isCDBurned: status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED,
                approval,
                approvalRecords: approvalRecords.reverse(),
                salesRepId: salesRep?.id,
                salesRepName: salesRep?.name,
                salesDepartmentId: salesDeptId,
                salesDepartmentName: salesDeptName,
                businessManagerId: 'u3',
                businessManagerName: '王强',
                rawDate: date 
            });
        }
        return mockOrders.sort((a, b) => b.rawDate!.getTime() - a.rawDate!.getTime());
    };

    setOrders(generateMockOrders());
  }, [customers, products, users, departments]);

  // --- 6. Channels Mock Data ---
  const [channels, setChannels] = useState<Channel[]>([
      { id: 'CH00000001', name: '神州数码', type: 'Distributor', level: 'Tier1', contactName: '刘总', contactPhone: '13888888888', email: 'liu@digitalchina.com', region: '全国', status: 'Active', agreementDate: '2023-01-01' },
      { id: 'CH00000002', name: '伟仕佳杰', type: 'Distributor', level: 'Tier1', contactName: '陈总', contactPhone: '13999999999', email: 'chen@vst.com', region: '全国', status: 'Active', agreementDate: '2023-02-15' },
      { id: 'CH00000003', name: '北京中软', type: 'SI', level: 'Tier2', contactName: '赵经理', contactPhone: '13666666666', email: 'zhao@css.com', region: '华北', status: 'Active', agreementDate: '2023-06-01' },
  ]);

  // --- 7. Opportunities Mock Data ---
  const [opportunities, setOpportunities] = useState<Opportunity[]>([
      { id: 'OPP001', name: '某银行WPS采购项目', customerId: 'C00000001', customerName: '华兴科技银行', expectedRevenue: 500000, stage: 'Negotiation', probability: 80, closeDate: '2024-06-30', ownerId: 'u2', ownerName: '李娜', createdAt: '2024-01-10' },
      { id: 'OPP002', name: '某大学正版化二期', customerId: 'C00000003', customerName: '中科大学', expectedRevenue: 200000, stage: 'Proposal', probability: 50, closeDate: '2024-09-01', ownerId: 'u6', ownerName: '周杰', createdAt: '2024-02-15' },
  ]);

  // --- 8. Projects Mock Data ---
  const [projects, setProjects] = useState<Project[]>([
      { id: 'PRJ001', name: '华兴银行交付项目', customerId: 'C00000001', customerName: '华兴科技银行', pmId: 'u4', pmName: '赵敏', status: 'Ongoing', progress: 65, startDate: '2024-03-01', description: '私有化部署实施' },
      { id: 'PRJ002', name: '中科大学部署项目', customerId: 'C00000003', customerName: '中科大学', pmId: 'u4', pmName: '赵敏', status: 'Planning', progress: 10, startDate: '2024-05-01', description: '全校授权推广' },
  ]);

  return (
    <HashRouter>
      <Layout currentUser={currentUser} users={users} setCurrentUser={setCurrentUser}>
        <Routes>
          <Route path="/" element={<Dashboard orders={orders} totalRevenue={orders.reduce((sum, o) => sum + o.total, 0)} totalOrders={orders.length} totalCustomers={customers.length} />} />
          
          <Route path="/orders" element={<OrderManager orders={orders} setOrders={setOrders} products={products} customers={customers} currentUser={currentUser} users={users} departments={departments} opportunities={opportunities} />} />
          <Route path="/orders/:id" element={<OrderDetails orders={orders} setOrders={setOrders} products={products} customers={customers} users={users} departments={departments} currentUser={currentUser} />} />
          
          <Route path="/products" element={<ProductManager products={products} setProducts={setProducts} />} />
          <Route path="/products/:id" element={<ProductDetails products={products} setProducts={setProducts} />} />
          
          <Route path="/customers" element={<CustomerManager customers={customers} setCustomers={setCustomers} users={users} />} />
          <Route path="/customers/:id" element={<CustomerDetails customers={customers} setCustomers={setCustomers} orders={orders} users={users} />} />
          
          <Route path="/channels" element={<ChannelManager channels={channels} setChannels={setChannels} />} />
          <Route path="/channels/:id" element={<ChannelDetails channels={channels} setChannels={setChannels} />} />

          <Route path="/opportunities" element={<OpportunityManager opportunities={opportunities} setOpportunities={setOpportunities} customers={customers} />} />
          <Route path="/opportunities/:id" element={<OpportunityDetails opportunities={opportunities} setOpportunities={setOpportunities} customers={customers} />} />

          <Route path="/projects" element={<ProjectManager projects={projects} setProjects={setProjects} customers={customers} />} />
          <Route path="/projects/:id" element={<ProjectDetails projects={projects} setProjects={setProjects} customers={customers} />} />

          <Route path="/users" element={<UserManager users={users} setUsers={setUsers} departments={departments} />} />
          <Route path="/organization" element={<OrganizationManager departments={departments} setDepartments={setDepartments} users={users} />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
