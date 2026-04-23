import { useCallback, useEffect, useRef, useState } from 'react';
import type { PaginatedResult } from '../services/api';

export interface UsePagedQueryOptions<TFilters extends object> {
  /**
   * 拉取分页数据的函数。
   * 接收 page/size 以及调用方传入的 filters 合并后的对象。
   * 必须返回符合 PaginatedResult 的结构。
   */
  fetcher: (params: TFilters & { page: number; size: number }) => Promise<PaginatedResult<any>>;
  /** 初始 filters（不包含 page/size） */
  initialFilters?: TFilters;
  /** 初始页号，默认 1 */
  initialPage?: number;
  /** 每页大小，默认 20 */
  initialSize?: number;
  /** false 时手动触发 fetch；默认 true */
  autoFetch?: boolean;
  /** filters 变化时是否回到第 1 页（默认 true） */
  resetPageOnFilterChange?: boolean;
}

export interface UsePagedQueryResult<T, TFilters extends object> {
  data: T[];
  total: number;
  page: number;
  size: number;
  loading: boolean;
  error: string | null;
  filters: TFilters;
  setFilters: (next: Partial<TFilters>, opts?: { resetPage?: boolean }) => void;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  refresh: () => Promise<void>;
}

/**
 * 通用列表分页 hook：屏蔽 page/size/filters 编排，保持 UI 简洁。
 * 用法：
 *   const q = usePagedQuery({
 *     fetcher: (p) => orderApi.list(p),
 *     initialFilters: { status: '', search: '' },
 *     initialSize: 20,
 *   });
 */
export function usePagedQuery<T = any, TFilters extends object = Record<string, any>>(
  options: UsePagedQueryOptions<TFilters>,
): UsePagedQueryResult<T, TFilters> {
  const {
    fetcher,
    initialFilters = {} as TFilters,
    initialPage = 1,
    initialSize = 20,
    autoFetch = true,
    resetPageOnFilterChange = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(initialPage);
  const [size, setSizeState] = useState(initialSize);
  const [filters, setFiltersState] = useState<TFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // 用 ref 跟踪最后一次发起的请求，避免乱序覆盖
  const reqIdRef = useRef(0);

  const doFetch = useCallback(
    async (p: number, s: number, f: TFilters) => {
      const reqId = ++reqIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const res = await fetcherRef.current({ ...(f as any), page: p, size: s });
        if (reqId !== reqIdRef.current) return;
        setData(res.data || []);
        setTotal(res.total || 0);
      } catch (e: any) {
        if (reqId !== reqIdRef.current) return;
        setError(e?.message || '加载失败');
        setData([]);
        setTotal(0);
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!autoFetch) return;
    doFetch(page, size, filters);
  }, [autoFetch, doFetch, page, size, filters]);

  const setFilters = useCallback((next: Partial<TFilters>, opts?: { resetPage?: boolean }) => {
    setFiltersState((prev) => ({ ...prev, ...next }));
    const shouldReset = opts?.resetPage ?? resetPageOnFilterChange;
    if (shouldReset) setPageState(1);
  }, [resetPageOnFilterChange]);

  const setPage = useCallback((p: number) => setPageState(Math.max(1, p)), []);
  const setSize = useCallback((s: number) => {
    setSizeState(Math.max(1, s));
    setPageState(1);
  }, []);

  const refresh = useCallback(() => doFetch(page, size, filters), [doFetch, page, size, filters]);

  return {
    data,
    total,
    page,
    size,
    loading,
    error,
    filters,
    setFilters,
    setPage,
    setSize,
    refresh,
  };
}
