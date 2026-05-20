import { OrderRepository, type OrderRow } from '../repositories/OrderRepository.ts';
import { CustomerRepository } from '../repositories/CustomerRepository.ts';
import { buildRowPermissionWhere, checkRowPermissionForSingle } from '../rowPermissionFilter.ts';
import { notifyOrderStatusChange } from '../notifications.ts';
import { safeJsonParse, safePagination, getUserName, sanitizeOrderItemsSubUnits } from '../utils.ts';
import { validateSubUnits } from '../validate.ts';
import type { JwtPayload } from '../auth.ts';
import type { OrderItem } from '../../types.ts';

const STATUS_ALIASES: Record<string, string> = {
  APPROVED: 'PENDING_CONFIRM',
  PROCESSING: 'PROCESSING_PROD',
  COMPLETED: 'DELIVERED',
  REFUND_REQUESTED: 'REFUND_PENDING',
  REFUNDING: 'REFUND_PENDING',
  REJECTED: 'DRAFT',
};

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_APPROVAL', 'PENDING_PAYMENT', 'CANCELLED'],
  PENDING_APPROVAL: ['PENDING_CONFIRM', 'DRAFT', 'CANCELLED'],
  PENDING_CONFIRM: ['PROCESSING_PROD', 'CANCELLED'],
  PROCESSING_PROD: ['PENDING_PAYMENT', 'SHIPPED', 'DELIVERED', 'PENDING_APPROVAL', 'CANCELLED'],
  PENDING_PAYMENT: ['PENDING_APPROVAL', 'PROCESSING_PROD', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'REFUND_PENDING', 'CANCELLED'],
  DELIVERED: ['REFUND_PENDING', 'REFUNDED', 'CANCELLED'],
  REFUND_PENDING: ['REFUNDED', 'DELIVERED', 'CANCELLED'],
  REFUNDED: [],
  CANCELLED: [],
};

