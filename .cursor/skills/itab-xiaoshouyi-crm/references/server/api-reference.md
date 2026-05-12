# 销售易 CRM 后端 API 参考

## 代码与配置

| 项 | 说明 |
|----|------|
| 包路径 | `server/internal/pkg/xiaoshouyi/` |
| 客户端 | `xiaoshouyi.NewFromCfg(ctx)`，从 `gcfg` 读 `crm.xiaoshouyi.*` |
| 获取 token | `(*Client).GetCRMToken(ctx, code, redirectURI)` → `*TokenResponse` |
| 授权页 URL | `(*Client).BuildAuthorizeURL(state)`（query 含 `response_type`、`client_id`、`redirect_uri`、`scope`、`oauthType`、`access_type` 等） |
| XOQL | `(*Client).QueryXOQL(ctx, authorizationHeader, xoql)`，`Authorization` 头值为获取 token 返回的 `access_token` 原文（Bearer 前缀按平台要求，当前 sandbox 为 token 原文） |

### 环境变量（覆盖配置）

| 变量 | 覆盖配置键 |
|------|------------|
| `CRM_XSY_CLIENT_ID` | `crm.xiaoshouyi.clientId` |
| `CRM_XSY_CLIENT_SECRET` | `crm.xiaoshouyi.clientSecret` |
| `CRM_XSY_REDIRECT_URI` | `crm.xiaoshouyi.redirectUri` |
| `CRM_XSY_SCOPE` | `crm.xiaoshouyi.scope` |

### 集成测试（真实调用 sandbox）

源码：`server/internal/pkg/xiaoshouyi/client_integration_test.go`（`//go:build integration`，默认 `go test` 不包含）。

在 **`server/` 目录**下执行：

```bash
go test -tags=integration -v -count=1 ./internal/pkg/xiaoshouyi/...
```

需设置 `CRM_XSY_INTEGRATION=1`。获取 token 测试另设 `CRM_XSY_AUTH_CODE`（一次性）；仅测 XOQL 可设 `CRM_XSY_ACCESS_TOKEN`；可选 `CRM_XSY_XOQL` 覆盖默认查询语句。`TestIntegrationExchangeThenQueryXOQL` 为「获取 token + XOQL」一条链路。

---

## 一、浏览器授权（authorize）— query 参数说明

授权跳转由 `BuildAuthorizeURL` 生成，基址为 `oauthBaseUrl` + `authorizePath`（默认 `/auc/oauth2/authorize`）。

以下为 **sandbox 文档用写死示例**（与 Postman/联调一致时可对照；`state` 建议每次随机生成防 CSRF）。

| 参数名 | 写死示例值 | 说明 |
|--------|------------|------|
| `response_type` | `code` | 授权码模式 |
| `client_id` | `627ca790c252ac82d8add19e7dc1e587` | 应用 Client ID |
| `redirect_uri` | `https://www.baidu.com` | 必须与开放平台配置一致（URL 编码后参与请求） |
| `scope` | `all` | 权限范围（示例与 token 响应一致） |
| `oauthType` | （空） | 平台可选扩展；无则省略或空字符串 |
| `access_type` | （空） | 平台可选扩展；无则省略或空字符串 |
| `state` | （每次随机） | 可选；防 CSRF，回调时原样带回 |

用户登录同意后，浏览器重定向到 `redirect_uri`，query 中带 **`code`**（一次性授权码，极短有效期）。

---

## 二、获取 token 接口 — `POST …/auc/oauth2/token`

### HTTP 约定

- **Method**：`POST`
- **完整 URL（query）**：`{oauthBaseUrl}/auc/oauth2/token?{query}`
- **Header**：`Content-Type: application/x-www-form-urlencoded`
- **Body**：空（参数全部在 query）

### Query 参数（文档写死示例）

| 参数名 | 写死示例值 | 说明 |
|--------|------------|------|
| `grant_type` | `authorization_code` | 固定 |
| `client_id` | `627ca790c252ac82d8add19e7dc1e587` | 与授权页一致 |
| `client_secret` | `46ffe3d342308d8a5e9b91903eaad7d3` | **密钥勿提交公开仓库；生产用环境变量** |
| `redirect_uri` | `https://www.baidu.com` | 必须与授权请求一致 |
| `code` | `jDrFfG0` | **一次性**，仅作示例；真实联调需用回调里的新 `code` |

