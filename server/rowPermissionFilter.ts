type RowRule = {
  resource?: string;
  dimension?: string;
  values?: string[];
};

type PermissionResource = 'Order' | 'Customer' | 'Product';

function safeJsonParse(str: string | null | undefined, fallback: any = {}) {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

export function getRowRules(db: any, roleId: string | string[], resource: PermissionResource): RowRule[] {
  const ids = Array.isArray(roleId) ? roleId : [roleId];
  const allRules: RowRule[] = [];
  for (const id of ids) {
    const role = db.prepare('SELECT row_permissions FROM roles WHERE id = ?').get(id) as any;
    const rules = safeJsonParse(role?.row_permissions, []);
    if (!Array.isArray(rules)) continue;
    allRules.push(...rules.filter((r: RowRule) => r?.resource === resource && Array.isArray(r.values) && r.values.length > 0));
  }
  return allRules;
}

export function getDescendantDeptIds(db: any, deptId: string): string[] {
  const rows = db.prepare('SELECT id, parent_id FROM departments').all() as Array<{ id: string; parent_id: string | null }>;
  const childrenMap = new Map<string, string[]>();
  rows.forEach((row) => {
    const pid = row.parent_id || '__root__';
    const arr = childrenMap.get(pid) || [];
    arr.push(row.id);
    childrenMap.set(pid, arr);
  });

  const result = new Set<string>([deptId]);
  const queue: string[] = [deptId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const children = childrenMap.get(curr) || [];
    for (const child of children) {
      if (!result.has(child)) {
        result.add(child);
        queue.push(child);
      }
    }
  }
  return Array.from(result);
}

export function buildUserDeptMap(db: any): Map<string, string | null> {
  const userRows = db.prepare('SELECT id, department_id FROM users').all() as Array<{ id: string; department_id: string | null }>;
  const map = new Map<string, string | null>();
  userRows.forEach((u) => map.set(u.id, u.department_id || null));
  return map;
}

function evaluatePersonDimension(
  vals: string[],
  targetUserId: string | undefined | null,
  currentUserId: string,
  currentUserDeptId: string | null,
  deptAndChildrenIds: string[],
  userDeptMap: Map<string, string | null>,
): boolean {
  return vals.some(v => {
    if (v === 'self') return targetUserId === currentUserId;
    const targetDeptId = targetUserId ? userDeptMap.get(targetUserId) || null : null;
    if (v === 'department') return !!currentUserDeptId && targetDeptId === currentUserDeptId;
    if (v === 'departmentAndChildren') return !!currentUserDeptId && !!targetDeptId && deptAndChildrenIds.includes(targetDeptId);
    return false;
  });
}

function evaluateOrderRowRule(
  rule: RowRule,
  order: any,
  currentUserId: string,
  currentUserDeptId: string | null,
  deptAndChildrenIds: string[],
  userDeptMap: Map<string, string | null>,
): boolean {
  const vals = rule.values || [];
  if (vals.length === 0) return true;

  switch (rule.dimension) {
    case 'salesRep':
      return evaluatePersonDimension(vals, order.salesRepId, currentUserId, currentUserDeptId, deptAndChildrenIds, userDeptMap);
    case 'businessManager':
      return evaluatePersonDimension(vals, order.businessManagerId, currentUserId, currentUserDeptId, deptAndChildrenIds, userDeptMap);
    case 'creator':
      return evaluatePersonDimension(vals, order.creatorId, currentUserId, currentUserDeptId, deptAndChildrenIds, userDeptMap);
    case 'departmentId': {
      const salesDeptId = order.salesRepId ? userDeptMap.get(order.salesRepId) : null;
      return !!salesDeptId && vals.includes(salesDeptId);
    }
    case 'orderType':
    case 'buyerType':
      return vals.includes(order.buyerType || 'Customer');
    case 'orderSource':
      return !!order.source && vals.includes(order.source);
    case 'orderStatus':
      return !!order.status && vals.includes(order.status);
    case 'industryLine':
      return !!order.industryLine && vals.includes(order.industryLine);
    case 'province':
      return !!order.province && vals.includes(order.province);
    case 'customerIndustry':
      return !!order.customerIndustry && vals.includes(order.customerIndustry);
    case 'customerLevel':
      return !!order.customerLevel && vals.includes(order.customerLevel);
    case 'directChannelId':
    case 'channelId': {
      const directChannelId = order.buyerType === 'Channel' ? order.buyerId : undefined;
      return !!directChannelId && vals.includes(directChannelId);
    }
    default:
      return true;
  }
}

function evaluateCustomerRowRule(
  rule: RowRule,
  customer: any,
  currentUserId: string,
  currentUserDeptId: string | null,
  deptAndChildrenIds: string[],
  userDeptMap: Map<string, string | null>,
): boolean {
  const vals = rule.values || [];
  if (vals.length === 0) return true;

  switch (rule.dimension) {
    case 'salesRep':
      return evaluatePersonDimension(vals, customer.ownerId, currentUserId, currentUserDeptId, deptAndChildrenIds, userDeptMap);
    case 'departmentId': {
      const ownerDeptId = customer.ownerId ? userDeptMap.get(customer.ownerId) : null;
      return !!ownerDeptId && vals.includes(ownerDeptId);
    }
    case 'industryLine':
      return !!(customer.industryLine || customer.industry) && vals.includes(customer.industryLine || customer.industry);
    case 'province':
      return !!(customer.province || customer.region) && vals.includes(customer.province || customer.region);
    case 'directChannelId':
      return !!customer.channelId && vals.includes(customer.channelId);
    default:
      return true;
  }
}

const warnedProductDimensions = new Set<string>();

function evaluateProductRowRule(
  rule: RowRule,
  product: any,
): boolean {
  const vals = rule.values || [];
  if (vals.length === 0) return true;

  switch (rule.dimension) {
    case 'productId':
      return !!product.id && vals.includes(product.id);
    case 'category':
      return !!product.category && vals.includes(product.category);
    case 'subCategory':
      return !!product.subCategory && vals.includes(product.subCategory);
    case 'status':
      return !!product.status && vals.includes(product.status);
    case 'tag':
    case 'tags': {
      const tags: string[] = Array.isArray(product.tags) ? product.tags : [];
      return tags.some(t => vals.includes(t));
    }
    case 'departmentId':
    case 'industryLine':
    case 'directChannelId':
    case 'province': {
      const key = `Product:${rule.dimension}`;
      if (!warnedProductDimensions.has(key)) {
        warnedProductDimensions.add(key);
        console.warn(`[rowPermission] Product 资源不支持维度 "${rule.dimension}"（产品表无对应字段），规则被忽略`);
      }
      return true;
    }
    default: {
      const key = `Product:${rule.dimension || 'unknown'}`;
      if (!warnedProductDimensions.has(key)) {
        warnedProductDimensions.add(key);
        console.warn(`[rowPermission] Product 资源未识别维度 "${rule.dimension}"，规则被忽略`);
      }
      return true;
    }
  }
}

export function filterByRowPermissions(
  db: any,
  user: { userId: string; roles: string[] },
  resource: PermissionResource,
  data: any[],
): any[] {
  const safeRoles = Array.isArray(user.roles) ? user.roles : [];
  const rules = getRowRules(db, safeRoles, resource);
  if (rules.length === 0) return data;

  const userDeptMap = buildUserDeptMap(db);
  const currentUserDeptId = userDeptMap.get(user.userId) || null;
  const deptAndChildrenIds = currentUserDeptId ? getDescendantDeptIds(db, currentUserDeptId) : [];

  const evaluator = resource === 'Order'
    ? evaluateOrderRowRule
    : resource === 'Customer'
      ? evaluateCustomerRowRule
      : evaluateProductRowRule;

  if (resource === 'Product') {
    return data.filter(item => rules.every(rule => evaluateProductRowRule(rule, item)));
  }

  return data.filter(item =>
    rules.every(rule => evaluator(rule, item, user.userId, currentUserDeptId, deptAndChildrenIds, userDeptMap))
  );
}

export function checkRowPermissionForSingle(
  db: any,
  user: { userId: string; roles: string[] },
  resource: PermissionResource,
  item: any,
): boolean {
  return filterByRowPermissions(db, user, resource, [item]).length > 0;
}

// ============================================================================
// SQL 下推：把行权限规则编译为 WHERE 片段，避免内存过滤
// ============================================================================

type Ctx = {
  userId: string;
  currentUserDeptId: string | null;
  deptAndChildrenIds: string[];
};

type Clause = { sql: string; params: any[] } | null;

const warnedDims = new Set<string>();
function warnDim(resource: string, dim: string | undefined, reason: string) {
  const key = `${resource}:${dim}:${reason}`;
  if (warnedDims.has(key)) return;
  warnedDims.add(key);
  console.warn(`[rowPermission/SQL] ${resource} 维度 "${dim}" ${reason}，规则被忽略`);
}

/**
 * 构造 person 维度（self / department / departmentAndChildren）的 SQL 片段。
 *  - columnExpr: 目标用户列表达式（可以是表字段或 json_extract）
 */
function buildPersonClause(vals: string[], columnExpr: string, ctx: Ctx): Clause {
  const orParts: string[] = [];
  const params: any[] = [];
  for (const v of vals) {
    if (v === 'self') {
      orParts.push(`${columnExpr} = ?`);
      params.push(ctx.userId);
    } else if (v === 'department' && ctx.currentUserDeptId) {
      orParts.push(`${columnExpr} IN (SELECT id FROM users WHERE department_id = ?)`);
      params.push(ctx.currentUserDeptId);
    } else if (v === 'departmentAndChildren' && ctx.deptAndChildrenIds.length > 0) {
      const placeholders = ctx.deptAndChildrenIds.map(() => '?').join(',');
      orParts.push(`${columnExpr} IN (SELECT id FROM users WHERE department_id IN (${placeholders}))`);
      params.push(...ctx.deptAndChildrenIds);
    }
  }
  if (orParts.length === 0) return { sql: '1=0', params: [] };
  return { sql: `(${orParts.join(' OR ')})`, params };
}

/** 简单 IN(...) 片段 */
function buildInClause(columnExpr: string, vals: string[]): Clause {
  if (vals.length === 0) return null;
  const placeholders = vals.map(() => '?').join(',');
  return { sql: `${columnExpr} IN (${placeholders})`, params: vals };
}

function buildOrderRuleClause(rule: RowRule, ctx: Ctx): Clause {
  const vals = rule.values || [];
  if (vals.length === 0) return null;

  switch (rule.dimension) {
    case 'salesRep':
      return buildPersonClause(vals, 'sales_rep_id', ctx);
    case 'businessManager':
      return buildPersonClause(vals, 'biz_manager_id', ctx);
    case 'creator':
      // creatorId 写在 extra JSON 中
      return buildPersonClause(vals, "json_extract(extra, '$.creatorId')", ctx);
    case 'departmentId': {
      // 通过销售负责人的部门关联
      const placeholders = vals.map(() => '?').join(',');
      return {
        sql: `sales_rep_id IN (SELECT id FROM users WHERE department_id IN (${placeholders}))`,
        params: vals,
      };
    }
    case 'orderType':
    case 'buyerType':
      return buildInClause('buyer_type', vals);
    case 'orderSource':
      return buildInClause('source', vals);
    case 'orderStatus':
      return buildInClause('status', vals);
    case 'customerIndustry':
      return buildInClause('customer_industry', vals);
    case 'customerLevel':
      return buildInClause('customer_level', vals);
    case 'directChannelId':
    case 'channelId': {
      // 仅当 buyer_type='Channel' 时 buyer_id 即渠道 id
      const placeholders = vals.map(() => '?').join(',');
      return {
        sql: `(buyer_type = 'Channel' AND buyer_id IN (${placeholders}))`,
        params: vals,
      };
    }
    case 'industryLine':
      return buildInClause("json_extract(extra, '$.industryLine')", vals);
    case 'province':
      return buildInClause("json_extract(extra, '$.province')", vals);
    default:
      warnDim('Order', rule.dimension, '未识别');
      return null;
  }
}

function buildCustomerRuleClause(rule: RowRule, ctx: Ctx): Clause {
  const vals = rule.values || [];
  if (vals.length === 0) return null;

  switch (rule.dimension) {
    case 'salesRep':
      return buildPersonClause(vals, 'owner_id', ctx);
    case 'departmentId': {
      const placeholders = vals.map(() => '?').join(',');
      return {
        sql: `owner_id IN (SELECT id FROM users WHERE department_id IN (${placeholders}))`,
        params: vals,
      };
    }
    case 'industryLine':
    case 'industry':
      // Customer 表用 industry 字段；industryLine 也兼容映射到 industry
      return buildInClause('industry', vals);
    case 'province':
    case 'region':
      return buildInClause('region', vals);
    case 'directChannelId':
    case 'channelId':
      warnDim('Customer', rule.dimension, '客户表无渠道字段');
      return null;
    default:
      warnDim('Customer', rule.dimension, '未识别');
      return null;
  }
}

function buildProductRuleClause(rule: RowRule): Clause {
  const vals = rule.values || [];
  if (vals.length === 0) return null;

  switch (rule.dimension) {
    case 'productId':
      return buildInClause('id', vals);
    case 'category':
      return buildInClause('category', vals);
    case 'subCategory':
      return buildInClause('sub_category', vals);
    case 'status':
      return buildInClause('status', vals);
    case 'tag':
    case 'tags': {
      // tags 存的是 JSON 数组，使用 EXISTS + json_each 检查交集
      const placeholders = vals.map(() => '?').join(',');
      return {
        sql: `EXISTS (SELECT 1 FROM json_each(products.tags) WHERE json_each.value IN (${placeholders}))`,
        params: vals,
      };
    }
    case 'departmentId':
    case 'industryLine':
    case 'directChannelId':
    case 'province':
      warnDim('Product', rule.dimension, '产品表无对应字段');
      return null;
    default:
      warnDim('Product', rule.dimension, '未识别');
      return null;
  }
}

/**
 * 构造行权限的 SQL WHERE 片段。
 * 返回值：
 *   - { sql: '', params: [] }           没有规则或全部规则被忽略
 *   - { sql: ' AND (a) AND (b)', ... }  可拼接到主查询尾部
 *
 * 注意：调用方需要在主查询里使用资源所在的表名（如 orders、customers、products）。
 *       products 的 EXISTS 子句使用了带表名的 `products.tags`，因此调用方主表别名需保持为 products。
 */
export function buildRowPermissionWhere(
  db: any,
  user: { userId: string; roles: string[] },
  resource: PermissionResource,
): { sql: string; params: any[] } {
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const rules = getRowRules(db, roles, resource);
  if (rules.length === 0) return { sql: '', params: [] };

  const userDeptMap = buildUserDeptMap(db);
  const currentUserDeptId = userDeptMap.get(user.userId) || null;
  const deptAndChildrenIds = currentUserDeptId ? getDescendantDeptIds(db, currentUserDeptId) : [];

  const ctx: Ctx = { userId: user.userId, currentUserDeptId, deptAndChildrenIds };

  const clauses: string[] = [];
  const params: any[] = [];
  for (const rule of rules) {
    let c: Clause = null;
    if (resource === 'Order') c = buildOrderRuleClause(rule, ctx);
    else if (resource === 'Customer') c = buildCustomerRuleClause(rule, ctx);
    else if (resource === 'Product') c = buildProductRuleClause(rule);
    if (c) {
      clauses.push(c.sql);
      params.push(...c.params);
    }
    // null = 维度无法 SQL 表达 → 忽略（已 warn）
  }

  if (clauses.length === 0) return { sql: '', params: [] };
  return { sql: ' AND ' + clauses.map(c => `(${c})`).join(' AND '), params };
}
