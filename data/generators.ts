import {
  OrderStatus,
  type User,
  type Customer,
  type CustomerType,
  type CustomerLevel,
  type Opportunity,
  type Order,
  type OrderItem,
  type OrderSource,
  type BuyerType,
  type OrderApproval,
  type ApprovalRecord,
  type InvoiceInfo,
  type Contract,
  type Remittance,
  type Invoice,
  type Performance,
  type Authorization,
  type DeliveryInfo,
  type Product,
  type SalesMerchandise,
  type Channel,
} from '../types';

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 5; j++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) result += '-';
  }
  return result;
}

export function generateCustomers(users: User[]): Customer[] {
  const industries = ['互联网', '金融', '教育', '制造', '政府', '医疗', '零售'];
  const regions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉'];
  const types: CustomerType[] = ['Enterprise', 'SMB', 'Government', 'Education', 'Partner'];
  const levels: CustomerLevel[] = ['KA', 'A', 'B', 'C'];

  return Array.from({ length: 60 }).map((_, i) => {
    const id = `C${(i + 1).toString().padStart(8, '0')}`;
    const name = `${['科技', '发展', '贸易', '网络', '信息', '实业'][i % 6]}有限公司`;
    const prefix = ['华兴', '信达', '中科', '远洋', '天行', '博大', '瑞通', '金桥', '海纳', '智汇'][i % 10];
    const companyName = `${prefix}${name}`;
    const owner = users.filter(u => u.role === 'Sales')[i % users.filter(u => u.role === 'Sales').length];

    const entCount = Math.floor(Math.random() * 3) + 1;
    const enterprises = Array.from({ length: entCount }).map((_, idx) => ({
      id: (88000000 + i * 100 + idx).toString(),
      name: `${companyName} ${idx === 0 ? '总租户' : `分租户 ${idx}`}`,
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
      logo: `https://ui-avatars.com/api/?name=${companyName.substring(0, 2)}&background=random&color=fff`,
      contacts: [
        { id: `ct-${i}-1`, name: '陈经理', phone: `1390000${1000 + i}`, email: `contact@${id.toLowerCase()}.com`, position: '采购经理', roles: ['Purchasing'], isPrimary: true },
        { id: `ct-${i}-2`, name: '张工', phone: `1380000${1000 + i}`, email: `it@${id.toLowerCase()}.com`, position: 'IT负责人', roles: ['IT'], isPrimary: false },
      ],
      billingInfo: {
        taxId: `91110108MA00${1000 + i}`,
        title: companyName,
        bankName: '招商银行',
        accountNumber: `622202${10000000 + i}`,
        registerAddress: `${regions[i % regions.length]}市`,
        registerPhone: `010-8888${1000 + i}`,
      },
      ownerId: owner.id,
      ownerName: owner.name,
      enterprises,
    };
  });
}

export function generateOpportunities(customers: Customer[]): Opportunity[] {
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
      createdAt: '2024-01-10',
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
      createdAt: '2024-02-05',
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
      createdAt: '2024-03-12',
    },
    { id: 'OPP004', name: '远洋贸易-海外版部署咨询', customerId: customers[3]?.id, customerName: customers[3]?.companyName, expectedRevenue: 120000, stage: 'New', probability: 10, closeDate: '2024-12-31', ownerId: 'u2', ownerName: '李娜', createdAt: '2024-04-10' },
    { id: 'OPP005', name: '天行实业-全员订阅升级', customerId: customers[4]?.id, customerName: customers[4]?.companyName, expectedRevenue: 2000000, stage: 'Closed Won', probability: 100, closeDate: '2024-05-20', ownerId: 'u6', ownerName: '周杰', createdAt: '2023-11-20' },
    { id: 'OPP006', name: '博大教育-校园正版化', customerId: customers[5]?.id, customerName: customers[5]?.companyName, expectedRevenue: 450000, stage: 'Negotiation', probability: 75, closeDate: '2024-09-10', ownerId: 'u1', ownerName: '张伟', createdAt: '2024-01-22' },
    { id: 'OPP007', name: '瑞通物流-移动办公接入', customerId: customers[6]?.id, customerName: customers[6]?.companyName, expectedRevenue: 180000, stage: 'Closed Lost', probability: 0, closeDate: '2024-04-01', ownerId: 'u2', ownerName: '李娜', createdAt: '2024-02-18' },
    { id: 'OPP008', name: '金桥金融-文档安全管控', customerId: customers[7]?.id, customerName: customers[7]?.companyName, expectedRevenue: 1500000, stage: 'Proposal', probability: 55, closeDate: '2024-10-15', ownerId: 'u6', ownerName: '周杰', createdAt: '2024-03-05' },
    { id: 'OPP009', name: '海纳制造-PLM集成', customerId: customers[8]?.id, customerName: customers[8]?.companyName, expectedRevenue: 600000, stage: 'Qualification', probability: 30, closeDate: '2024-11-30', ownerId: 'u2', ownerName: '李娜', createdAt: '2024-04-01' },
    { id: 'OPP010', name: '智汇科技-API接口调用包', customerId: customers[9]?.id, customerName: customers[9]?.companyName, expectedRevenue: 50000, stage: 'Closed Won', probability: 100, closeDate: '2024-05-15', ownerId: 'u1', ownerName: '张伟', createdAt: '2024-05-01' },
  ];
  return opps;
}