### 成功响应 JSON 结构（示例）

获取 token 成功后响应体为 JSON，字段含义如下（与 `TokenResponse` 对齐）。

```json
{
  "access_token": "ce5d4a2e89b6e6902a21e9c550f83e1dccf616825b17fa890f220aa1dd4bb5c4.MzQxMDUyNDA5NTY3NzQyNA==0",
  "token_type": "Bearer",
  "expires_in": 7199,
  "scope": "all",
  "tenant_id": "3410524095677424",
  "login_type": "",
  "encryption_key": "",
  "client_id": "627ca790c252ac82d8add19e7dc1e587",
  "passport_id": "4286900281295829",
  "mobile_params": "",
  "instance_uri": "api-sandbox.xiaoshouyi.com"
}
```

| 字段 | 说明 |
|------|------|
| `access_token` | 后续调用数据接口时放入 `Authorization`（见下节）；可能含 `.` 与 Base64 片段 |
| `token_type` | 一般为 `Bearer` |
| `expires_in` | 秒；约 7199 表示约 2 小时 |
| `scope` | 授权范围 |
| `tenant_id` | 租户 |
| `instance_uri` | 数据 API 主机名（与配置的 `apiBaseUrl` 应一致或用于校验） |
| `client_id` / `passport_id` 等 | 平台扩展字段 |

失败时可能返回 OAuth2 风格 `error` / `error_description`（`TokenResponse` 已预留字段）。

---

## 三、XOQL 查询 — `POST …/rest/data/v2.0/query/xoql`

### HTTP 约定

- **Method**：`POST`
- **URL**：`{apiBaseUrl}/rest/data/v2.0/query/xoql`
- **Header**：
  - `Content-Type: application/x-www-form-urlencoded`
  - `Authorization`: 值为 **`access_token` 原文**（与 Postman 一致；示例见下）
- **Body**：`application/x-www-form-urlencoded`，字段如下

### 表单字段（文档写死示例）

| 字段名 | 写死示例值 |
|--------|------------|
| `xoql` | `select id, accountName, ownerId.name from account where accountName = '测试'` |

### Authorization 写死示例（与某次获取 token 结果一致，仅作格式参考）

```
ce5d4a2e89b6e6902a21e9c550f83e1dccf616825b17fa890f220aa1dd4bb5c4.MzQxMDUyNDA5NTY3NzQyNA==0
```

### 成功响应 JSON 结构（示例）

与 `XOQLQueryResponse` / `XOQLData` 对齐；业务成功时 `code` 为字符串 `"200"`。

```json
{
  "code": "200",
  "msg": null,
  "errorInfo": null,
  "debugInfo": null,
  "data": {
    "totalSize": 1,
    "count": 1,
    "records": [
      {
        "id": "3461908724664363",
        "accountName": "测试",
        "ownerId.name": "姚玉婷"
      }
    ]
  }
}
```

| 字段 | 说明 |
|------|------|
| `code` | 业务码；`"200"` 表示成功 |
| `msg` / `errorInfo` / `debugInfo` | 错误或调试信息；成功时常为 `null` |
| `data.totalSize` | 总条数（语义以平台为准） |
| `data.count` | 当前返回条数 |
| `data.records` | 行数组；字段名与 XOQL 所选列一致，关联字段可能为 `ownerId.name` 形式 |
| `records` 中单行 | `map[string]interface{}` 解析，动态字段 |

---

## 四、Go 调用顺序（最小）

```go
cli := xiaoshouyi.NewFromCfg(ctx)
tr, err := cli.GetCRMToken(ctx, "从回调 URL 解析的 code", "")
auth, err := xiaoshouyi.MustGetAccessTokenForQuery(tr)
res, err := cli.QueryXOQL(ctx, auth, "select id from account limit 1")
```

`sandbox` 基址示例：`oauthBaseUrl=https://login-sandbox.xiaoshouyi.com`，`apiBaseUrl=https://api-sandbox.xiaoshouyi.com`（见各环境 `manifest/config/config.*.yaml` 中 `crm.xiaoshouyi`）。
