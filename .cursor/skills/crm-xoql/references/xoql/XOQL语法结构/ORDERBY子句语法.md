# ORDER BY 子句语法

## 1. 作用

`order by` 用于结果排序，可指定升序或降序。

## 2. 基本写法

- 升序：`order by 字段 asc`
- 降序：`order by 字段 desc`

示例：

select id, name, updatedAt
from account
where updatedAt >= 1745251200000
order by updatedAt desc;

## 3. 多字段排序

可按优先级依次声明：

order by deptRef__c asc, moneyW__c desc;

## 4. 分页场景建议

- 与 `limit/offset` 配合时必须有稳定排序字段
- 推荐优先使用时间戳或主键作为次排序，避免翻页重复/遗漏

## 5. 获取来源

- https://doc.xiaoshouyi.com/?sso-domain=login-sandbox.xiaoshouyi.com#/proMan/workplaceDetailApi?url=%2F%2Fconcepts%2Fxoql_orderByClauseSyntax.html&id=1488&dir=output_1767152029920&time=1777432534869
