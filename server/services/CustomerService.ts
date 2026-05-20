import { CustomerRepository, type CustomerRow } from '../repositories/CustomerRepository.ts';
import { buildRowPermissionWhere, checkRowPermissionForSingle } from '../rowPermissionFilter.ts';
import { safeJsonParse, safePagination, getUserName } from '../utils.ts';
import type { JwtPayload } from '../auth.ts';

export class CustomerService {
  private customerRepository: CustomerRepository;

  constructor() {
    this.customerRepository = new CustomerRepository();
  }

  private toCustomer(row: CustomerRow) {
    return {
      id: row.id,
      companyName: row.company_name,
      industry: row.industry,
      customerType: row.customer_type,
      level: row.level,
      region: row.region,
      address: row.address,
      shippingAddress: row.shipping_address,
      status: row.status,
      logo: row.logo,
      contacts: safeJsonParse(row.contacts, []),
      billingInfo: row.billing_info ? safeJsonParse(row.billing_info) : undefined,
      ownerId: row.owner_id ?? undefined,
      ownerName: row.owner_name ?? undefined,
      enterprises: safeJsonParse(row.enterprises, []),
      nextFollowUpDate: row.next_follow_up,
    };
  }

  /**
   * 列表查询，支持完整的过滤、搜索与行级数据权限控制
   */
  public async getCustomers(query: Record<string, string>, currentUser: JwtPayload) {
    const { type, level, status, search, industry, region, page = '1', size = '50' } = query;
    const conds: string[] = ['1=1'];
    const params: any[] = [];

    if (type) { conds.push('customer_type = ?'); params.push(type); }
    if (level) { conds.push('level = ?'); params.push(level); }
    if (status) { conds.push('status = ?'); params.push(status); }
    if (industry) { conds.push('industry = ?'); params.push(industry); }
    if (region) { conds.push('region = ?'); params.push(region); }
    if (search && search.trim()) {
      conds.push('(company_name LIKE ? OR id LIKE ?)');
      const k = `%${search.trim()}%`;
      params.push(k, k);
    }

    // 拼装行权限过滤条件
    const rowPerm = buildRowPermissionWhere(this.customerRepository['db'], currentUser, 'Customer');
    const whereSql = ' WHERE ' + conds.join(' AND ') + rowPerm.sql;
    const whereParams = [...params, ...rowPerm.params];

    const total = this.customerRepository.count(whereSql, whereParams);
    const { limit, offset, pageNum } = safePagination(page, size);
    const rows = this.customerRepository.findMany(whereSql, whereParams, limit, offset);

    return {
      data: rows.map(r => this.toCustomer(r)),
      total,
      page: pageNum,
      size: limit,
    };
  }

  /**
   * 根据 ID 查询单个客户，并做行权限校正
   */
  public async getCustomerById(id: string, currentUser: JwtPayload) {
    const row = this.customerRepository.findById(id);
    if (!row) {
      throw { status: 404, message: '客户不存在' };
    }

    const customer = this.toCustomer(row);
    const readable = checkRowPermissionForSingle(this.customerRepository['db'], currentUser, 'Customer', customer);
    if (!readable) {
      throw { status: 403, message: '无权查看该客户数据' };
    }

    return customer;
  }

  /**
   * 创建客户
   */
  public async createCustomer(id: string, body: any, currentUser: JwtPayload) {
    const existing = this.customerRepository.findById(id);
    if (existing) {
      throw { status: 400, message: '该客户 ID 已存在' };
    }

    const row: CustomerRow = {
      id,
      company_name: body.companyName,
      industry: body.industry,
      customer_type: body.customerType,
      level: body.level,
      region: body.region,
      address: body.address || '',
      shipping_address: body.shippingAddress || '',
      status: body.status || 'Active',
      logo: body.logo || null,
      contacts: body.contacts ? JSON.stringify(body.contacts) : '[]',
      billing_info: body.billingInfo ? JSON.stringify(body.billingInfo) : null,
      owner_id: body.ownerId || null,
      owner_name: body.ownerName || null,
      enterprises: body.enterprises ? JSON.stringify(body.enterprises) : '[]',
      next_follow_up: body.nextFollowUpDate || null,
      created_at: '', // 由数据库 SQLite 默认值生成
      updated_at: '',
    };

    const db = this.customerRepository['db'];
    const currentUserName = getUserName(db, currentUser.userId);

    this.customerRepository.transaction(() => {
      this.customerRepository.create(row);
      this.customerRepository.insertAuditLog({
        userId: currentUser.userId,
        userName: currentUserName,
        action: 'CREATE',
        resource: 'Customer',
        resourceId: id,
        detail: `创建客户: ${body.companyName}`,
      });
    });

    const created = this.customerRepository.findById(id);
    return created ? this.toCustomer(created) : null;
  }

  /**
   * 更新客户
   */
  public async updateCustomer(id: string, body: any, currentUser: JwtPayload) {
    const existing = this.customerRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: '客户不存在' };
    }

    const db = this.customerRepository['db'];
    const readable = checkRowPermissionForSingle(
      db,
      currentUser,
      'Customer',
      this.toCustomer(existing)
    );
    if (!readable) {
      throw { status: 403, message: '无权修改此客户' };
    }

    const updateData: Partial<CustomerRow> = {};
    if (body.companyName !== undefined) updateData.company_name = body.companyName;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.customerType !== undefined) updateData.customer_type = body.customerType;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.region !== undefined) updateData.region = body.region;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.shippingAddress !== undefined) updateData.shipping_address = body.shippingAddress;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.contacts !== undefined) updateData.contacts = JSON.stringify(body.contacts);
    if (body.billingInfo !== undefined) updateData.billing_info = body.billingInfo ? JSON.stringify(body.billingInfo) : null;
    if (body.ownerId !== undefined) updateData.owner_id = body.ownerId;
    if (body.ownerName !== undefined) updateData.owner_name = body.ownerName;
    if (body.enterprises !== undefined) updateData.enterprises = body.enterprises ? JSON.stringify(body.enterprises) : '[]';
    if (body.nextFollowUpDate !== undefined) updateData.next_follow_up = body.nextFollowUpDate || null;

    const currentUserName = getUserName(db, currentUser.userId);

    this.customerRepository.transaction(() => {
      this.customerRepository.update(id, updateData);
      this.customerRepository.insertAuditLog({
        userId: currentUser.userId,
        userName: currentUserName,
        action: 'UPDATE',
        resource: 'Customer',
        resourceId: id,
        detail: `更新客户数据: ${body.companyName || existing.company_name}`,
      });
    });

    const updated = this.customerRepository.findById(id);
    return updated ? this.toCustomer(updated) : null;
  }

  /**
   * 删除客户
   */
  public async deleteCustomer(id: string, currentUser: JwtPayload) {
    const existing = this.customerRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: '客户不存在' };
    }

    const db = this.customerRepository['db'];
    const readable = checkRowPermissionForSingle(
      db,
      currentUser,
      'Customer',
      this.toCustomer(existing)
    );
    if (!readable) {
      throw { status: 403, message: '无权删除该客户' };
    }

    const currentUserName = getUserName(db, currentUser.userId);

    this.customerRepository.transaction(() => {
      this.customerRepository.delete(id);
      this.customerRepository.insertAuditLog({
        userId: currentUser.userId,
        userName: currentUserName,
        action: 'DELETE',
        resource: 'Customer',
        resourceId: id,
        detail: `删除客户: ${existing.company_name}`,
      });
    });

    return true;
  }
}
