# XOQL 错误码

## 1. 错误码总表（当前可获取到的全部）

| 错误码/错误标识 | 含义 | 备注 |
| :--- | :--- | :--- |
| `200` | 成功 | 可能返回为数字 `200` |
| `"200"` | 成功 | 可能返回为字符串 `"200"` |
| `"290007"` | internal server error | 来源于 XOQL 调用失败示例 |
| `500` | 服务端错误 | 来源于相关接口失败示例 |
| `signature required` | 缺少签名 | 请求未传 `sign` |
| `signature expired` | 签名过期 | `timestamp` 超出有效期 |
| `Invalid signature` | 签名无效 | 签名校验不通过 |

## 2. XOQL 返回结构（原始形态）

XOQL 常见返回字段：

- `code`
- `msg`
- `errorInfo`
- `debugInfo`
- `data`

失败示例（原始格式）：

{
  "code": "290007",
  "msg": "internal server error",
  "errorInfo": null,
  "debugInfo": null,
  "data": null
}

## 3. 代码判定兼容

成功判断需要兼容：

- `code == 200`
- `code == "200"`

## 4. 来源明细

### 4.1 你提供的 XOQL 错误码来源页

- https://doc.xiaoshouyi.com/?sso-domain=login-sandbox.xiaoshouyi.com#/proMan/workplaceDetailApi?url=%2F%2Fconcepts%2Fxoql_errorCode.html&id=1488&dir=output_1767152029920&time=1777433007567

### 4.2 本仓库已存在原始样例来源

- `docs/xsy-api.md`
  - `"code": "200"`
  - `"code": "290007"`
- `docs/商机风险过程提醒-技术方案.md`
  - `code: 200`
  - `code: 500`
  - `signature required`
  - `signature expired`
  - `Invalid signature`

## 5. 说明

由于来源链接为登录态页面，当前会话无法直接抓取到页面正文；本文件中的错误码已基于仓库内可核验原始文本进行全量回填。
## 6. XOQL 错误码明细（原文去色版）

更新时间: 2025-12-31 11:33:49

| 错误码 | 返回信息 | 错误说明 |
| --- | --- | --- |
| 290000 | a valid expression is required | XOQL 表达式为空 |
| 290001 | unknown error parsing query | XOQL 语法格式错误 |
| 290002 | character ‘*' is not supported | 不支持使用 * 查询所有字段 |
| 290003 | no such column [AAA] on entity [Account] | 对象上没有该字段 |
| 290004 | query filter is longer than then 4,000 characters | 查询条件长度超过最大限制 |
| 290005 | no more than 5 parent-to-child relationships can be specified in a query | 向下关联查询子对象个数超出上限 |
| 290006 | no more than 35 child-to-parent relationships can be specified in a query | 向上关联查询字段数量超出上限 |
| 290007 | internal server error | 服务器内部错误 |
| 290008 | entity [AAA] is not supported | 所查对象不存在 |
| 290009 | long xoql, no more then 20,000 characters | XOQL 表达式长度超出最大限制 |
| 290010 | a relationship is required in sub-query | 子查询中不包含指定关系 |
| 290011 | cannot query foreign key relationships more than 4 levels away from the root entity | 向上查询穿透超过 4 级 |
| 290012 | the number of request records exceeds the maximum limit | 请求记录数超出最大限制 |
| 290013 | no such relation column [{0}] on entity [{1}] | 对象上没有该关联关系（关联字段） |
| 290014 | no entity [{0}] access rights | 对象没有访问权限 |

