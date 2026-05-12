# LIMIT 子句语法

## 1. 作用

`limit` 用于限制返回记录数量，常用于分页和接口限流。

## 2. 基本写法

limit 50;

含义：最多返回 50 条记录。

## 3. 与分页结合

推荐与 `order by`、`offset` 配合：

select id, name, updatedAt
from account
order by updatedAt desc
limit 50
offset 0;

## 4. 实践建议

- 限制单次返回条数，避免超大响应
- 对外接口建议设置最大 `limit`（例如 500）
- 数据量大时使用循环翻页拉取

## 5. 获取来源

- https://doc.xiaoshouyi.com/?sso-domain=login-sandbox.xiaoshouyi.com#/proMan/workplaceDetailApi?url=%2F%2Fconcepts%2Fxoql_limitClauseSyntax.html&id=1488&dir=output_1767152029920&time=1777432549471
