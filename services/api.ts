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
    window.location.hash = '#/login';
    throw new Error('认证已过期，请重新登录');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `请求失败 (${res.status})`);
  }
  return res.json();
}

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  me: () => request<any>('/auth/me'),
};

// ---- Users ----
export const userApi = {
  list: () => request<any[]>('/users'),
  get: (id: string) => request<any>(`/users/${id}`),
  update: (id: string, data: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  departments: () => request<any[]>('/users/meta/departments'),
  roles: () => request<any[]>('/users/meta/roles'),
  updateRole: (id: string, data: any) => request<any>(`/users/meta/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ---- Orders ----
interface PaginatedResult<T> { data: T[]; total: number; page: number; size: number; }

export const orderApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResult<any>>(`/orders${qs}`);
  },
  get: (id: string) => request<any>(`/orders/${id}`),
  create: (data: any) => request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
  logs: (id: string) => request<any[]>(`/orders/${id}/logs`),
};

// ---- Customers ----
export const customerApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResult<any>>(`/customers${qs}`);
  },
  get: (id: string) => request<any>(`/customers/${id}`),
  create: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/customers/${id}`, { method: 'DELETE' }),
};

// ---- Products ----
export const productApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/products${qs}`);
  },
  get: (id: string) => request<any>(`/products/${id}`),
  update: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  channels: () => request<any[]>('/products/meta/channels'),
  opportunities: () => request<any[]>('/products/meta/opportunities'),
};

// ---- Finance ----
export const financeApi = {
  contracts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResult<any>>(`/finance/contracts${qs}`);
  },
  remittances: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResult<any>>(`/finance/remittances${qs}`);
  },
  invoices: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResult<any>>(`/finance/invoices${qs}`);
  },
  performances: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResult<any>>(`/finance/performances${qs}`);
  },
  authorizations: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResult<any>>(`/finance/authorizations${qs}`);
  },
  deliveryInfos: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResult<any>>(`/finance/delivery-infos${qs}`);
  },
};

// ---- Health check ----
export const healthCheck = () => request<{ status: string; time: string }>('/health');
