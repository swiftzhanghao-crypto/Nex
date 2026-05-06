import { MaterialListItem } from '../types';

/**
 * 物料清单 mock 数据。后续接入后端时替换为真实 API。
 * 包含：授权类、介质类两种 kind，供货组织覆盖珠海/北京/武汉等主要总部。
 */
const MOCK_MATERIALS: MaterialListItem[] = [
  // 授权类
  { code: 'LIC-001', name: 'WPS Office 商业版-永久授权', kind: '授权', supplyOrg: '珠海总部', enabled: true },
  { code: 'LIC-002', name: 'WPS Office 商业版-订阅授权', kind: '授权', supplyOrg: '珠海总部', enabled: true },
  { code: 'LIC-003', name: 'WPS Office 教育版-永久授权', kind: '授权', supplyOrg: '北京总部', enabled: true },
  { code: 'LIC-004', name: 'WPS Office 政企版-永久授权', kind: '授权', supplyOrg: '北京总部', enabled: false },
  { code: 'LIC-005', name: 'WPS 365 标准版-订阅授权', kind: '授权', supplyOrg: '珠海总部', enabled: true },
  { code: 'LIC-006', name: 'WPS 365 旗舰版-订阅授权', kind: '授权', supplyOrg: '珠海总部', enabled: true },
  { code: 'LIC-007', name: 'WPS 365 增值授权-用户数', kind: '授权', supplyOrg: '武汉总部', enabled: true },
  { code: 'LIC-008', name: 'WPS Conference 视频会议-授权', kind: '授权', supplyOrg: '武汉总部', enabled: false },
  { code: 'LIC-009', name: '金山数字办公平台-平台授权', kind: '授权', supplyOrg: '北京总部', enabled: true },
  { code: 'LIC-010', name: '金山词霸 专业版-永久授权', kind: '授权', supplyOrg: '北京总部', enabled: true },
  // 介质类
  { code: 'MED-001', name: 'WPS Office 商业版-电子介质', kind: '介质', supplyOrg: '珠海总部', enabled: true },
  { code: 'MED-002', name: 'WPS Office 商业版-光盘介质', kind: '介质', supplyOrg: '珠海总部', enabled: false },
  { code: 'MED-003', name: 'WPS Office 教育版-电子介质', kind: '介质', supplyOrg: '北京总部', enabled: true },
  { code: 'MED-004', name: 'WPS Office 政企版-电子介质', kind: '介质', supplyOrg: '北京总部', enabled: true },
  { code: 'MED-005', name: 'WPS 365 标准版-电子介质', kind: '介质', supplyOrg: '珠海总部', enabled: true },
  { code: 'MED-006', name: 'WPS 365 旗舰版-电子介质', kind: '介质', supplyOrg: '珠海总部', enabled: true },
  { code: 'MED-007', name: 'WPS Conference-电子介质', kind: '介质', supplyOrg: '武汉总部', enabled: true },
  { code: 'MED-008', name: '金山数字办公平台-电子介质', kind: '介质', supplyOrg: '北京总部', enabled: true },
];

/**
 * 查询物料清单（模拟接口）。
 * 默认仅返回**已启用**的物料；如需包含已停用项，传入 includeDisabled=true。
 * @param kind '授权' 或 '介质'，如不指定则全部返回
 * @param keyword 模糊搜索关键字（物料编号 / 物料名称）
 * @param includeDisabled 是否包含已停用物料，默认 false
 */
export async function fetchMaterials(
  kind?: '授权' | '介质',
  keyword?: string,
  includeDisabled = false,
): Promise<MaterialListItem[]> {
  // 模拟网络延迟
  await new Promise(r => setTimeout(r, 200));
  let list = MOCK_MATERIALS.slice();
  if (!includeDisabled) list = list.filter(m => m.enabled);
  if (kind) list = list.filter(m => m.kind === kind);
  if (keyword) {
    const q = keyword.toLowerCase();
    list = list.filter(m => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
  }
  return list;
}
