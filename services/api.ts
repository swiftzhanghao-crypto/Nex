import type { User, RoleDefinition, Department, Space, SpaceRole, SpaceMember } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let _token: string | null = localStorage.getItem('auth_token');

export function setToken(token: string | null) {
  _token = token;
  if (token) localStorage.setItem('auth_token', token);
  else localStorage.removeItem('auth_token');
}

export function getToken() { return _token; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new Error('认证已过期，请重新登录');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `请求失败 (${res.status})`);
  }
  // 204 / 空 body
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ============================================================================
// 分页通用类型 / 工具
// ============================================================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
}

/** 把 page/size 等参数序列化为 query string，过滤掉 undefined/空 */
function buildQuery(params?: Record<string, string | number | boolean | null | undefined>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>('/auth/me'),
};

// ---- Users ----
export interface UserListParams extends PaginationParams {
  search?: string;
  role?: string;
  status?: string;
  departmentId?: string;
}

export type UserUpdatePayload = Partial<Pick<User, 'name' | 'email' | 'phone' | 'roles' | 'userType' | 'status' | 'departmentId'>>;
export type RoleCreatePayload = Partial<Omit<RoleDefinition, 'id' | 'isSystem'>>;
export type RoleUpdatePayload = Partial<Omit<RoleDefinition, 'id' | 'isSystem'>>;

