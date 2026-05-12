---
name: itab-wps365-auth
description: WPS 365 企业自建应用 OAuth2 登录接入 skill。当用户说"接入 WPS 登录"、"WPS SSO"、"wps365 oauth"、"WPS 单点登录"时触发。适用于 Go 后端 + 任意 SPA 前端。不适用于 ISV/第三方应用。
---

# WPS 365 OAuth2 登录接入

> 适用：企业自建应用 + Go 后端 + Vue/React/任意 SPA 前端。
> 不适用：ISV 应用（需 app_ticket 链路，本 skill 不覆盖）。

---

## 代码三层模型

接入工作分三层，每层的操作方式不同：

```
┌─────────────────────────────────────────────────────────┐
│  胶水层（Glue）                                          │
│  LoginView / router guard / user store / main.go 装配   │
│  → 按目标项目的框架和规范从头写，examples/ 仅作 API 参考  │
├─────────────────────────────────────────────────────────┤
│  应用层（Auth）                                          │
│  auth/handler.go  auth/middleware.go  auth/service.go   │
│  → net/http 项目直接拷贝；其他框架参考逻辑、适配框架写法  │
├─────────────────────────────────────────────────────────┤
│  WPS 协议层（Protocol）                                  │
│  client.go  config.go  errors.go  sign.go               │
│  oauth/  user/  store/                                   │
│  前端：lib/wps-auth/                                     │
│    auth.ts (协议契约) / guard.ts (路由器适配)            │
│    fetch-default.ts (零依赖默认 RequestFn) / index.ts    │
│  → 协议层无框架依赖；HTTP 客户端由项目注入               │
└─────────────────────────────────────────────────────────┘
```

---

## 第一步：判断目标项目框架

**接手目标项目时，先确认两件事：**

1. **后端 HTTP 框架**：`net/http` 原生 / `gin` / `goframe (ghttp)` / `echo` / 其他？
2. **前端框架与状态管理**：Vue + Pinia / React + Zustand / React + Redux / 其他？

这决定了应用层和胶水层的写法。

---

## WPS 协议层：直接拷贝

以下文件框架无关，**直接拷贝**到目标项目，只需把 import 路径中的 module 前缀从 `wps365auth` 改为目标项目的 module 路径：

**后端（Go）**：
```
examples/backend/client.go          → yourapp/wps365auth/client.go（或任意子包路径）
examples/backend/config.go
examples/backend/errors.go
examples/backend/sign.go
examples/backend/oauth/authorize.go
examples/backend/oauth/token.go
examples/backend/user/current.go
examples/backend/store/types.go
examples/backend/store/sqlite/store.go
examples/backend/store/memory/preauth.go
```

**前端（TypeScript）**：

```
examples/frontend/lib/wps-auth/auth.ts          → src/lib/wps-auth/auth.ts
examples/frontend/lib/wps-auth/guard.ts         → src/lib/wps-auth/guard.ts
examples/frontend/lib/wps-auth/fetch-default.ts → src/lib/wps-auth/fetch-default.ts
examples/frontend/lib/wps-auth/index.ts         → src/lib/wps-auth/index.ts
```

文件分工：

| 文件 | 角色 | 框架/依赖 |
|---|---|---|
| `auth.ts` | 协议契约：`UserInfo`、`createAuthAPI(request)` 工厂、`loginURL()`、`RequestFn` 类型 | 无 |
| `guard.ts` | 鉴权决策：框架无关的 `evaluateAuth()` + Vue Router 适配器 `createVueAuthGuard()` | 仅 Vue 适配器是 vue-router 形状，可不用 |
| `fetch-default.ts` | 零依赖默认 `RequestFn`（基于原生 fetch） | 无 |
| `index.ts` | barrel re-export | 无 |

**HTTP 客户端由项目注入**——这是 lib 框架无关的关键。项目已有 axios/ky/ofetch 时，自行写一个满足 `RequestFn` 契约的函数交给 `createAuthAPI()`，**不要**拷贝 `fetch-default.ts`。零依赖项目可以直接用 `fetchRequest`。

`RequestFn` 契约（违反会让 401 行为错乱）：

