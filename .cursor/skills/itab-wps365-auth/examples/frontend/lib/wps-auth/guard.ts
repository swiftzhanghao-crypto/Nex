export type AuthState = boolean | 'unknown'

/**
 * 探测失败 / 防呆触发时的兜底行为。
 * - 'cancel'     取消本次导航（默认）。安全但用户停在原页或空白；不会死循环。
 * - 'allow'      放行，由组件层处理未授权状态（业务 API 调用会 401，需自家处理）。
 * - 'login-page' 跳到 loginPath。**仅当你确实有 loginPath 这个路由时使用**，
 *                否则会触发 vue-router resolve 不到 → 反复 push 的死循环。
 */
export type FallbackBehavior = 'cancel' | 'allow' | 'login-page'

export interface AuthGuardOptions {
  /** 不需要登录就可访问的路径前缀（精确匹配）。默认 ['/']。 */
  publicPaths?: string[]
  /**
   * 未登录（明确 false）时的跳转策略：
   * - 'page'     → 跳到 loginPath 显示登录页
   * - 'redirect' → 直接跳到 OAuth 授权 URL（通过 oauthURL 生成）
   */
  authMode?: 'page' | 'redirect'
  /** authMode='page' 时使用。默认 '/login'。仅在你有这个路由时才有意义。 */
  loginPath?: string
  /** authMode='redirect' 时使用。接收目标路径，返回完整的 OAuth 入口 URL。 */
  oauthURL?: (redirect: string) => string
  /**
   * 由调用方提供：判断登录态。三态返回值：
   * - `true`      已登录
   * - `false`     **明确**未登录（例如 /api/auth/me 返回 401）
   * - `'unknown'` 探测失败（网络错 / 5xx / 后端 404 / 其他异常）
   */
  ensureAuth: () => Promise<AuthState>
  /**
   * 'unknown' 状态的兜底行为，默认 'cancel'。详见 FallbackBehavior。
   * 防呆触发（同一 path 连续外跳 OAuth）也走这条兜底。
   */
  unknownFallback?: FallbackBehavior
}

export type GuardDecision =
  | { kind: 'allow' }
  | { kind: 'cancel' }
  | { kind: 'redirect-external'; url: string }
  | { kind: 'login-page'; loginPath: string; redirect: string }

export interface GuardLocation {
  path: string
  fullPath?: string
}

const REDIRECT_GUARD_KEY = 'wps-auth:redirect-attempt'

interface RedirectAttempt {
  path: string
  at: number
}

function readRedirectAttempt(): RedirectAttempt | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(REDIRECT_GUARD_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as RedirectAttempt
    if (Date.now() - v.at > 5 * 60_000) {
      sessionStorage.removeItem(REDIRECT_GUARD_KEY)
      return null
    }
    return v
  } catch {
    return null
  }
}

function writeRedirectAttempt(path: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(REDIRECT_GUARD_KEY, JSON.stringify({ path, at: Date.now() }))
  } catch {
    /* noop */
  }
}

function clearRedirectAttempt(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(REDIRECT_GUARD_KEY)
  } catch {
    /* noop */
  }
}

function fallbackDecision(
  behavior: FallbackBehavior,
  loginPath: string,
  fullPath: string,
): GuardDecision {
  switch (behavior) {
    case 'allow':
      return { kind: 'allow' }
    case 'login-page':
      return { kind: 'login-page', loginPath, redirect: fullPath }
    case 'cancel':
    default:
      return { kind: 'cancel' }
  }
}

export async function evaluateAuth(
  opts: AuthGuardOptions,
  to: GuardLocation,
): Promise<GuardDecision> {
  const publicPaths = opts.publicPaths ?? ['/']
  const authMode = opts.authMode ?? 'page'
  const loginPath = opts.loginPath ?? '/login'
  const fullPath = to.fullPath ?? to.path
  const fallback = opts.unknownFallback ?? 'cancel'

  if (publicPaths.includes(to.path)) {
    clearRedirectAttempt()
    return { kind: 'allow' }
  }

  const state = await opts.ensureAuth()
  if (state === true) {
    clearRedirectAttempt()
    return { kind: 'allow' }
  }

  if (state === 'unknown') {
    return fallbackDecision(fallback, loginPath, fullPath)
  }

  // state === false：明确未登录
  if (authMode === 'redirect' && opts.oauthURL) {
    const prev = readRedirectAttempt()
    if (prev && prev.path === to.path) {
      // 上次已为同一 path 外跳过 OAuth 又回到这里仍 false → 跳出去后被弹回。
      // 不再外跳，按 fallback 处理（默认 cancel，避免依赖 loginPath 路由存在）。
      clearRedirectAttempt()
      return fallbackDecision(fallback, loginPath, fullPath)
    }
    writeRedirectAttempt(to.path)
    return { kind: 'redirect-external', url: opts.oauthURL(fullPath) }
  }
  return { kind: 'login-page', loginPath, redirect: fullPath }
}

export function createVueAuthGuard(opts: AuthGuardOptions) {
  return async (to: { path: string; fullPath: string }) => {
    const decision = await evaluateAuth(opts, to)
    switch (decision.kind) {
      case 'allow':
        return true
      case 'cancel':
        return false
      case 'redirect-external':
        window.location.href = decision.url
        return false
      case 'login-page':
        return { path: decision.loginPath, query: { redirect: decision.redirect } }
    }
  }
}
