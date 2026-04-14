
export type LicenseType = 'Subscription' | 'Perpetual' | 'FlatRate' | 'PerUser';
export type LicenseUnit = 'Year' | 'Month' | 'Day' | 'Forever';

export interface AuthTypeData {
    id: string;
    name: string;
    period: string;
    nccBiz: string;
    nccIncome: string;
}

export type ActivationMethod = 'LicenseKey' | 'Online' | 'Dongle' | 'Account' | 'SerialKey' | 'AccountAndSerialKey';

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
    installPackageType?: '通用' | '定制';
    installPackageLink?: string;
    activationMethod: ActivationMethod;
    mediaCount?: number;
    deliveredContent?: string[];

    // Enterprise Connect
    enterpriseId?: string;
    enterpriseName?: string;
    
    // Snapshot of Atomic Capabilities for this order (Layer 4 realization)
    capabilitiesSnapshot?: string[]; 

    licenseType?: string;
    productType?: string;

    // Pricing Option selected
    pricingOptionId?: string;
    pricingOptionName?: string;

    // Pricing details
    finalUserUnitPrice?: number;
    pricingUnitPrice?: number;
    finalUserPricingUnitPrice?: number;
    lineRemarks?: string;

    // Price reference
    channelLevel?: string;
    agreementNo?: string;
    matchedPriceType?: string;
    matchedPrice?: number;
    matchedPriceId?: string;
    suggestedRetailPrice?: number;

    // Delivery info
    distributionMode?: string;
    supplyOrgInfo?: string;
    upgradeWarrantyPeriod?: string;

    // License info
    licensee?: string;
    licenseTerms?: string;
    licensePeriod?: string;
    licenseStartMethod?: string;
    licenseEndDate?: string;
    licenseScope?: string;
    subUnitLicenseAllowed?: boolean;

    // Purchase nature
    purchaseNature?: PurchaseNature;
    renewalSubType?: string;
    purchaseNature365?: PurchaseNature;

    // After-sale info
    afterSaleWarrantyPeriod?: string;

    // Sub-unit authorization (per item level)
    subUnitAuthMode?: SubUnitAuthMode;
    subUnits?: SubUnit[];
}

export type PurchaseNature = 'New' | 'Renewal' | 'AddOn' | 'Upgrade';

export type CapabilityType = 'Component' | 'Feature' | 'Service';
export type ComponentNature = '自有' | '第三方采购' | '第三方授权';

export interface AtomicCapability {
    id: string;
    name: string;
    type: CapabilityType;
    description?: string;
    componentNo?: number;
    version?: string;
    nature?: ComponentNature;
    generateSerial?: boolean;
    referencedByProduct?: boolean;
    enabled?: boolean;
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
}

export interface InstallPackage {
    id: string;
    name: string;
    version: string;
    url: string;
    platform?: string;
    cpu?: string;
    os?: string;
    arch?: string;
    remarks?: string;
    deliveryItemId?: string;
    deliveryItemName?: string;
    productSpec?: string;
    enabled?: boolean;
    packageType?: 'public' | 'private';
    source?: string;
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
    licenseTemplate?: {
        showLicensePeriod: boolean;
        showLicenseScope: boolean;
    };
    productType?: string;
    onlineDelivery?: string;
    productClass?: string;
    productClassification?: string;
    productSeries?: string;
    productCategory?: string;
    productLine?: string;
    productClassFinance?: string;
    productLineFinance?: string;
    productSeriesFinance?: string;
    maintenanceContent?: string;
    maintenanceStandard?: string;
    hasUpgradeWarranty?: boolean;
    hasAfterSalesService?: boolean;
    internationalName?: string;
    afterSalesServiceDefault?: string;
    salesOrgId?: string;
    salesOrgName?: string;
    businessDeliveryName?: string;
    taxRefundType?: string;
    linkedServices?: LinkedService[];
    salesScope?: SalesScopeRow[];
}

export interface SalesScopeRow {
    salesOrg: string;
    materialType: string;
    authMaterialName: string;
    mediaMaterialName: string;
    supplyOrg: string;
    status: 'listed' | 'unlisted';
    billingStatus: 'maintained' | 'unmaintained';
    billingTaxRefundType?: string;
    billingInvoiceName?: string;
    billingTaxRate?: string;
    billingModelSpec?: string;
    billingProductCode?: string;
    billingUnit?: string;
}

export interface LinkedService {
    productId: string;
    productName: string;
    skuId?: string;
    skuName?: string;
    required: boolean;
    remark?: string;
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

export type CustomerType = string;
export type CustomerLevel = string;
export type ContactRole = 'Purchasing' | 'IT' | 'Finance' | 'Management' | 'Other';

export interface CustomerContact {
    id: string;
    name: string;
    phone: string;
    email: string;
    position?: string;
    roles: ContactRole[];
    isPrimary: boolean;
    creatorId?: string;
    creatorName?: string;
    createdAt?: string;
}

export interface BillingInfo {
    invoiceType?: '增值税普通发票' | '增值税专用发票';
    taxId: string;
    title: string;
    bankName: string;
    accountNumber: string;
    registerAddress: string;
    registerPhone: string;
}

export type EnterpriseSource = '客户创建' | '渠道人员创建';

export interface Enterprise {
    id: string;
    name: string;
    createdAt?: string;
    source?: EnterpriseSource;
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