1. 同源请求带 cookie（`credentials: 'include'` / `withCredentials: true`）
2. 4xx/5xx 必须 throw —— **绝不**在拦截器里 `window.location.href = ...`
3. 返回值是已解析的 JSON body

`createVueAuthGuard()` 是 Vue Router 适配器；React Router / TanStack Router 等请直接调 `evaluateAuth()`，按 `GuardDecision` 自行决定怎么导航（`guard.ts` 头注释里有 React Router v6/v7 的参考片段）。

### `ensureAuth` 必须三态返回（重要）

```ts
ensureAuth: () => Promise<true | false | 'unknown'>
```

| 返回值 | 含义 | 守卫行为 |
|---|---|---|
| `true` | 已登录 | allow |
| `false` | **明确**未登录（`/api/auth/me` 返回 **401**） | `authMode='redirect'` 时外跳 OAuth |
| `'unknown'` | 探测失败（网络错 / 5xx / **404** / 其他异常） | **不**外跳 OAuth，落 login-page |

**为什么必须三态？** 后端没起、路由前缀对不上、proxy 没配等情况下 `/api/auth/me` 会拿到 404 或 5xx 而不是 401。如果守卫把这些当成"未登录"去外跳 OAuth，OAuth 入口 URL 同样会触底 SPA 兜底→回首页→守卫再触发，**死循环**。三态语义让守卫在不确定时降级到登录页，而不是无限外跳。

lib 提供 `isUnauthorized(err)` helper 帮你区分：fetch-default 抛的是带 status 的 `HttpError`；axios 用户的适配器请把 `error.response.status` 也归一到 `HttpError`，否则 `isUnauthorized` 仅靠 `err.response?.status === 401` 兜底。

```ts
async function fetchUser() {
  try {
    user.value = await wpsAuth.getUserInfo()
    return 'authed'
  } catch (err) {
    user.value = null
    return isUnauthorized(err) ? 'unauthed' : 'unknown'
  }
}
```

> 守卫还内置一层防呆：连续两次为同一 path 触发 `redirect-external` 会自动走 `unknownFallback`（说明用户外跳 OAuth 后又被弹回了）。但这是兜底，不是替代品 —— `ensureAuth` 把 401 与其他错误分开，才是根因层面的修法。

### `unknownFallback`：探测失败 / 防呆触发时的兜底行为

| 取值 | 行为 | 用什么时候 |
|---|---|---|
| `'cancel'`（默认） | 取消本次导航（守卫返回 `false`） | **没有 `/login` 路由的 `authMode='redirect'` 项目**；最安全，不会死循环但用户停留空白 |
| `'allow'` | 放行，组件层自己处理未授权状态 | 业务页面能优雅展示"请先登录"、且已配未登录态 UI |
| `'login-page'` | 跳到 `loginPath` | **仅当你确实有 `loginPath` 这个路由时**；否则 vue-router resolve 不到会死循环 |

> **常见死循环原因**：`authMode='redirect'`、没注册 `/login` 路由、又把 `unknownFallback` 设成 `'login-page'`。vue-router push 到不存在的 `/login` → 又触发守卫 → 又返回 `/login` → ⟳。默认 `'cancel'` 就是为了挡这个坑。

---

## 应用层：按框架决定策略

### net/http 项目

直接拷贝 `examples/backend/auth/`，修改 import 路径即可：

```go
// 拷贝后只改 import 路径
import "yourmodule/wps365auth"
import "yourmodule/wps365auth/store"
```

### Gin 项目

不要拷贝 `auth/handler.go`，**参照其逻辑**用 Gin 风格重写：

```go
// net/http 写法（参考）
func (s *Service) handleMe(w http.ResponseWriter, r *http.Request) {
    a := Auth(r.Context())
    writeJSON(w, http.StatusOK, jsonResp{Code: 0, Data: meResp{...}})
}

// Gin 等价写法（目标项目中实际写的）
func (s *Service) HandleMe(c *gin.Context) {
    a := Auth(c.Request.Context())
    c.JSON(http.StatusOK, gin.H{"code": 0, "data": meResp{...}})
}
```

`auth/service.go`、`auth/refresh.go` 中的业务逻辑（singleflight 刷新、用户缓存）可直接复用，只有 handler 签名和 mux 注册需要改。

### GoFrame (ghttp) 项目

