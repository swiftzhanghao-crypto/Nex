import type {
    PermissionResource, PermissionDimension,
    RowPermissionRule, RoleDefinition,
    User, Department, Order, Customer, Product,
} from '../types';

function getDescendantDeptIds(departments: Department[], deptId: string): string[] {
    const result = new Set<string>([deptId]);
    const queue: string[] = [deptId];
    while (queue.length > 0) {
        const curr = queue.shift()!;
        for (const d of departments) {
            if (d.parentId === curr && !result.has(d.id)) {
                result.add(d.id);
                queue.push(d.id);
            }
        }
    }
    return Array.from(result);
}

function getUserDeptId(users: User[], userId: string | undefined): string | undefined {
    if (!userId) return undefined;
    return users.find(u => u.id === userId)?.departmentId;
}

function evaluatePersonDimension(
    vals: string[],
    targetUserId: string | undefined,
    currentUser: User,
    deptAndChildrenIds: string[],
    users: User[],
): boolean {
    return vals.some(v => {
        if (v === 'self') return targetUserId === currentUser.id;
        const targetDeptId = getUserDeptId(users, targetUserId);
        if (v === 'department') return !!currentUser.departmentId && targetDeptId === currentUser.departmentId;
        if (v === 'departmentAndChildren') return !!targetDeptId && deptAndChildrenIds.includes(targetDeptId);
        if (v === '__self_dept__') return !!currentUser.departmentId && targetDeptId === currentUser.departmentId;
        if (v === '__self_dept_children__') return !!targetDeptId && deptAndChildrenIds.includes(targetDeptId);
        return false;
    });
}