export const userApi = {
  list: (params?: UserListParams) =>
    request<PaginatedResult<User>>(`/users${buildQuery(params as Record<string, string | number | boolean | null | undefined>)}`),
  get: (id: string) => request<User>(`/users/${id}`),
  update: (id: string, data: UserUpdatePayload) =>
    request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  departments: () => request<Department[]>('/users/meta/departments'),
  roles: () => request<RoleDefinition[]>('/users/meta/roles'),
  createPlatformRole: (data: RoleCreatePayload) =>
    request<RoleDefinition>('/users/meta/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id: string, data: RoleUpdatePayload) =>
    request<RoleDefinition>(`/users/meta/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  copyRole: (id: string, name?: string) =>
    request<RoleDefinition>(`/users/meta/roles/${id}/copy`, { method: 'POST', body: JSON.stringify({ name }) }),
  deleteRole: (id: string) =>
    request<void>(`/users/meta/roles/${id}`, { method: 'DELETE' }),
  reorderRoles: (orderedIds: string[]) =>
    request<{ ok: true }>('/users/meta/roles-order', { method: 'PUT', body: JSON.stringify({ orderedIds }) }),
  reorderUsers: (orderedIds: string[]) =>
    request<{ ok: true }>('/users/order', { method: 'PUT', body: JSON.stringify({ orderedIds }) }),
};

// ---- Orders ----
export interface OrderListParams extends PaginationParams {
  status?: string;
  customerId?: string;
  source?: string;
  keyword?: string;
}

export const orderApi = {
  list: (params?: OrderListParams) =>
    request<PaginatedResult<any>>(`/orders${buildQuery(params as any)}`),
  get: (id: string) => request<any>(`/orders/${id}`),
  create: (data: any) => request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
  logs: (id: string) => request<any[]>(`/orders/${id}/logs`),
  subUnitList: (params?: { keyword?: string; page?: number; size?: number }) =>
    request<PaginatedResult<any>>(`/orders/sub-units/list${buildQuery(params as any)}`),
};

// ---- Customers ----
export interface CustomerListParams extends PaginationParams {
  type?: string;
  level?: string;
  status?: string;
  industry?: string;
  region?: string;
  search?: string;
}

export const customerApi = {
  list: (params?: CustomerListParams) =>
    request<PaginatedResult<any>>(`/customers${buildQuery(params as any)}`),
  get: (id: string) => request<any>(`/customers/${id}`),
  create: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/customers/${id}`, { method: 'DELETE' }),
};

// ---- Products ----
export interface ProductListParams extends PaginationParams {
  category?: string;
  status?: string;
  search?: string;
}

export const productApi = {
  list: (params?: ProductListParams) =>
    request<PaginatedResult<any>>(`/products${buildQuery(params as any)}`),
  get: (id: string) => request<any>(`/products/${id}`),
  create: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  channels: () => request<any[]>('/products/meta/channels'),
  opportunities: () => request<any[]>('/products/meta/opportunities'),
};

// ---- Opportunities ----
export interface OpportunityListParams extends PaginationParams {
  customerId?: string;
  stage?: string;
  ownerId?: string;
  search?: string;
}

export const opportunityApi = {
  list: (params?: OpportunityListParams) =>
    request<PaginatedResult<any>>(`/opportunities${buildQuery(params as any)}`),
  get: (id: string) => request<any>(`/opportunities/${id}`),
  create: (data: any) => request<any>('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/opportunities/${id}`, { method: 'DELETE' }),
};

// ---- Finance ----
export interface AuditLogListParams extends PaginationParams {
  resource?: string;
  resourceId?: string;
  userId?: string;
  action?: string;
}

export const financeApi = {
  contracts: (params?: PaginationParams & Record<string, any>) =>
    request<PaginatedResult<any>>(`/finance/contracts${buildQuery(params as any)}`),
  remittances: (params?: PaginationParams & Record<string, any>) =>
    request<PaginatedResult<any>>(`/finance/remittances${buildQuery(params as any)}`),
  invoices: (params?: PaginationParams & Record<string, any>) =>
    request<PaginatedResult<any>>(`/finance/invoices${buildQuery(params as any)}`),
  performances: (params?: PaginationParams & Record<string, any>) =>
    request<PaginatedResult<any>>(`/finance/performances${buildQuery(params as any)}`),
  authorizations: (params?: PaginationParams & Record<string, any>) =>
    request<PaginatedResult<any>>(`/finance/authorizations${buildQuery(params as any)}`),
  deliveryInfos: (params?: PaginationParams & Record<string, any>) =>
    request<PaginatedResult<any>>(`/finance/delivery-infos${buildQuery(params as any)}`),
  auditLogs: (params?: AuditLogListParams) =>
    request<PaginatedResult<any>>(`/finance/audit-logs${buildQuery(params as any)}`),
};

// ---- Spaces ----
export type SpaceCreatePayload = Partial<Omit<Space, 'id'>> & { adminUserId?: string };
export type SpaceUpdatePayload = Partial<Omit<Space, 'id'>>;
export type SpaceRoleCreatePayload = Partial<Omit<SpaceRole, 'id' | 'spaceId'>>;
export type SpaceRoleUpdatePayload = Partial<Omit<SpaceRole, 'id' | 'spaceId'>>;

export const spaceApi = {
  list: () => request<Space[]>('/spaces'),
  get: (id: string) => request<Space>(`/spaces/${id}`),
  create: (data: SpaceCreatePayload) =>
    request<Space>('/spaces', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: SpaceUpdatePayload) =>
    request<Space>(`/spaces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/spaces/${id}`, { method: 'DELETE' }),

  listRoles: (spaceId: string) => request<SpaceRole[]>(`/spaces/${spaceId}/roles`),
  createRole: (spaceId: string, data: SpaceRoleCreatePayload) =>
    request<SpaceRole>(`/spaces/${spaceId}/roles`, { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (spaceId: string, roleId: string, data: SpaceRoleUpdatePayload) =>
    request<SpaceRole>(`/spaces/${spaceId}/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRole: (spaceId: string, roleId: string) =>
    request<void>(`/spaces/${spaceId}/roles/${roleId}`, { method: 'DELETE' }),

  listMembers: (spaceId: string) => request<SpaceMember[]>(`/spaces/${spaceId}/members`),
  addMember: (spaceId: string, data: { userId: string; roleId: string; isAdmin?: boolean }) =>
    request<SpaceMember>(`/spaces/${spaceId}/members`, { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (spaceId: string, memberId: string, data: { roleId?: string; isAdmin?: boolean }) =>
    request<SpaceMember>(`/spaces/${spaceId}/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeMember: (spaceId: string, memberId: string) =>
    request<void>(`/spaces/${spaceId}/members/${memberId}`, { method: 'DELETE' }),
};

// ---- Health check ----
export const healthCheck = () => request<{ status: string; time: string }>('/health');
