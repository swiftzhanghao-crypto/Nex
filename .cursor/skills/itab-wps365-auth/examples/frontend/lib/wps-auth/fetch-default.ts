import { HttpError, type RequestFn } from './auth'

/**
 * 零依赖默认实现。项目已有 axios/ky/ofetch 等 HTTP 客户端时，
 * 应该自己实现一个 RequestFn 注入给 createAuthAPI，不要拷这个文件。
 *
 * 契约：
 * - credentials: 'include'（同站 cookie 才会带过去）
 * - !res.ok → throw HttpError(status)（401/403/500 都让调用方决定怎么处理；不要在这里做 location.href 跳转）
 */
export const fetchRequest: RequestFn = async (url, options = {}) => {
  const { params, body, method = 'GET' } = options
  let target = url

  if (params) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) qs.set(k, String(v))
    target += '?' + qs.toString()
  }

  const init: RequestInit = {
    method,
    credentials: 'include',
    signal: AbortSignal.timeout(30_000),
  }
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }

  const res = await fetch(target, init)
  if (!res.ok) throw new HttpError(res.status)
  return res.json()
}
