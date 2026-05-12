---
name: itab-xiaoshouyi-crm
description: >-
  销售易 CRM 一体化技能（前后端）。后端（Go / GoFrame v2）：OAuth2 授权页参数、authorization_code 获取 access_token、
  XOQL 查询，实现位于 server/internal/pkg/xiaoshouyi/，配置键 crm.xiaoshouyi.*。
  前端（Vue 3 + Vite）：独立回调路由 /crm/callback 处理换票、避免与 SSO code 参数冲突、调后端 /api/crm/auth 完成绑定。
  Use when CRM授权, 销售易, CRM OAuth, 第三方授权绑定, OAuth 回调中间页, xiaoshouyi, XOQL, crm token.
---

# 销售易 CRM —— 前后端一体

本技能说明在 **it-ai-base** 中接入销售易 CRM 开放平台的完整约定：后端 OAuth 换票与数据查询、前端授权跳转与回调处理。

前后端衔接点是 **`POST /api/crm/auth`**：前端把销售易回调的 `code` + `redirect_uri` 交给后端，后端换取 CRM access token 并持久化。前端不直接调用销售易 API。

路径若无特殊说明，均**相对本技能根**（`.cursor/skills/itab-xiaoshouyi-crm/`）。

## 边界与依赖

- **不替代** `.cursor/skills/itab-server/SKILL.md`（后端基础）与 `.cursor/skills/itab-client/SKILL.md`（前端基础）的约束。
- **前提**：项目已接入 SSO 登录（参见 `.cursor/skills/itab-kso-sso/`），用户已登录状态下才能发起 CRM 授权。
- Go / GoFrame / ORM 实现约定见 `.cursor/skills/goframe-v2/SKILL.md`。

## 导航

### 后端实施（Go / GoFrame v2）

| 主题 | 文档 |
|------|------|
| OAuth 授权页参数、token 接口、XOQL 查询、Go 调用示例 | [references/server/api-reference.md](./references/server/api-reference.md) |

### 前端接入（Vue 3 + Vite）

| 主题 | 文档 |
|------|------|
| code 冲突处理、授权流程、接入步骤 | [references/web/integration-guide.md](./references/web/integration-guide.md) |
| 逐文件模板（可复制） | [examples/web/frontend-files.md](./examples/web/frontend-files.md) |

## 关键共识

1. **code 参数冲突**：SSO 和 CRM 都通过 `?code=xxx` 回调，用**路径**区分——`/?code` 归 SSO，`/crm/callback?code` 归 CRM。`checkOauth()` 检测到 `/crm/callback` 时必须跳过 SSO 换票。
2. **redirect_uri 必须完全一致**：前端跳转销售易时用的 `redirect_uri`、前端传给后端 `/api/crm/auth` 的 `redirect_uri`、销售易后台白名单，三者必须完全一致（含大小写、协议、端口），否则 OAuth 规范要求拒绝换票。
3. **code 一次性**：CRM 的 `code` 只能用一次，后端 `/api/crm/auth` 负责用它换取 CRM access token 并持久化。
4. **敏感配置不入库**：`client_secret` 等敏感项用环境变量 `CRM_XSY_*` 覆盖，生产勿提交明文密钥。
5. **前端只做跳转和传递 code**：不直接调用销售易 API；数据查询（XOQL 等）由后端完成。
