import { describe, it, expect } from 'vitest';
import {
  getRowRulesForResource,
  filterOrdersByRowPermissions,
  filterCustomersByRowPermissions,
  filterOrdersByRowPermissionsMulti,
} from '../../utils/rowPermissionFilter';
import { OrderStatus, type Order, Customer, User, Department, RoleDefinition } from '../../types';

const departments: Department[] = [
  { id: 'd1', name: '销售一部' },
  { id: 'd2', name: '销售二部', parentId: 'd1' },
];

const users: User[] = [
  {
    id: 'u1',
    accountId: '10000001',
    name: '张三',
    email: 'a@test.com',
    roles: ['Sales'],
    userType: 'Internal',
    status: 'Active',
    departmentId: 'd1',
  },
  {
    id: 'u2',
    accountId: '10000002',
    name: '李四',
    email: 'b@test.com',
    roles: ['Sales'],
    userType: 'Internal',
    status: 'Active',
    departmentId: 'd2',
  },
];

const currentUser = users[0];

const salesRole: RoleDefinition = {
  id: 'r-sales',
  name: '销售',
  description: '销售角色',
  permissions: [],
  baseRowPermission: 'custom',
  rowPermissions: [
    { id: 'rr1', resource: 'Order', dimension: 'salesRep', operator: 'equals', values: ['self'] },
    { id: 'rr2', resource: 'Customer', dimension: 'salesRep', operator: 'equals', values: ['self'] },
  ],
};

const adminRole: RoleDefinition = {
  id: 'r-admin',
  name: '管理员',
  description: '管理员',
  permissions: [],
  baseRowPermission: 'all',
  rowPermissions: [],
};

const orders: Order[] = [
  {
    id: 'o1',
    customerId: 'c1',
    customerName: '客户A',
    date: '2026-01-01',
    status: OrderStatus.DRAFT,
    total: 1000,
    items: [],
    source: 'Sales',
    buyerType: 'Customer',
    isPaid: false,
    approval: { salesApproved: false, businessApproved: false, financeApproved: false },
    approvalRecords: [],
    salesRepId: 'u1',
    creatorId: 'u1',
  },
  {
    id: 'o2',
    customerId: 'c2',
    customerName: '客户B',
    date: '2026-01-02',
    status: OrderStatus.DRAFT,
    total: 2000,
    items: [],
    source: 'Sales',
    buyerType: 'Customer',
    isPaid: false,
    approval: { salesApproved: false, businessApproved: false, financeApproved: false },
    approvalRecords: [],
    salesRepId: 'u2',
    creatorId: 'u2',
  },
];

const customers: Customer[] = [
  {
    id: 'c1',
    companyName: '客户A',
    industry: 'IT',
    customerType: 'Enterprise',
    level: 'A',
    region: '华东',
    address: '上海',
    shippingAddress: '上海',
    status: 'Active',
    contacts: [],
    ownerId: 'u1',
  },
  {
    id: 'c2',
    companyName: '客户B',
    industry: 'IT',
    customerType: 'Enterprise',
    level: 'B',
    region: '华北',
    address: '北京',
    shippingAddress: '北京',
    status: 'Active',
    contacts: [],
    ownerId: 'u2',
  },
];

describe('rowPermissionFilter', () => {
  it('getRowRulesForResource returns rules for resource', () => {
    const rules = getRowRulesForResource(salesRole, 'Order');
    expect(rules).toHaveLength(1);
    expect(rules[0].dimension).toBe('salesRep');
  });

  it('filterOrdersByRowPermissions keeps only self orders', () => {
    const filtered = filterOrdersByRowPermissions(orders, salesRole, currentUser, users, departments);
    expect(filtered.map((o) => o.id)).toEqual(['o1']);
  });

  it('filterCustomersByRowPermissions keeps only owned customers', () => {
    const filtered = filterCustomersByRowPermissions(customers, salesRole, currentUser, users, departments);
    expect(filtered.map((c) => c.id)).toEqual(['c1']);
  });

  it('filterOrdersByRowPermissionsMulti returns all when any role has no rules', () => {
    const filtered = filterOrdersByRowPermissionsMulti(orders, [salesRole, adminRole], currentUser, users, departments);
    expect(filtered).toHaveLength(2);
  });

  it('filterOrdersByRowPermissions returns all when no rules', () => {
    const filtered = filterOrdersByRowPermissions(orders, adminRole, currentUser, users, departments);
    expect(filtered).toHaveLength(2);
  });
});