    crmId?: string;
    reportTag?: string;
    customerAttribute?: string;
    industryLine?: string;
    industryPromotionType?: string;
    parentOrg?: string;
    supervisoryOrg?: string;
    country?: string;
    province?: string;
    city?: string;
    district?: string;
    companyPhone?: string;
    customerDepartment?: string;
    dealerName?: string;
    levelFocusUnit?: string;
    customerGrade?: string;
    createdAt?: string;
}

export type UserRole = 'Admin' | 'Sales' | 'Business' | 'Technical' | 'Logistics' | string; // Updated to allow dynamic strings
export type UserType = 'Internal' | 'External';

export type PermissionResource = 'Order' | 'Customer' | 'Opportunity' | 'Product';
export type PermissionDimension = 'departmentId' | 'productId' | 'customerIndustry' | 'customerLevel' | 'channelId' | 'buyerType' | 'industryLine' | 'province' | 'directChannelId' | 'orderType' | 'orderSource' | 'orderStatus' | 'salesRep' | 'businessManager' | 'creator';

export type PermissionOperator = 'equals' | 'contains';

export interface RowPermissionRule {
    id: string;
    resource: PermissionResource;
    dimension: PermissionDimension;
    operator: PermissionOperator;
    values: string[];
}

export interface RowLogicConfig {
    dimOperators: Record<string, 'AND' | 'OR'>;
    dimGroups: { id: string; dims: string[] }[];
}

export interface ColumnPermissionRule {
    id: string;
    resource: PermissionResource;
    allowedColumns: string[];
}

export type BaseRowPermission = 'all' | 'custom';

export interface RoleDefinition {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    isSystem?: boolean;
    baseRowPermission?: BaseRowPermission;
    rowPermissions?: RowPermissionRule[];
    rowLogic?: Record<string, RowLogicConfig>;
    columnPermissions?: ColumnPermissionRule[];
}

export interface User {
    id: string;
    accountId: string; // 8-digit numeric ID
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    userType: UserType;
    status: 'Active' | 'Inactive';
    avatar?: string;
    departmentId?: string;
    monthBadge?: string;
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
    crmId?: string;
    name: string;
    type: ChannelType;
    level: 'Tier1' | 'Tier2' | 'Tier3';
    contactName: string;
    contactPhone: string;
    email: string;
    region: string;
    province?: string;
    city?: string;
    district?: string;
    country?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyZipCode?: string;
    relatedParty?: string;
    rebate?: string;
    parentChannel?: string;
    firstLevelChannel?: string;
    bChannelManager?: string;
    gChannelManager?: string;
    status: 'Active' | 'Inactive';
    contractStatus?: '已签约' | '未签约';
    erpSyncStatus?: '已同步' | '未同步';
    agreementDate: string;
}

export type OpportunityStage = '需求判断' | '确认商机' | '确认渠道' | '证实方案' | '赢单' | '输单';

export interface OpportunityProduct {
    productName: string;
    skuName?: string;
    licenseType?: string;
}

export interface Opportunity {
    id: string;
    crmId?: string;
    name: string;
    customerId: string;
    customerName: string;
    productType?: string;
    products?: OpportunityProduct[];
    stage: OpportunityStage;
    probability: number;
    department?: string;
    amount?: number;
    expectedRevenue: number;
    finalUserRevenue?: number;
    closeDate: string;
    ownerId: string;
    ownerName: string;
    createdAt: string;
}

export enum OrderStatus {
    DRAFT = 'DRAFT',
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
export type BuyerType = 'Customer' | 'Channel' | 'SelfDeal' | 'Direct' | 'RedeemCode';
export type DeliveryMethod = 'Online' | 'Offline' | 'Hybrid';
export type PaymentMethod = 'WechatPay' | 'Alipay' | 'Transfer';

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
    shippingPhone?: string;
    shippingEmail?: string;
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
    creatorId?: string;
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

    conversionDeductionAmount?: number; // 折算抵扣金额
    conversionAmount?: number;          // 折算金额（低于实付金额）

    orderRemark?: string;

    purchasingContactId?: string;
    itContactId?: string;

    linkedContractIds?: string[];
    linkedContractNames?: string[];

    isAgentOrder?: boolean;
    agentCode?: string;

    settlementMethod?: 'cash' | 'credit' | 'prepaid';
    settlementType?: 'once' | 'installment';
    expectedPaymentDate?: string;
    installmentPlans?: { amount: number; expectedDate: string; actualDate: string; paidAmount: number }[];

    serialNumbers?: SerialNumber[];

