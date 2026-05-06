import { DeployPackageInfo } from '../types';

/**
 * 私有云部署包 mock 数据。
 * 实际接入"运维聚合平台"接口后替换。
 */
const MOCK_DEPLOY_PACKAGES: DeployPackageInfo[] = [
  { id: 'DEP-100001', name: 'WPS365 私有云-基础部署包', versionType: '正式版', packageProductType: 'WPS365 旗舰版（私有云）', versionNumber: '6.5.0', packageKind: '基础包' },
  { id: 'DEP-100002', name: 'WPS365 私有云-高可用扩展包', versionType: '正式版', packageProductType: 'WPS365 旗舰版（私有云）', versionNumber: '6.5.0', packageKind: '基础包' },
  { id: 'DEP-100003', name: 'WPS365 私有云-AI 能力扩展包', versionType: '试用版', packageProductType: 'WPS365 AI 增值', versionNumber: '1.0.2', packageKind: '增值包' },
  { id: 'DEP-100004', name: 'WPS365 私有云-补丁包 6.5.1', versionType: '正式版', packageProductType: 'WPS365 旗舰版（私有云）', versionNumber: '6.5.1', packageKind: '补丁包' },
  { id: 'DEP-100005', name: 'WPS Conference 私有云-基础包', versionType: '正式版', packageProductType: 'WPS Conference 私有云', versionNumber: '3.2.0', packageKind: '基础包' },
  { id: 'DEP-100006', name: '文档中台-基础平台部署包', versionType: '正式版', packageProductType: '文档中台', versionNumber: '2.4.0', packageKind: '基础包' },
  { id: 'DEP-100007', name: '文档中台-OCR 能力包', versionType: '试用版', packageProductType: '文档中台-OCR', versionNumber: '1.1.0', packageKind: '能力包' },
];

/**
 * 通过部署包 ID 查询详细信息（模拟外部接口）。
 * 找不到时 resolve(null)；不抛错，便于在 UI 上做友好提示。
 */
export async function fetchDeployPackageById(id: string): Promise<DeployPackageInfo | null> {
  await new Promise(r => setTimeout(r, 220));
  const match = MOCK_DEPLOY_PACKAGES.find(p => p.id.toLowerCase() === id.toLowerCase());
  return match ?? null;
}

/**
 * 模糊搜索部署包（供选择器场景使用，可选）。
 */
export async function searchDeployPackages(keyword?: string): Promise<DeployPackageInfo[]> {
  await new Promise(r => setTimeout(r, 220));
  if (!keyword) return MOCK_DEPLOY_PACKAGES.slice();
  const q = keyword.toLowerCase();
  return MOCK_DEPLOY_PACKAGES.filter(p => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
}
