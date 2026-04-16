# 开放 API：创建订单（对外版）

本文档供**外部系统 / ISV / 企业自建商城**通过 HTTP API 在本平台创建销售订单。阅读对象为实现对接的开发人员。

---

## 1. 概述

| 项 | 说明 |
|----|------|
| 协议 | HTTPS |
| 数据格式 | `application/json; charset=utf-8` |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601，建议使用 UTC，例如 `2026-04-15T08:30:00Z`；**日期字段**（如授权起止）可使用 `YYYY-MM-DD` |
| API 版本 | 建议在路径中包含主版本号，例如 `/v1/orders` |

**说明**：下文路径以 `/v1` 为前缀；实际部署时由贵司网关统一替换为正式域名与前缀（如 `https://api.example.com/wps365/v1`）。

---

## 2. 接入与认证

### 2.1 凭证申请

外部接入前需向平台运营申请：

- **环境**：沙箱（Sandbox）与生产（Production）各一套凭证（或同一套按网关区分）。
- **认证方式**（二选一或组合，以贵司最终开放策略为准）：
  - **Bearer Token**：OAuth2 Client Credentials 换取的 `access_token`；
  - **或 API Key**：`X-Api-Key` + `X-Api-Secret`（仅服务端保存 Secret，禁止写入前端）。

文档示例统一使用 **Authorization Bearer**。

### 2.2 必选请求头

| 头名称 | 必填 | 说明 |
|--------|------|------|
| `Authorization` | 是 | `Bearer <access_token>` |
| `Content-Type` | 是 | `application/json` |
| `Idempotency-Key` | **强烈建议** | UUID v4；相同 Key 在有效期内重复请求应返回**同一笔订单**，避免重复下单 |

---

## 3. 创建订单

### 3.1 基本信息

```
POST /v1/orders
```

**功能**：提交一笔新订单；服务端校验主数据、计价、权限后落库，并返回订单主档及行明细。

### 3.2 请求体 `CreateOrderRequest`

根对象字段说明如下。**是否必填**可能随 `buyerType`（买方类型）变化，见 §3.5。

#### 3.2.1 订单头（买方 / 来源 / 备注）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `buyerType` | string | 是 | 买方类型，见 §4.1 枚举 |
| `orderSource` | string | 是 | 订单来源，见 §4.2；外部开放对接建议固定为 `APISync` |
| `customerId` | string | 条件 | **终端客户**主数据 ID。`buyerType=Customer` 或渠道单需关联终客时必填 |
| `buyerId` | string | 条件 | **实际签约买方** ID：`Channel` 时为渠道 ID；`Customer` 时通常与 `customerId` 相同，也可由服务端约定 |
| `orderRemark` | string | 否 | 订单备注 |
| `originalOrderId` | string | 否 | 续费/变更场景下的原订单号 |
| `opportunityId` | string | 否 | 商机 ID |
| `linkedContractIds` | string[] | 否 | 关联合同 ID 列表，最多条数以平台策略为准 |

#### 3.2.2 组织与人员

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `salesRepId` | string | 否* | 销售代表用户 ID；*是否必填由贵司审批流策略决定 |
| `businessManagerId` | string | 否 | 商务经理用户 ID |
| `creatorId` | string | 否 | 创建人；不传则取 Token 对应主体 |
| `purchasingContactId` | string | 否 | 客户采购联系人 ID |
| `itContactId` | string | 否 | 客户 IT 联系人 ID |

#### 3.2.3 渠道扩展（`buyerType=Channel`）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `directChannel` | string | 否 | 直销通路描述 |
| `terminalChannel` | string | 否 | 终端通路描述 |

#### 3.2.4 自成交（`buyerType=SelfDeal`）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `orderEnterpriseId` | string | 是 | 企业主数据 ID（或贵司约定的企业标识） |
| `isAgentOrder` | boolean | 否 | 是否代理单 |
| `agentCode` | string | 否 | 代理编码 |

#### 3.2.5 交付与收货

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `deliveryMethod` | string | 否 | `Online` \| `Offline` \| `Hybrid` |
| `shippingAddress` | string | 否 | 收货地址 |
| `shippingPhone` | string | 否 | 收货电话 |
| `shippingEmail` | string | 否 | 收货邮箱 |
| `receivingParty` | string | 否 | 收货人/单位 |
| `receivingCompany` | string | 否 | 收货公司 |
| `receivingMethod` | string | 否 | 收货方式说明 |

