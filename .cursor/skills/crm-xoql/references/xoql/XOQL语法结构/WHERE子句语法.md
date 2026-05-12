# WHERE 子句语法
**更新时间: 2025-12-31 11:33:49**

## 作用
用于指定数据查询的条件。

如果不使用 WHERE 子句，则返回所查询对象上的全部数据。

## 语句结构
```plain
SQL

WHERE conditionExpression
```

| **参数** | **说明** |
| --- | --- |
| conditionExpression | 条件表达式，用于指定数据查询条件。<br/>conditionExpression 最多可包含 4000 个字符。 |


## 条件表达式语法
```plain
SQL

fieldExpression [logicalOperator fieldExpression2][...]
```

| **参数** | **说明** |
| --- | --- |
| fieldExpression | 条件表达式 1 |
| logicalOperator | 逻辑运算符 |
| fieldExpression2 | 条件表达式 2 |


**说明**

+ 在条件表达式中可以只包含一个条件。例如：

```plain
SQL

SELECT accountName
FROM account
WHERE accountName LIKE '仁%'
```

+ 在条件表达式中可以有多个条件，使用逻辑运算符指定多个条件之间的关系，目前支持 AND、OR。例如：

```plain
SQL

SELECT id
FROM account
WHERE accountName LIKE '仁%'
  AND address = '北京市朝阳区复兴国际中心'
```

+ 对于日期和日期时间类型的字段，在条件表达式中可以使用字符串、日期绝对值、日期函数。例如 ：

```plain
SQL

SELECT id
FROM account
WHERE createdAt > 1192929933
```

+ 当条件表达式中有多个条件时，可以使用圆括号指定多个条件之间的逻辑判断顺序。例如：

```plain
SQL

SELECT id
FROM account
WHERE accountName LIKE '仁%'
  AND (address LIKE '北京%' OR address LIKE '上海%')
```

## 字段表达式语法
```plain
SQL

fieldName comparisonOperator value
```

| **参数** | **说明** |
| --- | --- |
| fieldName | 需要判断字段的名称（API 名称）。<br/>支持作为判断字段的字段类型请参考[支持在查询条件中使用的字段类型](https://doc.xiaoshouyi.com/xoql_supportedFieldTypesInQueryConditions.html)。 |
| comparisonOperator | 比较运算符。 |
| value | 所判断字段需要满足的值。<br/>对于日期类型字段：<br/>支持的最小值为：1700-01-01T00:00:00<br/>支持的最大值为：4000-12-31T00:00:00 |


**支持的比较运算符**

| **比较运算符** | **说明** |
| --- | --- |
| = | 如果 fieldName 与 value 相等，表达式返回 true。 |
| != | 如果 fieldName 与 value 不相等，表达式返回 true 。 |
| < | 如果 fieldName 小于 value ，表达式返回 true 。 |
| <= | 如果 fieldName 小于或等于 value ，表达式返回 true 。 |
| > | 如果 fieldName 大于 value ，表达式返回 true 。 |
| >= | 如果 fieldName 大于或等于 value ，表达式返回 true 。 |
| Like | 如果 fieldName 匹配到 value ，表达式返回 true 。Like 与 SQL 中的 Like 类似，用于实现匹配部分文本字符串，支持通配符。<br/>通配符 % 匹配 0 个或多个字符。<br/>通配符_匹配一个字符。<br/>Like 表达式后的 value 必须使用单引号。<br/>Like 表达式仅支持 String 类型的字段。 |

