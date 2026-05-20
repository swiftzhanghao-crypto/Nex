import type { PermissionDimension, Department, Channel } from '../../../types';

export function getDimensionOptions(
  dim: PermissionDimension,
  departments: Department[],
  channels: Channel[],
  getDepartmentPath: (deptId: string) => string,
): { value: string; label: string }[] {
  if (dim === 'departmentId') {
    return [
      { value: '__self_dept__', label: '本部门' },
      { value: '__self_dept_children__', label: '本部门及下属部门' },
      ...departments.map(d => ({ value: d.id, label: getDepartmentPath(d.id) })),
    ];
  }
  if (dim === 'industryLine') {
    const lines = [
      '政务特种', '大客民企', '政务区域党政', '企业区域金融', '企业区域民企',
      '区域新闻出版传媒', '部委党政', '部委医疗', '部委新闻出版传媒', '其他',
      '大客央国企', '大客特种', '渠道和生态', '国内SaaS', '大客金融',
      '教育业务', '企业区域国企', '医疗行业',
    ];
    return lines.map(l => ({ value: l, label: l }));
  }
  if (dim === 'directChannelId') {
    return channels.map(c => ({ value: c.id, label: c.name }));
  }
  if (dim === 'province') {
    const provinces = [
      '北京市', '天津市', '上海市', '重庆市',
      '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
      '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
      '河南省', '湖北省', '湖南省', '广东省', '海南省',
      '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
      '台湾省', '内蒙古自治区', '广西壮族自治区', '西藏自治区',
      '宁夏回族自治区', '新疆维吾尔自治区',
      '香港特别行政区', '澳门特别行政区',
    ];
    return provinces.map(p => ({ value: p, label: p }));
  }
  if (dim === 'salesRep' || dim === 'businessManager' || dim === 'creator') {
    return [
      { value: 'self', label: '本人' },
      { value: 'department', label: '本人所属部门' },
      { value: 'departmentAndChildren', label: '本人所属部门及下属部门' },
    ];
  }
  if (dim === 'orderType') {
    return [
      { value: 'Customer', label: '直签订单' },
      { value: 'Channel', label: '渠道订单' },
      { value: 'SelfDeal', label: '自成交订单' },
      { value: 'RedeemCode', label: '兑换码订单' },
    ];
  }
  if (dim === 'orderSource') {
    return [
      { value: 'Sales', label: '后台下单' },
      { value: 'ChannelPortal', label: '渠道来源' },
      { value: 'OnlineStore', label: '官网' },
      { value: 'APISync', label: '三方平台' },
    ];
  }
  if (dim === 'orderStatus') {
    return [
      { value: 'DRAFT', label: '草稿' },
      { value: 'PENDING_APPROVAL', label: '待审批' },
      { value: 'PENDING_CONFIRM', label: '待确认' },
      { value: 'PROCESSING_PROD', label: '备货中' },
      { value: 'PENDING_PAYMENT', label: '待支付' },
      { value: 'SHIPPED', label: '已发货' },
      { value: 'DELIVERED', label: '已完成' },
      { value: 'CANCELLED', label: '已取消' },
      { value: 'REFUND_PENDING', label: '退款中' },
      { value: 'REFUNDED', label: '已退款' },
    ];
  }
  if (dim === 'buyerType') {
    return [
      { value: 'Customer', label: '直签订单' },
      { value: 'Channel', label: '渠道订单' },
      { value: 'SelfDeal', label: '自成交订单' },
    ];
  }
  if (dim === 'channelId') return channels.map(c => ({ value: c.id, label: c.name }));
  if (dim === 'customerIndustry') return ['互联网', '金融', '教育', '制造', '政府', '医疗', '零售'].map(i => ({ value: i, label: i }));
  if (dim === 'productId') {
    return [
      { value: 'wps-office', label: 'WPS Office' },
      { value: 'wps-365', label: 'WPS 365' },
      { value: 'wps-ai', label: 'WPS AI' },
    ];
  }
  if (dim === 'customerLevel') return ['KA', 'SMB', 'Enterprise'].map(l => ({ value: l, label: l }));
  return [];
}

export function getReadableValue(
  dim: PermissionDimension,
  val: string,
  departments: Department[],
  channels: Channel[],
  getDepartmentPath: (deptId: string) => string,
): string {
  const options = getDimensionOptions(dim, departments, channels, getDepartmentPath);
  return options.find(o => o.value === val)?.label || val;
}
