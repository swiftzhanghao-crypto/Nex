
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
import ContractManager, { Contract } from './components/ContractManager';
import RemittanceManager, { Remittance } from './components/RemittanceManager';
import InvoiceManager, { Invoice } from './components/InvoiceManager';
import PerformanceManager, { Performance } from './components/PerformanceManager';
import AuthorizationManager, { Authorization } from './components/AuthorizationManager';
import DeliveryInfoManager, { DeliveryInfo } from './components/DeliveryInfoManager';
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
      composition: [
        { id: 'c1-1', name: 'WPS Office 专业版', type: 'Component' },
        { id: 'c1-2', name: 'WPS云文档', type: 'Service' },
        { id: 'c1-3', name: 'WPS会议', type: 'Service' },
        { id: 'c1-4', name: 'WPS表单', type: 'Service' },
        { id: 'c1-5', name: 'WPS IM 消息', type: 'Feature' },
        { id: 'c1-6', name: 'AI助手', type: 'Feature' },
      ],
      installPackages: [
        { id: 'AZ0006022', name: 'WPS 365 Win端', version: 'v12.1.0', url: '#', platform: 'Windows', cpu: '麒麟', os: 'UOS', arch: '-' },
        { id: 'pkg1-2', name: 'WPS 365 Mac端', version: 'v6.0.1', url: '#', platform: 'macOS', cpu: 'Intel/M1', os: 'macOS', arch: 'x64/arm64' }
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
      composition: [
        { id: 'c12-1', name: 'WPS Office 基础版', type: 'Component' },
        { id: 'c12-2', name: 'WPS云文档', type: 'Service' },
        { id: 'c12-3', name: 'WPS IM 消息', type: 'Feature' },
      ],
      installPackages: [{ id: 'pkg1-2-1', name: 'WPS 365 Win端', version: 'v12.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows 10/11' }]
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
      composition: [
        { id: 'c2-1', name: 'WPS Office 专业版', type: 'Component' },
        { id: 'c2-2', name: 'WPS云文档', type: 'Service' },
        { id: 'c2-3', name: 'WPS会议', type: 'Service' },
        { id: 'c2-4', name: 'WPS表单', type: 'Service' },
        { id: 'c2-5', name: 'WPS轻文档', type: 'Service' },
        { id: 'c2-6', name: 'WPS稻壳模板', type: 'Service' },
        { id: 'c2-7', name: 'AI智能写作', type: 'Feature' },
        { id: 'c2-8', name: 'AI图像识别', type: 'Feature' },
      ],
      installPackages: [
        { id: 'pkg2-1', name: 'WPS 365 Win端', version: 'v12.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows 10/11' },
        { id: 'pkg2-2', name: 'WPS 365 移动端', version: 'v11.5.0', url: '#', platform: 'Android/iOS', cpu: '通用', os: 'Android 8+ / iOS 14+' }
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
      composition: [
        { id: 'c22-1', name: 'WPS Office 专业版', type: 'Component' },
        { id: 'c22-2', name: 'WPS云文档', type: 'Service' },
        { id: 'c22-3', name: 'WPS表单', type: 'Service' },
        { id: 'c22-4', name: 'AI智能写作', type: 'Feature' },
        { id: 'c22-5', name: '教育管控平台', type: 'Service' },
      ],
      installPackages: [{ id: 'pkg2-2-1', name: 'WPS 365 Win端', version: 'v12.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows 10/11' }]
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
      composition: [
        { id: 'c5-1', name: 'WPS Office 服务端', type: 'Component' },
        { id: 'c5-2', name: '私有云文档协作引擎', type: 'Component' },
        { id: 'c5-3', name: '私有IM服务', type: 'Service' },
        { id: 'c5-4', name: '企业会议系统', type: 'Service' },
        { id: 'c5-5', name: 'AI写作助手 (私有部署)', type: 'Feature' },
        { id: 'c5-6', name: '管理员控制台', type: 'Feature' },
      ],
      installPackages: [{ id: 'pkg5-1', name: '私有云部署包', version: 'v7.0.0', url: '#', platform: 'Linux', cpu: 'x86_64/ARM', os: 'CentOS 7+ / UOS' }]
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
      composition: [
        { id: 'c52-1', name: 'WPS Office 服务端', type: 'Component' },
        { id: 'c52-2', name: '私有云文档存储引擎', type: 'Component' },
        { id: 'c52-3', name: '私有IM服务', type: 'Service' },
        { id: 'c52-4', name: '管理员控制台', type: 'Feature' },
      ],
      installPackages: [{ id: 'pkg5-2-1', name: '私有云部署包', version: 'v7.0.0', url: '#', platform: 'Linux', cpu: 'x86_64/ARM', os: 'CentOS 7+ / UOS' }]
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
      composition: [
        { id: 'c8-1', name: 'WebOffice 文字引擎', type: 'Component' },
        { id: 'c8-2', name: 'WebOffice 表格引擎', type: 'Component' },
        { id: 'c8-3', name: 'WebOffice 演示引擎', type: 'Component' },
        { id: 'c8-4', name: '协同编辑服务', type: 'Service' },
      ],
      installPackages: [{ id: 'pkg8-1', name: 'WebOffice SDK', version: 'v3.2.1', url: '#', platform: 'Web', cpu: '通用', os: '全平台' }]
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
      composition: [
        { id: 'c82-1', name: 'WebOffice 文字引擎', type: 'Component' },
        { id: 'c82-2', name: 'WebOffice 表格引擎', type: 'Component' },
        { id: 'c82-3', name: 'WebOffice 演示引擎', type: 'Component' },
        { id: 'c82-4', name: 'WebOffice PDF引擎', type: 'Component' },
        { id: 'c82-5', name: '协同编辑服务', type: 'Service' },
        { id: 'c82-6', name: 'AI文档处理', type: 'Feature' },
        { id: 'c82-7', name: '插件扩展框架', type: 'Feature' },
      ],
      installPackages: [{ id: 'pkg8-2-1', name: 'WebOffice SDK', version: 'v3.2.1', url: '#', platform: 'Web', cpu: '通用', os: '全平台' }]
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
      composition: [
        { id: 'c12-1', name: 'WPS 文字', type: 'Component' },
        { id: 'c12-2', name: 'WPS 表格', type: 'Component' },
        { id: 'c12-3', name: 'WPS 演示', type: 'Component' },
        { id: 'c12-4', name: 'WPS PDF', type: 'Component' },
      ],
      installPackages: [{ id: 'pkg12-1', name: 'WPS 2019 安装包', version: 'v11.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows 7/10/11' }]
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
      composition: [
        { id: 'c122-1', name: 'WPS 文字', type: 'Component' },
        { id: 'c122-2', name: 'WPS 表格', type: 'Component' },
        { id: 'c122-3', name: 'WPS 演示', type: 'Component' },
        { id: 'c122-4', name: 'WPS PDF', type: 'Component' },
        { id: 'c122-5', name: 'AI写作助手', type: 'Feature' },
        { id: 'c122-6', name: 'WPS稻壳模板', type: 'Service' },
      ],
      installPackages: [{ id: 'pkg12-2-1', name: 'WPS 2019 安装包', version: 'v11.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows 7/10/11' }]
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
      composition: [
        { id: 'c15-1', name: 'WPS 文字 (Mac)', type: 'Component' },
        { id: 'c15-2', name: 'WPS 表格 (Mac)', type: 'Component' },
        { id: 'c15-3', name: 'WPS 演示 (Mac)', type: 'Component' },
        { id: 'c15-4', name: 'WPS PDF (Mac)', type: 'Component' },
      ],
      installPackages: [{ id: 'pkg15-1', name: 'WPS Mac 安装包', version: 'v6.0.1', url: '#', platform: 'macOS', cpu: 'Intel/M1/M2', os: 'macOS 11+' }]
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
      composition: [
        { id: 'c152-1', name: 'WPS 文字 (Mac)', type: 'Component' },
        { id: 'c152-2', name: 'WPS 表格 (Mac)', type: 'Component' },
        { id: 'c152-3', name: 'WPS 演示 (Mac)', type: 'Component' },
      ],
      installPackages: [{ id: 'pkg15-2-1', name: 'WPS Mac 安装包', version: 'v6.0.1', url: '#', platform: 'macOS', cpu: 'Intel/M1/M2', os: 'macOS 11+' }]
    },

    // 退市产品
    { 
      id: 'PROD-OFF-001', name: 'WPS Office 2016 专业版', category: 'Win端', subCategory: 'Win2019', status: 'OffShelf', tags: ['生态'],
      skus: [{ 
        id: 's20', code: 'S20', name: '标准版', price: 398, status: 'Inactive', stock: 0,
        pricingOptions: [
          {id:'o20-1', title:'永久授权', price:398, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},
          {id:'o20-2', title:'年度订阅', price:128, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}
        ] 
      }],
      composition: [
        { id: 'c20-1', name: 'WPS 文字', type: 'Component' },
        { id: 'c20-2', name: 'WPS 表格', type: 'Component' },
        { id: 'c20-3', name: 'WPS 演示', type: 'Component' },
      ],
      installPackages: [{ id: 'pkg20-1', name: 'WPS 2016 安装包', version: 'v10.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows 7/10' }]
    },
    {
      id: 'PROD-OFF-002', name: 'WPS Office 2013 企业版', category: 'Win端', subCategory: 'Win2019', status: 'OffShelf', tags: ['生态'],
      skus: [{
        id: 's21', code: 'S21', name: '企业版', price: 298, status: 'Inactive', stock: 0,
        pricingOptions: [
          {id:'o21-1', title:'永久授权', price:298, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}
        ]
      }],
      composition: [
        { id: 'c21-1', name: 'WPS 文字', type: 'Component' },
        { id: 'c21-2', name: 'WPS 表格', type: 'Component' },
        { id: 'c21-3', name: 'WPS 演示', type: 'Component' },
      ],
      installPackages: [{ id: 'pkg21-1', name: 'WPS 2013 安装包', version: 'v9.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows XP/7' }]
    },
    {
      id: 'PROD-OFF-003', name: 'WPS 365 基础版 (旧版)', category: '云服务产品', subCategory: 'WPS365公有云', status: 'OffShelf', tags: ['生态'],
      skus: [{
        id: 's22', code: 'S22', name: '基础版', price: 99, status: 'Inactive', stock: 0,
        pricingOptions: [
          {id:'o22-1', title:'年度订阅', price:99, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}
        ]
      }],
      installPackages: []
    },
    {
      id: 'PROD-OFF-004', name: 'WPS Mac 2019 标准版', category: 'Mac端', subCategory: 'Mac2019', status: 'OffShelf', tags: ['生态'],
      skus: [{
        id: 's23', code: 'S23', name: '标准版', price: 338, status: 'Inactive', stock: 0,
        pricingOptions: [
          {id:'o23-1', title:'永久授权', price:338, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},
          {id:'o23-2', title:'年度订阅', price:108, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}
        ]
      }],
      installPackages: [{ id: 'pkg23-1', name: 'WPS Mac 2019 安装包', version: 'v2.1.0', url: '#', platform: 'Mac', cpu: '通用', os: 'macOS 10.13+' }]
    },
    {
      id: 'PROD-OFF-005', name: 'WPS 文字处理单品 (旧版)', category: '单品授权', subCategory: '私有云单品', status: 'OffShelf', tags: ['生态'],
      skus: [{
        id: 's24', code: 'S24', name: '标准版', price: 188, status: 'Inactive', stock: 0,
        pricingOptions: [
          {id:'o24-1', title:'永久授权', price:188, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}
        ]
      }],
      installPackages: []
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
      { id: 'Sales', name: '销售经理 (Sales)', description: '负责客户跟进与订单录入', isSystem: true, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_create', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'order_view_refund_pending', 'order_view_refunded', 'order_view_cancelled', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_shipping', 'order_detail_log', 'customer_view', 'opportunity_manage', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'leads_view', 'performance_view'] },
      { id: 'Business', name: '商务经理 (Business)', description: '负责合同审批与收款确认', isSystem: true, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_approve', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_contract', 'order_detail_invoice', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_log', 'payment_manage', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license', 'order_view_refund_pending', 'order_view_refunded', 'order_view_cancelled'] },
      { id: 'Technical', name: '技术支持 (Technical)', description: '负责生产授权与安装包', isSystem: true, permissions: ['dashboard_view', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_workflow_view', 'order_workflow_stock', 'order_workflow_shipping', 'stock_prep', 'license_gen', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license', 'product_tab_rights', 'product_tab_packages', 'product_tab_atomic', 'wps_ops_view', 'authorization_view', 'delivery_info_view'] },
      { id: 'Logistics', name: '物流专员 (Logistics)', description: '负责发货与物流跟踪', isSystem: true, permissions: ['dashboard_view', 'order_view_stock_ship', 'order_view_shipped', 'order_workflow_view', 'order_workflow_shipping', 'shipping_manage'] },
      { id: 'Executive', name: '高管', description: '公司高层管理人员，拥有全局数据查看权限', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'order_view_refund_pending', 'order_view_refunded', 'order_view_cancelled', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_contract', 'order_detail_original', 'order_detail_invoice', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_shipping', 'order_detail_snapshot', 'order_detail_log', 'customer_view', 'opportunity_manage', 'channel_view', 'contract_view', 'payment_manage', 'invoice_manage', 'remittance_view', 'authorization_view', 'delivery_info_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license', 'product_tab_rights', 'product_tab_packages', 'product_tab_atomic', 'merchandise_view', 'leads_view', 'wps_ops_view', 'performance_view'] },
      { id: 'Commerce', name: '商务', description: '负责商务谈判、合同管理与发票对接', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_approve', 'order_view_shipped', 'order_view_completed', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_contract', 'order_detail_invoice', 'order_detail_acceptance', 'order_detail_log', 'customer_view', 'opportunity_manage', 'channel_view', 'contract_view', 'contract_edit', 'payment_manage', 'invoice_manage', 'invoice_approve', 'remittance_view', 'authorization_view', 'delivery_info_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license', 'performance_view'] },
      { id: 'Month03', name: '3月', description: '3月份固定角色', isSystem: false, permissions: ['order_list_view', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_original', 'order_detail_log', 'product_display_view', 'product_view'] },
      { id: 'Month04', name: '4月', description: '4月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_view_all', 'order_view_pending_approval', 'order_workflow_view', 'order_workflow_payment', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_log', 'customer_view', 'product_display_view', 'product_view', 'product_tab_spu'] },
      { id: 'Month05', name: '5月', description: '5月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_log', 'customer_view', 'opportunity_manage', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku'] },
      { id: 'Month06', name: '6月', description: '6月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_contract', 'order_detail_invoice', 'order_detail_log', 'customer_view', 'contract_view', 'invoice_manage', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license'] },
      { id: 'Month07', name: '7月', description: '7月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_contract', 'order_detail_acceptance', 'order_detail_delivery', 'order_detail_log', 'customer_view', 'contract_view', 'payment_manage', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license', 'authorization_view'] },
      { id: 'Month08', name: '8月', description: '8月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_contract', 'order_detail_invoice', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_detail_shipping', 'order_detail_log', 'customer_view', 'contract_view', 'payment_manage', 'invoice_manage', 'remittance_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license', 'product_tab_rights', 'authorization_view', 'delivery_info_view'] },
      { id: 'Month09', name: '9月', description: '9月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_shipped', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_contract', 'order_detail_invoice', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_shipping', 'order_detail_log', 'customer_view', 'opportunity_manage', 'contract_view', 'payment_manage', 'invoice_manage', 'remittance_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license', 'product_tab_rights', 'product_tab_packages', 'authorization_view', 'delivery_info_view', 'performance_view'] },
      { id: 'Month10', name: '10月', description: '10月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_contract', 'order_detail_original', 'order_detail_invoice', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_shipping', 'order_detail_snapshot', 'order_detail_log', 'customer_view', 'opportunity_manage', 'channel_view', 'contract_view', 'payment_manage', 'invoice_manage', 'remittance_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license', 'product_tab_rights', 'product_tab_packages', 'product_tab_atomic', 'merchandise_view', 'authorization_view', 'delivery_info_view', 'performance_view'] },
      { id: 'Month11', name: '11月', description: '11月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'order_view_refund_pending', 'order_view_refunded', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_contract', 'order_detail_original', 'order_detail_invoice', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_shipping', 'order_detail_snapshot', 'order_detail_log', 'customer_view', 'opportunity_manage', 'channel_view', 'contract_view', 'payment_manage', 'invoice_manage', 'remittance_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license', 'product_tab_rights', 'product_tab_packages', 'product_tab_atomic', 'merchandise_view', 'leads_view', 'authorization_view', 'delivery_info_view', 'performance_view', 'wps_ops_view'] },
      { id: 'Month12', name: '12月', description: '12月份固定角色', isSystem: false, permissions: ['dashboard_view', 'order_list_view', 'order_column_config', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'order_view_refund_pending', 'order_view_refunded', 'order_view_cancelled', 'order_workflow_view', 'order_workflow_payment', 'order_workflow_approval', 'order_workflow_confirm', 'order_workflow_stock', 'order_workflow_shipping', 'order_workflow_acceptance', 'order_detail_product', 'order_detail_customer', 'order_detail_trader', 'order_detail_opportunity', 'order_detail_contract', 'order_detail_original', 'order_detail_invoice', 'order_detail_acceptance', 'order_detail_delivery', 'order_delivery_auth_change', 'order_delivery_redelivery', 'order_detail_shipping', 'order_detail_snapshot', 'order_detail_log', 'customer_view', 'opportunity_manage', 'channel_view', 'contract_view', 'payment_manage', 'invoice_manage', 'invoice_approve', 'remittance_view', 'product_display_view', 'product_display_preview', 'product_view', 'product_tab_spu', 'product_tab_sku', 'product_tab_license', 'product_tab_rights', 'product_tab_packages', 'product_tab_atomic', 'product_edit', 'merchandise_view', 'merchandise_edit', 'leads_view', 'authorization_view', 'delivery_info_view', 'performance_view', 'wps_ops_view'] },
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: 'u1', accountId: '10000001', name: '张伟 (Admin)', email: 'zhangwei@wps.cn', phone: '13800000001', role: 'Admin', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ZhangWei', departmentId: 'root' },
    { id: 'u2', accountId: '10000002', name: '李娜 (Sales)', email: 'lina@wps.cn', phone: '13800000002', role: 'Sales', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=LiNa', departmentId: 'c2-d1-r1-t1' },
    { id: 'u3', accountId: '10000003', name: '王强 (Business)', email: 'wangqiang@wps.cn', phone: '13800000003', role: 'Business', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=WangQiang', departmentId: 'c3-d1' },
    { id: 'u4', accountId: '10000004', name: '赵敏 (Technical)', email: 'zhaomin@wps.cn', phone: '13800000004', role: 'Technical', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ZhaoMin', departmentId: 'root' },
    { id: 'u5', accountId: '10000005', name: '孙涛 (Logistics)', email: 'suntao@wps.cn', phone: '13800000005', role: 'Logistics', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SunTao', departmentId: 'c3-d2' },
    { id: 'u6', accountId: '10000006', name: '周杰 (Sales)', email: 'zhoujie@wps.cn', phone: '13800000006', role: 'Sales', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix', departmentId: 'c2-d1' },
    { id: 'u7', accountId: '10000007', name: '吴刚 (Sales)', email: 'wugang@wps.cn', phone: '13800000007', role: 'Sales', userType: 'Internal', status: 'Inactive', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka', departmentId: 'c2-d1' },
    { id: 'u8', accountId: '10000008', name: '郑华 (Finance)', email: 'zhenghua@wps.cn', phone: '13800000008', role: 'Business', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ZhengHua', departmentId: 'c3-d1' },
    { id: 'u9', accountId: '20000001', name: '陈总 (Partner)', email: 'chen@wps.cn', phone: '13800000009', role: 'Sales', userType: 'External', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ChenPartner', departmentId: '' },
    { id: 'u10', accountId: '10000010', name: '苏雪松', email: 'suxuesong@wps.cn', phone: '17610166961', role: 'Business', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SuXueSong', departmentId: 'c2-d1' },
    { id: 'u11', accountId: '10000011', name: '林通', email: 'lintong@wps.cn', phone: '13800000011', role: 'Executive', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=梅花', departmentId: 'root', monthBadge: '正月' },
    { id: 'u12', accountId: '10000012', name: '陆游', email: 'luyou@wps.cn', phone: '13800000012', role: 'Sales', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=杏花', departmentId: 'c2-d1', monthBadge: '二月' },
    { id: 'u13', accountId: '10000013', name: '息夫人', email: 'xifuren@wps.cn', phone: '13800000013', role: 'Month03', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=桃花', departmentId: 'c2-d1', monthBadge: '三月' },
    { id: 'u14', accountId: '10000014', name: '杨玉环', email: 'yangyuhuan@wps.cn', phone: '13800000014', role: 'Month04', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=芍药', departmentId: 'c3-d1', monthBadge: '四月' },
    { id: 'u15', accountId: '10000015', name: '张骞', email: 'zhangqian@wps.cn', phone: '13800000015', role: 'Month05', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=石榴花', departmentId: 'c2-d1-r1', monthBadge: '五月' },
    { id: 'u16', accountId: '10000016', name: '周敦颐', email: 'zhoudunyi@wps.cn', phone: '13800000016', role: 'Month06', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=荷花', departmentId: 'root', monthBadge: '六月' },
    { id: 'u17', accountId: '10000017', name: '徐渭', email: 'xuwei@wps.cn', phone: '13800000017', role: 'Month07', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=蜀葵', departmentId: 'root', monthBadge: '七月' },
    { id: 'u18', accountId: '10000018', name: '李清照', email: 'liqingzhao@wps.cn', phone: '13800000018', role: 'Month08', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=桂花', departmentId: 'c3-d1', monthBadge: '八月' },
    { id: 'u19', accountId: '10000019', name: '陶渊明', email: 'taoyuanming@wps.cn', phone: '13800000019', role: 'Month09', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=菊花', departmentId: 'c3-d1', monthBadge: '九月' },
    { id: 'u20', accountId: '10000020', name: '王昭君', email: 'wangzhaojun@wps.cn', phone: '13800000020', role: 'Month10', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=芙蓉', departmentId: 'c2-d1-r1-t1', monthBadge: '十月' },
    { id: 'u21', accountId: '10000021', name: '白居易', email: 'baijuyi@wps.cn', phone: '13800000021', role: 'Month11', userType: 'Internal', status: 'Active', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=山茶', departmentId: 'root', monthBadge: '冬月' },
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

  // --- 6a. Standalone Enterprises (not linked to any customer) ---
  const [standaloneEnterprises] = useState<import('./types').Enterprise[]>([
    { id: '99000001', name: '量子云算科技有限公司' },
    { id: '99000002', name: '星海数字信息技术有限公司' },
    { id: '99000003', name: '鼎鑫智能制造有限公司' },
    { id: '99000004', name: '未来芯片研究院有限公司' },
    { id: '99000005', name: '极光网络安全科技有限公司' },
    { id: '99000006', name: '万象大数据服务有限公司' },
    { id: '99000007', name: '碳链区块链技术有限公司' },
    { id: '99000008', name: '浩瀚卫星通信科技有限公司' },
    { id: '99000009', name: '凌峰人工智能有限公司' },
    { id: '99000010', name: '聚能新能源软件有限公司' },
  ]);

  // --- 6. Channels Mock Data ---
  const [channels, setChannels] = useState<Channel[]>([
      { id: 'CH00000001', name: '神州数码', type: 'Distributor', level: 'Tier1', contactName: '刘总', contactPhone: '13888888888', email: 'liu@wps.cn', region: '全国', status: 'Active', agreementDate: '2023-01-01' },
      { id: 'CH00000002', name: '伟仕佳杰', type: 'Distributor', level: 'Tier1', contactName: '陈总', contactPhone: '13999999999', email: 'chen@wps.cn', region: '全国', status: 'Active', agreementDate: '2023-02-15' },
      { id: 'CH00000003', name: '中软国际', type: 'Distributor', level: 'Tier1', contactName: '王总', contactPhone: '13777777777', email: 'wang@wps.cn', region: '华东', status: 'Active', agreementDate: '2023-03-10' },
      { id: 'CH00000004', name: '软通动力', type: 'Distributor', level: 'Tier2', contactName: '李总', contactPhone: '13666666666', email: 'li@wps.cn', region: '华南', status: 'Active', agreementDate: '2023-04-20' },
      { id: 'CH00000005', name: '东华软件', type: 'Reseller', level: 'Tier2', contactName: '张总', contactPhone: '13555555555', email: 'zhang@wps.cn', region: '华北', status: 'Active', agreementDate: '2023-05-12' },
      { id: 'CH00000006', name: '太极股份', type: 'Reseller', level: 'Tier2', contactName: '孙总', contactPhone: '13444444444', email: 'sun@wps.cn', region: '华北', status: 'Active', agreementDate: '2023-06-18' },
      { id: 'CH00000007', name: '汉得信息', type: 'Reseller', level: 'Tier3', contactName: '周总', contactPhone: '13333333333', email: 'zhou@wps.cn', region: '华东', status: 'Active', agreementDate: '2023-07-25' },
      { id: 'CH00000008', name: '用友网络', type: 'Distributor', level: 'Tier1', contactName: '吴总', contactPhone: '13222222222', email: 'wu@wps.cn', region: '全国', status: 'Active', agreementDate: '2023-08-30' },
      { id: 'CH00000009', name: '金蝶软件', type: 'Distributor', level: 'Tier1', contactName: '郑总', contactPhone: '13111111111', email: 'zheng@wps.cn', region: '全国', status: 'Active', agreementDate: '2023-09-15' },
      { id: 'CH00000010', name: '浪潮软件', type: 'Distributor', level: 'Tier1', contactName: '冯总', contactPhone: '13000000000', email: 'feng@wps.cn', region: '华北', status: 'Active', agreementDate: '2023-10-05' },
      { id: 'CH00000011', name: '北明软件', type: 'Reseller', level: 'Tier2', contactName: '褚总', contactPhone: '18999999999', email: 'chu@wps.cn', region: '华南', status: 'Active', agreementDate: '2023-11-20' },
      { id: 'CH00000012', name: '诚迈科技', type: 'Reseller', level: 'Tier3', contactName: '卫总', contactPhone: '18888888888', email: 'wei@wps.cn', region: '华东', status: 'Active', agreementDate: '2023-12-10' },
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
            // Top 5 orders get very recent dates (0-4 days ago) to appear at the top of the list
            date.setDate(date.getDate() - (i <= 5 ? (i - 1) : Math.floor(Math.random() * 180)));
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

            const licenseTypeFallbacks = ['数量授权', '用户订阅许可', '服务器授权', '年授权'] as const;

            const deriveLicenseType = (option?: { license: { type: string; scope: string } }): string => {
                if (!option) return licenseTypeFallbacks[0];
                const { type, scope } = option.license;
                if (type === 'FlatRate') return '服务器授权';
                if (type === 'Perpetual') return scope === 'Platform' ? '服务器授权' : '数量授权';
                if (type === 'Subscription') return scope === '1 User' ? '用户订阅许可' : '年授权';
                return '数量授权';
            };

            // Extra product pool for multi-item orders
            const extraProductPool = [
                { productId: 'PROD-PUB-002', productName: 'WPS 365 高级版', skuId: 's2', skuName: '标准版', price: 499 },
                { productId: 'PROD-PUB-001-2', productName: 'WPS 365 基础版 (政府)', skuId: 's1-2', skuName: '基础版', price: 199 },
                { productId: 'PROD-PVT-001', productName: 'WPS 365 高级版 (私有云)', skuId: 's5', skuName: '标准版', price: 50000 },
                { productId: 'PROD-ITEM-001', productName: 'Web Office 核心组件', skuId: 's8', skuName: '标准版', price: 20000 },
                { productId: 'PROD-PUB-001', productName: 'WPS 365 标准版 (政府)', skuId: 's1', skuName: '标准版', price: 299 },
            ];

            const makeItem = (mItem: { productId: string; productName: string; skuId: string; skuName: string; quantity?: number }, unitPrice: number, idxOffset: number): OrderItem => {
                const product = products.find(p => p.id === mItem.productId);
                const capabilitiesSnapshot = product?.composition?.map(c => c.name) || [];
                const sku = product?.skus.find(s => s.id === mItem.skuId);
                const defaultOption = sku?.pricingOptions?.[0];
                const lt = defaultOption ? deriveLicenseType(defaultOption) : licenseTypeFallbacks[(i + idxOffset) % licenseTypeFallbacks.length];
                const periodOptions = ['1年', '2年', '3年', '5年'];
                return {
                    merchandiseId: merchandise?.id,
                    merchandiseName: merchandise?.name,
                    productId: mItem.productId,
                    productName: mItem.productName,
                    skuId: mItem.skuId,
                    skuName: mItem.skuName,
                    licenseType: lt,
                    licensePeriod: (lt === '数量授权' || lt === '服务器授权') ? '永久' : (lt === '用户订阅许可' || lt === '年授权') ? periodOptions[(i + idxOffset) % periodOptions.length] : undefined,
                    quantity: quantity * (mItem.quantity ?? 1),
                    priceAtPurchase: unitPrice,
                    capabilitiesSnapshot,
                    deliveredContent: (status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED) ? [generateLicenseKey()] : [],
                    activationMethod: 'LicenseKey',
                    pricingOptionId: defaultOption?.id,
                    pricingOptionName: defaultOption?.title
                };
            };

            const baseItems = (merchandise?.items || []).map((mItem, idx) =>
                makeItem(mItem, (merchandise?.price || 500) / (merchandise?.items.length || 1), idx)
            );

            // Determine how many extra items to add based on order index
            // Top 5 orders get 4 extra items (5 total), next 30 get 1 extra (2 total)
            const extraCount = i <= 5 ? 4 : i <= 35 ? 1 : 0;
            const extraItems: OrderItem[] = Array.from({ length: extraCount }).map((_, idx) => {
                const poolItem = extraProductPool[(i + idx) % extraProductPool.length];
                // Avoid duplicating the same product as base or already-added extras
                const usedIds = [...baseItems.map(b => b.productId)];
                let safePoolItem = poolItem;
                let attempts = 0;
                while (usedIds.includes(safePoolItem.productId) && attempts < extraProductPool.length) {
                    safePoolItem = extraProductPool[(i + idx + attempts + 1) % extraProductPool.length];
                    attempts++;
                }
                usedIds.push(safePoolItem.productId);
                return makeItem(safePoolItem, safePoolItem.price, idx + 10);
            });

            const orderItems: OrderItem[] = [...baseItems, ...extraItems];

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
                id: `S${date.getFullYear().toString().slice(-2)}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}${Math.floor(Math.random() * 1e12).toString().padStart(12,'0')}`,
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
                orderType: ['新购订单', '续费订单', '增购订单', '降配订单', '退款订单'][i % 5],
                creatorId: 'u10',
                creatorName: '苏雪松',
                creatorPhone: '17610166961',
                industryLine: '大客央国企',
                province: '浙江省',
                city: '嘉兴市',
                district: '桐乡市',
                reportTag: 'EA',
                sellerName: ['珠海金山办公软件有限公司', '武汉金山办公软件有限公司', '北京金山办公软件有限公司'][i % 3],
                sellerContact: '李海瑞 (00019829)',
                customerStatus: '已覆盖',
                channelService: '否',
                // 折算抵扣金额：约30条数据（i % 3 === 0，且 i ≤ 90）
                conversionDeductionAmount: (i % 3 === 0 && i <= 90)
                    ? Math.floor(total * 0.04 / 100) * 100 || 100
                    : undefined,
                // 折算金额：比实付金额小，约取 total 的 70%
                conversionAmount: (i % 3 === 0 && i <= 90)
                    ? Math.floor(total * 0.70 / 100) * 100 || 500
                    : undefined,
            });
        }
        return mockOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };
    setOrders(generateMockOrders());
  }, [customers, products, users, merchandises, opportunities, channels]);

  // --- 8. Contracts Mock Data ---
  const [contracts] = useState<Contract[]>(() => {
    const contractTypes = ['渠道最终用户合同', '直销合同', '框架合同', '服务合同', '补充协议'];
    const verifyStatuses: Contract['verifyStatus'][] = ['PENDING_BUSINESS', 'PENDING', 'VERIFIED', 'APPROVED', 'REJECTED'];
    const sellerCompanies = [
      '广西金奇志科技有限公司', '郑州海友科伟电子科技有限公司', '广州瑞斯信息科技有限公司',
      '杭州连邦电脑信息技术有限公司', '成都连邦信息技术有限公司', '成都中创亚太信息科技有限公司',
      '云南铠炫科技有限公司', '北京神州数码信息服务有限公司', '上海软通动力信息技术有限公司',
      '深圳市汇众腾达科技有限公司', '武汉中软国际科技有限公司', '南京太极股份有限公司',
    ];
    const buyerCompanies = [
      '广州市公用公交站场管理服务有限公司', '-', '崇左幼儿师范高等专科学校', '梁园区委',
      '马边政法委', '普洱市教育体育局', '广西凭祥产业园区管理委员会', '交投40',
      '中创智库', '北京市海淀区教育委员会', '重庆市人力资源和社会保障局', '天津滨海新区政府',
    ];
    const contractNames = [
      '崇左幼儿师范高等专科学校附属幼儿园-30套', '梁园区委合同', 'WPS365协作办公高级平台V12授校采购合同',
      '交投40', '马边政法委', '中创-智库.pdf', '普洱市教育体育局最终用户合同',
      '广西凭祥产业园区管理委员会', '北京市海淀区教委WPS采购合同', '重庆人社局信创替换项目合同',
      '天津滨海新区政务云协议', '华兴科技年度订阅合同', '信达发展信创终端合同', '中科网络私有云服务合同',
      '远洋贸易全球授权框架协议', '天行实业全员订阅协议', '博大教育校园正版化合同', '瑞通物流移动办公协议',
      '金桥金融文档安全管控合同', '海纳制造PLM集成服务合同', '智汇科技API调用包协议',
      '南京市玄武区教育局采购合同', '西安市市政工程设计研究院合同', '福州市数字办信创项目协议',
      '厦门市卫生健康委员会WPS采购', '哈尔滨工业大学正版化合同', '成都市政府数字化转型采购',
      '广州开发区企业服务协议', '昆明市公安局信息化采购合同', '武汉大学图书馆协议',
    ];

    return Array.from({ length: 30 }, (_, i) => {
      const baseCode = 46543 + (29 - i);
      const statusIndex = i % verifyStatuses.length;
      return {
        id: `CT${(i + 1).toString().padStart(8, '0')}`,
        code: `HT${baseCode.toString().padStart(9, '0')}`,
        name: contractNames[i % contractNames.length],
        externalCode: i % 4 === 0 ? `EXT-${2024 + (i % 3)}-${(1000 + i).toString()}` : undefined,
        contractType: contractTypes[i % contractTypes.length],
        partyA: buyerCompanies[i % buyerCompanies.length] === '-' ? undefined : buyerCompanies[i % buyerCompanies.length],
        partyB: sellerCompanies[i % sellerCompanies.length],
        verifyStatus: verifyStatuses[statusIndex],
        verifyRemark: verifyStatuses[statusIndex] === 'REJECTED' ? '合同条款不符合规范，请修改后重新提交' : undefined,
        amount: [15000, 50000, 120000, 299000, 500000, 850000, 1200000][i % 7],
        signDate: `2026-0${(i % 3) + 1}-${(10 + (i % 18)).toString().padStart(2, '0')}`,
        createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
      };
    });
  });

  // --- 9. Remittances Mock Data ---
  const [remittances] = useState<Remittance[]>(() => {
    const remitterNames = [
      '辽宁四方达电子股份有限公司', '北京美好时空科技有限公司', '北京宏盛福达科贸有限公司',
      '重庆环舜科技有限公司', '中银国际证券股份有限公司', '北京太极法智易科技有限公司',
      '浙江领真信息科技有限公司', '北京润成恒信科技有限公司', '北京信诺时代科技发展有限公司',
      '广州智汇科技有限公司', '天津滨海新区政府采购中心', '成都市财政局电子政务处',
      '北京市海淀区教育委员会', '重庆市人力资源和社会保障局', '南京太极股份有限公司',
      '深圳市汇众腾达科技有限公司', '杭州网易计算机系统有限公司', '上海复旦微电子集团股份有限公司',
      '武汉大学信息化建设办公室', '西安交通大学采购管理处', '福建省政府采购中心',
      '山东省财政厅集中采购办公室', '河南省教育厅信息化处', '新疆维吾尔自治区政府采购中心',
      '内蒙古电力（集团）有限责任公司', '中国石油天然气股份有限公司华北分公司',
      '国家电网有限公司信息通信分公司', '中国工商银行股份有限公司软件开发中心',
      '中国建设银行股份有限公司数据中心', '招商银行股份有限公司信息技术部',
    ];
    const receiverNames = ['武汉金山办公软件有限公司', '珠海金山办公软件有限公司', '北京金山办公软件有限公司'];
    const receiverAccounts: Record<string, string> = {
      '武汉金山办公软件有限公司': '421867018018800053651',
      '珠海金山办公软件有限公司': '999010293010305',
      '北京金山办公软件有限公司': '110023456789012345678',
    };
    const amounts = [330, 640, 1200, 2400, 3600, 4800, 6870, 7200, 15758, 27160, 46800, 75000, 162000, 288000, 500000];
    const types: Remittance['type'][] = ['渠道', '客户'];
    const methods = ['电汇', '电汇', '电汇', '网银', '支票'];

    const baseDate = new Date('2026-03-13T16:00:00');

    return Array.from({ length: 100 }, (_, i) => {
      const rmId = 145730 + i;
      const erpBase = 22026031325388530 + i;
      const receiverName = receiverNames[i % receiverNames.length];
      const payTime = new Date(baseDate.getTime() - i * 3600000 * 2);
      return {
        id: `RM${rmId}`,
        erpDocNo: `D${erpBase}`,
        bankTransactionNo: i % 3 === 0 ? undefined : `BK${Date.now().toString().slice(-10)}${i}`,
        type: types[i % types.length],
        remitterName: remitterNames[i % remitterNames.length],
        remitterAccount: i % 5 === 0 ? undefined : `6228${(480000000000 + i * 137).toString().slice(0, 12)}`,
        paymentMethod: methods[i % methods.length],
        amount: amounts[i % amounts.length],
        receiverName,
        receiverAccount: receiverAccounts[receiverName],
        paymentTime: payTime.toISOString(),
      };
    });
  });

  // --- 10. Invoices Mock Data ---
  const [invoices] = useState<Invoice[]>(() => {
    const titles = [
      '长春精彩科技有限公司', '北京美好时空科技有限公司', '广州瑞斯信息科技有限公司',
      '重庆环舜科技有限公司', '中银国际证券股份有限公司', '浙江领真信息科技有限公司',
      '武汉大学信息化建设办公室', '成都市财政局电子政务处', '深圳市汇众腾达科技有限公司',
      '北京市海淀区教育委员会', '天津滨海新区政府采购中心', '南京太极股份有限公司',
      '北京宏盛福达科贸有限公司', '杭州网易计算机系统有限公司', '西安交通大学采购管理处',
      '福建省政府采购中心', '河南省教育厅信息化处', '辽宁四方达电子股份有限公司',
      '中国石油天然气股份有限公司华北分公司', '招商银行股份有限公司信息技术部',
    ];
    const taxIds = titles.map((_, i) => `91${110000 + i * 7}MA00${(1000 + i * 13).toString().padStart(4,'0')}XY`);
    const statuses: Invoice['status'][] = ['PENDING', 'PROCESSING', 'ISSUED', 'CANCELLED', 'REJECTED'];
    const applyTypes: Invoice['applyType'][] = ['开票', '开票', '开票', '红冲', '换票'];
    const amounts = [2511, 640, 6870, 27160, 75000, 162000, 46800, 15758, 1200, 3600, 50000, 288000, 4800, 330, 7200, 500000, 120000, 36000, 9800, 24000];
    const baseTime = new Date('2026-03-13T18:14:58');

    return Array.from({ length: 60 }, (_, i) => {
      const t = new Date(baseTime.getTime() - i * 3600000 * 4);
      return {
        id: `P${(556941 - i).toString().padStart(9, '0')}`,
        invoiceTitle: titles[i % titles.length],
        taxId: i % 3 !== 0 ? taxIds[i % taxIds.length] : undefined,
        amount: amounts[i % amounts.length],
        applyTime: t.toISOString(),
        applyType: applyTypes[i % applyTypes.length],
        status: statuses[i % statuses.length],
        orderId: i % 4 === 0 ? undefined : `S260${(313000 + i).toString()}`,
        remark: i % 7 === 0 ? '请尽快处理，客户催促' : undefined,
      };
    });
  });

  const [performances] = useState<Performance[]>(() => {
    const owners = ['雷昀', '陈明伦', '王建萍', '李媛', '张伟', '周杰', '吴刚', '赵敏', '孙涛', '苏雪松', '林通', '陆游'];
    const statuses = ['已失效', '已完成', '执行中', '已取消'];
    const serviceTypes: ('授权' | '订阅')[] = ['授权', '订阅'];
    const postStatuses = ['已提供', '未提供', '不适用'];
    const discounts = ['-', '9折', '8.5折', '7折', '无'];
    return Array.from({ length: 80 }, (_, i) => {
      const svc = serviceTypes[i % 2];
      const baseAmount = [60000, 73800, 102950, 48000, 158000, 35600, 89200, 126500, 42000, 67500][i % 10];
      const projCoeff = [1, 1, 1, 0.9, 1, 0.8, 1, 1, 0.9, 1][i % 10];
      const subCoeff = svc === '订阅' ? [0.9, 0.85, 1, 0.8, 0.9][i % 5] : [1, 1, 0.9, 1, 1][i % 5];
      const authCoeff = svc === '授权' ? [0.7, 0.6, 0.8, 0.6, 0.75][i % 5] : [0.5, 0.6, 0.7, 0.55, 0.65][i % 5];
      const salesPerf = -(baseAmount);
      const weightedPerf = Math.round(salesPerf * projCoeff * (svc === '订阅' ? subCoeff : authCoeff));
      return {
        id: `YG${(38527100 - i * 3).toString().padStart(10, '0')}`,
        orderId: `S00${(603011 + i * 17).toString()}`,
        acceptanceDetailId: `YS000${(707737 - i * 23).toString()}`,
        orderStatus: statuses[i % statuses.length],
        detailAmountSubtotal: baseAmount,
        acceptanceRatio: 100,
        deferralRatio: 0,
        postContractStatus: postStatuses[i % postStatuses.length],
        discount: discounts[i % discounts.length],
        costAmount: 0,
        salesPerformance: salesPerf,
        weightedSalesPerformance: weightedPerf,
        projectWeightCoeff: projCoeff,
        productWeightCoeffSubscription: subCoeff,
        productWeightCoeffAuthorization: authCoeff,
        serviceType: svc,
        owner: owners[i % owners.length],
      };
    });
  });

  const [authorizations] = useState<Authorization[]>(() => {
    const companies = [
      { name: '东菱（上海）生物科技有限公司', region: '上海', custId: 'C-00968067' },
      { name: '安徽省人民政府驻上海办事处', region: '上海', custId: 'C-01429885' },
      { name: '北京中科创新技术有限公司', region: '北京', custId: 'C-00512344' },
      { name: '深圳前海智联科技有限公司', region: '深圳', custId: 'C-00876521' },
      { name: '广州瑞斯信息科技有限公司', region: '广州', custId: 'C-01023456' },
      { name: '杭州云途数据科技有限公司', region: '杭州', custId: 'C-00745612' },
      { name: '成都天府软件园管理有限公司', region: '成都', custId: 'C-00634578' },
      { name: '武汉光谷联合发展有限公司', region: '武汉', custId: 'C-00923451' },
      { name: '南京紫金山实验室', region: '南京', custId: 'C-01134567' },
      { name: '珠海金山办公软件有限公司', region: '珠海', custId: 'C-00100001' },
    ];
    const products = [
      { name: 'WPS PDF专业版软件V12', code: 'AB0001879' },
      { name: 'WPS Office 2023 for Linux专业版办公软件V12.8', code: 'AB0000772' },
      { name: 'WPS Office 2023 专业版V12', code: 'AB0002156' },
      { name: 'WPS 365 企业版', code: 'AB0003210' },
      { name: 'WPS AI 企业版', code: 'AB0004001' },
      { name: 'WPS 数据库专业版V3.0', code: 'AB0002789' },
    ];
    return Array.from({ length: 50 }, (_, i) => {
      const comp = companies[i % companies.length];
      const prod = products[i % products.length];
      const orderNum = 716412 - i * 7;
      const baseDate = new Date(2026, 2, 18, 17, 41, 27);
      baseDate.setDate(baseDate.getDate() - i * 5);
      const endDate = new Date(baseDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      const hasService = i % 3 === 0;
      return {
        id: `auth_${i}`,
        authCode: `${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}${String(baseDate.getDate()).padStart(2, '0')}14772000_${orderNum}`,
        orderId: `S00${orderNum}`,
        licensee: comp.name,
        customerName: comp.name,
        customerId: comp.custId,
        productName: prod.name,
        productCode: prod.code,
        authStartDate: `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')} ${String(baseDate.getHours()).padStart(2, '0')}:${String(baseDate.getMinutes()).padStart(2, '0')}:${String(baseDate.getSeconds()).padStart(2, '0')}`,
        authEndDate: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:${String(endDate.getSeconds()).padStart(2, '0')}`,
        serviceStartDate: hasService ? `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')} 00:00:00` : undefined,
        serviceEndDate: hasService ? `9999-01-01 00:00:00` : undefined,
      };
    });
  });

  const [deliveryInfos] = useState<DeliveryInfo[]>(() => {
    const companies = [
      { name: '云南省烟草公司昆明市公司', id: 'C-00150232' },
      { name: '中国烟草总公司江西省公司', id: 'C-00001415' },
      { name: '青岛武船麦克德莫特海洋工程有限公司', id: 'C-00119503' },
      { name: '广州市增城区新塘镇大敦村股份经济联合社', id: 'C-00234567' },
      { name: '深圳前海智联科技有限公司', id: 'C-00876521' },
      { name: '杭州云途数据科技有限公司', id: 'C-00745612' },
      { name: '北京中科创新技术有限公司', id: 'C-00512344' },
      { name: '成都天府软件园管理有限公司', id: 'C-00634578' },
    ];
    const deliveryTypes = ['购买', '购买', '购买', '续费', '购买', '升级'];
    const authTypes = ['数量授权', '用户订阅许可', '服务器授权', '年授权', '数量授权', '用户订阅许可'];
    const quantities = [150, 1071, 10, 500, 200, 50, 100, 300, 80, 25];
    const durations = [undefined, undefined, '1年', '2年', '3年', undefined, '1年', undefined];
    const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    return Array.from({ length: 60 }, (_, i) => {
      const comp = companies[i % companies.length];
      const baseDate = new Date(2026, 2, 17, 19, 37, 26);
      baseDate.setDate(baseDate.getDate() - i * 3);
      baseDate.setHours(baseDate.getHours() - i * 2);
      const dur = durations[i % durations.length];
      const hasAuth = i % 3 !== 2;
      const endDate = new Date(baseDate);
      if (dur === '1年') endDate.setFullYear(endDate.getFullYear() + 1);
      else if (dur === '2年') endDate.setFullYear(endDate.getFullYear() + 2);
      else if (dur === '3年') endDate.setFullYear(endDate.getFullYear() + 3);
      const hasSvc = i % 4 === 0;
      return {
        id: `JF0${1508982 - i}`,
        deliveryType: deliveryTypes[i % deliveryTypes.length],
        orderId: `S00${715985 - i * 11}`,
        quantity: quantities[i % quantities.length],
        authType: authTypes[i % authTypes.length],
        licensee: comp.name,
        customerName: comp.name,
        customerId: comp.id,
        authCode: hasAuth ? undefined : undefined,
        authDuration: dur,
        authStartDate: hasAuth ? fmtDate(baseDate) : undefined,
        authEndDate: hasAuth ? (dur ? fmtDate(endDate) : '-') : undefined,
        serviceStartDate: hasSvc ? fmtDate(baseDate) : undefined,
        serviceEndDate: hasSvc ? fmtDate(endDate) : undefined,
      };
    });
  });

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