#### 3.2.6 发票 `invoice`（对象，可选）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 否 | 发票类型，如 `VAT_Special`（专票）等，以平台枚举为准 |
| `content` | string | 否 | 发票内容 |
| `title` | string | 否 | 发票抬头 |
| `taxId` | string | 否 | 税号 |
| `bankName` | string | 否 | 开户行 |
| `accountNumber` | string | 否 | 银行账号 |

#### 3.2.7 验收 `acceptance`（对象，可选）

推荐由调用方传**按行**的验收计划，服务端汇总为内部验收配置。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `acceptanceInfo` | object | 否 | 整单验收联系人：`contactName`, `contactPhone`, `method` 等 |
| `lineAcceptancePlans` | array | 否 | 与 `items` 下标对齐的数组，每项含 `method`（如一次性/分期）、`condition`、`expectedDate`、`percentage` 等 |

若暂不对接验收，可省略；服务端可采用默认一次性验收策略（以实际实现为准）。

#### 3.2.8 结算 `settlement`（对象，可选）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `settlementMethod` | string | 否 | `cash` \| `credit` \| `prepaid` |
| `settlementType` | string | 否 | `once` \| `installment`（赊销分期时使用） |
| `expectedPaymentDate` | string | 否 | `YYYY-MM-DD` |
| `installmentPlans` | array | 否 | `{ amount, expectedDate, actualDate?, paidAmount? }[]` |

#### 3.2.9 折算 / 关联老单 `conversion`（对象，可选）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | boolean | 否 | 是否启用折算 |
| `deductionAmount` | number | 否 | 折算抵扣金额 |
| `sourceOrderIds` | string[] | 否 | 关联原订单号列表 |

#### 3.2.10 订阅上下文 `subscriptionContext`（对象，可选）

从「续费管理」类能力发起续费/增购时携带，便于审计与幂等。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `subscriptionId` | string | 条件 | 平台订阅编号，如 `SUB-201000` |
| `mode` | string | 条件 | `renew` \| `addon` |

#### 3.2.11 订单行 `items`（数组，**必填**，至少 1 条）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `lineKey` | string | 否 | 调用方幂等行键；重试时便于对齐同一逻辑行 |
| `merchandiseId` | string | 否 | 商品包/目录行 ID，若从标准商品包下单则填 |
| `productId` | string | 是 | 产品主数据编码/ID（与主数据一致） |
| `skuId` | string | 是 | SKU ID |
| `pricingOptionId` | string | 否 | 计价项 ID；不传时由服务端按默认价格项解析 |
| `quantity` | integer | 是 | ≥ 1 |
| `priceAtPurchase` | number | 是 | 成交单价，≥ 0；**服务端应再次按价目表校验**，不一致时返回错误或可配置为「以服务端为准」 |
| `purchaseNature` | string | 否 | `New` \| `Renewal` \| `AddOn` \| `Upgrade`；不传时服务端可按订阅规则推断 |
| `purchaseNature365` | string | 否 | 365 侧订购性质，通常与 `purchaseNature` 一致 |
| `licenseType` | string | 否 | 授权类型展示名；可由 `pricingOptionId` 推导 |
| `licensePeriod` | string | 否 | 如 `1年`、`2年`、`永久` |
| `licenseStartDate` | string | 否 | `YYYY-MM-DD` |
| `licenseEndDate` | string | 否 | `YYYY-MM-DD` |
| `activationMethod` | string | 否 | 如 `Account`、`SerialKey`、`AccountAndSerialKey` |
| `mediaCount` | integer | 否 | 介质数量，默认 1 |
| `installPackageType` | string | 否 | `通用` \| `定制` |
| `installPackageName` | string | 否 | 安装包名称 |
| `installPackageLink` | string | 否 | 定制包链接 URL |
| `enterpriseId` | string | 否 | 被授权企业 ID |
| `enterpriseName` | string | 否 | 建议以服务端主数据为准回填 |
| `licensee` | string | 否 | 被授权方名称 |
| `lineRemarks` | string | 否 | 行备注 |

**快照策略**：`productName`、`skuName`、`capabilitiesSnapshot` 等展示字段建议**仅由服务端在落库时从主数据生成**，外部请求不必传；若传入则可用于**对账校验**（与主数据不一致时返回 `422`）。

---

## 4. 枚举说明

### 4.1 `buyerType`（买方类型）

| 值 | 含义 |
|----|------|
| `Customer` | 直销终端客户 |
| `Channel` | 渠道下单 |
| `SelfDeal` | 自成交 |
| `Direct` | 直销（若与 Customer 并存，以主数据定义为准） |
| `RedeemCode` | 兑换类 |

### 4.2 `orderSource`（订单来源）