export interface OrderGeneratorParams {
  customers: Customer[];
  products: Product[];
  users: User[];
  merchandises: SalesMerchandise[];
  opportunities: Opportunity[];
  channels: Channel[];
}

export function generateOrders(params: OrderGeneratorParams): Order[] {
  const { customers, products, users, merchandises, opportunities, channels } = params;
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
    date.setDate(date.getDate() - (i <= 5 ? i - 1 : Math.floor(Math.random() * 180)));
    const dateStr = date.toISOString();

    let status = statuses[i % statuses.length];
    if (i < 10) status = OrderStatus.PENDING_APPROVAL;

    const isSelfDeal = Math.random() > 0.8;

    let buyerType: BuyerType = 'Customer';
    const supportsChannel = merchandise?.salesType.includes('Channel');
    const supportsDirect = merchandise?.salesType.includes('Direct');

    if (isSelfDeal) {
      buyerType = 'SelfDeal';
    } else {
      if (supportsChannel && supportsDirect) {
        buyerType = Math.random() > 0.6 ? 'Channel' : 'Customer';
      } else if (supportsChannel) {
        buyerType = 'Channel';
      } else {
        buyerType = 'Customer';
      }
    }

    let buyerId: string | undefined;
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
        licensePeriod: lt === '数量授权' || lt === '服务器授权' ? '永久' : lt === '用户订阅许可' || lt === '年授权' ? periodOptions[(i + idxOffset) % periodOptions.length] : undefined,
        quantity: quantity * (mItem.quantity ?? 1),
        priceAtPurchase: unitPrice,
        capabilitiesSnapshot,
        deliveredContent: status === OrderStatus.DELIVERED || status === OrderStatus.SHIPPED ? [generateLicenseKey()] : [],
        activationMethod: 'LicenseKey',
        pricingOptionId: defaultOption?.id,
        pricingOptionName: defaultOption?.title,
      };
    };

    const baseItems = (merchandise?.items || []).map((mItem, idx) =>
      makeItem(mItem, (merchandise?.price || 500) / (merchandise?.items.length || 1), idx)
    );

    const extraCount = i <= 5 ? 4 : i <= 35 ? 1 : 0;
    const extraItems: OrderItem[] = Array.from({ length: extraCount }).map((_, idx) => {
      const poolItem = extraProductPool[(i + idx) % extraProductPool.length];
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
    const invoiceInfo: InvoiceInfo | undefined = isPaid
      ? {
          type: 'VAT_Special',
          content: '软件产品',
          title: customer.companyName,
          taxId: customer.billingInfo?.taxId || '',
          bankName: customer.billingInfo?.bankName || '',
          accountNumber: customer.billingInfo?.accountNumber || '',
        }
      : undefined;

    let oppId: string | undefined;
    let oppName: string | undefined;

    const customerOpp = opportunities.find(o => o.customerId === customer.id);
    if (customerOpp && Math.random() > 0.3) {
      oppId = customerOpp.id;
      oppName = customerOpp.name;
    } else if (Math.random() > 0.8 && i > 50) {
      oppId = `OPP${i}`;
      oppName = `${customer.companyName} 采购项目`;
    }

    const isCompleted = status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED;
    let isAuthConfirmed = isCompleted;
    let isPackageConfirmed = isCompleted;
    let isShippingConfirmed = isCompleted;
    let isCDBurned = isCompleted;

    if (status === OrderStatus.PROCESSING_PROD) {
      const progress = Math.floor(Math.random() * 5);
      if (progress >= 1) isAuthConfirmed = true;
      if (progress >= 2) isPackageConfirmed = true;
      if (progress >= 3) isShippingConfirmed = true;
      if (progress >= 4) isCDBurned = true;
    }

    mockOrders.push({
      id: `S${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 1e12).toString().padStart(12, '0')}`,
      customerId: customer.id,
      customerName: customer.companyName,
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
        method: 'Remote',
      },
      opportunityId: oppId,
      opportunityName: oppName,
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
      // 按与 OrderDetails 相同的逻辑算出优惠折扣和返利折扣，再计算折算折扣金额
      // 折算折扣金额 = 产品总金额 - 优惠折扣金额 - 返利折扣金额（使三者恰好加总等于产品总金额）
      // i%4==0: 两者都有；i%4==1: 只有折算折扣金额；i%4==2: 只有折算金额；i%4==3: 两者都没有
      ...(() => {
        const _allItems = [...baseItems, ...extraItems];
        const _productTotal = _allItems.reduce((s, it) => s + it.priceAtPurchase * it.quantity, 0);
        const _discountAmt = _allItems.reduce((s, it) => {
          const lt = it.priceAtPurchase * it.quantity;
          return s + (it.priceAtPurchase > 1000 ? Math.floor(lt * 0.05 / 10) * 10 : 0);
        }, 0);
        const _rebateAmt = _allItems.reduce((s, it) => {
          const lt = it.priceAtPurchase * it.quantity;
          return s + (it.priceAtPurchase > 5000 ? Math.floor(lt * 0.02 / 10) * 10 : 0);
        }, 0);
        const _convDeduct = Math.max(_productTotal - _discountAmt - _rebateAmt, 0);
        return {
          conversionDeductionAmount: (i % 4 === 0 || i % 4 === 1) ? _convDeduct : undefined,
          conversionAmount: (i % 4 === 0 || i % 4 === 2) ? Math.floor(_productTotal * 0.7 / 100) * 100 || 500 : undefined,
        };
      })(),
    });
  }
  return mockOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function generateContracts(): Contract[] {
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
}

