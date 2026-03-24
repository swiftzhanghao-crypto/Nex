import {
    SalesMerchandise, Product, User, Channel, Department, AtomicCapability,
    ProductRightDefinition, RightPackage, LicenseTypeDefinition, RoleDefinition, Enterprise
} from '../types';

// --- Atomic Capabilities ---
export const initialAtomicCapabilities: AtomicCapability[] = [
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
];

// --- Product Rights ---
export const initialProductRights: ProductRightDefinition[] = [
    { id: 'PR001', name: '云存储空间', code: 'storage_quota', dataType: 'Number', unit: 'GB', description: '企业云文档总存储空间' },
    { id: 'PR002', name: '会议并发数', code: 'meeting_concurrency', dataType: 'Number', unit: '方', description: '同时在线会议最大方数' },
    { id: 'PR003', name: 'API 调用次数', code: 'api_limit', dataType: 'Number', unit: '次/天', description: '每日 API 接口调用上限' },
    { id: 'PR004', name: '专属客户经理', code: 'vip_support', dataType: 'Boolean', description: '是否配备专属 VIP 客户经理' },
    { id: 'PR005', name: '自定义 LOGO', code: 'custom_branding', dataType: 'Boolean', description: '允许替换企业 Logo' },
    { id: 'PR006', name: '客户端设备数', code: 'device_limit', dataType: 'Number', unit: '台', description: '每账号可登录设备数' },
];

// --- Right Packages ---
export const initialRightPackages: RightPackage[] = [
    {
        id: 'PKG001', name: 'WPS 365 商业版标准权益', description: '适用于公有云商业版用户的标准权益配置',
        rights: [
            { definitionId: 'PR001', name: '云存储空间', value: 100, unit: 'GB' },
            { definitionId: 'PR002', name: '会议并发数', value: 50, unit: '方' },
            { definitionId: 'PR006', name: '客户端设备数', value: 5, unit: '台' }
        ]
    },
    {
        id: 'PKG002', name: 'WPS Office 端授权基础包', description: '适用于本地端产品的标准功能授权',
        rights: [
            { definitionId: 'PR005', name: '自定义 LOGO', value: false },
            { definitionId: 'PR006', name: '客户端设备数', value: 1, unit: '台' }
        ]
    },
    {
        id: 'PKG003', name: 'WPS Office 端授权增强包', description: '包含高级定制能力的端授权',
        rights: [
            { definitionId: 'PR005', name: '自定义 LOGO', value: true },
            { definitionId: 'PR006', name: '客户端设备数', value: 3, unit: '台' }
        ]
    }
];

// --- License Type Definitions ---
export const initialLicenseDefs: LicenseTypeDefinition[] = [
    { id: 'LT001', name: '年度订阅 (1用户)', code: 'SUB-YEAR-1U', type: 'Subscription', period: 1, periodUnit: 'Year', scope: '1 User', description: '标准年度订阅模式' },
    { id: 'LT002', name: '月度订阅 (1用户)', code: 'SUB-MON-1U', type: 'Subscription', period: 1, periodUnit: 'Month', scope: '1 User', description: '短期月度订阅模式' },
    { id: 'LT003', name: '永久授权 (1设备)', code: 'PERP-DEV-1', type: 'Perpetual', period: 1, periodUnit: 'Forever', scope: '1 Device', description: '买断制永久授权' },
    { id: 'LT004', name: '场地授权 (100设备)', code: 'SITE-100', type: 'FlatRate', period: 1, periodUnit: 'Year', scope: '100 Devices', description: '年度场地包' },
    { id: 'LT005', name: '平台订阅 (Server)', code: 'SUB-PLAT', type: 'Subscription', period: 1, periodUnit: 'Year', scope: 'Platform', description: '服务器端平台授权' },
];