同样参考逻辑、适配框架：

```go
// GoFrame handler 写法
func (s *Service) HandleMe(r *ghttp.Request) {
    a := Auth(r.Context())
    r.Response.WriteJsonExit(g.Map{"code": 0, "data": meResp{...}})
}

// 路由注册
s := g.Server()
s.Group("/api/auth", func(group *ghttp.RouterGroup) {
    group.GET("/me", svc.HandleMe)
    group.POST("/logout", svc.HandleLogout)
})
```

### Echo / 其他框架

模式相同：`auth/service.go` 和 `auth/refresh.go` 复用，handler 按框架 API 重写，中间件按框架风格实现。

---

## 胶水层：参考示例、按项目写

以下文件只是示范，**理解意图后按目标项目的规范重新写**：

| 示例文件 | 意图 | 按项目写时注意 |
|---|---|---|
| `examples/backend/cmd/server/main.go` | 如何装配 5 个组件 | 集成进目标项目的 main 或初始化逻辑 |
| `examples/frontend/views/App.vue` | App Shell 示例（navbar 登录按钮 + 错误展示），目标项目放到 `src/App.vue` 入口组件 | `<a :href="loginURL(route.path)">` 注意用 path 不用 fullPath |
| `examples/frontend/stores/user.ts` | user store 调 `getUserInfo()` + `logout()` | 适配项目的状态管理（Pinia/Zustand/Redux） |
| `examples/frontend/services/wpsAuth.ts` | 把项目自家 HTTP 客户端注入 `createAuthAPI()` | 用项目已有的 axios/ky/ofetch；零依赖项目用 `fetchRequest` |
| `examples/frontend/router/index.ts` | Vue Router 用 `createVueAuthGuard`；React/其他路由器调 `evaluateAuth` 自行适配 | 按模式选择 `authMode` |

---

## 两种授权模式

接入前先确认业务需要哪种模式，两种可以同时存在于一个项目中：

### 模式 A：按钮触发（首页公开，用户主动登录）

适合有公开落地页的产品。首页对所有人可见，登录入口是导航栏按钮或链接。

```ts
// router/index.ts（Vue 项目）
createVueAuthGuard(router, {
  publicPaths: ['/'],   // 首页公开
  authMode: 'page',     // 受保护路由跳 /login 页（若有独立登录页）
  ensureAuth: ...,
})
```

### 模式 B：访问即授权（全站必须登录）

适合内部工具、企业应用。用户访问受保护路由时守卫直接跳 OAuth，不经过中间登录页。

```ts
// router/index.ts（Vue 项目）
createVueAuthGuard(router, {
  publicPaths: ['/'],       // 仅首页（或完全不设）
  authMode: 'redirect',     // 直接跳 OAuth，无需 /login 页
  oauthURL: (redirect) => loginURL(redirect),
  ensureAuth: ...,
})
```

两种模式的完整实现见 [examples/frontend/lib/wps-auth/guard.ts](./examples/frontend/lib/wps-auth/guard.ts)（Vue 项目用 `createVueAuthGuard`；非 Vue 项目用 `evaluateAuth` + 自家路由器）。

---

## 核心规则（违反会静默失败）

### 1. `RequestFn` 不做 401 全局跳转，由守卫负责

无论项目用 fetch / axios / ky / ofetch，注入给 `createAuthAPI()` 的 `RequestFn` 都只能 `throw`，**不要**在里面加 `window.location.href` 跳转：

```ts
// CORRECT：抛出错误，由调用方和守卫决定怎么处理
if (!res.ok) throw new Error(`HTTP ${res.status}`)

// WRONG：全局 401 跳转会让公开页面（首页）的静默探测也被强制跳授权
if (res.status === 401) { window.location.href = '/api/auth/login?...' }
```

授权跳转的责任在守卫：`ensureAuth` 返回 false → `authMode:'redirect'` → 守卫跳 OAuth。
公开页面的 `fetchUser()` 失败由 `catch` 静默处理，不跳转。

> 如果项目已经有一个全局 axios 实例并在拦截器里写了 401 跳转：要么给 WPS 鉴权 API 用一个**独立、无 401 拦截**的 axios 实例，要么把 401 跳转的行为收进守卫里。两套不能共存。

