// 项目级胶水：在这里把项目自家的 HTTP 客户端注入给 createAuthAPI。
// 三种典型写法：
//
// (A) 没有现成 HTTP 客户端 → 用 lib 自带的 fetch 默认实现：
import { createAuthAPI, fetchRequest } from '@/lib/wps-auth'
export const wpsAuth = createAuthAPI(fetchRequest)

// (B) 项目已有 axios 实例：
//   import axios from '@/utils/http'    // 你自己的 axios 实例
//   import type { RequestFn } from '@/lib/wps-auth'
//   const request: RequestFn = async (url, opts = {}) => {
//     const res = await axios.request({
//       url,
//       method: opts.method ?? 'GET',
//       params: opts.params,
//       data: opts.body,
//       withCredentials: true,
//     })
//     return res.data
//   }
//   export const wpsAuth = createAuthAPI(request)
//
// (C) 项目用 ky：
//   import ky from 'ky'
//   import type { RequestFn } from '@/lib/wps-auth'
//   const request: RequestFn = (url, opts = {}) =>
//     ky(url, {
//       method: opts.method ?? 'get',
//       searchParams: opts.params as Record<string, string | number> | undefined,
//       json: opts.body,
//       credentials: 'include',
//     }).json()
//   export const wpsAuth = createAuthAPI(request)
//
// 无论哪种 RequestFn，必须满足：① 同源带 cookie ② 4xx/5xx throw ③ 不要在拦截器里跳登录。
