# 后端授权接口文档

> 基础路径：`/api/auth`  
> 统一响应格式：`{ "code": number, "msg": string, "data": object }`  
> 登录态通过 HttpOnly Cookie `itab-sid` 维持（cookie 名可由后端 `Config.CookieName` 自定义），前端无需手动传 token

---

## 流程总览

```
用户点击登录
    │
    ▼
GET /api/auth/login?redirect=/dashboard
    │
    │  302 跳转
    ▼
WPS 授权页（用户扫码/输密码）
    │
    │  携带 code + state 回调
    ▼
GET /api/auth/callback?code=xxx&state=yyy
    │
    │  后端换 token → 取用户信息 → 建 session
    │  302 回跳前端 + 写 sid cookie
    ▼
前端页面（已登录）
    │
    │  后续请求自动带 cookie
    ▼
GET /api/auth/me          ← 取用户信息
GET /api/auth/status      ← 轻量检查是否登录
POST /api/auth/logout     ← 登出
```

---

## 接口详情

### 1. 发起登录

```
GET /api/auth/login
```

浏览器直接跳转此地址即可，后端会 302 重定向到 WPS 授权页。

**请求参数（Query）**

| 参数 | 必填 | 说明 |
|------|------|------|
| `redirect` | 否 | 登录成功后回跳的前端路径，如 `/dashboard`。不传默认 `/` |
| `scope` | 否 | 逗号分隔的权限范围，不传默认 `kso.user_base.read` |

**响应**

不返回 JSON，直接 **302 重定向**到 WPS 授权页。

**前端调用示例**

```html
<a href="/api/auth/login?redirect=/dashboard">使用 WPS 账号登录</a>
```

---

### 2. 授权回调

```
GET /api/auth/callback
```

WPS 授权成功后自动回调此地址，**前端不需要主动调用**。

**请求参数（Query，由 WPS 自动携带）**

| 参数 | 说明 |
|------|------|
| `code` | 授权码，用于换取 access_token |
| `state` | CSRF 校验参数，必须与登录时生成的一致 |
| `error` | 授权失败时携带的错误码 |

**响应**

不返回 JSON，处理成功后 **302 重定向**到登录时传入的 `redirect` 路径。

**内部处理流程**

1. 校验 `state` 防止 CSRF 攻击
2. 用 `code` 向 WPS 换取 `access_token` + `refresh_token`
3. 用 `access_token` 调 WPS 获取用户信息
4. 保存 token、用户信息入库
5. 创建新的 session，写入 `itab-sid` cookie
6. 302 回跳前端

---

### 3. 获取当前用户信息

```
GET /api/auth/me
```

**需要登录**。返回当前登录用户的详细信息。

**请求参数（Query）**

| 参数 | 必填 | 说明 |
|------|------|------|
| `refresh` | 否 | 传 `1` 强制从 WPS 回源最新数据，否则读 60s 缓存 |

**成功响应** `200`

```json
{
  "code": 0,
  "data": {
    "id": "1Jk1LQ0",
    "user_name": "张国华",
    "avatar": "https://img.qwps.cn/...",
    "company_id": "vOdj8z",
    "local_id": 1,
    "expires_in": 6532,
    "must_reauth_before": "2027-04-21T03:00:00Z"
  }
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | WPS 用户 ID |
| `user_name` | string | 用户姓名 |
| `avatar` | string | 头像 URL |
| `company_id` | string | 企业 ID |
| `local_id` | int | 本地数据库用户主键 |
| `expires_in` | int | access_token 剩余秒数 |
| `must_reauth_before` | string | refresh_token 即将过期时才返回（剩余 < 7天），提示用户需重新授权 |

**未登录响应** `401`

```json
{
  "code": 401,
  "msg": "未登录"
}
```

---

### 4. 检查登录状态

```
GET /api/auth/status
```

**不需要登录**。轻量接口，仅返回是否已登录，不会刷新 token 也不会请求 WPS。适合前端轮询。

**成功响应** `200`

已登录：

```json
{
  "code": 0,
  "data": {
    "logged_in": true,
    "expires_in": 6532
  }
}
```

未登录：

```json
{
  "code": 0,
  "data": {
    "logged_in": false
  }
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `logged_in` | bool | 是否已登录 |
| `expires_in` | int | access_token 剩余秒数，仅登录时返回 |

---

### 5. 登出

```
POST /api/auth/logout
```

**不需要登录**（未登录调用也不会报错）。清除本地 session，不会通知 WPS。

**请求**

无参数，无请求体。

**成功响应** `200`

```json
{
  "code": 0,
  "msg": "已退出"
}
```

**前端调用示例**

```ts
await fetch('/api/auth/logout', { method: 'POST' })
window.location.href = '/login'
```

---

## 后端调用的 WPS 外部接口

以下接口由后端内部调用，前端不直接接触。

| 用途 | WPS 端点 | 调用时机 |
|------|---------|---------|
| 授权跳转 | `GET https://openapi.wps.cn/oauth2/auth` | `/login` 时 302 跳转过去 |
| Code 换 Token | `POST https://openapi.wps.cn/oauth2/token` | `/callback` 收到授权码后 |
| 刷新 Token | `POST https://openapi.wps.cn/oauth2/token` | 访问 `/me` 时 token 临到期（< 5min）自动触发 |
| 获取用户信息 | `GET https://openapi.wps.cn/v7/users/current` | `/callback` 登录时 + `/me` 缓存过期（60s）回源时 |

---

## Cookie 说明

| 名称 | 用途 | 有效期 | 路径 |
|------|------|-------|------|
| `wps_preauth` | 登录跳转期间防 CSRF | 10 分钟 | `/api/auth` |
| `itab-sid` | 登录态会话标识 | 24 小时（每次请求自动续期） | `/` |

两个 Cookie 均为 `HttpOnly`，前端 JS 无法读取，浏览器自动携带。

---

## Token 自动刷新

前端无需关心 token 刷新，后端中间件自动处理：

| 情况 | 后端行为 | 前端感知 |
|------|---------|---------|
| token 快过期（< 5min） | 自动调 WPS 刷新 | 无感知，请求正常返回 |
| refresh_token 失效 | 清除 session | 收到 `401`，跳登录页 |
| WPS 临时故障 | 用旧 token 继续服务 | 无感知 |
| refresh_token 快过期（< 7天） | `/me` 返回 `must_reauth_before` | 可提示用户重新登录 |

---

## 前端 401 处理建议

```ts
// axios 拦截器
if (error.response?.status === 401) {
  const redirect = encodeURIComponent(location.pathname + location.search)
  location.href = `/login?redirect=${redirect}`
}
```
