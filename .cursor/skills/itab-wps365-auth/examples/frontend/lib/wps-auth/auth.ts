export interface UserInfo {
  id: string
  user_name: string
  avatar: string
  company_id: string
  local_id: number
  expires_in: number
  must_reauth_before?: string
}

export interface RequestOptions {
  method?: string
  body?: unknown
  params?: Record<string, string | number>
}

/**
 * 由接入项目注入的 HTTP 函数。约定：
 * 1. 同源请求带 cookie（fetch: `credentials: 'include'` / axios: `withCredentials: true`）
 * 2. 4xx/5xx 必须 throw —— 任何形式的"401 自动跳登录"都不要在这里做
 * 3. 抛错时尽量是 HttpError（带 status），方便守卫区分 401（未登录）和 其他错（探测失败）
 * 4. 返回值是后端 JSON body（已解析）
 */
export type RequestFn = <T = unknown>(url: string, options?: RequestOptions) => Promise<T>

/** 带 HTTP 状态码的错误。fetchRequest 默认抛此类型；axios 适配器建议把 error.response.status 转成 HttpError。 */
export class HttpError extends Error {
  constructor(public readonly status: number, message?: string) {
    super(message ?? `HTTP ${status}`)
    this.name = 'HttpError'
  }
}

/** 类型守卫：抓到的异常是否是明确未登录（401）。守卫 ensureAuth 用得上。 */
export function isUnauthorized(err: unknown): boolean {
  if (err instanceof HttpError) return err.status === 401
  // 兼容 axios：err.response?.status === 401
  if (typeof err === 'object' && err !== null) {
    const status = (err as { status?: unknown; response?: { status?: unknown } }).status
      ?? (err as { response?: { status?: unknown } }).response?.status
    if (status === 401) return true
  }
  return false
}

interface ApiResponse<T> {
  code: number
  msg?: string
  data?: T
}

export interface AuthAPI {
  getUserInfo(refresh?: boolean): Promise<UserInfo>
  logout(): Promise<void>
}

export function createAuthAPI(request: RequestFn): AuthAPI {
  return {
    async getUserInfo(refresh = false) {
      const params = refresh ? { refresh: 1 } : undefined
      const res = await request<ApiResponse<UserInfo>>('/api/auth/me', { params })
      if (res.code !== 0 || !res.data) {
        throw new Error(res.msg || '获取用户信息失败')
      }
      return res.data
    },
    async logout() {
      await request('/api/auth/logout', { method: 'POST' })
    },
  }
}

/** 拼出登录入口 URL；前端用 `<a href>` 或 `window.location.href` 跳过去，由后端 302 到 WPS。 */
export function loginURL(redirect = '/'): string {
  return `/api/auth/login?redirect=${encodeURIComponent(redirect)}`
}
