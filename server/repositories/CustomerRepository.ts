import { BaseRepository } from './BaseRepository.ts';

export interface CustomerRow {
  id: string;
  company_name: string;
  industry: string;
  customer_type: string;
  level: string;
  region: string;
  address: string;
  shipping_address: string;
  status: string;
  logo: string | null;
  contacts: string;
  billing_info: string | null;
  owner_id: string | null;
  owner_name: string | null;
  enterprises: string;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
}

export class CustomerRepository extends BaseRepository {
  /**
   * 计算匹配查询条件的客户总数
   */
  public count(whereSql: string, params: any[]): number {
    const totalRow = this.getOne<{ c: number }>(
      `SELECT COUNT(*) AS c FROM customers ${whereSql}`,
      ...params
    );
    return totalRow?.c ?? 0;
  }

  /**
   * 查找分页匹配查询条件的客户列表
   */
  public findMany(whereSql: string, params: any[], limit: number, offset: number): CustomerRow[] {
    return this.getAll<CustomerRow>(
      `SELECT * FROM customers ${whereSql} ORDER BY company_name LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );
  }

  /**
   * 根据 ID 查找单个客户
   */
  public findById(id: string): CustomerRow | undefined {
    return this.getOne<CustomerRow>('SELECT * FROM customers WHERE id = ?', id);
  }

  /**
   * 插入新客户记录
   */
  public create(row: CustomerRow): void {
    this.run(
      `INSERT INTO customers (
        id, company_name, industry, customer_type, level, region, address, shipping_address,
        status, logo, contacts, billing_info, owner_id, owner_name, enterprises, next_follow_up
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.id, row.company_name, row.industry, row.customer_type, row.level, row.region, row.address, row.shipping_address,
      row.status, row.logo, row.contacts, row.billing_info, row.owner_id, row.owner_name, row.enterprises, row.next_follow_up
    );
  }

  /**
   * 更新已有客户记录
   */
  public update(id: string, row: Partial<CustomerRow>): void {
    const keys = Object.keys(row).filter(k => k !== 'id' && k !== 'created_at');
    if (keys.length === 0) return;

    const setSql = keys.map(k => `${k} = ?`).join(', ');
    const params = keys.map(k => (row as any)[k]);
    params.push(id);

    this.run(`UPDATE customers SET ${setSql}, updated_at = datetime('now') WHERE id = ?`, ...params);
  }

  /**
   * 删除单个客户
   */
  public delete(id: string): void {
    this.run('DELETE FROM customers WHERE id = ?', id);
  }
}
