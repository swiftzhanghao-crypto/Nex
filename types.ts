
export enum OrderStatus {
  PENDING_PAYMENT = '待支付',
  PENDING_APPROVAL = '待审批',
  PENDING_CONFIRM = '待确认',
  PROCESSING_PROD = '生产处理中', // 包含安装包确认、光盘刻录
  SHIPPED = '已发货',
  DELIVERED = '已送达',
  CANCELLED = '已取消',
}

export interface BankInfo {
  bankName: string;
  accountName: string; // 账户名称（通常是公司名或财务专用名）
  accountNumber: string;
}

export interface Customer {
  id: string;
  companyName: string; // 企业名称
  industry: string;    // 所属行业
  contactPerson: string; // 联系人
  position: string;    // 职位
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive'; // 合作状态
  logo: string;
  bankInfo?: BankInfo; // 客户默认付款账户信息
}

export type LicenseType = 'PerUser' | 'FlatRate' | 'Subscription' | 'Perpetual';

export interface LicenseOption {
  id: string;
  name: string;       // e.g., "个人版", "企业版(5人)", "终身授权"
  price: number;
  type: LicenseType;
  description?: string;
}

export type CpuArchitecture = 'x86_64' | 'ARM64' | 'MIPS64' | 'LoongArch' | 'SW_64' | 'Universal';

export interface InstallPackage {
  id: string;
  name: string;       // e.g., "Windows x64 Installer"
  version: string;    // e.g., "12.1.0"
  os: string;         // e.g., "Windows", "macOS", "Linux", "UOS", "Kylin"
  cpuArchitecture?: CpuArchitecture; // e.g. "ARM64" (Kunpeng), "LoongArch" (Loongson)
  url?: string;       // Download link placeholder
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number; // Display price (usually the lowest or default)
  stock: number;
  category: string;
  description: string;
  status: 'OnShelf' | 'OffShelf'; // 产品状态：已上架 | 已下架
  licenseOptions?: LicenseOption[]; // Multiple licensing options
  installPackages?: InstallPackage[]; // Available installation packages
}

export type ActivationMethod = 'LicenseKey' | 'AccountBind';

export interface OrderItem {
  productId: string;
  productName: string;
  licenseOptionId?: string; // Selected license option ID
  licenseOptionName?: string; // Selected license option Name
  installPackageName?: string; // Selected installation package name
  quantity: number;
  priceAtPurchase: number;
  activationMethod: ActivationMethod; // 激活方式
  deliveredContent?: string[]; // 具体发放的序列号或绑定的账号列表
}

export interface OrderApproval {
  salesApproved: boolean;
  salesApprovedDate?: string;
  businessApproved: boolean;
  businessApprovedDate?: string;
}

export interface PaymentRecord {
  method: 'BankTransfer'; // Currently supporting Bank Transfer
  bankName: string;       // e.g. "招商银行", "工商银行"
  accountNumber: string;  // Last 4 digits or full account
  transactionId: string;  // Bank transaction reference number
  payerName: string;      // Account holder name
  amount: number;
  paymentDate: string;
  remarks?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string; // 这里指公司名称
  date: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  shippingAddress: string;
  carrier?: string;
  trackingNumber?: string;
  approval?: OrderApproval;
  
  // New Workflow Fields
  isPaid: boolean;              // 是否已支付
  paymentDate?: string;
  paymentRecord?: PaymentRecord; // 详细支付记录
  confirmedDate?: string;       // 订单最终确认时间
  
  // Production Steps
  isPackageConfirmed: boolean;  // 安装包是否已校验确认
  isCDBurned: boolean;          // 光盘是否已刻录
  cdBurnedDate?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  activeCustomers: number;
}

export type UserRole = 'Admin' | 'Sales' | 'Business' | 'Technical' | 'Logistics';

export interface Department {
  id: string;
  name: string;
  description: string;
  parentId?: string; // Optional Parent ID for hierarchy
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: 'Active' | 'Inactive';
  departmentId?: string;
}
