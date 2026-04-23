import type { Customer } from '../../../types';

/** Wizard 内单行下级单位的本地结构。 */
export interface SubUnitLocal {
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

export const SUB_UNIT_CSV_HEADERS = [
  '客户下级单位名称',
  '企业ID',
  '企业名称',
  '授权数量',
  'IT联系人',
  '手机',
  '邮箱',
  '客户类型',
  '行业条线',
  '卖方联系人',
] as const;

/** 解析单行 CSV，正确处理引号转义。 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

/** 下载下级单位 CSV 模板。 */
export function downloadSubUnitTemplate(): void {
  const bom = '\uFEFF';
  const csv =
    bom +
    SUB_UNIT_CSV_HEADERS.join(',') +
    '\n' +
    '示例单位名称,ENT001,示例企业,100,张三,13800138000,zhangsan@example.com,企业客户,教育,李四\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '下级单位授权导入模板.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 解析整段 CSV 文本，结合客户列表回填 customerType / industryLine。
 * 解析失败或无有效行时返回空数组并通过 onError 回调上报。
 */
export function parseSubUnitsCSV(
  text: string,
  customers: Customer[],
  idPrefix: string,
  onError?: (msg: string) => void,
): SubUnitLocal[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) {
    onError?.('文件中没有数据行，请检查格式。');
    return [];
  }
  const headerLine = parseCSVLine(lines[0]);
  const findIdx = (kw: string) => headerLine.findIndex(h => h.replace(/\uFEFF/, '').includes(kw));
  const nameIdx = findIdx('单位名称');
  const eidIdx = findIdx('企业ID');
  const enameIdx = findIdx('企业名称');
  const countIdx = findIdx('授权数量');
  const itIdx = findIdx('IT联系人');
  const phoneIdx = findIdx('手机');
  const emailIdx = findIdx('邮箱');
  const ctypeIdx = findIdx('客户类型');
  const indIdx = findIdx('行业条线');
  const sellerIdx = findIdx('卖方联系人');

  const newSubs: SubUnitLocal[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.every(c => !c)) continue;
    const unitName = (nameIdx >= 0 ? cols[nameIdx] : cols[0]) || '';
    const cust = customers.find(c => c.companyName === unitName);
    newSubs.push({
      id: `${idPrefix}_${Date.now()}_${i}`,
      unitName,
      enterpriseId: (eidIdx >= 0 ? cols[eidIdx] : cols[1]) || '',
      enterpriseName: (enameIdx >= 0 ? cols[enameIdx] : cols[2]) || '-',
      authCount: (countIdx >= 0 ? cols[countIdx] : cols[3]) || '',
      itContact: (itIdx >= 0 ? cols[itIdx] : cols[4]) || '',
      phone: (phoneIdx >= 0 ? cols[phoneIdx] : cols[5]) || '',
      email: (emailIdx >= 0 ? cols[emailIdx] : cols[6]) || '',
      customerType:
        cust?.customerType || (ctypeIdx >= 0 ? cols[ctypeIdx] : cols[7]) || '-',
      industryLine:
        cust?.industryLine || cust?.industry || (indIdx >= 0 ? cols[indIdx] : cols[8]) || '-',
      sellerContact: (sellerIdx >= 0 ? cols[sellerIdx] : cols[9]) || '-',
    });
  }
  if (newSubs.length === 0) {
    onError?.('未解析到有效数据，请检查文件内容。');
  }
  return newSubs;
}
