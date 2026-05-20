import { OrderStatus } from '../types';

export interface OrderListFilters {
  status: string;
  source: string;
  keyword: string;
}

const STOCK_PSEUDO = new Set(['STOCK_AUTH', 'STOCK_PKG', 'STOCK_SHIP', 'STOCK_CD']);

/** 是否必须使用全量订单做客户端筛选（子状态、高级筛选、日期/金额） */
export function orderListNeedsClientDataset(opts: {
  filterStatus: string;
  appliedAdvancedCount: number;
  hasDateOrAmountFilter: boolean;
}): boolean {
  if (STOCK_PSEUDO.has(opts.filterStatus)) return true;
  if (opts.appliedAdvancedCount > 0) return true;
  if (opts.hasDateOrAmountFilter) return true;
  return false;
}

/** 将列表页基础筛选映射为 orderApi.list 查询参数 */
export function buildOrderListFilters(
  filterStatus: string,
  filterSource: string,
  searchTerm: string,
  searchField: string,
): OrderListFilters {
  const filters: OrderListFilters = { status: '', source: '', keyword: '' };

  if (filterStatus !== 'All' && !STOCK_PSEUDO.has(filterStatus)) {
    if (Object.values(OrderStatus).includes(filterStatus as OrderStatus)) {
      filters.status = filterStatus;
    }
  }

  if (filterSource !== 'All') {
    filters.source = filterSource;
  }

  if (searchTerm.trim() && (searchField === 'id' || searchField === 'customerName')) {
    filters.keyword = searchTerm.trim();
  }

  return filters;
}
