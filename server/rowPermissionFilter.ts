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

export function getRowRules(db: any, roleId: string, resource: PermissionResource): RowRule[] {
  const role = db.prepare('SELECT row_permissions FROM roles WHERE id = ?').get(roleId) as any;
  const rules = safeJsonParse(role?.row_permissions, []);
  if (!Array.isArray(rules)) return [];
  return rules.filter((r: RowRule) => r?.resource === resource && Array.isArray(r.values) && r.values.length > 0);
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

function evaluateProductRowRule(
  rule: RowRule,
  _product: any,
): boolean {
  const vals = rule.values || [];
  if (vals.length === 0) return true;
  return true;
}

export function filterByRowPermissions(
  db: any,
  user: { userId: string; role: string },
  resource: PermissionResource,
  data: any[],
): any[] {
  const rules = getRowRules(db, user.role, resource);
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
  user: { userId: string; role: string },
  resource: PermissionResource,
  item: any,
): boolean {
  return filterByRowPermissions(db, user, resource, [item]).length > 0;
}
