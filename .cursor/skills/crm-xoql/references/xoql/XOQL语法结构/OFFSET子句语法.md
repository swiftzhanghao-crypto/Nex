# OFFSET 子句语法

## 1. 作用

`offset` 用于指定结果偏移量，常与 `limit` 配合实现分页。

## 2. 基本写法

limit 50 offset 0;

含义：从第 0 条开始，取 50 条。

## 3. 分页示例

第一页：

limit 50 offset 0

第二页：

limit 50 offset 50

第三页：

limit 50 offset 100

## 4. 注意事项

- 必须搭配稳定 `order by`，否则翻页结果可能不稳定
- 深分页成本较高，必要时控制最大页码
- 批量同步场景建议用增量条件代替过深 offset

## 5. 获取来源

- https://doc.xiaoshouyi.com/?sso-domain=login-sandbox.xiaoshouyi.com#/proMan/workplaceDetailApi?url=%2F%2Fconcepts%2Fxoql_offsetClauseSyntax.html&id=1488&dir=output_1767152029920&time=1777432559181