### 2. 登录必须用 `<a href>`，绝不用 fetch/axios

```html
<!-- CORRECT：浏览器直接跳转，后端 302 被正确处理 -->
<a :href="loginURL(redirect)">使用 WPS 账号登录</a>

<!-- WRONG：fetch/axios 会吃掉 302，OAuth 流程中断 -->
await axios.get('/api/auth/login')
```

### 3. 登录按钮的 redirect 用 `route.path`，不用 `route.fullPath`

```ts
// CORRECT：只用 path，不携带 query（避免 ?error=xxx 被带回来）
loginURL(route.path)

// WRONG：fullPath 含 query，OAuth 失败重登后会再次显示旧错误
loginURL(route.fullPath)
```

> 注：守卫场景例外。`evaluateAuth` 内部用的是 `to.fullPath`，目的是登录后能回到带 query 的原始受保护路径——这里的 query 是业务参数，不是 OAuth 错误回显。

### 4. 使用同域部署，不要配 CORS

**vite `base = '/'`（绝大多数项目）** —— 直接代理 `/api`：

```ts
// vite.config.ts
server: { proxy: { '/api': 'http://localhost:8080' } }
```

```nginx
location /api/ { proxy_pass http://127.0.0.1:8080; }
location /     { root /var/www/spa; try_files $uri /index.html; }
```

**vite `base = '/your-app/'`（带路径前缀的子应用）** —— 三选一，三选项要前后端对齐：

| 选项 | vite proxy | 后端路由前缀 | lib 内 URL |
|---|---|---|---|
| A. proxy 剥前缀 | `'/your-app/api': { target: ':8080', rewrite: p => p.replace(/^\/your-app/, '') }` | 不带前缀（挂在 `/api/auth/*`） | 默认 `/api/auth/*`（不动 lib） |
| B. 后端带前缀 | `'/your-app/api': ':8080'`（不 rewrite） | 带前缀（`{prefix}/api/auth/*`） | **必须**改成 `${BASE_URL}api/auth/*`，否则浏览器请求 `/api/...` 不走 proxy |
| C. 后端 + nginx 都带前缀 | 同 B | 同 B | 同 B；生产 nginx 同样 `proxy_pass` 带前缀的 location |

**踩过的坑**：选项 B/C 时需要在项目里改 `auth.ts` 里的 URL 拼接，**同时**把 OAuth 回调地址（WPS 后台 + `WPS_REDIRECT_URI` env）改成带前缀的版本。否则会出现：me 接口能通 → OAuth 跳过去能通 → 但回调地址 404 → 又触发循环。

如果项目用 axios 全局实例并设了 `baseURL: import.meta.env.BASE_URL`，**不要**把这个 axios 实例直接给 `createAuthAPI`——它会把 `/api/auth/me` 请求拼成 `/your-app/api/auth/me`，路径意外加前缀。要么用独立 axios 实例（不带 baseURL），要么走 lib 自带的 `fetchRequest`。

### 5. Go 版本要求 1.22+（如用 net/http 原生路由）

```
# go.mod
go 1.22   ← "GET /api/auth/login" 路由模式需要 1.22+
```

Gin/GoFrame/Echo 项目不受此限制。

### 6. scope 用英文逗号分隔（不是空格）

```
kso.user_base.read,kso.other_scope   ← CORRECT
kso.user_base.read kso.other_scope   ← WRONG（WPS 非标准 OAuth2）
```

### 7. 回调地址必须完全一致

WPS 后台填写的回调 URL 与 `WPS_REDIRECT_URI` env 必须完全匹配（含协议、端口、路径末尾斜杠）。

### 8. Token 刷新和 Cookie 前端无需处理

Token 自动刷新由后端中间件完成；前端只需在 401 时让守卫把用户带到登录入口，Cookie 由浏览器自动携带。

---

## 装配示意（net/http 版）

