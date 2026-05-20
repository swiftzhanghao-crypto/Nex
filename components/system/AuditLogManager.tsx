import React, { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import Pagination from '../common/Pagination';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { auditApi, type AuditLogEntry } from '../../services/api';

const RESOURCE_OPTIONS = ['', 'Order', 'Customer', 'Product', 'User', 'Contract', 'Channel', 'Opportunity'];
const ACTION_OPTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'APPROVE', 'REJECT', 'SUBMIT'];

interface AuditFilters {
  resource: string;
  action: string;
}

const AuditLogManager: React.FC = () => {
  const query = usePagedQuery<AuditLogEntry, AuditFilters>({
    fetcher: (p) => auditApi.list({
      page: p.page,
      size: p.size,
      resource: p.resource || undefined,
      action: p.action || undefined,
    }),
    initialFilters: { resource: '', action: '' },
    initialSize: 20,
  });

  const columns = useMemo(() => ['时间', '用户', '操作', '资源', '资源ID', '详情'], []);

  return (
    <div className="page-container animate-page-enter h-full flex flex-col gap-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[#0071E3] dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">审计日志</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">系统操作留痕，仅管理员可查看</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={query.filters.resource}
            onChange={(e) => query.setFilters({ resource: e.target.value })}
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-700 dark:text-gray-200"
          >
            <option value="">全部资源</option>
            {RESOURCE_OPTIONS.filter(Boolean).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={query.filters.action}
            onChange={(e) => query.setFilters({ action: e.target.value })}
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-700 dark:text-gray-200"
          >
            <option value="">全部操作</option>
            {ACTION_OPTIONS.filter(Boolean).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="unified-card overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E] sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E] first:pl-6"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {query.loading && query.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">加载中...</td>
                </tr>
              ) : query.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">暂无审计记录</td>
                </tr>
              ) : (
                query.data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="pl-6 pr-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {row.createdAt}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white">
                      {row.userName}
                      <span className="text-gray-400 text-xs ml-1">({row.userId})</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{row.resource}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-500">{row.resourceId}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-md truncate" title={row.detail || ''}>
                      {row.detail || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={query.page}
          size={query.size}
          total={query.total}
          onPageChange={query.setPage}
          onSizeChange={query.setSize}
          loading={query.loading}
        />
      </div>
    </div>
  );
};

export default AuditLogManager;
