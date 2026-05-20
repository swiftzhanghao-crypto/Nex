import { BaseRepository } from './BaseRepository.ts';

export interface OrderRow {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_type: string | null;
  customer_level: string | null;
  customer_industry: string | null;
  customer_region: string | null;
  date: string;
  status: string;
  total: number;
  items: string;
  source: string;
  buyer_type: string;
  buyer_name: string | null;
  buyer_id: string | null;
  shipping_address: string | null;
  delivery_method: string | null;
  is_paid: number;
  payment_date: string | null;
  payment_method: string | null;
  payment_terms: string | null;
  payment_record: string | null;
  approval: string;
  approval_records: string;
  sales_rep_id: string | null;
  sales_rep_name: string | null;
  biz_manager_id: string | null;
  biz_manager_name: string | null;
  invoice_info: string | null;
  acceptance_info: string | null;
  acceptance_config: string | null;
  opportunity_id: string | null;
  opportunity_name: string | null;
  original_order_id: string | null;
  refund_reason: string | null;
  refund_amount: number | null;
  order_remark: string | null;
  extra: string;
  created_by_user?: string;
}

export interface OrderAuditLogRow {
  id: number;
  user_id: string;
  user_name: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface OrderSubUnitQueryRow {
  id: string;
  customer_name: string;
  items: string;
  sales_rep_name: string | null;
  date: string;
  status: string;
  buyer_type: string;
}

export class OrderRepository extends BaseRepository {
  /**
   * 计算匹配查询条件的订单总数
   */
  public count(whereSql: string, params: any[]): number {
    const totalRow = this.getOne<{ c: number }>(
      `SELECT COUNT(*) AS c FROM orders ${whereSql}`,
      ...params
    );
    return totalRow?.c ?? 0;
  }

  /**
   * 查找分页匹配查询条件的订单列表
   */
  public findMany(whereSql: string, params: any[], limit: number, offset: number): OrderRow[] {
    return this.getAll<OrderRow>(
      `SELECT * FROM orders ${whereSql} ORDER BY date DESC, rowid DESC LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );
  }

  /**
   * 根据 ID 查找单个订单
   */
  public findById(id: string): OrderRow | undefined {
    return this.getOne<OrderRow>('SELECT * FROM orders WHERE id = ?', id);
  }

  /**
   * 插入新订单记录
   */
  public create(row: OrderRow): void {
    this.run(
      `INSERT INTO orders (
        id, customer_id, customer_name, customer_type, customer_level, customer_industry, customer_region,
        date, status, total, items, source, buyer_type, buyer_name, buyer_id, shipping_address, delivery_method,
        is_paid, payment_date, payment_method, payment_terms, payment_record, approval, approval_records,
        sales_rep_id, sales_rep_name, biz_manager_id, biz_manager_name, invoice_info, acceptance_info, acceptance_config,
        opportunity_id, opportunity_name, original_order_id, refund_reason, refund_amount, order_remark, extra
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.id, row.customer_id, row.customer_name, row.customer_type, row.customer_level, row.customer_industry, row.customer_region,
      row.date, row.status, row.total, row.items, row.source, row.buyer_type, row.buyer_name, row.buyer_id, row.shipping_address, row.delivery_method,
      row.is_paid, row.payment_date, row.payment_method, row.payment_terms, row.payment_record, row.approval, row.approval_records,
      row.sales_rep_id, row.sales_rep_name, row.biz_manager_id, row.biz_manager_name, row.invoice_info, row.acceptance_info, row.acceptance_config,
      row.opportunity_id, row.opportunity_name, row.original_order_id, row.refund_reason, row.refund_amount, row.order_remark, row.extra
    );
  }

  /**
   * 更新已有订单记录
   */
  public update(id: string, row: Partial<OrderRow>): void {
    const keys = Object.keys(row).filter(k => k !== 'id');
    if (keys.length === 0) return;

    const setSql = keys.map(k => `${k} = ?`).join(', ');
    const params = keys.map(k => (row as any)[k]);
    params.push(id);

    this.run(`UPDATE orders SET ${setSql}, updated_at = datetime('now') WHERE id = ?`, ...params);
  }

  /**
   * 删除单个订单
   */
  public delete(id: string): void {
    this.run('DELETE FROM orders WHERE id = ?', id);
  }

  /**
   * 获取特定订单的审计日志
   */
  public getAuditLogs(orderId: string): OrderAuditLogRow[] {
    return this.getAll<OrderAuditLogRow>(
      `SELECT id, user_id, user_name, action, detail, created_at FROM audit_logs WHERE resource = 'Order' AND resource_id = ? ORDER BY created_at DESC`,
      orderId
    );
  }

  /**
   * 获取下级单位列表原始查询行
   */
  public findManySubUnits(whereSql: string, params: any[]): OrderSubUnitQueryRow[] {
    return this.getAll<OrderSubUnitQueryRow>(
      `SELECT id, customer_name, items, sales_rep_name, date, status, buyer_type FROM orders ${whereSql} ORDER BY date DESC`,
      ...params
    );
  }
}