```go
client := wps365auth.New(wps365auth.Config{
    AppID:       os.Getenv("WPS_APP_ID"),
    AppSecret:   os.Getenv("WPS_APP_SECRET"),
    RedirectURI: os.Getenv("WPS_REDIRECT_URI"),
    FrontendURL: os.Getenv("FRONTEND_URL"),
})

dbPath := envOr("SESSION_DB", "data/app.db")
sqlStore, err := sqlite.New(dbPath, 24*time.Hour)
if err != nil {
    log.Fatalf("SQLite 初始化失败: %v", err)
}
defer sqlStore.Close()

stores := auth.Stores{
    PreAuth:  memory.NewPreAuthStore(),  // 纯内存，重启即清
    Session:  sqlStore,
    Token:    sqlStore,
    UserRepo: sqlStore,
}
svc, _ := auth.New(client, stores, auth.Config{
    RedirectURI: client.Config.RedirectURI,
    FrontendURL: client.Config.FrontendURL,
})
svc.RegisterRoutes(mux)
```

### 业务 handler 中取用户身份

```go
// 需先经过 requireAuth 中间件（已在 RegisterRoutes 内注册于 /me 等路由）
a := auth.Auth(r.Context())
_ = a.Session.LocalUserID   // 本地数据库外键
_ = a.Session.WPSUserID     // 调 WPS API 用
_ = a.Profile.UserName      // 显示用

// 如需用 WPS access_token 调业务接口
tok, _ := stores.Token.GetUser(ctx, a.Session.WPSUserID)
client.Do(ctx, "GET", "/v7/some/api", tok.AccessToken, nil, &out)
```

---

## 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `WPS_APP_ID` | ✅ | WPS 开发者后台 AppID |
| `WPS_APP_SECRET` | ✅ | WPS 开发者后台 AppSecret |
| `WPS_REDIRECT_URI` | ✅ | 必须与后台完全一致，如 `https://app.example.com/api/auth/callback` |
| `FRONTEND_URL` | 同域时留空 | 跨域时填前端基础 URL |
| `WPS_ENABLE_SIGN` | ❌ | `true`/`false`，与后台"接口签名"开关一致，默认 `false` |
| `WPS_SCOPES` | ❌ | 逗号分隔，默认 `kso.user_base.read` |
| `SESSION_DB` | ❌ | SQLite 数据库路径，默认 `data/app.db` |
| `COOKIE_NAME` | ❌ | 登录态 cookie 名，默认 `itab-sid`，可改成自家前缀如 `myapp-sid` |
| `COOKIE_SAMESITE` | ❌ | `Lax`（默认）/`None`（跨域必须）/`Strict` |
| `COOKIE_SECURE` | ❌ | 生产 HTTPS 设 `true` |

---

## 已注册路由（net/http 版）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/auth/login?redirect=/path` | 302 跳 WPS 授权页 |
| GET | `/api/auth/callback` | WPS 回调，成功后 302 回前端 |
| GET | `/api/auth/me[?refresh=1]` | 取当前用户，需登录 |
| GET | `/api/auth/status` | 轻量探活，无需登录 |
| POST | `/api/auth/logout` | 清本地 session |

---

## 未来扩展点（接口已预留）

| 需求 | 改动 |
|---|---|
| Token 加密存储 | 在 `store/sqlite/store.go` 的读写方法中加 AES-GCM 加解密，注入 key via env |
| 多实例 / Redis | `PreAuthStore`+`SessionStore` 改 Redis 实现，`TokenStore` 走 DB |
| 强制下线 | `Token.DeleteUser + Session.DeleteByUser` |
| 业务 API 代理 `/api/wps/*` | 在 `auth/` 加 `proxy.go`，调 `client.Do(...)` |
| ISV/第三方应用 | 新增 `oauth.PushAppTicket` + 事件订阅 webhook |

---

## 参考

- API 接口文档：[references/api-contract.md](./references/api-contract.md)
- 架构决策记录：[references/architecture.md](./references/architecture.md)
- WPS 协议层代码：[examples/backend/](./examples/backend/)（拷贝层）
- 应用层参考代码：[examples/backend/auth/](./examples/backend/auth/)（net/http 版，其他框架参考逻辑）
- 前端 lib（拷贝层）：[examples/frontend/lib/wps-auth/](./examples/frontend/lib/wps-auth/)
- 前端胶水参考（含 axios/ky 注入示例）：[examples/frontend/services/wpsAuth.ts](./examples/frontend/services/wpsAuth.ts)、[examples/frontend/](./examples/frontend/)
