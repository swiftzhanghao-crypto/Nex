import type {
  User, RoleDefinition, Department, Space, SpaceRole, SpaceMember,
  Order, Customer, Product, Channel, Opportunity,
  Contract, Remittance, Invoice, Performance, Authorization, DeliveryInfo,
  AuthTypeData, SalesOrg,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let _token: string | null = localStorage.getItem('auth_token');

export function setToken(token: string | null) {
  _token = token;
  if (token) localStorage.setItem('auth_token', token);
  else localStorage.removeItem('auth_token');
}

export function getToken() { return _token; }

interface RequestOptions extends RequestInit {
  /** When true, suppress the global error toast on failure */
  silent?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { silent, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers, credentials: 'include' });

  if (res.status === 401) {
    setToken(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new Error('认证已过期，请重新登录');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body.error || `请求失败 (${res.status})`;
    if (!silent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:error', { detail: msg }));
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

/** Same as request but never fires the global error toast */
function silentRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, { ...options, silent: true });
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

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function buildQuery(params?: QueryParams): string {
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
  logout: () => request<{ code: number; msg: string }>('/auth/logout', { method: 'POST' }),
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
    request<PaginatedResult<User>>(`/users${buildQuery(params as QueryParams)}`),
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
    request<PaginatedResult<Order>>(`/orders${buildQuery(params as QueryParams)}`),
  get: (id: string) => request<Order>(`/orders/${id}`),
  create: (data: Partial<Order>) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Order>) => request<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
  logs: (id: string) => request<{ id: number; action: string; detail: string; createdAt: string }[]>(`/orders/${id}/logs`),
  subUnitList: (params?: { keyword?: string; page?: number; size?: number }) =>
    request<PaginatedResult<Record<string, unknown>>>(`/orders/sub-units/list${buildQuery(params as QueryParams)}`),
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
    request<PaginatedResult<Customer>>(`/customers${buildQuery(params as QueryParams)}`),
  get: (id: string) => request<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) => request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Customer>) => request<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
    request<PaginatedResult<Product>>(`/products${buildQuery(params as QueryParams)}`),
  get: (id: string) => request<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  channels: () => request<Channel[]>('/products/meta/channels'),
  opportunities: () => request<Opportunity[]>('/products/meta/opportunities'),
};

// ---- Channels ----
export interface ChannelListParams extends PaginationParams {
  search?: string;
  type?: string;
  level?: string;
  status?: string;
}

export const channelApi = {
  list: (params?: ChannelListParams) =>
    request<PaginatedResult<Channel>>(`/channels${buildQuery(params as QueryParams)}`),
  get: (id: string) => request<Channel>(`/channels/${id}`),
  create: (data: Partial<Channel>) => request<Channel>('/channels', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Channel>) => request<Channel>(`/channels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/channels/${id}`, { method: 'DELETE' }),
  users: (channelId: string) => request<User[]>(`/channels/${channelId}/users`),
};

// ---- 销售易 CRM ----
export interface CrmXsyStatus {
  enabled: boolean;
  bound: boolean;
}

export const crmXsyApi = {
  status: () => request<CrmXsyStatus>('/crm/xsy/status'),
  syncCustomers: () =>
    request<{ synced: number; total: number }>('/crm/xsy/sync-customers', { method: 'POST' }),
};

export function buildCrmXsyOAuthLoginUrl(redirectPath = '/customers'): string {
  const token = getToken();
  if (!token) return '';
  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
  const p = '/crm/xsy/login';
  const safeRedirect = redirectPath.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : '/customers';
  const qs = new URLSearchParams({ token, redirect: safeRedirect }).toString();
  if (typeof window === 'undefined') return '';
  if (apiBase.startsWith('http')) {
    return `${apiBase}${p}?${qs}`;
  }
  return `${window.location.origin}${apiBase}${p}?${qs}`;
}

// ---- Opportunities ----
export interface OpportunityListParams extends PaginationParams {
  customerId?: string;
  stage?: string;
  ownerId?: string;
  search?: string;
}

