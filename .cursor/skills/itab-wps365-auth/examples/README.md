# Examples

## backend/

完整 Go 后端实现，可直接拷贝到目标项目。

```
backend/
├── client.go               # WPS HTTP Client（KSO-1 签名 + Bearer，签名可选）
├── config.go               # 全局 Config + defaults + Validate
├── errors.go               # APIError + 哨兵错误（ErrInvalidGrant / ErrTransient 等）
├── sign.go                 # KSO-1 HMAC-SHA256 签名实现
├── oauth/
│   ├── authorize.go        # AuthorizeURL（scope 逗号分隔）
│   └── token.go            # ExchangeCode / RefreshUserToken / UserToken 模型
├── auth/
│   ├── service.go          # Service 装配；RegisterRoutes
│   ├── handler.go          # /login /callback /me /status /logout handlers
│   ├── middleware.go       # requireAuth；Auth(ctx) 取登录身份
│   └── refresh.go          # singleflight Token 刷新；错误分类
├── store/
│   ├── types.go            # PreAuthStore / SessionStore / TokenStore / UserRepo 接口
│   ├── sqlite/
│   │   └── store.go        # SQLite 实现：一张 users 表承载 Session + Token + UserProfile
│   └── memory/
│       └── preauth.go      # PreAuthStore 纯内存实现（短寿命，重启即清）
├── user/
│   └── current.go          # GET /v7/users/current
└── cmd/server/
    └── main.go             # 完整装配示例（env + mux + CORS + logging）
```

**拷贝后只需改两处**：
1. 将所有 `import "wps365auth"` 替换为目标项目的 module 路径（如 `"yourapp/wps365auth"`）。
2. `cmd/server/main.go` 根据项目实际路由结构调整 mux 注册。**示例 main.go 内已改为 `WPS_APP_ID` / `WPS_APP_SECRET` 缺失即 `log.Fatal`**——切勿把真实凭证作为默认值写回去。

## frontend/

前端 lib（`lib/wps-auth/`）是协议契约 + 默认实现。**HTTP 客户端由项目注入**（fetch / axios / ky 任选），所以接入项目要写一份胶水（`services/wpsAuth.ts`）把自家的 HTTP 函数交给 `createAuthAPI()`。

```
frontend/
├── lib/wps-auth/           ← 协议层，整个文件夹拷贝
│   ├── auth.ts             # createAuthAPI(request) 工厂 + UserInfo + RequestFn 契约 + loginURL
│   ├── guard.ts            # evaluateAuth (框架无关) + createVueAuthGuard (Vue Router 适配)
│   ├── fetch-default.ts    # 零依赖 RequestFn（基于原生 fetch；项目有 axios/ky 时不用拷）
│   └── index.ts            # barrel re-export
├── services/wpsAuth.ts     ← 胶水：注入项目的 HTTP 客户端，导出 wpsAuth 实例
├── stores/user.ts          ← 胶水：Pinia user store，调用 wpsAuth.getUserInfo / wpsAuth.logout
├── router/index.ts         ← 胶水：Vue Router 用 createVueAuthGuard；其他路由器调 evaluateAuth
└── views/
    └── HomeView.vue        ← 胶水：登录后首页示例
```

**`RequestFn` 契约**（写自家的 HTTP 适配函数时必须遵守）：

1. 同源带 cookie：fetch 用 `credentials: 'include'`，axios 用 `withCredentials: true`
2. 4xx/5xx 必须 `throw`——**不要**在拦截器里 `window.location.href` 跳登录
3. 返回值是已解析的 JSON body

跳转责任全部在路由守卫；如果项目有全局 axios 实例并已经在 401 拦截里跳转，要么给 WPS 鉴权 API 用独立的 axios 实例，要么把 401 跳转的行为收进守卫里。