function evaluateOrderRule(
    rule: RowPermissionRule,
    order: Order,
    currentUser: User,
    deptAndChildrenIds: string[],
    users: User[],
): boolean {
    const vals = rule.values;
    if (!vals || vals.length === 0) return true;

    switch (rule.dimension) {
        case 'salesRep':
            return evaluatePersonDimension(vals, order.salesRepId, currentUser, deptAndChildrenIds, users);
        case 'businessManager':
            return evaluatePersonDimension(vals, order.businessManagerId, currentUser, deptAndChildrenIds, users);
        case 'creator':
            return evaluatePersonDimension(vals, order.creatorId, currentUser, deptAndChildrenIds, users);
        case 'departmentId': {
            const salesDeptId = getUserDeptId(users, order.salesRepId);
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
            return !!(order as any).industryLine && vals.includes((order as any).industryLine);
        case 'province':
            return !!(order as any).province && vals.includes((order as any).province);
        case 'directChannelId':
        case 'channelId': {
            const directChannelId = order.buyerType === 'Channel' ? order.buyerId : undefined;
            return !!directChannelId && vals.includes(directChannelId);
        }
        default:
            return true;
    }
}

function evaluateCustomerRule(
    rule: RowPermissionRule,
    customer: Customer,
    currentUser: User,
    deptAndChildrenIds: string[],
    users: User[],
): boolean {
    const vals = rule.values;
    if (!vals || vals.length === 0) return true;

    switch (rule.dimension) {
        case 'departmentId': {
            const ownerDeptId = getUserDeptId(users, customer.ownerId);
            return !!ownerDeptId && vals.includes(ownerDeptId);
        }
        case 'industryLine':
            return !!(customer.industryLine || customer.industry) && vals.includes(customer.industryLine || customer.industry || '');
        case 'province':
            return !!(customer.province || customer.region) && vals.includes(customer.province || customer.region || '');
        case 'directChannelId':
            return !!(customer as any).channelId && vals.includes((customer as any).channelId);
        case 'salesRep':
            return evaluatePersonDimension(vals, customer.ownerId, currentUser, deptAndChildrenIds, users);
        default:
            return true;
    }
}

function evaluateProductRule(
    rule: RowPermissionRule,
    product: Product,
    _currentUser: User,
    _deptAndChildrenIds: string[],
    _users: User[],
): boolean {
    const vals = rule.values;
    if (!vals || vals.length === 0) return true;

    switch (rule.dimension) {
        case 'departmentId':
            return true;
        case 'industryLine':
            return true;
        case 'province':
            return true;
        case 'directChannelId':
            return true;
        default:
            return true;
    }
}

export function getRowRulesForResource(
    role: RoleDefinition | undefined,
    resource: PermissionResource,
): RowPermissionRule[] {
    if (!role) return [];
    if ((role.baseRowPermission || 'all') === 'all') {
        const hasRules = (role.rowPermissions || []).some(r => r.resource === resource && r.values.length > 0);
        if (!hasRules) return [];
    }
    return (role.rowPermissions || []).filter(r => r.resource === resource && r.values.length > 0);
}

export function filterOrdersByRowPermissions(
    orders: Order[],
    role: RoleDefinition | undefined,
    currentUser: User,
    users: User[],
    departments: Department[],
): Order[] {
    const rules = getRowRulesForResource(role, 'Order');
    if (rules.length === 0) return orders;

    const deptAndChildrenIds = currentUser.departmentId
        ? getDescendantDeptIds(departments, currentUser.departmentId)
        : [];

    return orders.filter(order =>
        rules.every(rule => evaluateOrderRule(rule, order, currentUser, deptAndChildrenIds, users))
    );
}

export function filterCustomersByRowPermissions(
    customers: Customer[],
    role: RoleDefinition | undefined,
    currentUser: User,
    users: User[],
    departments: Department[],
): Customer[] {
    const rules = getRowRulesForResource(role, 'Customer');
    if (rules.length === 0) return customers;

    const deptAndChildrenIds = currentUser.departmentId
        ? getDescendantDeptIds(departments, currentUser.departmentId)
        : [];

    return customers.filter(customer =>
        rules.every(rule => evaluateCustomerRule(rule, customer, currentUser, deptAndChildrenIds, users))
    );
}

export function filterProductsByRowPermissions(
    products: Product[],
    role: RoleDefinition | undefined,
    currentUser: User,
    users: User[],
    departments: Department[],
): Product[] {
    const rules = getRowRulesForResource(role, 'Product');
    if (rules.length === 0) return products;

    const deptAndChildrenIds = currentUser.departmentId
        ? getDescendantDeptIds(departments, currentUser.departmentId)
        : [];

    return products.filter(product =>
        rules.every(rule => evaluateProductRule(rule, product, currentUser, deptAndChildrenIds, users))
    );
}

// ─── 多角色合并版本：行可见 = 用户任一角色允许可见（取并集）────────────────
//
// 设计说明：
// 单角色内部多条规则之间是「AND」（逐条筛选收窄）；
// 不同角色之间是「OR」（任一角色放行即可见），与功能权限并集口径一致。
// 任意一个角色没有针对该资源配置规则（即 baseRowPermission='all' 且无规则），表示该角色可见全部，整体直接返回原数据。
export function filterOrdersByRowPermissionsMulti(
    orders: Order[],
    roles: RoleDefinition[],
    currentUser: User,
    users: User[],
    departments: Department[],
): Order[] {
    if (roles.length === 0) return orders;
    const perRoleRules = roles.map(r => getRowRulesForResource(r, 'Order'));
    if (perRoleRules.some(rules => rules.length === 0)) return orders;

    const deptAndChildrenIds = currentUser.departmentId
        ? getDescendantDeptIds(departments, currentUser.departmentId)
        : [];

    return orders.filter(order =>
        perRoleRules.some(rules =>
            rules.every(rule => evaluateOrderRule(rule, order, currentUser, deptAndChildrenIds, users))
        )
    );
}

export function filterCustomersByRowPermissionsMulti(
    customers: Customer[],
    roles: RoleDefinition[],
    currentUser: User,
    users: User[],
    departments: Department[],
): Customer[] {
    if (roles.length === 0) return customers;
    const perRoleRules = roles.map(r => getRowRulesForResource(r, 'Customer'));
    if (perRoleRules.some(rules => rules.length === 0)) return customers;

    const deptAndChildrenIds = currentUser.departmentId
        ? getDescendantDeptIds(departments, currentUser.departmentId)
        : [];

    return customers.filter(customer =>
        perRoleRules.some(rules =>
            rules.every(rule => evaluateCustomerRule(rule, customer, currentUser, deptAndChildrenIds, users))
        )
    );
}

export function filterProductsByRowPermissionsMulti(
    products: Product[],
    roles: RoleDefinition[],
    currentUser: User,
    users: User[],
    departments: Department[],
): Product[] {
    if (roles.length === 0) return products;
    const perRoleRules = roles.map(r => getRowRulesForResource(r, 'Product'));
    if (perRoleRules.some(rules => rules.length === 0)) return products;

    const deptAndChildrenIds = currentUser.departmentId
        ? getDescendantDeptIds(departments, currentUser.departmentId)
        : [];

    return products.filter(product =>
        perRoleRules.some(rules =>
            rules.every(rule => evaluateProductRule(rule, product, currentUser, deptAndChildrenIds, users))
        )
    );
}
