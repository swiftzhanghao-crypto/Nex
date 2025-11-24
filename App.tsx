
import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrderManager from './components/OrderManager';
import ProductManager from './components/ProductManager';
import CustomerManager from './components/CustomerManager';
import CustomerDetails from './components/CustomerDetails';
import ProductDetails from './components/ProductDetails';
import UserManager from './components/UserManager';
import OrganizationManager from './components/OrganizationManager';
import { Order, Product, Customer, OrderStatus, User, Department } from './types';

const App: React.FC = () => {
  // Mock Data Initialization - WPS Products with Licensing Options and Install Packages
  const [products, setProducts] = useState<Product[]>([
    { 
      id: '1', 
      name: 'WPS Office 年度超级会员', 
      sku: 'WPS-VIP', 
      price: 179.00, 
      stock: 5000, 
      category: '会员服务', 
      description: '尊享PDF转换、云空间扩容、无广告等特权。适合个人高效办公需求，支持多端同步。', 
      status: 'OnShelf',
      licenseOptions: [
        { id: 'l1', name: '个人年卡', price: 179.00, type: 'Subscription' },
        { id: 'l2', name: '个人季卡', price: 59.00, type: 'Subscription' },
        { id: 'l3', name: '家庭版 (6人/年)', price: 399.00, type: 'Subscription' }
      ],
      installPackages: [
          { id: 'p1', name: 'WPS Office for Windows', version: '12.8.0', os: 'Windows', cpuArchitecture: 'x86_64' },
          { id: 'p2', name: 'WPS Office for Mac (M1/M2)', version: '6.2.0', os: 'macOS', cpuArchitecture: 'ARM64' },
          { id: 'p3', name: 'WPS Office Mobile', version: 'Latest', os: 'Android/iOS', cpuArchitecture: 'Universal' }
      ]
    },
    { 
      id: '2', 
      name: 'WPS 365 商业版', 
      sku: 'WPS-365', 
      price: 999.00, 
      stock: 200, 
      category: '企业服务', 
      description: '专为小微团队打造，包含在线协作文档、企业通讯录、基础管理后台，提升团队协作效率。', 
      status: 'OnShelf',
      licenseOptions: [
        { id: 'l4', name: '基础版 (5人团队包)', price: 999.00, type: 'FlatRate' },
        { id: 'l5', name: '专业版 (每用户/年)', price: 365.00, type: 'PerUser' },
        { id: 'l6', name: '旗舰版 (包含AI能力/每用户/年)', price: 599.00, type: 'PerUser' }
      ],
      installPackages: [
          { id: 'p4', name: 'WPS 365 企业客户端 (Win)', version: '2.0.5', os: 'Windows', cpuArchitecture: 'x86_64' },
          { id: 'p5', name: 'WPS 365 企业客户端 (Mac)', version: '2.0.5', os: 'macOS', cpuArchitecture: 'ARM64' }
      ]
    },
    { 
      id: '3', 
      name: 'WPS AI 会员', 
      sku: 'WPS-AI', 
      price: 29.90, 
      stock: 10000, 
      category: 'AI服务', 
      description: '体验强大的WPS AI能力，包括智能写作、PPT一键生成、PDF智能阅读与分析功能。', 
      status: 'OnShelf',
      licenseOptions: [
         { id: 'l7', name: '连续包月', price: 29.90, type: 'Subscription' },
         { id: 'l8', name: '年度会员', price: 299.00, type: 'Subscription' }
      ],
      installPackages: [] // AI is a service, usually no specific standalone installer unless it's a plugin
    },
    { 
      id: '4', 
      name: '金山文档企业版', 
      sku: 'KDOC-ENT', 
      price: 3600.00, 
      stock: 50, 
      category: '企业服务', 
      description: '专注于即时协作的企业级文档解决方案，支持私有化部署选项，保障数据安全。', 
      status: 'OnShelf',
      licenseOptions: [
          { id: 'l9', name: '团队标准版 (20人/年)', price: 3600.00, type: 'FlatRate' },
          { id: 'l10', name: '私有化部署 (每服务器)', price: 50000.00, type: 'Perpetual' }
      ],
      installPackages: [
          { id: 'p6', name: '金山文档私有化服务端', version: 'v5.0 Server', os: 'Linux', cpuArchitecture: 'x86_64' }
      ]
    },
    { 
      id: '5', 
      name: 'WPS 稻壳会员', 
      sku: 'WPS-DOCER', 
      price: 89.00, 
      stock: 3000, 
      category: '素材服务', 
      description: '海量精美PPT模板、简历模板、Excel图表无限下载，让文档排版更专业。', 
      status: 'OnShelf',
      licenseOptions: [
          { id: 'l11', name: '年度会员', price: 89.00, type: 'Subscription' },
          { id: 'l12', name: '终身会员', price: 299.00, type: 'Perpetual' }
      ]
    },
    { 
      id: '6', 
      name: 'WPS PDF 编辑器', 
      sku: 'WPS-PDF', 
      price: 298.00, 
      stock: 150, 
      category: '工具软件', 
      description: '专业的PDF编辑工具，支持流式编辑、页面管理、OCR文字识别、格式转换。', 
      status: 'OnShelf',
      licenseOptions: [
          { id: 'l13', name: '专业版 (永久授权)', price: 298.00, type: 'Perpetual' },
          { id: 'l14', name: '年度订阅', price: 98.00, type: 'Subscription' }
      ],
      installPackages: [
          { id: 'p7', name: 'WPS PDF Pro Installer', version: '10.1', os: 'Windows', cpuArchitecture: 'x86_64' }
      ]
    },
    { 
      id: '7', 
      name: 'WPS 365 教育版', 
      sku: 'WPS-EDU', 
      price: 15000.00, 
      stock: 10, 
      category: '教育及行业', 
      description: '面向教育机构的定制版本，包含作业管理、师生协作功能，符合教育行业合规要求。', 
      status: 'OnShelf',
      licenseOptions: [
          { id: 'l15', name: '校园授权 (全校)', price: 15000.00, type: 'FlatRate' }
      ],
      installPackages: [
          { id: 'p8', name: 'WPS 教育版客户端', version: 'EDU-2025', os: 'Windows', cpuArchitecture: 'x86_64' }
      ]
    },
    { 
      id: '8', 
      name: 'WPS 图片设计工具会员', 
      sku: 'WPS-IMG', 
      price: 68.00, 
      stock: 500, 
      category: '设计工具', 
      description: '在线图片设计与编辑工具，提供海量版权图片素材，一键生成营销海报。', 
      status: 'OnShelf',
       licenseOptions: [
          { id: 'l16', name: '年度会员', price: 68.00, type: 'Subscription' }
      ]
    },
    { 
      id: '9', 
      name: 'WPS 论文查重服务', 
      sku: 'WPS-PAPER', 
      price: 45.00, 
      stock: 999, 
      category: '增值服务', 
      description: '权威数据库比对，快速生成查重报告，助你轻松通过论文审核。', 
      status: 'OnShelf',
       licenseOptions: [
          { id: 'l17', name: '单篇查重 (1万字以内)', price: 45.00, type: 'FlatRate' },
          { id: 'l18', name: '单篇查重 (3万字以内)', price: 98.00, type: 'FlatRate' }
      ]
    },
    { 
      id: '10', 
      name: 'WPS Office 2019 信创版', 
      sku: 'WPS-XC', 
      price: 498.00, 
      stock: 80, 
      category: '信创产品', 
      description: '适配国产操作系统与芯片，符合国家信创标准，政企办公首选。支持 UOS、麒麟等操作系统。', 
      status: 'OffShelf',
      licenseOptions: [
          { id: 'l19', name: '单机授权', price: 498.00, type: 'Perpetual' },
          { id: 'l20', name: '批量授权 (100点)', price: 39800.00, type: 'FlatRate' }
      ],
      installPackages: [
          { id: 'p9', name: 'WPS Linux (UOS)', version: '11.8.2.1', os: 'UOS', cpuArchitecture: 'ARM64' },
          { id: 'p10', name: 'WPS Linux (Kylin)', version: '11.8.2.1', os: 'Kylin', cpuArchitecture: 'MIPS64' },
          { id: 'p11', name: 'WPS Linux (Deepin)', version: '11.8.2.2', os: 'Deepin', cpuArchitecture: 'LoongArch' },
          { id: 'p12', name: 'WPS Windows 11 ARM', version: '12.0.1', os: 'Windows', cpuArchitecture: 'ARM64' }
      ]
    },
  ]);

  const [customers] = useState<Customer[]>([
    { 
        id: '101', 
        companyName: '未来科技集团', 
        industry: '互联网/软件', 
        contactPerson: '张伟', 
        position: '采购经理', 
        email: 'purchasing@futuretech.com', 
        phone: '010-88886666', 
        address: '北京市海淀区中关村软件园A座', 
        status: 'Active', 
        logo: 'https://ui-avatars.com/api/?name=FT&background=0D8ABC&color=fff',
        bankInfo: {
            bankName: '招商银行北京分行',
            accountName: '未来科技集团财务部',
            accountNumber: '6225 8888 9999 1234'
        }
    },
    { 
        id: '102', 
        companyName: '绿源生态农业有限公司', 
        industry: '农业/食品', 
        contactPerson: '李娜', 
        position: '运营总监', 
        email: 'lina@luyuan.com', 
        phone: '021-55557777', 
        address: '上海市浦东新区农业科技园', 
        status: 'Active', 
        logo: 'https://ui-avatars.com/api/?name=LY&background=27ae60&color=fff',
        bankInfo: {
            bankName: '中国工商银行上海浦东支行',
            accountName: '绿源生态农业有限公司',
            accountNumber: '6222 0000 1234 5678'
        }
    },
    { 
        id: '103', 
        companyName: '蓝天物流控股', 
        industry: '物流/运输', 
        contactPerson: '王强', 
        position: '区域经理', 
        email: 'wang.q@bluesky.cn', 
        phone: '020-33339999', 
        address: '广州市白云区物流大道100号', 
        status: 'Active', 
        logo: 'https://ui-avatars.com/api/?name=BS&background=2980b9&color=fff',
        bankInfo: {
            bankName: '中国建设银行广州白云支行',
            accountName: '蓝天物流结算专户',
            accountNumber: '6217 0000 9876 5432'
        }
    },
    { 
        id: '104', 
        companyName: '极光创意设计室', 
        industry: '广告/设计', 
        contactPerson: '赵敏', 
        position: '合伙人', 
        email: 'hello@auroradesign.com', 
        phone: '0755-22221111', 
        address: '深圳市南山区华侨城创意园', 
        status: 'Inactive', 
        logo: 'https://ui-avatars.com/api/?name=AD&background=8e44ad&color=fff',
        bankInfo: {
            bankName: '平安银行深圳分行',
            accountName: '深圳市极光创意设计有限公司',
            accountNumber: '6218 0000 1122 3344'
        }
    },
    { 
        id: '105', 
        companyName: '星际教育咨询', 
        industry: '教育/培训', 
        contactPerson: '陈杰', 
        position: '行政主管', 
        email: 'admin@staredu.com', 
        phone: '0571-66668888', 
        address: '杭州市西湖区文教区8号', 
        status: 'Active', 
        logo: 'https://ui-avatars.com/api/?name=SE&background=f39c12&color=fff' 
        // Intentionally left without bank info to test fallback
    },
  ]);

  // Departments Mock Data with Deep Hierarchy (up to 5 levels)
  const [departments, setDepartments] = useState<Department[]>([
      { id: 'root', name: 'NexOrder 总部', description: '公司最高管理机构' },
      
      // Level 1: Centers
      { id: 'c1', name: '研发中心', description: '负责全线产品研发与技术支持', parentId: 'root' },
      { id: 'c2', name: '营销中心', description: '负责市场推广与全球销售', parentId: 'root' },
      { id: 'c3', name: '运营中心', description: '负责客户服务与交付运营', parentId: 'root' },
      { id: 'c4', name: '职能支持中心', description: '人力、财务、行政、法务', parentId: 'root' },

      // Level 2: Departments (Under R&D)
      { id: 'c1-d1', name: '基础架构部', description: '云平台、容器化、中间件', parentId: 'c1' },
      { id: 'c1-d2', name: '业务应用部', description: 'SaaS业务系统开发', parentId: 'c1' },
      { id: 'c1-d3', name: '前沿技术实验室', description: 'AI大模型应用探索', parentId: 'c1' },

      // Level 3: Groups (Under Infrastructure)
      { id: 'c1-d1-g1', name: '云平台组', description: 'K8s集群维护', parentId: 'c1-d1' },
      { id: 'c1-d1-g2', name: '存储与网络组', description: '分布式存储', parentId: 'c1-d1' },

      // Level 4: Teams (Under Cloud Platform)
      { id: 'c1-d1-g1-t1', name: '容器运维小队', description: '日常巡检与故障处理', parentId: 'c1-d1-g1' },
      { id: 'c1-d1-g1-t2', name: 'DevOps工具小队', description: 'CI/CD流水线', parentId: 'c1-d1-g1' },

      // Level 5: Specialized Units (Under DevOps)
      { id: 'c1-d1-g1-t2-u1', name: '流水线优化专项', description: '构建速度优化', parentId: 'c1-d1-g1-t2' },

      // Level 3: Groups (Under Business App)
      { id: 'c1-d2-g1', name: 'PC客户端组', description: 'Windows/Mac/Linux', parentId: 'c1-d2' },
      { id: 'c1-d2-g2', name: '移动端组', description: 'iOS/Android', parentId: 'c1-d2' },
      { id: 'c1-d2-g3', name: 'Web服务端组', description: '后端API与微服务', parentId: 'c1-d2' },

      // Level 4: Teams (Under Web Server)
      { id: 'c1-d2-g3-t1', name: '交易系统开发队', description: '订单与支付', parentId: 'c1-d2-g3' },
      { id: 'c1-d2-g3-t2', name: '用户中心开发队', description: '账号与权限', parentId: 'c1-d2-g3' },

      // Level 5: Specialized Units (Under Transaction)
      { id: 'c1-d2-g3-t1-u1', name: '支付网关攻坚组', description: '对接多方支付渠道', parentId: 'c1-d2-g3-t1' },
      { id: 'c1-d2-g3-t1-u2', name: '结算对账攻坚组', description: '财务数据一致性', parentId: 'c1-d2-g3-t1' },

      // Level 2: Departments (Under Marketing)
      { id: 'c2-d1', name: '国内销售部', description: '大陆地区业务', parentId: 'c2' },
      { id: 'c2-d2', name: '海外销售部', description: '国际化业务', parentId: 'c2' },
      { id: 'c2-d3', name: '品牌公关部', description: '市场活动与媒体关系', parentId: 'c2' },

      // Level 3: Regions (Under Domestic Sales)
      { id: 'c2-d1-r1', name: '华北区', description: '京津冀蒙晋', parentId: 'c2-d1' },
      { id: 'c2-d1-r2', name: '华东区', description: '江浙沪皖鲁', parentId: 'c2-d1' },
      { id: 'c2-d1-r3', name: '华南区', description: '闽粤桂琼', parentId: 'c2-d1' },

      // Level 4: Cities (Under North China)
      { id: 'c2-d1-r1-c1', name: '北京分公司', description: '首都业务', parentId: 'c2-d1-r1' },
      { id: 'c2-d1-r1-c2', name: '天津办事处', description: '港口业务', parentId: 'c2-d1-r1' },

      // Level 5: Sales Teams (Under Beijing)
      { id: 'c2-d1-r1-c1-t1', name: '政企客户一部', description: '央企对接', parentId: 'c2-d1-r1-c1' },
      { id: 'c2-d1-r1-c1-t2', name: '金融客户二部', description: '银行证券', parentId: 'c2-d1-r1-c1' },
      { id: 'c2-d1-r1-c1-t3', name: '教育行业三部', description: '高校与K12', parentId: 'c2-d1-r1-c1' },

      // Level 2: Departments (Under Operations)
      { id: 'c3-d1', name: '客户成功部', description: 'CSM体系', parentId: 'c3' },
      { id: 'c3-d2', name: '技术支持部', description: '售后技术保障', parentId: 'c3' },
      { id: 'c3-d3', name: '实施交付部', description: '私有化部署实施', parentId: 'c3' },

      // Level 3 (Under Tech Support)
      { id: 'c3-d2-l1', name: '一线客服组', description: '400热线与在线客服', parentId: 'c3-d2' },
      { id: 'c3-d2-l2', name: '二线专家组', description: '疑难问题排查', parentId: 'c3-d2' },
  ]);

  // User Management Mock Data - Updated with Hierarchical Department IDs
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: 'Admin User', email: 'admin@nexorder.com', role: 'Admin', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff', departmentId: 'c4' },
    { id: 'u2', name: 'Sarah Sales', email: 'sarah@nexorder.com', role: 'Sales', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Sarah&background=3b82f6&color=fff', departmentId: 'c2-d1-r1-c1-t1' },
    { id: 'u3', name: 'Ben Business', email: 'ben@nexorder.com', role: 'Business', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Ben&background=f97316&color=fff', departmentId: 'c4' },
    { id: 'u4', name: 'Tom Tech', email: 'tom@nexorder.com', role: 'Technical', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Tom&background=a855f7&color=fff', departmentId: 'c1-d2-g3-t1-u1' },
    { id: 'u5', name: 'Leo Logistics', email: 'leo@nexorder.com', role: 'Logistics', status: 'Active', avatar: 'https://ui-avatars.com/api/?name=Leo&background=22c55e&color=fff', departmentId: 'c3-d3' },
  ]);

  // Current User State (Simulating Session)
  const [currentUser, setCurrentUser] = useState<User>(users[0]);

  const [orders, setOrders] = useState<Order[]>([
    { 
      id: 'ORD-7721', 
      customerId: '101', 
      customerName: '未来科技集团', 
      date: new Date().toISOString(), 
      status: OrderStatus.DELIVERED, 
      total: 1254.20,
      shippingAddress: '北京市海淀区中关村软件园A座',
      carrier: '顺丰速运',
      trackingNumber: 'SF1002993882',
      items: [
        { 
            productId: '1', 
            productName: 'WPS Office 年度超级会员', 
            licenseOptionId: 'l1', 
            licenseOptionName: '个人年卡', 
            installPackageName: 'WPS Office for Windows (v12.8.0)',
            quantity: 4, 
            priceAtPurchase: 179.00,
            activationMethod: 'LicenseKey',
            deliveredContent: ['WPS-8821-A001', 'WPS-8821-A002', 'WPS-8821-A003', 'WPS-8821-A004']
        },
        { 
            productId: '6', 
            productName: 'WPS PDF 编辑器', 
            licenseOptionId: 'l13', 
            licenseOptionName: '专业版 (永久授权)', 
            installPackageName: 'WPS PDF Pro Installer',
            quantity: 1, 
            priceAtPurchase: 298.00,
            activationMethod: 'LicenseKey',
            deliveredContent: ['PDF-PRO-9988-X']
        },
        { 
            productId: '3', 
            productName: 'WPS AI 会员', 
            licenseOptionId: 'l7', 
            licenseOptionName: '连续包月', 
            quantity: 8, 
            priceAtPurchase: 29.90,
            activationMethod: 'AccountBind',
            deliveredContent: ['user01@futuretech.com', 'user02@futuretech.com', 'user03@futuretech.com', '...']
        }
      ],
      approval: { salesApproved: true, salesApprovedDate: new Date().toISOString(), businessApproved: true, businessApprovedDate: new Date().toISOString() },
      isPaid: true,
      paymentDate: new Date().toISOString(),
      paymentRecord: {
          method: 'BankTransfer',
          bankName: '招商银行',
          accountNumber: '6225 **** **** 8888',
          transactionId: 'TXN-20241020-001',
          payerName: '未来科技集团财务部',
          amount: 1254.20,
          paymentDate: new Date().toISOString()
      },
      isPackageConfirmed: true,
      isCDBurned: true,
      confirmedDate: new Date().toISOString()
    },
    { 
      id: 'ORD-7722', 
      customerId: '102', 
      customerName: '绿源生态农业有限公司', 
      date: new Date(Date.now() - 86400000).toISOString(), 
      status: OrderStatus.PROCESSING_PROD, 
      total: 2997.00, 
      shippingAddress: '上海市浦东新区农业科技园',
      items: [
         { 
             productId: '2', 
             productName: 'WPS 365 商业版', 
             licenseOptionId: 'l4', 
             licenseOptionName: '基础版 (5人团队包)', 
             installPackageName: 'WPS 365 企业客户端 (Win)',
             quantity: 3, 
             priceAtPurchase: 999.00,
             activationMethod: 'AccountBind' 
         }
      ],
      approval: { salesApproved: true, salesApprovedDate: new Date().toISOString(), businessApproved: true, businessApprovedDate: new Date().toISOString() },
      isPaid: true,
      paymentRecord: {
          method: 'BankTransfer',
          bankName: '中国工商银行',
          accountNumber: '6222 **** **** 1234',
          transactionId: 'ICBC-9988212',
          payerName: '绿源生态结算账户',
          amount: 2997.00,
          paymentDate: new Date(Date.now() - 80000000).toISOString()
      },
      isPackageConfirmed: true,
      isCDBurned: false,
      confirmedDate: new Date().toISOString()
    },
    { 
      id: 'ORD-7723', 
      customerId: '103', 
      customerName: '蓝天物流控股', 
      date: new Date(Date.now() - 172800000).toISOString(), 
      status: OrderStatus.PENDING_PAYMENT, 
      total: 598.00, 
      shippingAddress: '广州市白云区物流大道100号',
      items: [
        { 
            productId: '5', 
            productName: 'WPS 稻壳会员', 
            licenseOptionId: 'l12', 
            licenseOptionName: '终身会员', 
            quantity: 2, 
            priceAtPurchase: 299.00,
            activationMethod: 'LicenseKey'
        }
      ],
      approval: { salesApproved: false, businessApproved: false },
      isPaid: false,
      isPackageConfirmed: false,
      isCDBurned: false
    },
    { 
      id: 'ORD-7724', 
      customerId: '101', 
      customerName: '未来科技集团', 
      date: new Date(Date.now() - 259200000).toISOString(), 
      status: OrderStatus.SHIPPED, 
      total: 3600.00, 
      shippingAddress: '北京市海淀区中关村软件园A座',
      carrier: 'EMS',
      trackingNumber: 'EM999123123CN',
      items: [
        { 
            productId: '4', 
            productName: '金山文档企业版', 
            licenseOptionId: 'l9', 
            licenseOptionName: '团队标准版 (20人/年)', 
            installPackageName: '金山文档私有化服务端',
            quantity: 1, 
            priceAtPurchase: 3600.00,
            activationMethod: 'LicenseKey',
            deliveredContent: ['ENT-KDOC-2024-001']
        }
      ],
      approval: { salesApproved: true, salesApprovedDate: new Date().toISOString(), businessApproved: true, businessApprovedDate: new Date().toISOString() },
      isPaid: true,
      paymentDate: new Date().toISOString(),
      paymentRecord: {
        method: 'BankTransfer',
        bankName: '建设银行',
        accountNumber: '6217 **** **** 5678',
        transactionId: 'CCB-7721231',
        payerName: '未来科技集团',
        amount: 3600.00,
        paymentDate: new Date(Date.now() - 250000000).toISOString()
      },
      confirmedDate: new Date().toISOString(),
      isPackageConfirmed: true,
      isCDBurned: true
    },
  ]);

  // Derived Stats
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.total, 0);
  const totalOrders = orders.length;

  return (
    <HashRouter>
      <Layout currentUser={currentUser} users={users} setCurrentUser={setCurrentUser}>
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                orders={orders} 
                totalRevenue={totalRevenue} 
                totalOrders={totalOrders} 
                totalCustomers={customers.length} 
              />
            } 
          />
          <Route 
            path="/orders" 
            element={
                <OrderManager 
                    orders={orders} 
                    setOrders={setOrders} 
                    products={products} 
                    customers={customers}
                    currentUser={currentUser} 
                />
            } 
          />
          <Route 
            path="/products" 
            element={<ProductManager products={products} setProducts={setProducts} />} 
          />
          <Route 
            path="/products/:id" 
            element={<ProductDetails products={products} setProducts={setProducts} />} 
          />
          <Route 
            path="/customers" 
            element={<CustomerManager customers={customers} />} 
          />
          <Route 
            path="/customers/:id" 
            element={<CustomerDetails customers={customers} orders={orders} />} 
          />
          <Route 
            path="/organization" 
            element={<OrganizationManager departments={departments} setDepartments={setDepartments} users={users} />} 
          />
          <Route 
            path="/users" 
            element={<UserManager users={users} setUsers={setUsers} departments={departments} />} 
          />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