export class OrderService {
  private orderRepository: OrderRepository;
  private customerRepository: CustomerRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.customerRepository = new CustomerRepository();
  }

  private normalizeOrderStatus(status: string | null | undefined): string {
    if (!status) return 'DRAFT';
    return STATUS_ALIASES[status] || status;
  }

  private validateStatusTransition(from: string, to: string): boolean {
    const fromStatus = this.normalizeOrderStatus(from);
    const toStatus = this.normalizeOrderStatus(to);
    const allowed = ORDER_STATUS_TRANSITIONS[fromStatus];
    if (!allowed) return false;
    return allowed.includes(toStatus);
  }

  private toOrder(row: OrderRow) {
    const extra = safeJsonParse<Record<string, unknown>>(row.extra, {});
    const rawItems = safeJsonParse(row.items, []);
    const items = sanitizeOrderItemsSubUnits(rawItems, row.buyer_type);
    return {
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerType: row.customer_type ?? undefined,
      customerLevel: row.customer_level ?? undefined,
      customerIndustry: row.customer_industry ?? undefined,
      customerRegion: row.customer_region ?? undefined,
      date: row.date,
      status: this.normalizeOrderStatus(row.status),
      total: row.total ?? 0,
      items,
      source: row.source,
      buyerType: row.buyer_type,
      buyerName: row.buyer_name ?? undefined,
      buyerId: row.buyer_id ?? undefined,
      shippingAddress: row.shipping_address ?? undefined,
      deliveryMethod: row.delivery_method ?? undefined,
      isPaid: !!row.is_paid,
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      paymentTerms: row.payment_terms,
      paymentRecord: row.payment_record ? safeJsonParse(row.payment_record) : undefined,
      approval: safeJsonParse(row.approval),
      approvalRecords: safeJsonParse(row.approval_records, []),
      salesRepId: row.sales_rep_id ?? undefined,
      salesRepName: row.sales_rep_name ?? undefined,
      businessManagerId: row.biz_manager_id ?? undefined,
      businessManagerName: row.biz_manager_name ?? undefined,
      invoiceInfo: row.invoice_info ? safeJsonParse(row.invoice_info) : undefined,
      acceptanceInfo: row.acceptance_info ? safeJsonParse(row.acceptance_info) : undefined,
      acceptanceConfig: row.acceptance_config ? safeJsonParse(row.acceptance_config) : undefined,
      opportunityId: row.opportunity_id,
      opportunityName: row.opportunity_name,
      originalOrderId: row.original_order_id,
      refundReason: row.refund_reason,
      refundAmount: row.refund_amount,
      orderRemark: row.order_remark ?? undefined,
      ...extra,
    };
  }

  /**
   * 列表查询：支持按状态、客户 ID、来源、关键字等筛选，配合行权限做真分页
   */
  public async getOrders(query: Record<string, string>, currentUser: JwtPayload) {
    const { status, customerId, source, keyword, page = '1', size = '50' } = query;
    const statusFilter = status ? this.normalizeOrderStatus(status) : null;

    const conds: string[] = ['1=1'];
    const params: any[] = [];

    if (customerId) { conds.push('customer_id = ?'); params.push(customerId); }
    if (source) { conds.push('source = ?'); params.push(source); }
    if (statusFilter) { conds.push('status = ?'); params.push(statusFilter); }
    if (keyword && keyword.trim()) {
      conds.push('(customer_name LIKE ? OR id LIKE ?)');
      const k = `%${keyword.trim()}%`;
      params.push(k, k);
    }

    const rowPerm = buildRowPermissionWhere(this.orderRepository['db'], currentUser, 'Order');
    const whereSql = ' WHERE ' + conds.join(' AND ') + rowPerm.sql;
    const whereParams = [...params, ...rowPerm.params];

    const total = this.orderRepository.count(whereSql, whereParams);
    const { limit, offset, pageNum } = safePagination(page, size);
    const rows = this.orderRepository.findMany(whereSql, whereParams, limit, offset);

    return {
      data: rows.map(r => this.toOrder(r)),
      total,
      page: pageNum,
      size: limit,
    };
  }

  /**
   * 按 ID 查找单个订单，并进行行权限过滤
   */
  public async getOrderById(id: string, currentUser: JwtPayload) {
    const row = this.orderRepository.findById(id);
    if (!row) {
      throw { status: 404, message: '订单不存在' };
    }

    const order = this.toOrder(row);
    const readable = checkRowPermissionForSingle(this.orderRepository['db'], currentUser, 'Order', order);
    if (!readable) {
      throw { status: 403, message: '无权查看此订单' };
    }

    return order;
  }

  /**
   * 创建订单，包含下级单位校验、身份自适应绑定、客户基本信息级联、以及审计日志
   */
  public async createOrder(body: any, currentUser: JwtPayload) {
    const id = body.id || `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const existing = this.orderRepository.findById(id);
    if (existing) {
      throw { status: 400, message: '订单 ID 已存在' };
    }

    // 校验下级单位格式
    const subUnitError = validateSubUnits(body.items);
    if (subUnitError) {
      throw { status: 400, message: subUnitError };
    }

    const db = this.orderRepository['db'];
    const userRoles = Array.isArray(currentUser.roles) ? currentUser.roles : [];
    const isAdminOrManager = userRoles.some(r => ['Admin', 'Business', 'Commerce'].includes(r));
    const currentUserName = getUserName(db, currentUser.userId);

    // 销售代表自适应归属指定
    let salesRepId: string | null = body.salesRepId ?? null;
    let salesRepName: string | null = body.salesRepName ?? null;
    if (!isAdminOrManager) {
      if (salesRepId && salesRepId !== currentUser.userId) {
        throw { status: 403, message: '无权将订单的销售归属指定为他人' };
      }
      salesRepId = currentUser.userId;
      salesRepName = currentUserName;
    } else if (!salesRepId) {
      salesRepId = currentUser.userId;
      salesRepName = currentUserName;
    }

    // 级联获取客户基本数据
    const customer = this.customerRepository.findById(body.customerId);
    if (!customer) {
      throw { status: 400, message: '指定的客户不存在' };
    }

    const priceTotal = body.total || 0;

    const extra = JSON.stringify({
      receivingParty: body.receivingParty,
      receivingCompany: body.receivingCompany,
      receivingMethod: body.receivingMethod,
      directChannel: body.directChannel,
      terminalChannel: body.terminalChannel,
      orderType: body.orderType,
      creatorId: currentUser.userId,
      creatorName: currentUserName,
      creatorPhone: body.creatorPhone,
      industryLine: body.industryLine,
      province: body.province,
      city: body.city,
      district: body.district,
      settlementMethod: body.settlementMethod,
      settlementType: body.settlementType,
      expectedPaymentDate: body.expectedPaymentDate,
      installmentPlans: body.installmentPlans,
      purchasingContactId: body.purchasingContactId,
      itContactId: body.itContactId,
      linkedContractIds: body.linkedContractIds,
      linkedContractNames: body.linkedContractNames,
    });

    const nextStatus = this.normalizeOrderStatus(body.status || 'PENDING_APPROVAL');

    const row: OrderRow = {
      id,
      customer_id: body.customerId,
      customer_name: customer.company_name,
      customer_type: customer.customer_type,
      customer_level: customer.level,
      customer_industry: customer.industry,
      customer_region: customer.region,
      date: body.date || new Date().toISOString(),
      status: nextStatus,
      total: priceTotal,
      items: body.items ? JSON.stringify(body.items) : '[]',
      source: body.source || 'Sales',
      buyer_type: body.buyerType || 'Customer',
      buyer_name: body.buyerName || null,
      buyer_id: body.buyerId || null,
      shipping_address: body.shippingAddress || null,
      delivery_method: body.deliveryMethod || null,
      is_paid: 0,
      payment_date: null,
      payment_method: body.paymentMethod || null,
      payment_terms: body.paymentTerms || null,
      payment_record: null,
      approval: JSON.stringify(body.approval || { salesApproved: false, businessApproved: false, financeApproved: false }),
      approval_records: JSON.stringify(body.approvalRecords || []),
      sales_rep_id: salesRepId,
      sales_rep_name: salesRepName,
      biz_manager_id: body.businessManagerId || null,
      biz_manager_name: body.businessManagerName || null,
      invoice_info: body.invoiceInfo ? JSON.stringify(body.invoiceInfo) : null,
      acceptance_info: body.acceptanceInfo ? JSON.stringify(body.acceptanceInfo) : null,
      acceptance_config: body.acceptanceConfig ? JSON.stringify(body.acceptanceConfig) : null,
      opportunity_id: body.opportunityId || null,
      opportunity_name: body.opportunityName || null,
      original_order_id: body.originalOrderId || null,
      refund_reason: null,
      refund_amount: null,
      order_remark: body.orderRemark || null,
      extra,
    };

    this.orderRepository.transaction(() => {
      this.orderRepository.create(row);
      this.orderRepository.insertAuditLog({
        userId: currentUser.userId,
        userName: currentUserName,
        action: 'CREATE',
        resource: 'Order',
        resourceId: id,
        detail: `创建订单 ${id}`,
      });
    });

    const created = this.orderRepository.findById(id);
    return created ? this.toOrder(created) : null;
  }

  /**
   * 更新已有订单并写入审计日志，实现严格的权限保护与状态转换检查
   */
  public async updateOrder(id: string, body: any, currentUser: JwtPayload) {
    const db = this.orderRepository['db'];
    const existing = this.orderRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: '订单不存在' };
    }
    const existingOrder = this.toOrder(existing);

    // 行数据权限校验
    if (!checkRowPermissionForSingle(db, currentUser, 'Order', existingOrder)) {
      throw { status: 403, message: '行权限限制，无权修改此订单' };
    }

    // 角色身份权限校验 (Admin, Owner, Manager)
    const updRoles = Array.isArray(currentUser.roles) ? currentUser.roles : [];
    const isAdmin = updRoles.includes('Admin');
    const isOwner = existing.sales_rep_id === currentUser.userId;
    const isManager = updRoles.some(r => ['Business', 'Commerce'].includes(r));
    if (!isAdmin && !isOwner && !isManager) {
      throw { status: 403, message: '无权修改此订单' };
    }

    const isAdminOrManager = isAdmin || isManager;
    // 非管理员或经理不能修改订单代表归属
    if (!isAdminOrManager && body.salesRepId && body.salesRepId !== existing.sales_rep_id) {
      throw { status: 403, message: '无权变更订单的销售归属' };
    }

    // 锁定制单人信息不被修改
    const existingExtra = safeJsonParse<Record<string, unknown>>(existing.extra, {});
    const lockedCreatorId = existingExtra.creatorId || existing.created_by_user || null;
    const lockedCreatorName = existingExtra.creatorName || null;

    // 校验下级单位格式
    if (body.items) {
      const subUnitError = validateSubUnits(body.items);
      if (subUnitError) {
        throw { status: 400, message: subUnitError };
      }
    }

    // 检查状态流转有效性
    const existingStatus = this.normalizeOrderStatus(existingOrder.status);
    const targetStatus = this.normalizeOrderStatus(body.status ?? existingStatus);
    if (targetStatus !== existingStatus) {
      if (!this.validateStatusTransition(existingStatus, targetStatus)) {
        throw { status: 400, message: `状态流转不合法: ${existingStatus} → ${targetStatus}` };
      }
    }

    const merged = {
      ...existingOrder,
      ...body,
      status: targetStatus,
      approval: existingOrder.approval || {},
      approvalRecords: existingOrder.approvalRecords || [],
    };

    const extra = JSON.stringify({
      receivingParty: merged.receivingParty,
      receivingCompany: merged.receivingCompany,
      receivingMethod: merged.receivingMethod,
      directChannel: merged.directChannel,
      terminalChannel: merged.terminalChannel,
      orderType: merged.orderType,
      creatorId: lockedCreatorId,
      creatorName: lockedCreatorName,
      creatorPhone: merged.creatorPhone,
      industryLine: merged.industryLine,
      province: merged.province,
      city: merged.city,
      district: merged.district,
      isAuthConfirmed: merged.isAuthConfirmed,
      authConfirmedDate: merged.authConfirmedDate,
      isPackageConfirmed: merged.isPackageConfirmed,
      packageConfirmedDate: merged.packageConfirmedDate,
      isShippingConfirmed: merged.isShippingConfirmed,
      shippingConfirmedDate: merged.shippingConfirmedDate,
      isCDBurned: merged.isCDBurned,
      cdBurnedDate: merged.cdBurnedDate,
      shippedDate: merged.shippedDate,
      carrier: merged.carrier,
      trackingNumber: merged.trackingNumber,
      settlementMethod: merged.settlementMethod,
      settlementType: merged.settlementType,
      expectedPaymentDate: merged.expectedPaymentDate,
      installmentPlans: merged.installmentPlans,
      purchasingContactId: merged.purchasingContactId,
      itContactId: merged.itContactId,
      linkedContractIds: merged.linkedContractIds,
      linkedContractNames: merged.linkedContractNames,
    });

    const updateData: Partial<OrderRow> = {
      status: merged.status,
      total: merged.total || 0,
      items: JSON.stringify(merged.items || []),
      source: merged.source,
      buyer_type: merged.buyerType,
      shipping_address: merged.shippingAddress ?? null,
      delivery_method: merged.deliveryMethod ?? null,
      is_paid: merged.isPaid ? 1 : 0,
      payment_date: merged.paymentDate ?? null,
      payment_method: merged.paymentMethod ?? null,
      payment_terms: merged.paymentTerms ?? null,
      payment_record: merged.paymentRecord ? JSON.stringify(merged.paymentRecord) : null,
      approval: JSON.stringify(existingOrder.approval || {}),
      approval_records: JSON.stringify(existingOrder.approvalRecords || []),
      biz_manager_id: merged.businessManagerId ?? null,
      biz_manager_name: merged.businessManagerName ?? null,
      invoice_info: merged.invoiceInfo ? JSON.stringify(merged.invoiceInfo) : null,
      acceptance_info: merged.acceptanceInfo ? JSON.stringify(merged.acceptanceInfo) : null,
      acceptance_config: merged.acceptanceConfig ? JSON.stringify(merged.acceptanceConfig) : null,
      refund_reason: merged.refundReason ?? null,
      refund_amount: merged.refundAmount ?? null,
      order_remark: merged.orderRemark ?? null,
      extra,
    };

    if (body.customerId !== undefined) {
      const customer = this.customerRepository.findById(body.customerId);
      if (!customer) {
        throw { status: 400, message: '指定的客户不存在' };
      }
      updateData.customer_id = body.customerId;
      updateData.customer_name = customer.company_name;
      updateData.customer_type = customer.customer_type;
      updateData.customer_level = customer.level;
      updateData.customer_industry = customer.industry;
      updateData.customer_region = customer.region;
    }

    const finalSalesRepId = isAdminOrManager ? (merged.salesRepId ?? null) : existing.sales_rep_id;
    const finalSalesRepName = isAdminOrManager ? (merged.salesRepName ?? null) : existing.sales_rep_name;
    updateData.sales_rep_id = finalSalesRepId;
    updateData.sales_rep_name = finalSalesRepName;

    const currentUserName = getUserName(db, currentUser.userId);

    this.orderRepository.transaction(() => {
      this.orderRepository.update(id, updateData);
      this.orderRepository.insertAuditLog({
        userId: currentUser.userId,
        userName: currentUserName,
        action: 'UPDATE',
        resource: 'Order',
        resourceId: id,
        detail: `更新订单 ${id}，状态: ${merged.status}`,
      });

      if (targetStatus !== existingStatus) {
        notifyOrderStatusChange(db, {
          orderId: id,
          customerName: merged.customerName,
          salesRepId: finalSalesRepId,
          oldStatus: existingStatus,
          newStatus: targetStatus,
        });
      }
    });

    const updated = this.orderRepository.findById(id);
    return updated ? this.toOrder(updated) : null;
  }

  /**
   * 审批流程核心，支持动态角色多字段（salesApproved, businessApproved, financeApproved）联合会签机制
   */
  public async approveOrder(id: string, action: 'approve' | 'reject', remark: string, currentUser: JwtPayload) {
    const db = this.orderRepository['db'];
    const existing = this.orderRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: '订单不存在' };
    }

    if (!checkRowPermissionForSingle(db, currentUser, 'Order', this.toOrder(existing))) {
      throw { status: 403, message: '行权限限制，无权审批此订单' };
    }

    const currentStatus = this.normalizeOrderStatus(existing.status);
    if (currentStatus !== 'PENDING_APPROVAL') {
      throw { status: 400, message: `当前状态 ${currentStatus} 不允许审批操作` };
    }

    const approval = safeJsonParse<Record<string, boolean>>(existing.approval, {});
    const records: Array<Record<string, unknown>> = safeJsonParse(existing.approval_records, []);

    // 会签字段映射关系
    const approvalFieldMap: Record<string, string> = {
      'Sales': 'salesApproved',
      'Business': 'businessApproved',
      'Commerce': 'businessApproved',
      'Finance': 'financeApproved',
      'Admin': 'financeApproved',
    };
    const field = currentUser.roles.map(r => approvalFieldMap[r]).find(Boolean);
    if (!field) {
      throw { status: 403, message: '当前角色无审批字段映射' };
    }

    if (action === 'approve') {
      approval[field] = true;
    }

    records.push({
      userId: currentUser.userId,
      role: currentUser.roles.join(','),
      action,
      remark: remark || '',
      timestamp: new Date().toISOString(),
    });

    const newStatus = action === 'reject'
      ? 'DRAFT'
      : (approval.salesApproved && approval.businessApproved && approval.financeApproved)
        ? 'PENDING_CONFIRM'
        : 'PENDING_APPROVAL';

    const currentUserName = getUserName(db, currentUser.userId);

    this.orderRepository.transaction(() => {
      this.orderRepository.update(id, {
        status: newStatus,
        approval: JSON.stringify(approval),
        approval_records: JSON.stringify(records),
      });

      this.orderRepository.insertAuditLog({
        userId: currentUser.userId,
        userName: currentUserName,
        action: action === 'approve' ? 'APPROVE' : 'REJECT',
        resource: 'Order',
        resourceId: id,
        detail: `${action === 'approve' ? '审批通过' : '驳回'}订单 ${id}${remark ? '，备注: ' + remark : ''}`,
      });

      if (newStatus !== currentStatus) {
        notifyOrderStatusChange(db, {
          orderId: id,
          customerName: existing.customer_name,
          salesRepId: existing.sales_rep_id,
          oldStatus: currentStatus,
          newStatus,
        });
      }
    });

    const updated = this.orderRepository.findById(id);
    return updated ? this.toOrder(updated) : null;
  }

  /**
   * 提交订单，使状态转换为 PENDING_APPROVAL
   */
  public async submitOrderForApproval(id: string, currentUser: JwtPayload) {
    const db = this.orderRepository['db'];
    const existing = this.orderRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: '订单不存在' };
    }

    if (!checkRowPermissionForSingle(db, currentUser, 'Order', this.toOrder(existing))) {
      throw { status: 403, message: '行权限限制，无权提交此订单' };
    }

    const currentStatus = this.normalizeOrderStatus(existing.status);
    if (currentStatus !== 'DRAFT') {
      throw { status: 400, message: `当前状态 ${currentStatus} 不允许提交审批` };
    }

    const approval = JSON.stringify({ salesApproved: false, businessApproved: false, financeApproved: false });
    const currentUserName = getUserName(db, currentUser.userId);

    this.orderRepository.transaction(() => {
      this.orderRepository.update(id, {
        status: 'PENDING_APPROVAL',
        approval,
      });

      this.orderRepository.insertAuditLog({
        userId: currentUser.userId,
        userName: currentUserName,
        action: 'SUBMIT',
        resource: 'Order',
        resourceId: id,
        detail: `提交订单 ${id} 至审批`,
      });

      notifyOrderStatusChange(db, {
        orderId: id,
        customerName: existing.customer_name,
        salesRepId: existing.sales_rep_id,
        oldStatus: currentStatus,
        newStatus: 'PENDING_APPROVAL',
      });
    });

    const updated = this.orderRepository.findById(id);
    return updated ? this.toOrder(updated) : null;
  }

  /**
   * 删除订单
   */
  public async deleteOrder(id: string, currentUser: JwtPayload) {
    const db = this.orderRepository['db'];
    const existing = this.orderRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: '订单不存在' };
    }

    if (!checkRowPermissionForSingle(db, currentUser, 'Order', this.toOrder(existing))) {
      throw { status: 403, message: '行权限限制，无权删除此订单' };
    }

    const isAdmin = currentUser.roles.includes('Admin');
    const isOwner = existing.sales_rep_id === currentUser.userId;
    if (!isAdmin && !isOwner) {
      throw { status: 403, message: '只有管理员或订单归属销售可以删除订单' };
    }

    if (!['DRAFT', 'CANCELLED'].includes(existing.status) && !isAdmin) {
      throw { status: 400, message: '只有草稿或已取消的订单可以被删除' };
    }

    const currentUserName = getUserName(db, currentUser.userId);

    this.orderRepository.transaction(() => {
      this.orderRepository.delete(id);
      this.orderRepository.insertAuditLog({
        userId: currentUser.userId,
        userName: currentUserName,
        action: 'DELETE',
        resource: 'Order',
        resourceId: id,
        detail: `删除订单 ${id}`,
      });
    });

    return true;
  }

  /**
   * 获取订单审计日志列表
   */
  public async getOrderAuditLogs(id: string, currentUser: JwtPayload) {
    const db = this.orderRepository['db'];
    const existing = this.orderRepository.findById(id);
    if (!existing) {
      throw { status: 404, message: '订单不存在' };
    }

    if (!checkRowPermissionForSingle(db, currentUser, 'Order', this.toOrder(existing))) {
      throw { status: 403, message: '行权限限制，无权查看此订单日志' };
    }

    const logs = this.orderRepository.getAuditLogs(id);
    return logs.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      action: r.action,
      detail: r.detail,
      createdAt: r.created_at,
    }));
  }

  /**
   * 获取下级单位扁平数据列表，配合行级权限及关键字过滤，做内存级/真物理双模真分页
   */
  public async getSubUnitsFlatList(query: Record<string, string>, currentUser: JwtPayload) {
    const { keyword, page = '1', size = '50' } = query;

    const rowPerm = buildRowPermissionWhere(this.orderRepository['db'], currentUser, 'Order');
    const whereSql = ' WHERE 1=1' + rowPerm.sql;
    const whereParams = rowPerm.params;

    const rawRows = this.orderRepository.findManySubUnits(whereSql, whereParams);

    const results: any[] = [];
    for (const row of rawRows) {
      const rawItems = safeJsonParse<OrderItem[]>(row.items, []);
      const items = sanitizeOrderItemsSubUnits(rawItems, row.buyer_type) as OrderItem[];

      for (const item of items) {
        if (!item.subUnits || item.subUnits.length === 0) continue;
        for (const su of item.subUnits) {
          if (keyword) {
            const kw = keyword.toLowerCase();
            if (!(su.unitName || '').toLowerCase().includes(kw) &&
                !(su.enterpriseId || '').toLowerCase().includes(kw) &&
                !(su.enterpriseName || '').toLowerCase().includes(kw)) {
              continue;
            }
          }
          results.push({
            orderId: row.id,
            customerName: row.customer_name,
            productName: item.productName || '',
            quantity: item.quantity,
            salesRepName: row.sales_rep_name,
            orderDate: row.date,
            orderStatus: this.normalizeOrderStatus(row.status),
            ...su,
          });
        }
      }
    }

    const total = results.length;
    const { limit, offset, pageNum } = safePagination(page, size);
    const data = results.slice(offset, offset + limit);

    return {
      data,
      total,
      page: pageNum,
      size: limit,
    };
  }
}
