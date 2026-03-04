
export type LicenseType = 'Subscription' | 'Perpetual' | 'FlatRate' | 'PerUser';
export type LicenseUnit = 'Year' | 'Month' | 'Day' | 'Forever';

export interface LicenseTypeDefinition {
    id: string;
    name: string; // e.g. "Commercial Annual"
    code: string;
    type: LicenseType;
    period: number;
    periodUnit: LicenseUnit;
    scope: string; // e.g. "1 User"
    description?: string;
}

export type ActivationMethod = 'LicenseKey' | 'Online' | 'Dongle';

export interface MerchandiseItem {
    productId: string;
    productName: string;
    skuId: string;
    skuName: string;
    quantity: number;
}

export interface OrderItem extends MerchandiseItem {
    // Reference to Merchandise
    merchandiseId?: string;
    merchandiseName?: string;

    skuCode?: string;

    quantity: number; // Final quantity in order
    priceAtPurchase: number;
    
    installPackageName?: string;
    activationMethod: ActivationMethod;
    deliveredContent?: string[];

    // Enterprise Connect
    enterpriseId?: string;
    enterpriseName?: string;
    
    // Snapshot of Atomic Capabilities for this order (Layer 4 realization)
    capabilitiesSnapshot?: string[]; 

    licenseType?: string;

    // Pricing Option selected
    pricingOptionId?: string;
    pricingOptionName?: string;
}

export type CapabilityType = 'Component' | 'Feature' | 'Rights' | 'Service';

export interface AtomicCapability {
    id: string;
    name: string;
    type: CapabilityType;
    description?: string;
}

export type RightDataType = 'Number' | 'Boolean' | 'Text';

export interface ProductRightDefinition {
    id: string;
    name: string;
    code: string;
    dataType: RightDataType;
    unit?: string;
    description?: string;
}

export interface RightValue {
    definitionId: string;
    name: string;
    value: number | boolean | string;
    unit?: string;
}

export interface RightPackage {
    id: string;
    name: string;
    description?: string;
    rights: RightValue[];
}

export interface ProductLicenseConfig {
    type: LicenseType;
    period: number;
    periodUnit: LicenseUnit;
    scope: string;
}

export interface SkuPricingOption {
    id: string;
    title: string;
    price: number;
    license: ProductLicenseConfig;
}

export interface ProductSku {
    id: string;
    code: string;
    name: string;
    price: number;
    stock: number;
    status: 'Active' | 'Inactive';
    description?: string;
    license?: ProductLicenseConfig;
    pricingOptions?: SkuPricingOption[];
    parentId?: string;
    parentName?: string;
    packageId?: string;
    packageName?: string;
}

export interface InstallPackage {
    id: string;
    name: string;
    version: string;
    url: string;
    cpu?: string;
    os?: string;
    arch?: string;
}

export interface Product {
    id: string;
    name: string;
    category: string;
    subCategory?: string;
    description?: string;
    status: 'OnShelf' | 'OffShelf';
    tags?: string[];
    skus: ProductSku[];
    composition?: AtomicCapability[];
    installPackages?: InstallPackage[];
    packageId?: string;
    rights?: RightValue[];
    licenseTemplate?: {
        showLicensePeriod: boolean;
        showLicenseScope: boolean;
    };
}

export type SalesType = 'Direct' | 'Channel';
export type PricingPolicy = 'Fixed' | 'Negotiable';

export interface SalesMerchandise {
    id: string;
    name: string;
    salesType: SalesType[];
    pricingPolicy: PricingPolicy;
    price: number;
    status: 'Active' | 'Inactive';
    items: MerchandiseItem[];
}

export type CustomerType = 'Enterprise' | 'SMB' | 'Government' | 'Education' | 'Partner';
export type CustomerLevel = 'KA' | 'A' | 'B' | 'C';
export type ContactRole = 'Purchasing' | 'IT' | 'Finance' | 'Management' | 'Other';

export interface CustomerContact {
    id: string;
    name: string;
    phone: string;
    email: string;
    position?: string;
    roles: ContactRole[];
    isPrimary: boolean;
}

export interface BillingInfo {
    taxId: string;
    title: string;
    bankName: string;
    accountNumber: string;
    registerAddress: string;
    registerPhone: string;
}

export interface Enterprise {
    id: string;
    name: string;
}

export interface Customer {
    id: string;
    companyName: string;
    industry: string;
    customerType: CustomerType;
    level: CustomerLevel;
    region: string;
    address: string;
    shippingAddress: string;
    status: 'Active' | 'Inactive';
    logo?: string;
    contacts: CustomerContact[];
    billingInfo?: BillingInfo;
    ownerId?: string;
    ownerName?: string;
    enterprises?: Enterprise[];
    nextFollowUpDate?: string;
}

export type UserRole = 'Admin' | 'Sales' | 'Business' | 'Technical' | 'Logistics' | string; // Updated to allow dynamic strings
export type UserType = 'Internal' | 'External';

export type PermissionResource = 'Order' | 'Customer' | 'Opportunity';
export type PermissionDimension = 'departmentId' | 'productId' | 'customerIndustry' | 'customerLevel' | 'channelId' | 'buyerType';

export interface RowPermissionRule {
    id: string;
    resource: PermissionResource;
    dimension: PermissionDimension;
    values: string[];
}

export interface ColumnPermissionRule {
    id: string;
    resource: PermissionResource;
    allowedColumns: string[];
}

export interface RoleDefinition {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    isSystem?: boolean; // System roles cannot be deleted
    rowPermissions?: RowPermissionRule[];
    columnPermissions?: ColumnPermissionRule[];
}