export const opportunityApi = {
  list: (params?: OpportunityListParams) =>
    request<PaginatedResult<Opportunity>>(`/opportunities${buildQuery(params as QueryParams)}`),
  get: (id: string) => request<Opportunity>(`/opportunities/${id}`),
  create: (data: Partial<Opportunity>) => request<Opportunity>('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Opportunity>) => request<Opportunity>(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/opportunities/${id}`, { method: 'DELETE' }),
};

// ---- Finance ----
export interface AuditLogListParams extends PaginationParams {
  resource?: string;
  resourceId?: string;
  userId?: string;
  action?: string;
}

export interface FinanceListParams extends PaginationParams {
  [key: string]: string | number | boolean | null | undefined;
}

function financeList<T>(resource: string) {
  return (params?: FinanceListParams) =>
    request<PaginatedResult<T>>(`/finance/${resource}${buildQuery(params as QueryParams)}`);
}

export const financeApi = {
  contracts: financeList<Contract>('contracts'),
  remittances: financeList<Remittance>('remittances'),
  invoices: financeList<Invoice>('invoices'),
  performances: financeList<Performance>('performances'),
  authorizations: financeList<Authorization>('authorizations'),
  deliveryInfos: financeList<DeliveryInfo>('delivery-infos'),
  auditLogs: financeList<{ id: number; userId: string; userName: string; action: string; resource: string; resourceId: string; detail: string; createdAt: string }>('audit-logs'),
};

// ---- Spaces ----
export type SpaceCreatePayload = Partial<Omit<Space, 'id'>> & { adminUserId?: string };
export type SpaceUpdatePayload = Partial<Omit<Space, 'id'>>;
export type SpaceRoleCreatePayload = Partial<Omit<SpaceRole, 'id' | 'spaceId'>>;
export type SpaceRoleUpdatePayload = Partial<Omit<SpaceRole, 'id' | 'spaceId'>>;

export const spaceApi = {
  list: (opts?: { silent?: boolean }) => opts?.silent ? silentRequest<Space[]>('/spaces') : request<Space[]>('/spaces'),
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

// ---- Audit Logs ----
export interface AuditLogListParams extends PaginationParams {
  resource?: string;
  action?: string;
  userId?: string;
}

export interface AuditLogEntry {
  id: number;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  detail: string | null;
  createdAt: string;
}

export const auditApi = {
  list: (params?: AuditLogListParams) =>
    request<PaginatedResult<AuditLogEntry>>(`/audit${buildQuery(params as QueryParams)}`),
};

// ---- Notifications ----
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export const notificationApi = {
  list: (opts?: { silent?: boolean }) => opts?.silent
    ? silentRequest<{ data: Notification[]; unreadCount: number }>('/notifications')
    : request<{ data: Notification[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) =>
    request<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () =>
    request<{ ok: boolean }>(`/notifications/read-all`, { method: 'PUT' }),
};

// ---- Import ----
export const importApi = {
  customers: (items: Record<string, unknown>[]) =>
    request<{ imported: number; ids: string[] }>('/import/customers', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  products: (items: Record<string, unknown>[]) =>
    request<{ imported: number; ids: string[] }>('/import/products', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};

// ---- Health check ----
export const healthCheck = () => request<{ status: string; time: string }>('/health');

// ---- System: 授权类型 & 销售组织 ----
export const systemApi = {
  listAuthTypes: (opts?: { silent?: boolean }) => opts?.silent ? silentRequest<AuthTypeData[]>('/system/auth-types') : request<AuthTypeData[]>('/system/auth-types'),
  getAuthType: (id: string) => request<AuthTypeData>(`/system/auth-types/${id}`),
  createAuthType: (data: AuthTypeData) =>
    request<AuthTypeData>('/system/auth-types', { method: 'POST', body: JSON.stringify(data) }),
  updateAuthType: (id: string, data: Partial<AuthTypeData>) =>
    request<AuthTypeData>(`/system/auth-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAuthType: (id: string) =>
    request<{ ok: boolean }>(`/system/auth-types/${id}`, { method: 'DELETE' }),

  listSalesOrgs: (params?: { orgType?: string; status?: string; search?: string; silent?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.orgType) q.set('orgType', params.orgType);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return params?.silent
      ? silentRequest<SalesOrg[]>(`/system/sales-orgs${qs ? `?${qs}` : ''}`)
      : request<SalesOrg[]>(`/system/sales-orgs${qs ? `?${qs}` : ''}`);
  },
  getSalesOrg: (id: string) => request<SalesOrg>(`/system/sales-orgs/${id}`),
  createSalesOrg: (data: SalesOrg) =>
    request<SalesOrg>('/system/sales-orgs', { method: 'POST', body: JSON.stringify(data) }),
  updateSalesOrg: (id: string, data: Partial<SalesOrg>) =>
    request<SalesOrg>(`/system/sales-orgs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSalesOrg: (id: string) =>
    request<{ ok: boolean }>(`/system/sales-orgs/${id}`, { method: 'DELETE' }),
};
