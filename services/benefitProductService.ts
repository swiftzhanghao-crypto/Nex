import { BenefitProduct, PublicCloudBenefitType, PrivateCloudBenefitType } from '../types';

/**
 * 外部权益系统产品 mock 数据。
 * 实际接入时替换为真实 API（按 type 调用对应外部接口）。
 */
const MOCK_PUBLIC_CLOUD: Record<PublicCloudBenefitType, BenefitProduct[]> = {
  '套餐': [
    { code: 'PLN-001', name: 'WPS 365 个人尊享套餐', benefitType: '套餐', description: '个人版-含云空间' },
    { code: 'PLN-002', name: 'WPS 365 团队协作套餐', benefitType: '套餐', description: '5人/团队，多端授权' },
    { code: 'PLN-003', name: 'WPS 365 企业旗舰套餐', benefitType: '套餐', description: '企业版-完整权益' },
    { code: 'PLN-004', name: 'WPS 365 教育版套餐', benefitType: '套餐', description: '教育机构专享' },
    { code: 'PLN-005', name: 'WPS 365 政府事业版套餐', benefitType: '套餐', description: '政府事业单位' },
  ],
  '权益包': [
    { code: 'BNF-001', name: 'PDF 高级编辑权益包', benefitType: '权益包', description: '含 PDF 转换、签名等' },
    { code: 'BNF-002', name: '云字体权益包', benefitType: '权益包', description: '5000+ 商用字体' },
    { code: 'BNF-003', name: '稻壳模板会员权益包', benefitType: '权益包', description: '海量精品模板' },
    { code: 'BNF-004', name: '云空间扩容权益包-100GB', benefitType: '权益包', description: '+100GB 云空间' },
    { code: 'BNF-005', name: 'AI 智能办公权益包', benefitType: '权益包', description: 'AI 写作、PPT、表格' },
    { code: 'BNF-006', name: '会议时长权益包-1000分钟', benefitType: '权益包', description: '+1000 分钟会议时长' },
  ],
  '三方产品': [
    { code: 'TPP-001', name: '腾讯会议-标准版', benefitType: '三方产品', description: '腾讯云提供' },
    { code: 'TPP-002', name: '钉钉企业版-基础包', benefitType: '三方产品', description: '阿里钉钉' },
    { code: 'TPP-003', name: '飞书入门版', benefitType: '三方产品', description: '字节飞书' },
    { code: 'TPP-004', name: '石墨文档协作版', benefitType: '三方产品', description: '石墨文档' },
    { code: 'TPP-005', name: '微盘存储扩展包', benefitType: '三方产品', description: '微盘云存储' },
  ],
  '三方产品-政企': [
    { code: 'TPG-001', name: '政务专用OA-基础版', benefitType: '三方产品-政企', description: '政府机关专用' },
    { code: 'TPG-002', name: '国资委督办系统-标准版', benefitType: '三方产品-政企', description: '国资专属' },
    { code: 'TPG-003', name: '军工保密协作平台', benefitType: '三方产品-政企', description: '保密资质要求' },
    { code: 'TPG-004', name: '事业单位项目管理系统', benefitType: '三方产品-政企', description: '事业单位通用' },
  ],
};

const MOCK_PRIVATE_CLOUD: Record<PrivateCloudBenefitType, BenefitProduct[]> = {
  '云办公（私有云）': [
    { code: 'PCO-001', name: 'WPS 365 私有云-基础包', benefitType: '云办公（私有云）', description: '5000 用户以下' },
    { code: 'PCO-002', name: 'WPS 365 私有云-企业版', benefitType: '云办公（私有云）', description: '中大型企业' },
    { code: 'PCO-003', name: 'WPS 365 私有云-集团版', benefitType: '云办公（私有云）', description: '集团多组织' },
    { code: 'PCO-004', name: 'WPS Conference 私有云会议系统', benefitType: '云办公（私有云）', description: '会议私有部署' },
    { code: 'PCO-005', name: 'WPS Mail 私有云邮件系统', benefitType: '云办公（私有云）', description: '企业邮件' },
    { code: 'PCO-006', name: 'WPS IM 即时通讯私有云', benefitType: '云办公（私有云）', description: '私有 IM' },
  ],
  '文档中台': [
    { code: 'DCT-001', name: '文档中台-基础平台', benefitType: '文档中台', description: '统一文档管理基座' },
    { code: 'DCT-002', name: '文档中台-OCR 识别能力', benefitType: '文档中台', description: '图片转文字' },
    { code: 'DCT-003', name: '文档中台-内容审核', benefitType: '文档中台', description: 'AI 内容审核' },
    { code: 'DCT-004', name: '文档中台-知识图谱', benefitType: '文档中台', description: '智能知识库' },
    { code: 'DCT-005', name: '文档中台-API 网关', benefitType: '文档中台', description: '开放接口' },
  ],
};

/**
 * 查询公有云权益关联候选产品（模拟外部接口）。
 */
export async function fetchPublicCloudBenefitProducts(
  type: PublicCloudBenefitType,
  keyword?: string,
): Promise<BenefitProduct[]> {
  await new Promise(r => setTimeout(r, 200));
  let list = (MOCK_PUBLIC_CLOUD[type] || []).slice();
  if (keyword) {
    const q = keyword.toLowerCase();
    list = list.filter(p => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  }
  return list;
}

/**
 * 查询私有云权益关联候选产品（模拟外部接口）。
 */
export async function fetchPrivateCloudBenefitProducts(
  type: PrivateCloudBenefitType,
  keyword?: string,
): Promise<BenefitProduct[]> {
  await new Promise(r => setTimeout(r, 200));
  let list = (MOCK_PRIVATE_CLOUD[type] || []).slice();
  if (keyword) {
    const q = keyword.toLowerCase();
    list = list.filter(p => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  }
  return list;
}
