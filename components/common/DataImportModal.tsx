import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import ModalPortal from './ModalPortal';
import { importApi } from '../../services/api';

export type ImportTarget = 'customers' | 'products';

interface DataImportModalProps {
  open: boolean;
  onClose: () => void;
  target: ImportTarget;
  onSuccess?: (imported: number) => void;
}

const CUSTOMER_HEADER_MAP: Record<string, string> = {
  companyname: 'companyName',
  公司名称: 'companyName',
  company_name: 'companyName',
  industry: 'industry',
  行业: 'industry',
  customertype: 'customerType',
  客户类型: 'customerType',
  customer_type: 'customerType',
  level: 'level',
  级别: 'level',
  客户级别: 'level',
  region: 'region',
  地区: 'region',
  区域: 'region',
  address: 'address',
  地址: 'address',
  shippingaddress: 'shippingAddress',
  收货地址: 'shippingAddress',
  status: 'status',
  状态: 'status',
};

const PRODUCT_HEADER_MAP: Record<string, string> = {
  name: 'name',
  产品名称: 'name',
  名称: 'name',
  category: 'category',
  分类: 'category',
  品类: 'category',
  subcategory: 'subCategory',
  子分类: 'subCategory',
  description: 'description',
  描述: 'description',
  status: 'status',
  状态: 'status',
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '');
}

function mapRowKeys(row: Record<string, unknown>, headerMap: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    const mapped = headerMap[normalizeHeader(key)] || headerMap[key];
    if (mapped) out[mapped] = val;
    else if (/^[a-z][a-zA-Z0-9]*$/.test(key)) out[key] = val;
  }
  return out;
}

function sheetToRows(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return raw.filter((row) => Object.values(row).some((v) => v !== '' && v != null));
}

const DataImportModal: React.FC<DataImportModalProps> = ({ open, onClose, target, onSuccess }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'file' | 'json'>('file');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const headerMap = target === 'customers' ? CUSTOMER_HEADER_MAP : PRODUCT_HEADER_MAP;
  const title = target === 'customers' ? '导入客户' : '导入产品';

  const reset = useCallback(() => {
    setRows([]);
    setJsonText('');
    setError(null);
    setTab('file');
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const parseFile = async (file: File) => {
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) {
        setError('文件中没有可读取的工作表');
        return;
      }
      const parsed = sheetToRows(sheet).map((r) => mapRowKeys(r, headerMap));
      if (parsed.length === 0) {
        setError('未解析到有效数据行');
        return;
      }
      setRows(parsed);
    } catch {
      setError('文件解析失败，请检查格式');
    }
  };

  const parseJson = () => {
    setError(null);
    try {
      const data = JSON.parse(jsonText) as unknown;
      if (!Array.isArray(data)) {
        setError('JSON 必须是数组格式');
        return;
      }
      const parsed = data.map((item) =>
        typeof item === 'object' && item !== null
          ? mapRowKeys(item as Record<string, unknown>, headerMap)
          : {},
      );
      if (parsed.length === 0) {
        setError('数组为空');
        return;
      }
      setRows(parsed);
    } catch {
      setError('JSON 格式无效');
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) {
      setError('请先上传或粘贴数据');
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const result = target === 'customers'
        ? await importApi.customers(rows)
        : await importApi.products(rows);
      onSuccess?.(result.imported);
      handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const preview = rows.slice(0, 5);
  const previewKeys = preview.length > 0 ? Object.keys(preview[0]) : [];

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col unified-card bg-white dark:bg-[#1C1C1E] shadow-2xl animate-modal-enter">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#0071E3]" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            </div>
            <button type="button" onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pt-4 flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTab('file')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === 'file' ? 'bg-[#0071E3] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}
            >
              上传文件
            </button>
            <button
              type="button"
              onClick={() => setTab('json')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === 'json' ? 'bg-[#0071E3] text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}
            >
              粘贴 JSON
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
            {tab === 'file' ? (
              <div
                className="border-2 border-dashed border-gray-200 dark:border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-[#0071E3]/50 transition"
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void parseFile(f);
                    e.target.value = '';
                  }}
                />
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300">点击上传 CSV 或 Excel</p>
                <p className="text-xs text-gray-400 mt-1">支持 .csv / .xlsx / .xls</p>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder='[{"companyName":"示例公司","industry":"金融",...}]'
                  className="w-full h-40 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-sm font-mono resize-none outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={parseJson}
                  className="text-sm text-[#0071E3] font-medium hover:underline"
                >
                  解析 JSON
                </button>
              </div>
            )}

            {rows.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  预览（共 {rows.length} 行，显示前 5 行）
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 dark:bg-white/5">
                      <tr>
                        {previewKeys.map((k) => (
                          <th key={k} className="px-3 py-2 whitespace-nowrap font-semibold text-gray-600 dark:text-gray-400">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {preview.map((row, i) => (
                        <tr key={i}>
                          {previewKeys.map((k) => (
                            <td key={k} className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[160px] truncate">
                              {String(row[k] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/10 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition"
            >
              取消
            </button>
            <button
              type="button"
              disabled={importing || rows.length === 0}
              onClick={() => void handleImport()}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#0071E3] hover:bg-[#0062CC] disabled:opacity-50 rounded-lg transition"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              确认导入 {rows.length > 0 ? `(${rows.length} 条)` : ''}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default DataImportModal;