    onlineDeliveries?: OnlineDeliveryEntry[];
}

export interface OnlineDeliveryEntry {
    id: string;
    receivingParty: string;
    receivingCompany: string;
    email: string;
    phone?: string;
    productItemIndex?: number;
}

export type SubUnitAuthMode =
    | 'separate_auth_separate_eid'
    | 'separate_auth_unified_eid'
    | 'unified_auth_with_list'
    | 'none';

export interface SubUnit {
    id: string;
    unitName: string;
    enterpriseId: string;
    enterpriseName: string;
    authCount: string;
    itContact: string;
    phone: string;
    email: string;
    customerType: string;
    industryLine: string;
    sellerContact: string;
}

export interface SerialNumber {
    serialNo: string;
    source: string;
    generateMethod: string;
    generateGroup: string;
    type: string;
    status: string;
    generateTime: string;
    expireTime: string;
}

// --- Contract (migrated from ContractManager.tsx) ---
export interface Contract {
    id: string;
    code: string;
    name: string;
    externalCode?: string;
    contractType: string;
    partyA?: string;
    partyB?: string;
    verifyStatus: 'PENDING_BUSINESS' | 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED';
    verifyRemark?: string;
    amount?: number;
    signDate?: string;
    createdAt: string;
    orderId?: string;
    customerId?: string;
}

// --- Remittance (migrated from RemittanceManager.tsx) ---
export interface Remittance {
    id: string;
    erpDocNo?: string;
    bankTransactionNo?: string;
    type: '渠道' | '客户';
    remitterName: string;
    remitterAccount?: string;
    paymentMethod: string;
    amount: number;
    receiverName: string;
    receiverAccount?: string;
    paymentTime: string;
}

// --- Invoice (migrated from InvoiceManager.tsx) ---
export interface Invoice {
    id: string;
    invoiceTitle: string;
    amount: number;
    applyTime: string;
    applyType: '开票' | '红冲' | '换票';
    status: 'PENDING' | 'PROCESSING' | 'ISSUED' | 'CANCELLED' | 'REJECTED';
    orderId?: string;
    taxId?: string;
    remark?: string;
}

// --- Performance (migrated from PerformanceManager.tsx) ---
export interface Performance {
    id: string;
    orderId: string;
    acceptanceDetailId: string;
    orderStatus: string;
    detailAmountSubtotal: number;
    acceptanceRatio: number;
    deferralRatio: number;
    postContractStatus: string;
    discount: string;
    costAmount: number;
    salesPerformance: number;
    weightedSalesPerformance: number;
    projectWeightCoeff: number;
    productWeightCoeffSubscription: number;
    productWeightCoeffAuthorization: number;
    serviceType: '授权' | '订阅';
    owner: string;
}

// --- Authorization (migrated from AuthorizationManager.tsx) ---
export interface Authorization {
    id: string;
    authCode: string;
    orderId: string;
    licensee: string;
    customerName: string;
    customerId: string;
    productName: string;
    productCode: string;
    authStartDate: string;
    authEndDate: string;
    serviceStartDate?: string;
    serviceEndDate?: string;
}

// --- DeliveryInfo (migrated from DeliveryInfoManager.tsx) ---
export interface DeliveryInfo {
    id: string;
    deliveryType: string;
    orderId: string;
    quantity: number;
    authType: string;
    licensee: string;
    customerName: string;
    customerId: string;
    authCode?: string;
    authDuration?: string;
    authStartDate?: string;
    authEndDate?: string;
    serviceStartDate?: string;
    serviceEndDate?: string;
}

export interface ConversionOrder {
    id: string;
    amount: number;
    enterpriseName: string;
    sourceOrderId: string;
    createdAt: string;
    status: 'Available' | 'Used';
}

export interface OrderDraft {
    id: string;
    savedAt: string;
    currentStep: number;
    // Step 1
    buyerType: BuyerType | '';
    orderSource: OrderSource;
    creatorId: string;
    originalOrderId?: string;
    // Step 2
    hasOpportunity: 'yes' | 'no' | '';
    linkedOpportunityId: string;
    newOrderCustomer: string;
    orderEnterpriseId: string;
    selectedChannelId: string;
    directChannel?: string;
    terminalChannel?: string;
    salesRepId: string;
    businessManagerId: string;
    // Step 3
    newOrderItems: OrderItem[];
    tempCategory: string;
    enableConversion?: boolean;
    selectedConversionIds?: string[];
    sellerName?: string;
    sellerContact?: string;
    // Step 4
    invoiceForm: InvoiceInfo;
    paymentMethod?: PaymentMethod;
    paymentTerms?: string;
    deliveryMethod: DeliveryMethod;
    receivingParty: string;
    receivingCompany: string;
    receivingMethod: string;
    shippingAddress: string;
    shippingPhone: string;
    shippingEmail: string;
    onlineDeliveries?: OnlineDeliveryEntry[];
    acceptanceForm: AcceptanceInfo;
    acceptanceType: AcceptanceType;
    phaseDrafts: { name: string; percentage: number }[];
    orderRemark: string;
    linkedContractIds: string[];
    purchasingContactId: string;
    itContactId: string;
    isAgentOrder?: boolean;
    agentCode?: string;
    buyerNameId?: string;
    settlementMethod?: 'cash' | 'credit' | '';
    expectedPaymentDate?: string;
    serialNumberRequirement?: '生成新序列号' | '沿用正式序列号' | '沿用测试序列号';
    reuseSerialNumber?: string;
}