| 值 | 含义 |
|----|------|
| `Sales` | 销售录入 |
| `ChannelPortal` | 渠道门户 |
| `OnlineStore` | 在线商店 |
| `APISync` | **开放 API / 外部系统同步**（推荐外部固定此值） |
| `Renewal` | 续费场景 |

### 4.3 `deliveryMethod`

| 值 | 含义 |
|----|------|
| `Online` | 线上交付 |
| `Offline` | 线下交付 |
| `Hybrid` | 混合 |

---

## 5. 响应

### 5.1 成功 `201 Created`

- **Body**：订单完整资源对象（建议与内部 `Order` 模型字段对齐），至少包含：
  - `id`：平台订单号  
  - `date`：创建时间  
  - `status`：初始状态（如待审批 `PENDING_APPROVAL`）  
  - `total`：服务端重算后的含税/协议总额  
  - `items[]`：含服务端补全后的名称、快照等  
- **Header**（推荐）：`Location: https://{host}/v1/orders/{id}`

### 5.2 错误响应（统一信封，示例）

HTTP 状态码与 `code` 对应关系由贵司统一规范；以下为常见场景。

| HTTP | `code`（示例） | 说明 |
|------|----------------|------|
| 400 | `INVALID_ARGUMENT` | 参数缺失、类型错误、JSON 非法 |
| 401 | `UNAUTHENTICATED` | Token 无效或过期 |
| 403 | `PERMISSION_DENIED` | 无权为该客户/渠道下单 |
| 404 | `NOT_FOUND` | `customerId` / `productId` / `skuId` 等主数据不存在 |
| 409 | `ALREADY_EXISTS` | 相同 `Idempotency-Key` 已创建订单（可返回已有订单 ID） |
| 422 | `BUSINESS_RULE_VIOLATION` | 价格与价目不匹配、库存/席位不足、订阅推断冲突等 |
| 429 | `RATE_LIMITED` | 限流 |
| 500 | `INTERNAL` | 服务端异常 |

**Body 示例结构**：

```json
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "单价与当前价目表不一致",
    "details": [
      { "field": "items[0].priceAtPurchase", "reason": "PRICE_MISMATCH", "allowedMax": 49900 }
    ],
    "requestId": "req-9f3c2a1b"
  }
}
```

---

## 6. 请求示例

### 6.1 终端客户直单（最小字段）

```http
POST /v1/orders HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
Idempotency-Key: 7c9e6679-7425-40de-944b-e07fc1f90ae7
```

```json
{
  "buyerType": "Customer",
  "orderSource": "APISync",
  "customerId": "C-00150232",
  "buyerId": "C-00150232",
  "salesRepId": "u1",
  "deliveryMethod": "Online",
  "items": [
    {
      "productId": "AB0000841",
      "skuId": "SKU0013541",
      "pricingOptionId": "po-SKU0013541",
      "quantity": 100,
      "priceAtPurchase": 499,
      "purchaseNature": "New",
      "purchaseNature365": "New",
      "licensePeriod": "1年",
      "activationMethod": "Account",
      "mediaCount": 1,
      "installPackageType": "通用"
    }
  ]
}
```

### 6.2 cURL

```bash
curl -sS -X POST "https://api.example.com/v1/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d @order.json
```

---

## 7. 幂等与重试

1. 每次下单生成新的 `Idempotency-Key`；**网络超时后重试应使用同一 Key**，直到收到明确 `201` 或 `409` 携带已创建订单信息。  
2. 服务端对同一 Key 的并发请求应**串行化或去重**，保证最多创建一笔业务订单。  
3. Key 建议有效期 24～72 小时（由平台配置）。

---

## 8. 安全与合规

- Secret 与 Token **禁止**写入浏览器或移动 App 明文存储。  
- 生产环境**强制 HTTPS**；建议对 IP 白名单、签名（如 HMAC-SHA256 对 body 签名）做第二层防护。  
- 日志中应对 `Authorization`、银行账号等字段脱敏。

---

## 9. 版本与变更

- 破坏性变更应升级路径版本（`/v2/orders`），旧版本保留至少一个约定期。  
- 建议在响应头增加 `X-Api-Version: 2026-04-15` 或 SemVer，便于排障。

---

## 10. 联系与支持

- **沙箱联调**：向平台申请沙箱 Base URL、测试凭证、测试客户/产品主数据。  
- **错误码表**：完整列表以贵司开放平台门户为准；本文档为业务字段级说明。

---

*文档版本：2026-04-15 · 与当前前端「新建订单」向导数据结构对齐，实际路径与枚举以发布环境 OpenAPI 为准。*
