
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
import { 
    SalesMerchandise, Product, Customer, Order, User, Channel, 
    Opportunity, Department, AtomicCapability, 
    ProductRightDefinition, RightPackage, OrderStatus, OrderItem,
    ApprovalRecord, CustomerType, CustomerLevel, InvoiceInfo,
    OrderApproval, OrderSource, LicenseTypeDefinition, RoleDefinition,
    BuyerType
} from './types';

function App() {
  // --- 0. Atomic Capabilities Mock Data ---
  const [atomicCapabilities, setAtomicCapabilities] = useState<AtomicCapability[]>([
      { id: 'AC001', name: 'WPS Office 基础编辑', type: 'Component', description: '包含文字、表格、演示核心组件' },
      { id: 'AC002', name: 'PDF 组件', type: 'Component', description: 'PDF 查看与编辑能力' },
      { id: 'AC003', name: 'OFD 组件', type: 'Component', description: '版式文件处理能力' },
      { id: 'AC004', name: 'WPS 会议权益包', type: 'Rights', description: '云会议并发权益 (描述性)' },
      { id: 'AC005', name: '私有云文档中心', type: 'Feature', description: '企业级云存储与协作服务' },
      { id: 'AC006', name: 'WPS AI 写作', type: 'Feature', description: '大模型辅助创作' },
      { id: 'AC007', name: '实施部署服务', type: 'Service', description: '私有化环境部署与调试' },
      { id: 'AC008', name: '企业通讯录同步', type: 'Feature', description: 'LDAP/AD 域集成' },
      { id: 'AC009', name: '数字水印', type: 'Feature', description: '防泄密溯源水印' },
      { id: 'AC010', name: '内容合规审查', type: 'Service', description: 'AI驱动的敏感词检测' },
  ]);

  // --- 0.5 Product Rights & Packages & License Types ---
  const [productRights, setProductRights] = useState<ProductRightDefinition[]>([
      { id: 'PR001', name: '云存储空间', code: 'storage_quota', dataType: 'Number', unit: 'GB', description: '企业云文档总存储空间' },
      { id: 'PR002', name: '会议并发数', code: 'meeting_concurrency', dataType: 'Number', unit: '方', description: '同时在线会议最大方数' },
      { id: 'PR003', name: 'API 调用次数', code: 'api_limit', dataType: 'Number', unit: '次/天', description: '每日 API 接口调用上限' },
      { id: 'PR004', name: '专属客户经理', code: 'vip_support', dataType: 'Boolean', description: '是否配备专属 VIP 客户经理' },
      { id: 'PR005', name: '自定义 LOGO', code: 'custom_branding', dataType: 'Boolean', description: '允许替换企业 Logo' },
      { id: 'PR006', name: '客户端设备数', code: 'device_limit', dataType: 'Number', unit: '台', description: '每账号可登录设备数' },
  ]);

  const [rightPackages, setRightPackages] = useState<RightPackage[]>([
      {
          id: 'PKG001',
          name: 'WPS 365 商业版标准权益',
          description: '适用于公有云商业版用户的标准权益配置',
          rights: [
              { definitionId: 'PR001', name: '云存储空间', value: 100, unit: 'GB' },
              { definitionId: 'PR002', name: '会议并发数', value: 50, unit: '方' },
              { definitionId: 'PR006', name: '客户端设备数', value: 5, unit: '台' }
          ]
      },
      {
          id: 'PKG002',
          name: 'WPS Office 端授权基础包',
          description: '适用于本地端产品的标准功能授权',
          rights: [
              { definitionId: 'PR005', name: '自定义 LOGO', value: false },
              { definitionId: 'PR006', name: '客户端设备数', value: 1, unit: '台' }
          ]
      },
      {
          id: 'PKG003',
          name: 'WPS Office 端授权增强包',
          description: '包含高级定制能力的端授权',
          rights: [
              { definitionId: 'PR005', name: '自定义 LOGO', value: true },
              { definitionId: 'PR006', name: '客户端设备数', value: 3, unit: '台' }
          ]
      }
  ]);

  const [licenseDefs, setLicenseDefs] = useState<LicenseTypeDefinition[]>([
      { id: 'LT001', name: '年度订阅 (1用户)', code: 'SUB-YEAR-1U', type: 'Subscription', period: 1, periodUnit: 'Year', scope: '1 User', description: '标准年度订阅模式' },
      { id: 'LT002', name: '月度订阅 (1用户)', code: 'SUB-MON-1U', type: 'Subscription', period: 1, periodUnit: 'Month', scope: '1 User', description: '短期月度订阅模式' },
      { id: 'LT003', name: '永久授权 (1设备)', code: 'PERP-DEV-1', type: 'Perpetual', period: 1, periodUnit: 'Forever', scope: '1 Device', description: '买断制永久授权' },
      { id: 'LT004', name: '场地授权 (100设备)', code: 'SITE-100', type: 'FlatRate', period: 1, periodUnit: 'Year', scope: '100 Devices', description: '年度场地包' },
      { id: 'LT005', name: '平台订阅 (Server)', code: 'SUB-PLAT', type: 'Subscription', period: 1, periodUnit: 'Year', scope: 'Platform', description: '服务器端平台授权' },
  ]);

  // --- 1. Products Mock Data (Aligned with new categories) ---
  const [products, setProducts] = useState<Product[]>([
    // WPS365公有云
    { 
      id: 'PROD-PUB-001', name: 'WPS 365 标准版 (政府)', category: 'WPS365公有云', subCategory: 'WPS365标准版（政府）（服务）', status: 'OnShelf', tags: ['IM', 'AI', '生态'],
      skus: [{ 
        id: 's1', code: 'S1', name: '标准版', price: 299, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o1-1', title:'年度订阅 (政府专享)', price:299, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}},
          {id:'o1-2', title:'三年订阅 (优惠包)', price:799, license:{type:'Subscription', period:3, periodUnit:'Year', scope:'1 User'}},
          {id:'o1-3', title:'五年订阅 (长期授权)', price:1299, license:{type:'Subscription', period:5, periodUnit:'Year', scope:'1 User'}}
        ] 
      }],
      installPackages: [
        { id: 'AZ0006022', name: 'WPS 365 Win端', version: 'v12.1.0', url: '#', cpu: '麒麟', os: 'UOS', arch: '-' },
        { id: 'pkg1-2', name: 'WPS 365 Mac端', version: 'v6.0.1', url: '#', cpu: 'Intel/M1', os: 'macOS', arch: 'x64/arm64' }
      ]
    },
    { 
      id: 'PROD-PUB-001-2', name: 'WPS 365 基础版 (政府)', category: 'WPS365公有云', subCategory: 'WPS365标准版（政府）（服务）', status: 'OnShelf', tags: ['IM', '生态'],
      skus: [{ 
        id: 's1-2', code: 'S1-2', name: '基础版', price: 199, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o1-2-1', title:'年度订阅 (基础版)', price:199, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}},
          {id:'o1-2-2', title:'月度订阅 (基础版)', price:19, license:{type:'Subscription', period:1, periodUnit:'Month', scope:'1 User'}}
        ] 
      }],
      installPackages: [{ id: 'pkg1-2-1', name: 'WPS 365 Win端', version: 'v12.1.0', url: '#' }]
    },
    { 
      id: 'PROD-PUB-002', name: 'WPS 365 高级版', category: 'WPS365公有云', subCategory: 'WPS365高级版', status: 'OnShelf', tags: ['AI', '生态'],
      skus: [{ 
        id: 's2', code: 'S2', name: '标准版', price: 499, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o2-1', title:'年度订阅 (高级版)', price:499, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}},
          {id:'o2-2', title:'三年订阅 (企业包)', price:1299, license:{type:'Subscription', period:3, periodUnit:'Year', scope:'1 User'}}
        ] 
      }],
      installPackages: [
        { id: 'pkg2-1', name: 'WPS 365 Win端', version: 'v12.1.0', url: '#' },
        { id: 'pkg2-2', name: 'WPS 365 移动端', version: 'v11.5.0', url: '#' }
      ]
    },
    { 
      id: 'PROD-PUB-002-2', name: 'WPS 365 高级版 (教育)', category: 'WPS365公有云', subCategory: 'WPS365高级版', status: 'OnShelf', tags: ['AI', '生态'],
      skus: [{ 
        id: 's2-2', code: 'S2-2', name: '教育版', price: 299, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o2-2-1', title:'年度订阅 (教育版)', price:299, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}},
          {id:'o2-2-2', title:'永久授权 (教育版)', price:999, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 User'}}
        ] 
      }],
      installPackages: [{ id: 'pkg2-2-1', name: 'WPS 365 Win端', version: 'v12.1.0', url: '#' }]
    },

    // WPS365私有云
    { 
      id: 'PROD-PVT-001', name: 'WPS 365 高级版 (私有云)', category: 'WPS365私有云', subCategory: 'WPS365高级版（私有云）', status: 'OnShelf', tags: ['IM', 'AI'],
      skus: [{ 
        id: 's5', code: 'S5', name: '标准版', price: 50000, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o5-1', title:'永久授权 (私有云)', price:50000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}},
          {id:'o5-2', title:'年度订阅 (私有云)', price:15000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}
        ] 
      }],
      installPackages: [{ id: 'pkg5-1', name: '私有云部署包', version: 'v7.0.0', url: '#' }]
    },
    { 
      id: 'PROD-PVT-001-2', name: 'WPS 365 基础版 (私有云)', category: 'WPS365私有云', subCategory: 'WPS365高级版（私有云）', status: 'OnShelf', tags: ['IM'],
      skus: [{ 
        id: 's5-2', code: 'S5-2', name: '基础版', price: 20000, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o5-2-1', title:'永久授权 (私有云基础)', price:20000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}},
          {id:'o5-2-2', title:'年度订阅 (私有云基础)', price:8000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}
        ] 
      }],
      installPackages: [{ id: 'pkg5-2-1', name: '私有云部署包', version: 'v7.0.0', url: '#' }]
    },

    // 私有云单品
    { 
      id: 'PROD-ITEM-001', name: 'Web Office 核心组件', category: '私有云单品', subCategory: 'Web Office', status: 'OnShelf', tags: ['生态'],
      skus: [{ 
        id: 's8', code: 'S8', name: '标准版', price: 20000, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o8-1', title:'永久授权 (WebOffice)', price:20000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}},
          {id:'o8-2', title:'年度订阅 (WebOffice)', price:6000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}
        ] 
      }],
      installPackages: [{ id: 'pkg8-1', name: 'WebOffice SDK', version: 'v3.2.1', url: '#' }]
    },
    { 
      id: 'PROD-ITEM-001-2', name: 'Web Office 增强组件', category: '私有云单品', subCategory: 'Web Office', status: 'OnShelf', tags: ['生态', 'AI'],
      skus: [{ 
        id: 's8-2', code: 'S8-2', name: '增强版', price: 35000, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o8-2-1', title:'永久授权 (WebOffice增强)', price:35000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}},
          {id:'o8-2-2', title:'年度订阅 (WebOffice增强)', price:12000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}
        ] 
      }],
      installPackages: [{ id: 'pkg8-2-1', name: 'WebOffice SDK', version: 'v3.2.1', url: '#' }]
    },

    // Win端
    { 
      id: 'PROD-WIN-001', name: 'WPS Office 2019 专业版', category: 'Win端', subCategory: 'Win2019', status: 'OnShelf', tags: ['生态'],
      skus: [{ 
        id: 's12', code: 'S12', name: '标准版', price: 498, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o12-1', title:'永久授权 (单机版)', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},
          {id:'o12-2', title:'年度订阅 (单机版)', price:158, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}
        ] 
      }],
      installPackages: [{ id: 'pkg12-1', name: 'WPS 2019 安装包', version: 'v11.1.0', url: '#' }]
    },
    { 
      id: 'PROD-WIN-001-2', name: 'WPS Office 2019 增强版', category: 'Win端', subCategory: 'Win2019', status: 'OnShelf', tags: ['生态', 'AI'],
      skus: [{ 
        id: 's12-2', code: 'S12-2', name: '增强版', price: 698, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o12-2-1', title:'永久授权', price:698, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},
          {id:'o12-2-2', title:'年度订阅', price:218, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}
        ] 
      }],
      installPackages: [{ id: 'pkg12-2-1', name: 'WPS 2019 安装包', version: 'v11.1.0', url: '#' }]
    },

    // 其他软件
    { 
      id: 'PROD-OTH-001', name: 'WPS for Mac 专业版', category: '其他软件', subCategory: 'WPS for Mac', status: 'OnShelf', tags: ['生态'],
      skus: [{ 
        id: 's15', code: 'S15', name: '标准版', price: 498, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o15-1', title:'永久授权 (Mac版)', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},
          {id:'o15-2', title:'年度订阅 (Mac版)', price:158, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}
        ] 
      }],
      installPackages: [{ id: 'pkg15-1', name: 'WPS Mac 安装包', version: 'v6.0.1', url: '#' }]
    },
    { 
      id: 'PROD-OTH-001-2', name: 'WPS for Mac 个人版', category: '其他软件', subCategory: 'WPS for Mac', status: 'OnShelf', tags: ['生态'],
      skus: [{ 
        id: 's15-2', code: 'S15-2', name: '个人版', price: 0, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o15-2-1', title:'免费版 (Mac个人)', price:0, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'1 User'}},
          {id:'o15-2-2', title:'会员订阅 (Mac个人)', price:89, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}
        ] 
      }],
      installPackages: [{ id: 'pkg15-2-1', name: 'WPS Mac 安装包', version: 'v6.0.1', url: '#' }]
    },

    // 退市商品
    { 
      id: 'PROD-OFF-001', name: 'WPS Office 2016 (已退市)', category: 'Win端', subCategory: 'Win2019', status: 'OffShelf', tags: ['生态'],
      skus: [{ 
        id: 's20', code: 'S20', name: '标准版', price: 398, status: 'Active', stock: 100,
        pricingOptions: [
          {id:'o20-1', title:'永久授权', price:398, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},
          {id:'o20-2', title:'年度订阅', price:128, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}
        ] 
      }],
      installPackages: [{ id: 'pkg20-1', name: 'WPS 2016 安装包', version: 'v10.1.0', url: '#' }]
    }
  ]);

  // --- 1.5 Sales Merchandise Mock Data ---
  const [merchandises, setMerchandises] = useState<SalesMerchandise[]>([
      { 
          id: 'M001', name: 'WPS 365 标准版 (政府)', salesType: ['Direct', 'Channel'], pricingPolicy: 'Fixed', price: 299.0, status: 'Active',
          items: [{ productId: 'PROD-PUB-001', productName: 'WPS 365 标准版 (政府)', skuId: 's1', skuName: '标准版', quantity: 1 }]
      },
      { 
          id: 'M002', name: 'WPS 365 基础版 (政府)', salesType: ['Direct', 'Channel'], pricingPolicy: 'Fixed', price: 199.0, status: 'Active',
          items: [{ productId: 'PROD-PUB-001-2', productName: 'WPS 365 基础版 (政府)', skuId: 's1-2', skuName: '基础版', quantity: 1 }]
      },
      { 
          id: 'M003', name: 'WPS 365 高级版', salesType: ['Direct', 'Channel'], pricingPolicy: 'Fixed', price: 499.0, status: 'Active',
          items: [{ productId: 'PROD-PUB-002', productName: 'WPS 365 高级版', skuId: 's2', skuName: '标准版', quantity: 1 }]
      },
      { 
          id: 'M004', name: 'WPS 365 高级版 (私有云)', salesType: ['Channel', 'Direct'], pricingPolicy: 'Fixed', price: 50000.0, status: 'Active',
          items: [{ productId: 'PROD-PVT-001', productName: 'WPS 365 高级版 (私有云)', skuId: 's5', skuName: '标准版', quantity: 1 }]
      },
      { 
          id: 'M005', name: 'Web Office 核心组件', salesType: ['Direct'], pricingPolicy: 'Negotiable', price: 20000.0, status: 'Active',
          items: [{ productId: 'PROD-ITEM-001', productName: 'Web Office 核心组件', skuId: 's8', skuName: '标准版', quantity: 1 }]
      },
  ]);

  // --- 2. Departments ---
  const [departments, setDepartments] = useState<Department[]>([
      { id: 'root', name: 'NexOrder 总部', description: '公司最高管理机构' },
      { id: 'c2', name: '营销中心', description: '负责市场推广与销售', parentId: 'root' },
      { id: 'c3', name: '运营中心', description: '负责交付与服务', parentId: 'root' },
      { id: 'c2-d1', name: '国内销售部', description: '大陆地区业务', parentId: 'c2' },
      { id: 'c2-d1-r1', name: '华北区', description: '京津冀', parentId: 'c2-d1' }, 
      { id: 'c2-d1-r1-t1', name: '北京销售组', description: '北京客户', parentId: 'c2-d1-r1' },
      { id: 'c3-d1', name: '商务部', description: '合同与流程', parentId: 'c3' },
      { id: 'c3-d2', name: '物流部', description: '发货与库存', parentId: 'c3' },
  ]);

  // --- 3. Users and Roles ---
  const [roles, setRoles] = useState<RoleDefinition[]>([
      { id: 'Admin', name: '管理员 (Admin)', description: '拥有系统所有权限', isSystem: true, permissions: ['all'] },
      { id: 'Sales', name: '销售经理 (Sales)', description: '负责客户跟进与订单录入', isSystem: true, permissions: ['order_view_all', 'order_create', 'order_view_payment', 'order_view_completed', 'customer_view', 'opportunity_manage'] },
      { id: 'Business', name: '商务经理 (Business)', description: '负责合同审批与收款确认', isSystem: true, permissions: ['order_view_pending_approval', 'order_view_pending_confirm', 'order_approve', 'payment_manage'] },
      { id: 'Technical', name: '技术支持 (Technical)', description: '负责生产授权与安装包', isSystem: true, permissions: ['order_view_auth_confirm', 'order_view_stock_prep', 'stock_prep', 'license_gen'] },
      { id: 'Logistics', name: '物流专员 (Logistics)', description: '负责发货与物流跟踪', isSystem: true, permissions: ['order_view_stock_prep', 'shipping_manage'] },
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: 'u1', accountId: '10000001', name: '张伟 (Admin)', email: 'zhangwei@nexorder.com', role: 'Admin', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ZhangWei', departmentId: 'root' },
    { id: 'u2', accountId: '10000002', name: '李娜 (Sales)', email: 'lina@nexorder.com', role: 'Sales', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=LiNa', departmentId: 'c2-d1-r1-t1' },
    { id: 'u3', accountId: '10000003', name: '王强 (Business)', email: 'wangqiang@nexorder.com', role: 'Business', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=WangQiang', departmentId: 'c3-d1' },
    { id: 'u4', accountId: '10000004', name: '赵敏 (Technical)', email: 'zhaomin@nexorder.com', role: 'Technical', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ZhaoMin', departmentId: 'root' },
    { id: 'u5', accountId: '10000005', name: '孙涛 (Logistics)', email: 'suntao@nexorder.com', role: 'Logistics', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SunTao', departmentId: 'c3-d2' },
    { id: 'u6', accountId: '10000006', name: '周杰 (Sales)', email: 'zhoujie@nexorder.com', role: 'Sales', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix', departmentId: 'c2-d1' },
    { id: 'u7', accountId: '10000007', name: '吴刚 (Sales)', email: 'wugang@nexorder.com', role: 'Sales', userType: 'Internal', status: 'Inactive', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka', departmentId: 'c2-d1' },
    { id: 'u8', accountId: '10000008', name: '郑华 (Finance)', email: 'zhenghua@nexorder.com', role: 'Business', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ZhengHua', departmentId: 'c3-d1' },
    { id: 'u9', accountId: '20000001', name: '陈总 (Partner)', email: 'chen@partner.com', role: 'Sales', userType: 'External', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ChenPartner', departmentId: '' },
  ]);
  const [currentUser, setCurrentUser] = useState<User>(users[0]);

  // --- 4. Customers ---
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
        
        // Generate random enterprises (1-3) with 8-digit IDs
        const entCount = Math.floor(Math.random() * 3) + 1;
        const enterprises = Array.from({length: entCount}).map((_, idx) => ({
            id: (88000000 + i * 100 + idx).toString(),
            name: `${companyName} ${idx === 0 ? '总租户' : `分租户 ${idx}`}`
        }));

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
                { id: `ct-${i}-2`, name: '张工', phone: `1380000${1000+i}`, email: `it@${id.toLowerCase()}.com`, position: 'IT负责人', roles: ['IT'], isPrimary: false }
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
            enterprises
        };
    });
    setCustomers(initialCustomers);
  }, [users]);

  // --- 6. Channels Mock Data ---
  const [channels, setChannels] = useState<Channel[]>([
      { id: 'CH00000001', name: '神州数码', type: 'Distributor', level: 'Tier1', contactName: '刘总', contactPhone: '13888888888', email: 'liu@digitalchina.com', region: '全国', status: 'Active', agreementDate: '2023-01-01' },
      { id: 'CH00000002', name: '伟仕佳杰', type: 'Distributor', level: 'Tier1', contactName: '陈总', contactPhone: '13999999999', email: 'chen@vst.com', region: '全国', status: 'Active', agreementDate: '2023-02-15' },
      { id: 'CH00000003', name: '中软国际', type: 'Distributor', level: 'Tier1', contactName: '王总', contactPhone: '13777777777', email: 'wang@chinasoft.com', region: '华东', status: 'Active', agreementDate: '2023-03-10' },
      { id: 'CH00000004', name: '软通动力', type: 'Distributor', level: 'Tier2', contactName: '李总', contactPhone: '13666666666', email: 'li@isoftstone.com', region: '华南', status: 'Active', agreementDate: '2023-04-20' },
      { id: 'CH00000005', name: '东华软件', type: 'Reseller', level: 'Tier2', contactName: '张总', contactPhone: '13555555555', email: 'zhang@dhcc.com', region: '华北', status: 'Active', agreementDate: '2023-05-12' },
      { id: 'CH00000006', name: '太极股份', type: 'Reseller', level: 'Tier2', contactName: '孙总', contactPhone: '13444444444', email: 'sun@taiji.com', region: '华北', status: 'Active', agreementDate: '2023-06-18' },
      { id: 'CH00000007', name: '汉得信息', type: 'Reseller', level: 'Tier3', contactName: '周总', contactPhone: '13333333333', email: 'zhou@hand-china.com', region: '华东', status: 'Active', agreementDate: '2023-07-25' },
      { id: 'CH00000008', name: '用友网络', type: 'Distributor', level: 'Tier1', contactName: '吴总', contactPhone: '13222222222', email: 'wu@yonyou.com', region: '全国', status: 'Active', agreementDate: '2023-08-30' },
      { id: 'CH00000009', name: '金蝶软件', type: 'Distributor', level: 'Tier1', contactName: '郑总', contactPhone: '13111111111', email: 'zheng@kingdee.com', region: '全国', status: 'Active', agreementDate: '2023-09-15' },
      { id: 'CH00000010', name: '浪潮软件', type: 'Distributor', level: 'Tier1', contactName: '冯总', contactPhone: '13000000000', email: 'feng@inspur.com', region: '华北', status: 'Active', agreementDate: '2023-10-05' },
      { id: 'CH00000011', name: '北明软件', type: 'Reseller', level: 'Tier2', contactName: '褚总', contactPhone: '18999999999', email: 'chu@bmsoft.com', region: '华南', status: 'Active', agreementDate: '2023-11-20' },
      { id: 'CH00000012', name: '诚迈科技', type: 'Reseller', level: 'Tier3', contactName: '卫总', contactPhone: '18888888888', email: 'wei@archermind.com', region: '华东', status: 'Active', agreementDate: '2023-12-10' },
  ]);

  // --- 7. Opportunities Mock Data (Enhanced) ---
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  useEffect(() => {
      if (customers.length === 0) return;
      
      const opps: Opportunity[] = [
          { 
            id: 'OPP001', 
            crmId: 'PR-00199303',
            name: '华兴科技-WPS 365 年度采购', 
            customerId: customers[0]?.id, 
            customerName: customers[0]?.companyName, 
            productType: '数科OFD用户端/随机数量授权 linux版云混合Lic（X+L）（政府）/年授权（1+L）',
            expectedRevenue: 500000, 
            amount: 1000000,
            finalUserRevenue: 2000000,
            stage: 'Negotiation', 
            probability: 80,
            closeDate: '2026-03-20', 
            ownerId: 'u2', 
            ownerName: '李娜', 
            createdAt: '2024-01-10' 
          },
          { 
            id: 'OPP002', 
            crmId: 'PR-00199304',
            name: '信达发展-信创终端替换一期', 
            customerId: customers[1]?.id, 
            customerName: customers[1]?.companyName, 
            productType: 'WPS Office 专业版/永久授权',
            expectedRevenue: 850000, 
            amount: 850000,
            finalUserRevenue: 1200000,
            stage: 'Proposal', 
            probability: 60,
            closeDate: '2024-07-15', 
            ownerId: 'u6', 
            ownerName: '周杰', 
            createdAt: '2024-02-05' 
          },
          { 
            id: 'OPP003', 
            crmId: 'PR-00199305',
            name: '中科网络-私有云扩容', 
            customerId: customers[2]?.id, 
            customerName: customers[2]?.companyName, 
            productType: 'WPS 365 私有云/年度订阅',
            expectedRevenue: 300000, 
            amount: 300000,
            finalUserRevenue: 450000,
            stage: 'Qualification', 
            probability: 40,
            closeDate: '2024-08-01', 
            ownerId: 'u2', 
            ownerName: '李娜', 
            createdAt: '2024-03-12' 
          },
          { id: 'OPP004', name: '远洋贸易-海外版部署咨询', customerId: customers[3]?.id, customerName: customers[3]?.companyName, expectedRevenue: 120000, stage: 'New', probability: 10, closeDate: '2024-12-31', ownerId: 'u2', ownerName: '李娜', createdAt: '2024-04-10' },
          { id: 'OPP005', name: '天行实业-全员订阅升级', customerId: customers[4]?.id, customerName: customers[4]?.companyName, expectedRevenue: 2000000, stage: 'Closed Won', probability: 100, closeDate: '2024-05-20', ownerId: 'u6', ownerName: '周杰', createdAt: '2023-11-20' },
          { id: 'OPP006', name: '博大教育-校园正版化', customerId: customers[5]?.id, customerName: customers[5]?.companyName, expectedRevenue: 450000, stage: 'Negotiation', probability: 75, closeDate: '2024-09-10', ownerId: 'u1', ownerName: '张伟', createdAt: '2024-01-22' },
          { id: 'OPP007', name: '瑞通物流-移动办公接入', customerId: customers[6]?.id, customerName: customers[6]?.companyName, expectedRevenue: 180000, stage: 'Closed Lost', probability: 0, closeDate: '2024-04-01', ownerId: 'u2', ownerName: '李娜', createdAt: '2024-02-18' },
          { id: 'OPP008', name: '金桥金融-文档安全管控', customerId: customers[7]?.id, customerName: customers[7]?.companyName, expectedRevenue: 1500000, stage: 'Proposal', probability: 55, closeDate: '2024-10-15', ownerId: 'u6', ownerName: '周杰', createdAt: '2024-03-05' },
          { id: 'OPP009', name: '海纳制造-PLM集成', customerId: customers[8]?.id, customerName: customers[8]?.companyName, expectedRevenue: 600000, stage: 'Qualification', probability: 30, closeDate: '2024-11-30', ownerId: 'u2', ownerName: '李娜', createdAt: '2024-04-01' },
          { id: 'OPP010', name: '智汇科技-API接口调用包', customerId: customers[9]?.id, customerName: customers[9]?.companyName, expectedRevenue: 50000, stage: 'Closed Won', probability: 100, closeDate: '2024-05-15', ownerId: 'u1', ownerName: '张伟', createdAt: '2024-05-01' },
      ];
      setOpportunities(opps);
  }, [customers]);

  // --- 5. Orders Mock Data (Updated to link Opportunities) ---
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
    if (customers.length === 0 || opportunities.length === 0 || products.length === 0 || channels.length === 0) return;

    const generateMockOrders = () => {
        const mockOrders: Order[] = [];
        const statuses = Object.values(OrderStatus);
        const sources: OrderSource[] = ['Sales', 'ChannelPortal', 'OnlineStore', 'APISync'];

        for (let i = 1; i <= 100; i++) {
            const customer = customers[i % customers.length];
            const merchandise = merchandises[i % merchandises.length]; 
            const quantity = Math.floor(Math.random() * 20) + 1;
            const total = (merchandise?.price || 500) * quantity;
            const source = sources[i % sources.length];
            
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 180));
            const dateStr = date.toISOString();

            let status = statuses[i % statuses.length];
            if (i < 10) status = OrderStatus.PENDING_APPROVAL;
            
            const isSelfDeal = Math.random() > 0.8; 
            
            // Logic to determine buyerType based on merchandise capabilities
            let buyerType: BuyerType = 'Customer';
            const supportsChannel = merchandise?.salesType.includes('Channel');
            const supportsDirect = merchandise?.salesType.includes('Direct');

            if (isSelfDeal) {
                buyerType = 'SelfDeal';
            } else {
                if (supportsChannel && supportsDirect) {
                    // If both supported, 40% chance of Channel to increase variety
                    buyerType = Math.random() > 0.6 ? 'Channel' : 'Customer';
                } else if (supportsChannel) {
                    buyerType = 'Channel';
                } else {
                    buyerType = 'Customer';
                }
            }
            
            let buyerId = undefined;
            let buyerName = customer.companyName;

            if (buyerType === 'Channel') {
                const randomChannel = channels[Math.floor(Math.random() * channels.length)];
                if (randomChannel) {
                    buyerId = randomChannel.id;
                    buyerName = randomChannel.name;
                }
            } else if (buyerType === 'Customer') {
                buyerId = customer.id;
            }
            
            if (isSelfDeal) {
                if (Math.random() > 0.5) status = OrderStatus.PENDING_PAYMENT;
                else status = OrderStatus.DELIVERED;
            }

            const isPaid = status !== OrderStatus.CANCELLED && (status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED || Math.random() > 0.3);
            const isApproved = !isSelfDeal && status !== OrderStatus.PENDING_APPROVAL && status !== OrderStatus.CANCELLED;
            
            const approval: OrderApproval = { salesApproved: false, businessApproved: false, financeApproved: false };
            const approvalRecords: ApprovalRecord[] = [];
            
            if (isApproved) {
                approval.salesApproved = true;
                approval.businessApproved = true;
                approval.financeApproved = true;
                approval.salesApprovedDate = dateStr; 
                approval.financeApprovedDate = dateStr;
                approvalRecords.push({ id: `ar-${i}-1`, operatorId: 'u2', operatorName: '李娜 (Sales)', operatorRole: 'Sales', actionType: 'Sales Approval', result: 'Approved', timestamp: dateStr, comment: '符合销售政策' });
            }

            const orderItems: OrderItem[] = (merchandise?.items || []).map(mItem => {
                const product = products.find(p => p.id === mItem.productId);
                const capabilitiesSnapshot = product?.composition?.map(c => c.name) || [];
                const sku = product?.skus.find(s => s.id === mItem.skuId);
                // Use the first pricing option as default mock value
                const defaultOption = sku?.pricingOptions?.[0]; 

                return {
                    merchandiseId: merchandise?.id,
                    merchandiseName: merchandise?.name,
                    productId: mItem.productId,
                    productName: mItem.productName,
                    skuId: mItem.skuId,
                    skuName: mItem.skuName,
                    quantity: quantity * mItem.quantity, 
                    priceAtPurchase: (merchandise?.price || 500) / (merchandise?.items.length || 1), 
                    capabilitiesSnapshot,
                    deliveredContent: (status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED) ? [generateLicenseKey()] : [],
                    activationMethod: 'LicenseKey',
                    pricingOptionId: defaultOption?.id,
                    pricingOptionName: defaultOption?.title
                };
            });

            const salesRep = users.find(u => u.id === customer.ownerId);
            const invoiceInfo: InvoiceInfo | undefined = isPaid ? {
                type: 'VAT_Special',
                content: '软件产品',
                title: customer.companyName,
                taxId: customer.billingInfo?.taxId || '',
                bankName: customer.billingInfo?.bankName || '',
                accountNumber: customer.billingInfo?.accountNumber || ''
            } : undefined;

            let oppId = undefined;
            let oppName = undefined;
            
            const customerOpp = opportunities.find(o => o.customerId === customer.id);
            if (customerOpp && Math.random() > 0.3) {
                oppId = customerOpp.id;
                oppName = customerOpp.name;
            } else if (Math.random() > 0.8 && i > 50) {
                oppId = `OPP${i}`;
                oppName = `${customer.companyName} 采购项目`;
            }

            // Determine detailed stock flags based on overall status
            const isCompleted = status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED;
            let isAuthConfirmed = isCompleted;
            let isPackageConfirmed = isCompleted;
            let isShippingConfirmed = isCompleted;
            let isCDBurned = isCompleted;

            if (status === OrderStatus.PROCESSING_PROD) {
                // Randomly assign progress for variety
                const progress = Math.floor(Math.random() * 5); // 0: Auth, 1: Pkg, 2: Ship, 3: CD, 4: Done (but still in PROCESSING_PROD)
                if (progress >= 1) isAuthConfirmed = true;
                if (progress >= 2) isPackageConfirmed = true;
                if (progress >= 3) isShippingConfirmed = true;
                if (progress >= 4) isCDBurned = true;
            }

            mockOrders.push({
                id: `S${i.toString().padStart(8, '0')}`,
                customerId: customer.id,
                customerName: customer.companyName,
                // Snapshot Data
                customerType: customer.customerType,
                customerLevel: customer.level,
                customerIndustry: customer.industry,
                customerRegion: customer.region,

                buyerType: buyerType as BuyerType,
                buyerId,
                source,
                date: dateStr,
                status,
                total,
                items: orderItems,
                shippingAddress: customer.address,
                isPaid,
                paymentDate: isPaid ? dateStr : undefined,
                
                // Stock Prep Flags
                isAuthConfirmed,
                authConfirmedDate: isAuthConfirmed ? dateStr : undefined,
                isPackageConfirmed,
                packageConfirmedDate: isPackageConfirmed ? dateStr : undefined,
                isShippingConfirmed,
                shippingConfirmedDate: isShippingConfirmed ? dateStr : undefined,
                isCDBurned,
                cdBurnedDate: isCDBurned ? dateStr : undefined,

                shippedDate: isCompleted ? dateStr : undefined,
                carrier: isCompleted || isShippingConfirmed ? 'SF Express' : undefined,
                trackingNumber: isCompleted || isShippingConfirmed ? `SF${Date.now()}` : undefined,
                
                approval,
                approvalRecords: approvalRecords.reverse(),
                salesRepId: salesRep?.id,
                salesRepName: salesRep?.name,
                businessManagerId: 'u3',
                businessManagerName: '王强 (Business)',
                invoiceInfo,
                smsOriginalOrderId: i % 5 === 0 ? `S00713${162 + i}` : undefined,
                saasOriginalOrderId: i % 5 === 0 ? `P2026030319575500000${i % 10}` : undefined,
                acceptanceInfo: { 
                    contactName: customer.contacts[0]?.name || 'Unknown', 
                    contactPhone: customer.contacts[0]?.phone || '',
                    method: 'Remote'
                },
                opportunityId: oppId,
                opportunityName: oppName,
                
                // New Business Fields from image
                buyerName: '北京小优易教科技有限公司',
                directChannel: '-',
                terminalChannel: '-',
                orderType: '订单',
                creatorName: '苏雪松',
                creatorPhone: '17610166961',
                industryLine: '大客央国企',
                province: '浙江省',
                city: '嘉兴市',
                district: '桐乡市',
                reportTag: 'EA',
                sellerName: '珠海金山办公软件有限公司',
                sellerContact: '李海瑞 (00019829)',
                customerStatus: '已覆盖',
                channelService: '否'
            });
        }
        return mockOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };
    setOrders(generateMockOrders());
  }, [customers, products, users, merchandises, opportunities, channels]);

  return (
    <Router>
      <Layout currentUser={currentUser} users={users} setCurrentUser={setCurrentUser}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          <Route path="/product-center" element={<ProductCenter products={products} />} />
          <Route path="/catalog/:id/preview" element={<ProductPreview products={products} />} />
          <Route path="/products" element={
            <ProductManager 
                products={products} setProducts={setProducts} 
                atomicCapabilities={atomicCapabilities} setAtomicCapabilities={setAtomicCapabilities}
                productRights={productRights} setProductRights={setProductRights}
                rightPackages={rightPackages} setRightPackages={setRightPackages}
                licenseDefs={licenseDefs} setLicenseDefs={setLicenseDefs}
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
            />
          } />
          <Route path="/orders/:id" element={
            <OrderDetails 
                orders={orders} setOrders={setOrders} products={products} 
                customers={customers} users={users} departments={departments} 
                currentUser={currentUser} opportunities={opportunities}
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