export interface User {
    id: string;
    accountId: string; // 8-digit numeric ID
    name: string;
    email: string;
    role: UserRole;
    userType: UserType;
    status: 'Active' | 'Inactive';
    avatar?: string;
    departmentId?: string;
}

export interface Department {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
}

export type ChannelType = 'Distributor' | 'Reseller' | 'SI' | 'ISV';

export interface Channel {
    id: string;
    name: string;
    type: ChannelType;
    level: 'Tier1' | 'Tier2' | 'Tier3';
    contactName: string;
    contactPhone: string;
    email: string;
    region: string;
    status: 'Active' | 'Inactive';
    agreementDate: string;
}

export type OpportunityStage = 'New' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export interface Opportunity {
    id: string;
    crmId?: string; // 商机名称(CRM)
    name: string;
    customerId: string;
    customerName: string;
    productType?: string; // 产品类型/授权方式
    stage: OpportunityStage | string;
    probability: number;
    amount?: number; // 商机金额
    expectedRevenue: number;
    finalUserRevenue?: number; // 最终用户成交额
    closeDate: string;
    ownerId: string;
    ownerName: string;
    createdAt: string;
}

export enum OrderStatus {
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    PENDING_CONFIRM = 'PENDING_CONFIRM',
    PROCESSING_PROD = 'PROCESSING_PROD',
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    REFUND_PENDING = 'REFUND_PENDING',
    REFUNDED = 'REFUNDED',
}

export type OrderSource = 'Sales' | 'ChannelPortal' | 'OnlineStore' | 'APISync' | 'Renewal';
export type BuyerType = 'Customer' | 'Channel' | 'SelfDeal' | 'Direct';
export type DeliveryMethod = 'Online' | 'Offline' | 'Hybrid';
export type PaymentMethod = 'Online' | 'Transfer' | 'COD';

export interface InvoiceInfo {
    type: 'VAT_Special' | 'VAT_Normal';
    title: string;
    taxId: string;
    content: string;
    bankName?: string;
    accountNumber?: string;
    address?: string;
    phone?: string;
}

export interface PaymentRecord {
    amount: number;
    paymentDate: string;
    bankName: string;
    accountNumber: string;
    transactionId: string;
    payerName: string;
    remarks?: string;
}

export interface AcceptanceInfo {
    contactName: string;
    contactPhone: string;
    method: 'Remote' | 'OnSite';
    email?: string;
}

export type AcceptanceType = 'OneTime' | 'Phased';

export interface AcceptancePhase {
    id: string;
    name: string;
    percentage: number;
    amount: number;
    status: 'Pending' | 'Accepted';
    acceptedDate?: string;
}

export interface AcceptanceConfig {
    type: AcceptanceType;
    status: 'Pending' | 'In Progress' | 'Completed';
    phases: AcceptancePhase[];
    setupDate: string;
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
    salesApprovedDate?: string;
    businessApproved: boolean;
    businessApprovedDate?: string;
    financeApproved: boolean;
    financeApprovedDate?: string;
}

export interface Order {
    id: string;
    customerId: string;
    customerName: string;
    
    // Customer Snapshot
    customerType?: CustomerType;
    customerLevel?: CustomerLevel;
    customerIndustry?: string;
    customerRegion?: string;

    date: string;
    status: OrderStatus;
    total: number;
    items: OrderItem[];
    
    source: OrderSource;
    buyerType: BuyerType;
    buyerName?: string;
    buyerId?: string; // ID of the Channel or Customer buying the product
    
    shippingAddress?: string;
    receivingParty?: string;
    receivingCompany?: string;
    receivingMethod?: string;
    deliveryMethod?: DeliveryMethod;
    
    isPaid: boolean;
    paymentDate?: string;
    paymentMethod?: PaymentMethod;
    paymentTerms?: string;
    paymentRecord?: PaymentRecord;
    
    isAuthConfirmed?: boolean;
    authConfirmedDate?: string;
    isPackageConfirmed?: boolean;
    packageConfirmedDate?: string;
    isShippingConfirmed?: boolean;
    shippingConfirmedDate?: string;
    isCDBurned?: boolean;
    cdBurnedDate?: string;
    
    shippedDate?: string;
    carrier?: string;
    trackingNumber?: string;
    
    approval: OrderApproval;
    approvalRecords: ApprovalRecord[];
    
    salesRepId?: string;
    salesRepName?: string;
    businessManagerId?: string;
    businessManagerName?: string;
    
    invoiceInfo?: InvoiceInfo;
    acceptanceInfo?: AcceptanceInfo;
    acceptanceConfig?: AcceptanceConfig;
    
    opportunityId?: string;
    opportunityName?: string;
    
    // Extended Business Fields
    directChannel?: string;
    terminalChannel?: string;
    orderType?: string;
    creatorName?: string;
    creatorPhone?: string;
    industryLine?: string;
    province?: string;
    city?: string;
    district?: string;
    reportTag?: string;
    sellerName?: string;
    sellerContact?: string;
    customerStatus?: string;
    channelService?: string;

    originalOrderId?: string; 
    smsOriginalOrderId?: string;
    saasOriginalOrderId?: string;
    confirmedDate?: string;
    
    refundReason?: string;
    refundAmount?: number;
}

export type ProjectStatus = 'Planning' | 'Ongoing' | 'OnHold' | 'Completed' | 'Cancelled';

export interface Project {
    id: string;
    name: string;
    customerId: string;
    customerName: string;
    pmId: string;
    pmName: string;
    startDate: string;
    endDate?: string;
    status: ProjectStatus;
    progress: number;
    description?: string;
}

export interface ContactInfo {
    name: string;
    phone: string;
    email: string;
}
