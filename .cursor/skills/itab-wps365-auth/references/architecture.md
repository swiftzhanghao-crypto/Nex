# 架构决策记录

## 登录态：Cookie+sid vs JWT

**采用 Cookie+sid（默认 cookie 名 `itab-sid`，可由 `Config.CookieName` 覆盖），不引入 JWT**，原因：

1. WPS `access_token` 必须存服务端（凭证零下放）。即使前端发 JWT，access_token 也不能进 JWT，TokenStore 无论如何都必须存在，引入 JWT 不省任何状态。
2. WPS 没有公开的 user-level token revoke 接口，依赖服务端 SessionStore 才能"立即注销"。
3. 部署形态是同域单后端，JWT 的"无状态跨服务"优势用不上。
4. `SessionStore` 里已有 `UserID/CompanyID`，O(1) 取，无需再请求接口。

**后端取用户信息路径**：
```
itab-sid (cookie) → SessionStore.Get → Session{UserID, CompanyID}
                  → TokenStore.GetUser → UserToken（调 WPS API 用）
                  → （仅 /me 触发）WPS /v7/users/current → UserInfo（60s TTL 缓存）
```

## 存储分层

| 数据 | 本次实现 | 未来扩展 |
|---|---|---|
| PreAuth state | 内存（重启即清，合理） | Redis（多实例） |
| Session / Token / UserProfile | SQLite 一张 `users` 表（`wps_user_id` 主键，`sid` 唯一索引） | Redis / 加密存储 |

**关键原则**：
- 一张 `users` 表同时承载 session、token、用户资料，通过 UPSERT 避免时序问题。
- 业务表外键用本地 `LocalUserID`（int64），不直接用 `WPSUserID`，保留切换身份源的空间。
- 生产环境建议对 token 字段 AES-256-GCM 加密，key 通过 env `WPS_TOKEN_ENC_KEY` 注入，不入 git。

## Token 刷新策略

- **触发**：`AccessExpiresAt - now < RefreshMargin`（默认 5min）视为临到期。
- **并发合并**：`singleflight.Group` 按 `userID` 去重，同一用户并发请求只发一次 refresh。
- **错误分类**：
  - `invalid_grant` / `invalid_token` / 4xx → 清 token + session，下次请求 401，前端跳登录。
  - 网络 / 5xx → 不清凭证，沿用旧 token 继续服务，打 warning。
- **refresh_token 寿命预警**：剩余 < 7天时，`/me` 响应附 `must_reauth_before` 字段。

## Cookie 设计

| Cookie | 作用 | TTL | Path | 说明 |
|---|---|---|---|---|
| `wps_preauth` | OAuth 跳转期防 CSRF | 10min | `/api/auth` | 一次性使用，回调后立即删除 |
| `itab-sid`（可改） | 登录态 session | 24h（滑动） | `/` | HttpOnly，前端不可读 |

两个 Cookie 分离，防止 session fixation：pre-auth state 和 logged-in session 完全独立。

## 设计原则

1. **凭证零下放**：AppSecret / access_token / refresh_token 永不出后端，前端只见 `itab-sid` cookie。
2. **接口抽象**：`PreAuthStore / SessionStore / TokenStore / UserRepo` 全部是 interface，SQLite 为默认实现，切 Redis/DB 不动业务代码。
3. **无状态 OAuth 层**：`oauth/` 包是纯函数，不持有任何 store，可独立测试。
4. **同域部署**：本地 Vite proxy，生产 nginx 反代，不需要 CORS，SameSite=Lax 即可正常工作。

## 为何不支持 ISV/第三方应用

ISV 应用需要额外的 `app_ticket` 链路（事件订阅 webhook + 推送应用票据 + 换取企业 token），整体复杂度是企业自建的 3-5 倍，且 WPS 文档有专门的 ISV 开发指引，本 skill 不覆盖。