export function generateRemittances(): Remittance[] {
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
}

export function generateInvoices(): Invoice[] {
  const titles = [
    '长春精彩科技有限公司', '北京美好时空科技有限公司', '广州瑞斯信息科技有限公司',
    '重庆环舜科技有限公司', '中银国际证券股份有限公司', '浙江领真信息科技有限公司',
    '武汉大学信息化建设办公室', '成都市财政局电子政务处', '深圳市汇众腾达科技有限公司',
    '北京市海淀区教育委员会', '天津滨海新区政府采购中心', '南京太极股份有限公司',
    '北京宏盛福达科贸有限公司', '杭州网易计算机系统有限公司', '西安交通大学采购管理处',
    '福建省政府采购中心', '河南省教育厅信息化处', '辽宁四方达电子股份有限公司',
    '中国石油天然气股份有限公司华北分公司', '招商银行股份有限公司信息技术部',
  ];
  const taxIds = titles.map((_, i) => `91${110000 + i * 7}MA00${(1000 + i * 13).toString().padStart(4, '0')}XY`);
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
}

export function generatePerformances(): Performance[] {
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
    const salesPerf = -baseAmount;
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
}

export function generateAuthorizations(): Authorization[] {
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
      serviceEndDate: hasService ? '9999-01-01 00:00:00' : undefined,
    };
  });
}

export function generateDeliveryInfos(): DeliveryInfo[] {
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
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
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
}
