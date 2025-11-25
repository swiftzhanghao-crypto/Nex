
export enum OrderStatus {
  PENDING_PAYMENT = '待支付',
  PENDING_APPROVAL = '待审批',
  PENDING_CONFIRM = '待确认',
  PROCESSING_PROD = '生产处理中', // 包含安装包确认、光盘刻录
  SHIPPED = '已发货',
  DELIVERED = '已送达',
  CANCELLED = '已取消',
}

export type CustomerType = 'Enterprise' | 'Government' | 'Education' | 'Partner' | 'SMB';
export type CustomerLevel = 'KA' | 'A' | 'B' | 'C'; // KA = Key Account

export type ContactRole = 'Purchasing' | 'IT' | 'Finance' | 'Management' | 'Other';

export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  position?: string;
}

export interface CustomerContact extends ContactInfo {
    id: string;
    roles: ContactRole[];
    isPrimary?: boolean;
}

export interface BillingInfo {
  taxId: string; // 纳税人识别号
  title: string; // 发票抬头
  bankName: string;
  accountNumber: string; // 银行账号
  registerAddress: string; // 注册地址
  registerPhone: string; // 注册电话
}

export interface Enterprise {
  id: string; // Tenant ID / Enterprise ID
  name: string; // Enterprise Name
}

export interface Customer {
  id: string;
  companyName: string; // 企业名称
  industry: string;    // 所属行业
  
  // New Classification
  customerType: CustomerType;
  level: CustomerLevel;
  region: string; // 所属城市/区域

  // Unified Contacts
  contacts: CustomerContact[];

  // Addresses
  address: string;         // 办公地址
  shippingAddress: string; // 收货地址

  // Financial
  billingInfo: BillingInfo; // 发票/开票信息
  
  // Tenants/Enterprises
  enterprises?: Enterprise[];

  status: 'Active' | 'Inactive'; // 合作状态
  logo: string;
  ownerId?: string;    // 客户归属人ID (销售负责人)
  ownerName?: string;  // 客户归属人姓名
  
  // Engagement
  nextFollowUpDate?: string; // 下次跟进/回访日期
}

export type LicenseType = 'PerUser' | 'FlatRate' | 'Subscription' | 'Perpetual';

export interface ProductSku {
    id: string;
    name: string; // e.g., "Enterprise Edition 5 Users"
    code: string; // e.g., "WPS-ENT-5"
    price: number;
    stock: number;
    description?: string;
}

export interface LicenseTemplateConfig {
    showLicensePeriod: boolean; // 是否显示授权期限
    showLicenseScope: boolean;  // 是否显示授权范围
    customTerms?: string;       // 自定义补充条款
}

export type CpuArchitecture = 'x86_64' | 'ARM64' | 'MIPS64' | 'LoongArch' | 'SW_64' | 'Universal';

export interface InstallPackage {
    id: string;
    name: string;
    version: string;
    os: string;
    cpuArchitecture?: CpuArchitecture;
}

export interface Product {
    id: string;
    name: string;
    category: string;
    description: string;
    status: 'OnShelf' | 'OffShelf';
    
    skus: ProductSku[];
    
    installPackages?: InstallPackage[];
    licenseTemplate?: LicenseTemplateConfig;
}

export type ActivationMethod = 'LicenseKey' | 'AccountBind';

export interface OrderItem {
    productId: string;
    productName: string;
    
    // SKU Association
    skuId: string;
    skuName: string; // e.g. "Professional Edition"
    skuCode: string; // e.g. "SKU-001"

    quantity: number;
    priceAtPurchase: number;
    
    installPackageName?: string;
    activationMethod: ActivationMethod;
    deliveredContent?: string[];
}

export interface PaymentRecord {
    method: string;
    bankName: string;
    accountNumber: string;
    transactionId: string;
    payerName: string;
    amount: number;
    paymentDate: string;
    remarks?: string;
}

export interface ApprovalRecord {
    id: string;
    operatorId: string;
    operatorName: string;
    operatorRole: string;
    actionType: string;
    result: string;
    timestamp: string;
    comment?: string;
}

export interface OrderApproval {
    salesApproved: boolean;
    businessApproved: boolean;
    financeApproved: boolean;
    salesApprovedDate?: string;
    businessApprovedDate?: string;
    financeApprovedDate?: string;
}

export interface Order {
    id: string;
    customerId: string;
    customerName: string;
    date: string;
    status: OrderStatus;
    total: number;
    items: OrderItem[];
    shippingAddress: string;
    isPaid: boolean;
    paymentRecord?: PaymentRecord;
    paymentDate?: string;
    isPackageConfirmed: boolean;
    isCDBurned: boolean;
    cdBurnedDate?: string;
    confirmedDate?: string;
    carrier?: string;
    trackingNumber?: string;
    salesRepId?: string;
    salesRepName?: string;
    salesDepartmentId?: string;
    salesDepartmentName?: string;
    businessManagerId?: string;
    businessManagerName?: string;
    approval: OrderApproval;
    approvalRecords: ApprovalRecord[];
    // Helper for mock sort
    rawDate?: Date; 
}

export type UserRole = 'Admin' | 'Sales' | 'Business' | 'Technical' | 'Logistics';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: 'Active' | 'Inactive';
    avatar: string;
    departmentId?: string;
}

export interface Department {
    id: string;
    name: string;
    description: string;
    parentId?: string;
}

export type ChannelType = 'Distributor' | 'Reseller' | 'SI' | 'ISV'; // 经销商, 分销商, 系统集成商, 独立软件开发商

export interface Channel {
    id: string;
    name: string;
    type: ChannelType;
    contactName: string;
    contactPhone: string;
    email: string;
    region: string;
    status: 'Active' | 'Inactive';
    level: 'Tier1' | 'Tier2' | 'Tier3';
    agreementDate: string;
}

// --- NEW MODULES ---

export type OpportunityStage = 'New' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export interface Opportunity {
    id: string;
    name: string; // 商机名称
    customerId: string;
    customerName: string;
    expectedRevenue: number;
    stage: OpportunityStage;
    probability: number; // 0-100%
    closeDate: string; // 预计成交日期
    ownerId: string;
    ownerName: string;
    createdAt: string;
}

export type ProjectStatus = 'Planning' | 'Ongoing' | 'OnHold' | 'Completed' | 'Cancelled';

export interface Project {
    id: string;
    name: string;
    customerId: string;
    customerName: string;
    pmId: string; // Project Manager ID
    pmName: string;
    startDate: string;
    endDate?: string;
    status: ProjectStatus;
    progress: number; // 0-100
    description?: string;
}