// --- Products ---
export const initialProducts: Product[] = [
  {
    id: 'AB0000001', name: 'WPS 365 标准版 (政府)', category: 'WPS365公有云', subCategory: 'WPS365标准版（政府）（服务）', status: 'OnShelf', tags: ['IM', 'AI', '生态'],
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
    id: 'AB0000002', name: 'WPS 365 基础版 (政府)', category: 'WPS365公有云', subCategory: 'WPS365标准版（政府）（服务）', status: 'OnShelf', tags: ['IM', '生态'],
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
    id: 'AB0000003', name: 'WPS 365 高级版', category: 'WPS365公有云', subCategory: 'WPS365高级版', status: 'OnShelf', tags: ['AI', '生态'],
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
    id: 'AB0000004', name: 'WPS 365 高级版 (教育)', category: 'WPS365公有云', subCategory: 'WPS365高级版', status: 'OnShelf', tags: ['AI', '生态'],
    skus: [{ id: 's2-2', code: 'S2-2', name: '教育版', price: 299, status: 'Active', stock: 100, pricingOptions: [{id:'o2-2-1', title:'年度订阅 (教育版)', price:299, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}},{id:'o2-2-2', title:'永久授权 (教育版)', price:999, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 User'}}] }],
    composition: [{ id: 'c22-1', name: 'WPS Office 专业版', type: 'Component' },{ id: 'c22-2', name: 'WPS云文档', type: 'Service' },{ id: 'c22-3', name: 'WPS表单', type: 'Service' },{ id: 'c22-4', name: 'AI智能写作', type: 'Feature' },{ id: 'c22-5', name: '教育管控平台', type: 'Service' }],
    installPackages: [{ id: 'pkg2-2-1', name: 'WPS 365 Win端', version: 'v12.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows 10/11' }]
  },
  {
    id: 'AB0000005', name: 'WPS 365 高级版 (私有云)', category: 'WPS365私有云', subCategory: 'WPS365高级版（私有云）', status: 'OnShelf', tags: ['IM', 'AI'],
    skus: [{ id: 's5', code: 'S5', name: '标准版', price: 50000, status: 'Active', stock: 100, pricingOptions: [{id:'o5-1', title:'永久授权 (私有云)', price:50000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}},{id:'o5-2', title:'年度订阅 (私有云)', price:15000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }],
    composition: [{ id: 'c5-1', name: 'WPS Office 服务端', type: 'Component' },{ id: 'c5-2', name: '私有云文档协作引擎', type: 'Component' },{ id: 'c5-3', name: '私有IM服务', type: 'Service' },{ id: 'c5-4', name: '企业会议系统', type: 'Service' },{ id: 'c5-5', name: 'AI写作助手 (私有部署)', type: 'Feature' },{ id: 'c5-6', name: '管理员控制台', type: 'Feature' }],
    installPackages: [{ id: 'pkg5-1', name: '私有云部署包', version: 'v7.0.0', url: '#', platform: 'Linux', cpu: 'x86_64/ARM', os: 'CentOS 7+ / UOS' }]
  },
  {
    id: 'AB0000006', name: 'WPS 365 基础版 (私有云)', category: 'WPS365私有云', subCategory: 'WPS365高级版（私有云）', status: 'OnShelf', tags: ['IM'],
    skus: [{ id: 's5-2', code: 'S5-2', name: '基础版', price: 20000, status: 'Active', stock: 100, pricingOptions: [{id:'o5-2-1', title:'永久授权 (私有云基础)', price:20000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}},{id:'o5-2-2', title:'年度订阅 (私有云基础)', price:8000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }],
    composition: [{ id: 'c52-1', name: 'WPS Office 服务端', type: 'Component' },{ id: 'c52-2', name: '私有云文档存储引擎', type: 'Component' },{ id: 'c52-3', name: '私有IM服务', type: 'Service' },{ id: 'c52-4', name: '管理员控制台', type: 'Feature' }],
    installPackages: [{ id: 'pkg5-2-1', name: '私有云部署包', version: 'v7.0.0', url: '#', platform: 'Linux', cpu: 'x86_64/ARM', os: 'CentOS 7+ / UOS' }]
  },
  {
    id: 'AB0000007', name: 'Web Office 核心组件', category: '私有云单品', subCategory: 'Web Office', status: 'OnShelf', tags: ['生态'],
    skus: [{ id: 's8', code: 'S8', name: '标准版', price: 20000, status: 'Active', stock: 100, pricingOptions: [{id:'o8-1', title:'永久授权 (WebOffice)', price:20000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}},{id:'o8-2', title:'年度订阅 (WebOffice)', price:6000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }],
    composition: [{ id: 'c8-1', name: 'WebOffice 文字引擎', type: 'Component' },{ id: 'c8-2', name: 'WebOffice 表格引擎', type: 'Component' },{ id: 'c8-3', name: 'WebOffice 演示引擎', type: 'Component' },{ id: 'c8-4', name: '协同编辑服务', type: 'Service' }],
    installPackages: [{ id: 'pkg8-1', name: 'WebOffice SDK', version: 'v3.2.1', url: '#', platform: 'Web', cpu: '通用', os: '全平台' }]
  },
  {
    id: 'AB0000008', name: 'Web Office 增强组件', category: '私有云单品', subCategory: 'Web Office', status: 'OnShelf', tags: ['生态', 'AI'],
    skus: [{ id: 's8-2', code: 'S8-2', name: '增强版', price: 35000, status: 'Active', stock: 100, pricingOptions: [{id:'o8-2-1', title:'永久授权 (WebOffice增强)', price:35000, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}},{id:'o8-2-2', title:'年度订阅 (WebOffice增强)', price:12000, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'Platform'}}] }],
    composition: [{ id: 'c82-1', name: 'WebOffice 文字引擎', type: 'Component' },{ id: 'c82-2', name: 'WebOffice 表格引擎', type: 'Component' },{ id: 'c82-3', name: 'WebOffice 演示引擎', type: 'Component' },{ id: 'c82-4', name: 'WebOffice PDF引擎', type: 'Component' },{ id: 'c82-5', name: '协同编辑服务', type: 'Service' },{ id: 'c82-6', name: 'AI文档处理', type: 'Feature' },{ id: 'c82-7', name: '插件扩展框架', type: 'Feature' }],
    installPackages: [{ id: 'pkg8-2-1', name: 'WebOffice SDK', version: 'v3.2.1', url: '#', platform: 'Web', cpu: '通用', os: '全平台' }]
  },
  {
    id: 'AB0000009', name: 'WPS Office 2019 专业版', category: 'Win端', subCategory: 'Win2019', status: 'OnShelf', tags: ['生态'],
    skus: [{ id: 's12', code: 'S12', name: '标准版', price: 498, status: 'Active', stock: 100, pricingOptions: [{id:'o12-1', title:'永久授权 (单机版)', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},{id:'o12-2', title:'年度订阅 (单机版)', price:158, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }],
    composition: [{ id: 'c12-1', name: 'WPS 文字', type: 'Component' },{ id: 'c12-2', name: 'WPS 表格', type: 'Component' },{ id: 'c12-3', name: 'WPS 演示', type: 'Component' },{ id: 'c12-4', name: 'WPS PDF', type: 'Component' }],
    installPackages: [{ id: 'pkg12-1', name: 'WPS 2019 安装包', version: 'v11.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows 7/10/11' }]
  },
  {
    id: 'AB0000010', name: 'WPS Office 2019 增强版', category: 'Win端', subCategory: 'Win2019', status: 'OnShelf', tags: ['生态', 'AI'],
    skus: [{ id: 's12-2', code: 'S12-2', name: '增强版', price: 698, status: 'Active', stock: 100, pricingOptions: [{id:'o12-2-1', title:'永久授权', price:698, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},{id:'o12-2-2', title:'年度订阅', price:218, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }],
    composition: [{ id: 'c122-1', name: 'WPS 文字', type: 'Component' },{ id: 'c122-2', name: 'WPS 表格', type: 'Component' },{ id: 'c122-3', name: 'WPS 演示', type: 'Component' },{ id: 'c122-4', name: 'WPS PDF', type: 'Component' },{ id: 'c122-5', name: 'AI写作助手', type: 'Feature' },{ id: 'c122-6', name: 'WPS稻壳模板', type: 'Service' }],
    installPackages: [{ id: 'pkg12-2-1', name: 'WPS 2019 安装包', version: 'v11.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows 7/10/11' }]
  },
  {
    id: 'AB0000011', name: 'WPS for Mac 专业版', category: '其他软件', subCategory: 'WPS for Mac', status: 'OnShelf', tags: ['生态'],
    skus: [{ id: 's15', code: 'S15', name: '标准版', price: 498, status: 'Active', stock: 100, pricingOptions: [{id:'o15-1', title:'永久授权 (Mac版)', price:498, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},{id:'o15-2', title:'年度订阅 (Mac版)', price:158, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }],
    composition: [{ id: 'c15-1', name: 'WPS 文字 (Mac)', type: 'Component' },{ id: 'c15-2', name: 'WPS 表格 (Mac)', type: 'Component' },{ id: 'c15-3', name: 'WPS 演示 (Mac)', type: 'Component' },{ id: 'c15-4', name: 'WPS PDF (Mac)', type: 'Component' }],
    installPackages: [{ id: 'pkg15-1', name: 'WPS Mac 安装包', version: 'v6.0.1', url: '#', platform: 'macOS', cpu: 'Intel/M1/M2', os: 'macOS 11+' }]
  },
  {
    id: 'AB0000012', name: 'WPS for Mac 个人版', category: '其他软件', subCategory: 'WPS for Mac', status: 'OnShelf', tags: ['生态'],
    skus: [{ id: 's15-2', code: 'S15-2', name: '个人版', price: 0, status: 'Active', stock: 100, pricingOptions: [{id:'o15-2-1', title:'免费版 (Mac个人)', price:0, license:{type:'FlatRate', period:1, periodUnit:'Forever', scope:'1 User'}},{id:'o15-2-2', title:'会员订阅 (Mac个人)', price:89, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }],
    composition: [{ id: 'c152-1', name: 'WPS 文字 (Mac)', type: 'Component' },{ id: 'c152-2', name: 'WPS 表格 (Mac)', type: 'Component' },{ id: 'c152-3', name: 'WPS 演示 (Mac)', type: 'Component' }],
    installPackages: [{ id: 'pkg15-2-1', name: 'WPS Mac 安装包', version: 'v6.0.1', url: '#', platform: 'macOS', cpu: 'Intel/M1/M2', os: 'macOS 11+' }]
  },
  {
    id: 'AB0000013', name: 'WPS Office 2016 专业版', category: 'Win端', subCategory: 'Win2019', status: 'OffShelf', tags: ['生态'],
    skus: [{ id: 's20', code: 'S20', name: '标准版', price: 398, status: 'Inactive', stock: 0, pricingOptions: [{id:'o20-1', title:'永久授权', price:398, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},{id:'o20-2', title:'年度订阅', price:128, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }],
    composition: [{ id: 'c20-1', name: 'WPS 文字', type: 'Component' },{ id: 'c20-2', name: 'WPS 表格', type: 'Component' },{ id: 'c20-3', name: 'WPS 演示', type: 'Component' }],
    installPackages: [{ id: 'pkg20-1', name: 'WPS 2016 安装包', version: 'v10.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows 7/10' }]
  },
  {
    id: 'AB0000014', name: 'WPS Office 2013 企业版', category: 'Win端', subCategory: 'Win2019', status: 'OffShelf', tags: ['生态'],
    skus: [{ id: 's21', code: 'S21', name: '企业版', price: 298, status: 'Inactive', stock: 0, pricingOptions: [{id:'o21-1', title:'永久授权', price:298, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }],
    composition: [{ id: 'c21-1', name: 'WPS 文字', type: 'Component' },{ id: 'c21-2', name: 'WPS 表格', type: 'Component' },{ id: 'c21-3', name: 'WPS 演示', type: 'Component' }],
    installPackages: [{ id: 'pkg21-1', name: 'WPS 2013 安装包', version: 'v9.1.0', url: '#', platform: 'Windows', cpu: '通用', os: 'Windows XP/7' }]
  },
  {
    id: 'AB0000015', name: 'WPS 365 基础版 (旧版)', category: '云服务产品', subCategory: 'WPS365公有云', status: 'OffShelf', tags: ['生态'],
    skus: [{ id: 's22', code: 'S22', name: '基础版', price: 99, status: 'Inactive', stock: 0, pricingOptions: [{id:'o22-1', title:'年度订阅', price:99, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 User'}}] }],
    installPackages: []
  },
  {
    id: 'AB0000016', name: 'WPS Mac 2019 标准版', category: 'Mac端', subCategory: 'Mac2019', status: 'OffShelf', tags: ['生态'],
    skus: [{ id: 's23', code: 'S23', name: '标准版', price: 338, status: 'Inactive', stock: 0, pricingOptions: [{id:'o23-1', title:'永久授权', price:338, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}},{id:'o23-2', title:'年度订阅', price:108, license:{type:'Subscription', period:1, periodUnit:'Year', scope:'1 Device'}}] }],
    installPackages: [{ id: 'pkg23-1', name: 'WPS Mac 2019 安装包', version: 'v2.1.0', url: '#', platform: 'Mac', cpu: '通用', os: 'macOS 10.13+' }]
  },
  {
    id: 'AB0000017', name: 'WPS 文字处理单品 (旧版)', category: '单品授权', subCategory: '私有云单品', status: 'OffShelf', tags: ['生态'],
    skus: [{ id: 's24', code: 'S24', name: '标准版', price: 188, status: 'Inactive', stock: 0, pricingOptions: [{id:'o24-1', title:'永久授权', price:188, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'1 Device'}}] }],
    installPackages: []
  },
  {
    id: 'AB0000041', name: 'WPS Office开发工具包软件V11', category: '信创端', subCategory: 'WPS for Lin开发工具包专用', status: 'OnShelf', tags: ['生态'],
    skus: [{ id: 's-xc-001', code: 'XC-001', name: 'JK专用', price: 0, status: 'Active', stock: 999, pricingOptions: [{id:'o-xc-001-1', title:'授权', price:0, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}}] }],
    composition: [],
    installPackages: [
      { id: 'AZ0006286', name: 'jk开发工具包', version: 'v11.0.0', url: '#', platform: 'linux', cpu: '飞腾', os: 'UOS', productSpec: 'JK专用' }
    ]
  },
  {
    id: 'AB0000774', name: 'WPS Office 2023 for Linux流版套装办公软件V12.8', category: '信创端', subCategory: '流版套装2023（Linux）', status: 'OnShelf', tags: ['生态'],
    skus: [{ id: 's-xc-002', code: 'XC-002', name: '专业版（Lin版）', price: 0, status: 'Active', stock: 999, pricingOptions: [{id:'o-xc-002-1', title:'授权', price:0, license:{type:'Perpetual', period:1, periodUnit:'Forever', scope:'Platform'}}] }],
    composition: [],
    installPackages: [
      { id: 'AZ0000336', name: 'WPS Office 2023 for Linux流版套装办公软件V12.8', version: 'v12.8.0', url: '#', platform: 'Linux', cpu: 'intel/amd', os: 'Linux', productSpec: '专业版（Lin版）' },
      { id: 'AZ0000340', name: 'WPS Office 2023 for Linux流版套装办公软件V12.8', version: 'v12.8.0', url: '#', platform: 'Linux', cpu: '海光', os: 'Linux', productSpec: '专业版（Lin版）' },
      { id: 'AZ0005369', name: '12.8.2.24730-2023流版套装【非金融】通用包x64+中科方德', version: 'v12.8.2', url: '#', platform: 'linux', cpu: '兆芯', os: 'Linux', deliveryItemId: '905875', productSpec: '专业版（Lin版）' },
      { id: 'AZ0005371', name: 'xc23流版套装非金融', version: 'v12.8.0', url: '#', platform: 'linux', cpu: 'intel/amd', os: 'Linux', productSpec: '专业版（Lin版）' },
      { id: 'AZ0000337', name: 'WPS Office 2023 for Linux流版套装办公软件V12.8', version: 'v12.8.0', url: '#', platform: 'Linux', cpu: '海光', os: 'Linux', productSpec: '专业版（Lin版）' }
    ]
  }
];

// --- Sales Merchandises ---
export const initialMerchandises: SalesMerchandise[] = [
    { id: 'M001', name: 'WPS 365 标准版 (政府)', salesType: ['Direct', 'Channel'], pricingPolicy: 'Fixed', price: 299.0, status: 'Active', items: [{ productId: 'AB0000001', productName: 'WPS 365 标准版 (政府)', skuId: 's1', skuName: '标准版', quantity: 1 }] },
    { id: 'M002', name: 'WPS 365 基础版 (政府)', salesType: ['Direct', 'Channel'], pricingPolicy: 'Fixed', price: 199.0, status: 'Active', items: [{ productId: 'AB0000002', productName: 'WPS 365 基础版 (政府)', skuId: 's1-2', skuName: '基础版', quantity: 1 }] },
    { id: 'M003', name: 'WPS 365 高级版', salesType: ['Direct', 'Channel'], pricingPolicy: 'Fixed', price: 499.0, status: 'Active', items: [{ productId: 'AB0000003', productName: 'WPS 365 高级版', skuId: 's2', skuName: '标准版', quantity: 1 }] },
    { id: 'M004', name: 'WPS 365 高级版 (私有云)', salesType: ['Channel', 'Direct'], pricingPolicy: 'Fixed', price: 50000.0, status: 'Active', items: [{ productId: 'AB0000005', productName: 'WPS 365 高级版 (私有云)', skuId: 's5', skuName: '标准版', quantity: 1 }] },
    { id: 'M005', name: 'Web Office 核心组件', salesType: ['Direct'], pricingPolicy: 'Negotiable', price: 20000.0, status: 'Active', items: [{ productId: 'AB0000007', productName: 'Web Office 核心组件', skuId: 's8', skuName: '标准版', quantity: 1 }] },
];

// --- Departments ---
export const initialDepartments: Department[] = [
    { id: 'root', name: 'NexOrder 总部', description: '公司最高管理机构' },
    { id: 'c2', name: '营销中心', description: '负责市场推广与销售', parentId: 'root' },
    { id: 'c3', name: '运营中心', description: '负责交付与服务', parentId: 'root' },
    { id: 'c2-d1', name: '国内销售部', description: '大陆地区业务', parentId: 'c2' },
    { id: 'c2-d1-r1', name: '华北区', description: '京津冀', parentId: 'c2-d1' },
    { id: 'c2-d1-r1-t1', name: '北京销售组', description: '北京客户', parentId: 'c2-d1-r1' },
    { id: 'c3-d1', name: '商务部', description: '合同与流程', parentId: 'c3' },
    { id: 'c3-d2', name: '物流部', description: '发货与库存', parentId: 'c3' },
];

// --- Roles ---
export const initialRoles: RoleDefinition[] = [
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
];

// --- Users ---
export const initialUsers: User[] = [
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
];

// --- Channels ---
export const initialChannels: Channel[] = [
    { id: 'CH50004729', crmId: 'CH50004729', name: '上海万企明道软件有限公司', type: 'Reseller', level: 'Tier2', contactName: '沈磊', contactPhone: '13812345678', email: 'shen@mingdao.sh.cn', region: '华东', province: '上海市', city: '上海市', district: '浦东新区', country: '中国', companyAddress: '浦东新区张江高科技园区碧波路888号', companyPhone: '021-58765432', companyEmail: 'info@mingdao.sh.cn', companyZipCode: '201203', relatedParty: '非关联方', rebate: '有', parentChannel: '-', firstLevelChannel: '上海万企明道软件有限公司', bChannelManager: '沈磊', gChannelManager: '王芳', status: 'Active', contractStatus: '未签约', erpSyncStatus: '未同步', agreementDate: '2024-03-10' },
    { id: 'CH50004728', crmId: 'CH50004728', name: '武汉思行科技发展有限公司', type: 'Reseller', level: 'Tier2', contactName: '黄磊', contactPhone: '13922345678', email: 'huang@sixing.wh.cn', region: '华中', province: '湖北省', city: '武汉市', district: '洪山区', country: '中国', companyAddress: '洪山区光谷大道77号金融港B11栋', companyPhone: '027-87654321', companyEmail: 'hr@sixing.wh.cn', companyZipCode: '430074', relatedParty: '非关联方', rebate: '无', parentChannel: '上海万企明道软件有限公司', firstLevelChannel: '上海万企明道软件有限公司', bChannelManager: '黄磊', gChannelManager: '-', status: 'Active', contractStatus: '已签约', erpSyncStatus: '未同步', agreementDate: '2024-02-28' },
    { id: 'CH50004727', crmId: 'CH50004727', name: '大连联达科技有限公司', type: 'Distributor', level: 'Tier1', contactName: '陈强', contactPhone: '13611345678', email: 'chen@lianda.dl.cn', region: '东北', province: '辽宁省', city: '大连市', district: '高新园区', country: '中国', companyAddress: '高新园区黄浦路507号', companyPhone: '0411-84567890', companyEmail: 'office@lianda.dl.cn', companyZipCode: '116023', relatedParty: '非关联方', rebate: '有', parentChannel: '-', firstLevelChannel: '大连联达科技有限公司', bChannelManager: '陈强', gChannelManager: '李悦', status: 'Active', contractStatus: '已签约', erpSyncStatus: '未同步', agreementDate: '2024-01-15' },
    { id: 'CH50004726', crmId: 'CH50004726', name: '河南帆尊教育科技有限公司', type: 'Reseller', level: 'Tier2', contactName: '张丽', contactPhone: '13733345678', email: 'zhang@fanzun.hn.cn', region: '华中', province: '河南省', city: '郑州市', district: '金水区', country: '中国', companyAddress: '金水区经三路68号金城国际广场6楼', companyPhone: '0371-65432109', companyEmail: 'service@fanzun.hn.cn', companyZipCode: '450008', relatedParty: '非关联方', rebate: '无', parentChannel: '大连联达科技有限公司', firstLevelChannel: '大连联达科技有限公司', bChannelManager: '张丽', gChannelManager: '赵明', status: 'Active', contractStatus: '已签约', erpSyncStatus: '未同步', agreementDate: '2023-12-20' },
    { id: 'CH50004725', crmId: 'CH50004725', name: '甘肃金诺安电子科技有限公司', type: 'Reseller', level: 'Tier3', contactName: '王建国', contactPhone: '13544345678', email: 'wang@jinnuoan.gs.cn', region: '西北', province: '甘肃省', city: '兰州市', district: '城关区', country: '中国', companyAddress: '城关区天水北路222号万达广场15层', companyPhone: '0931-8765432', companyEmail: 'admin@jinnuoan.gs.cn', companyZipCode: '730030', relatedParty: '非关联方', rebate: '无', parentChannel: '西安奥吉通信技术有限公司', firstLevelChannel: '西安奥吉通信技术有限公司', bChannelManager: '王建国', gChannelManager: '-', status: 'Active', contractStatus: '已签约', erpSyncStatus: '已同步', agreementDate: '2023-11-10' },
    { id: 'CH50004724', crmId: 'CH50004724', name: '深圳市鑫云安开发科技有限公司', type: 'SI', level: 'Tier2', contactName: '刘洋', contactPhone: '13455345678', email: 'liu@xinyunan.sz.cn', region: '华南', province: '广东省', city: '深圳市', district: '南山区', country: '中国', companyAddress: '南山区科技园科技南一路28号', companyPhone: '0755-86543210', companyEmail: 'biz@xinyunan.sz.cn', companyZipCode: '518057', relatedParty: '关联方', rebate: '有', parentChannel: '-', firstLevelChannel: '深圳市鑫云安开发科技有限公司', bChannelManager: '刘洋', gChannelManager: '周涛', status: 'Active', contractStatus: '未签约', erpSyncStatus: '未同步', agreementDate: '2023-10-05' },
    { id: 'CH50004723', crmId: 'CH50004723', name: '上海爱数智得科技有限公司', type: 'ISV', level: 'Tier2', contactName: '孙磊', contactPhone: '13366345678', email: 'sun@aishu.sh.cn', region: '华东', province: '上海市', city: '上海市', district: '徐汇区', country: '中国', companyAddress: '徐汇区宜山路889号齐来大厦17楼', companyPhone: '021-64321098', companyEmail: 'contact@aishu.sh.cn', companyZipCode: '200233', relatedParty: '非关联方', rebate: '无', parentChannel: '上海万企明道软件有限公司', firstLevelChannel: '上海万企明道软件有限公司', bChannelManager: '孙磊', gChannelManager: '吴婷', status: 'Active', contractStatus: '未签约', erpSyncStatus: '已同步', agreementDate: '2023-09-18' },
    { id: 'CH50004722', crmId: 'CH50004722', name: '卫宁健康科技集团股份有限公司', type: 'Distributor', level: 'Tier1', contactName: '陈卫宁', contactPhone: '13277345678', email: 'chen@winning.sh.cn', region: '华东', province: '上海市', city: '上海市', district: '闵行区', country: '中国', companyAddress: '闵行区万源路2158号合川大厦8楼', companyPhone: '021-54876543', companyEmail: 'hr@winning.sh.cn', companyZipCode: '201100', relatedParty: '非关联方', rebate: '有', parentChannel: '-', firstLevelChannel: '卫宁健康科技集团股份有限公司', bChannelManager: '陈卫宁', gChannelManager: '郑伟', status: 'Active', contractStatus: '未签约', erpSyncStatus: '未同步', agreementDate: '2023-08-25' },
    { id: 'CH50004721', crmId: 'CH50004721', name: '北京龙安天下科技有限公司', type: 'SI', level: 'Tier2', contactName: '赵龙', contactPhone: '13188345678', email: 'zhao@longan.bj.cn', region: '华北', province: '北京市', city: '北京市', district: '海淀区', country: '中国', companyAddress: '海淀区中关村南大街甲6号铸诚大厦A座12层', companyPhone: '010-82654321', companyEmail: 'info@longan.bj.cn', companyZipCode: '100086', relatedParty: '非关联方', rebate: '无', parentChannel: '-', firstLevelChannel: '北京龙安天下科技有限公司', bChannelManager: '赵龙', gChannelManager: '孙丽', status: 'Active', contractStatus: '已签约', erpSyncStatus: '已同步', agreementDate: '2023-07-14' },
    { id: 'CH50004720', crmId: 'CH50004720', name: '成都恒汇软件技术有限公司', type: 'Reseller', level: 'Tier2', contactName: '李恒', contactPhone: '13099345678', email: 'li@henghui.cd.cn', region: '西南', province: '四川省', city: '成都市', district: '高新区', country: '中国', companyAddress: '高新区天府软件园E5栋3层', companyPhone: '028-85432100', companyEmail: 'admin@henghui.cd.cn', companyZipCode: '610041', relatedParty: '非关联方', rebate: '有', parentChannel: '深圳市鑫云安开发科技有限公司', firstLevelChannel: '深圳市鑫云安开发科技有限公司', bChannelManager: '李恒', gChannelManager: '-', status: 'Active', contractStatus: '已签约', erpSyncStatus: '未同步', agreementDate: '2023-06-30' },
    { id: 'CH50004719', crmId: 'CH50004719', name: '南京博远信息科技有限公司', type: 'Reseller', level: 'Tier3', contactName: '吴博', contactPhone: '18911345678', email: 'wu@boyuan.nj.cn', region: '华东', province: '江苏省', city: '南京市', district: '雨花台区', country: '中国', companyAddress: '雨花台区软件大道101号华为云谷B座7楼', companyPhone: '025-86543210', companyEmail: 'service@boyuan.nj.cn', companyZipCode: '210012', relatedParty: '非关联方', rebate: '无', parentChannel: '卫宁健康科技集团股份有限公司', firstLevelChannel: '卫宁健康科技集团股份有限公司', bChannelManager: '吴博', gChannelManager: '钱进', status: 'Active', contractStatus: '已签约', erpSyncStatus: '已同步', agreementDate: '2023-05-22' },
    { id: 'CH50004718', crmId: 'CH50004718', name: '西安奥吉通信技术有限公司', type: 'Distributor', level: 'Tier1', contactName: '杨明', contactPhone: '18822345678', email: 'yang@aoji.xa.cn', region: '西北', province: '陕西省', city: '西安市', district: '雁塔区', country: '中国', companyAddress: '雁塔区科技路38号林凯国际大厦18层', companyPhone: '029-87654321', companyEmail: 'office@aoji.xa.cn', companyZipCode: '710065', relatedParty: '非关联方', rebate: '有', parentChannel: '-', firstLevelChannel: '西安奥吉通信技术有限公司', bChannelManager: '杨明', gChannelManager: '冯静', status: 'Inactive', contractStatus: '已签约', erpSyncStatus: '未同步', agreementDate: '2023-04-10' },
    { id: 'CH50004717', crmId: 'CH50004717', name: '杭州数梦工场科技有限公司', type: 'ISV', level: 'Tier2', contactName: '钱海涛', contactPhone: '18733345678', email: 'qian@shumeng.hz.cn', region: '华东', province: '浙江省', city: '杭州市', district: '余杭区', country: '中国', companyAddress: '余杭区文一西路998号海创科技中心', companyPhone: '0571-88765432', companyEmail: 'biz@shumeng.hz.cn', companyZipCode: '311121', relatedParty: '关联方', rebate: '无', parentChannel: '上海爱数智得科技有限公司', firstLevelChannel: '上海万企明道软件有限公司', bChannelManager: '钱海涛', gChannelManager: '褚亮', status: 'Active', contractStatus: '已签约', erpSyncStatus: '已同步', agreementDate: '2023-03-05' },
    { id: 'CH50004716', crmId: 'CH50004716', name: '广州中鹏天成软件有限公司', type: 'Reseller', level: 'Tier2', contactName: '郑鹏', contactPhone: '18644345678', email: 'zheng@zptech.gz.cn', region: '华南', province: '广东省', city: '广州市', district: '天河区', country: '中国', companyAddress: '天河区天河北路233号中信广场45层', companyPhone: '020-87654321', companyEmail: 'support@zptech.gz.cn', companyZipCode: '510610', relatedParty: '非关联方', rebate: '有', parentChannel: '深圳市鑫云安开发科技有限公司', firstLevelChannel: '深圳市鑫云安开发科技有限公司', bChannelManager: '郑鹏', gChannelManager: '蒋芳', status: 'Active', contractStatus: '未签约', erpSyncStatus: '未同步', agreementDate: '2023-02-18' },
    { id: 'CH50004715', crmId: 'CH50004715', name: '天津飞天云动科技有限公司', type: 'SI', level: 'Tier3', contactName: '冯飞', contactPhone: '18555345678', email: 'feng@ftyd.tj.cn', region: '华北', province: '天津市', city: '天津市', district: '滨海新区', country: '中国', companyAddress: '滨海新区信息安全产业园区A5栋', companyPhone: '022-65432109', companyEmail: 'admin@ftyd.tj.cn', companyZipCode: '300457', relatedParty: '非关联方', rebate: '无', parentChannel: '北京龙安天下科技有限公司', firstLevelChannel: '北京龙安天下科技有限公司', bChannelManager: '冯飞', gChannelManager: '-', status: 'Active', contractStatus: '已签约', erpSyncStatus: '已同步', agreementDate: '2023-01-28' },
];

// --- Standalone Enterprises ---
export const initialStandaloneEnterprises: Enterprise[] = [
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
];
