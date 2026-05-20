import { Cpu, FileText, Gift, Package, Globe } from 'lucide-react';
import type { Product, PublicCloudBenefitType, PrivateCloudBenefitType } from '../../../types';

export const DRAFT_STORAGE_KEY = 'product_create_draft';

export const STEPS = [
  { key: 'info', label: '产品信息', icon: Cpu },
  { key: 'classification', label: '产品分类', icon: FileText },
  { key: 'benefits', label: '权益信息', icon: Gift },
  { key: 'packages', label: '安装包', icon: Package },
  { key: 'salesScope', label: '销售范围', icon: Globe },
] as const;

export type StepKey = typeof STEPS[number]['key'];

export const BUSINESS_TAG_OPTIONS = ['生态', '数科', '金山志远', '公有云', '流版套件', '私有云', 'AI', 'IM'];

export const MATERIAL_TYPE_OPTIONS = ['单授权', '介质+授权', '服务', '介质+服务'];

export const SALES_CHANNEL_OPTIONS = [
  '渠道端', '商城', '365后台直签', '365后台兑换码', '365后台自流量',
] as const;

export const SELLABLE_CUSTOMER_TYPES = [
  '金融', '央企', '地方国企', '其他中央企业', '港澳台企业', '外资企业',
  '地方事业单位', '地方党政机关', '中央事业单位', '中央党政机关',
  '学校', '军队', '中央团体', '地方团体', '海外', '民企',
];

export const CHANNEL_LEVEL_OPTIONS = ['钻石', '铂金', '金牌', '银牌', '普通'];

export const PUBLIC_CLOUD_BENEFIT_TYPES: PublicCloudBenefitType[] = ['套餐', '权益包', '三方产品', '三方产品-政企'];
export const PRIVATE_CLOUD_BENEFIT_TYPES: PrivateCloudBenefitType[] = ['云办公（私有云）', '文档中台'];

export const PURCHASE_UNIT_OPTIONS = ['套', '用户', '获得授权主体', '人天', '人月', '次', '个', '年', '客户', '件'];
export const AUX_PURCHASE_UNIT_OPTIONS = ['用户', '套', '个', '客户', '次'];

export const MAINTENANCE_VARIABLES = [
  '产品类型', '产品名称', '下单日期', '授权方式', '被授权方', '授权开始时间', '计价数量',
  '序列号', '词霸账号', '词霸密码', '销售组织', '客户名称', '授权数量', '授权期限',
  '官网兑换码', '官网兑换链接', '到期后授权数量', '安装包链接', '授权结束时间', '黑马账号',
  '云服务用户数', '直签合同编号', '直签合同名称', '商务发货产品名称', '订单编号', '产品规格',
  '服务期限', '服务开始时间', '服务结束时间', '升级保障期限', '升级保障开始时间',
  '升级保障结束时间', '赠送端授权截止时间', '赠送端年限', '初始企业名称', 'WPS账号和初始密码',
  '生态伙伴产品名称',
];

export type MaintenanceField = 'maintenanceContent' | 'maintenanceStandard';

export const MAINTENANCE_FIELD_META: Record<MaintenanceField, { label: string; placeholder: string }> = {
  maintenanceContent: { label: '运维包服务内容', placeholder: '请输入运维包包含的服务内容，例如：系统巡检、故障响应、版本升级等' },
  maintenanceStandard: { label: '运维包服务标准', placeholder: '请输入运维包服务标准，例如：7×24 小时响应、4 小时到场、SLA 99.9%' },
};

export interface AuthTypeConfig {
  channelTpl: string;
  directTpl: string;
  saleStatus: '标准在售' | '非标在售';
  enabled: boolean;
  purchaseUnit: string;
  auxPurchaseUnit: string;
}

export interface ProductDraft {
  savedAt: string;
  currentStep: number;
  form: Partial<Product>;
  skuName: string;
  selectedAuthTypeIds: string[];
  selectedComponentIds: string[];
  authTypeConfigs?: Record<string, AuthTypeConfig>;
}
