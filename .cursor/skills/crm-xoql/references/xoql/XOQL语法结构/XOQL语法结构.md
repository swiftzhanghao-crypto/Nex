XOQL 查询语句与 SQL 中的 SELECT 语句类似，必须以 SELECT 开始，基本的语句结构为 SELECT ...... FROM ......，其后可以跟一个或多个子句。

+ 一个 XOQL 语句最多可包含 20000 个字符。
+ XOQL 是基于 REST API V2.0 开发，语句中使用的对象 API 名称和字段 API 名称可通过调用相应对象的 description 接口获得，详细信息请参考 **Open API** 文档。除此之外，也可以在销售易系统后台的 **对象和字段** > **对象** 中查看。

XOQL 的语句结构如下：

```plain
SQL

SELECT fieldList [subquery][...]
FROM objectType[...]
[WHERE conditionExpression]
[GROUP BY {fieldGroupByList}
[ORDER BY fieldOrderByList {ASC|DESC}
[LIMIT numberOfRowsToReturn]
[OFFSET numberOfRowsToSkip]
```

下面对语句结构中必须包含的 SELECT 和 FROM 进行详细的说明，其他可选子句的详细信息请参考[WHERE 子句语法](https://doc.xiaoshouyi.com/xoql_whereClauseSyntax.html)、[GROUP BY 子句语法](https://doc.xiaoshouyi.com/xoql_groupByClauseSyntax.html)、[ORDER BY 子句语法](https://doc.xiaoshouyi.com/xoql_orderByClauseSyntax.html)、[LIMIT 子句语法](https://doc.xiaoshouyi.com/xoql_limitClauseSyntax.html)、[OFFSET 子句语法](https://doc.xiaoshouyi.com/xoql_offsetClauseSyntax.html)。

**SELECT**

+ **参数说明**

fieldList：指定查询数据时返回的字段列表， 字段之间用逗号分隔。例如：

```plain
SQL

SELECT id, accountName
FROM account
```

    - fieldList 中的字段名为字段的 API 名称，必须填写正确的 API 名称。
    - 标准对象“订单”的 API 名称为：_order。
    - 支持查询的字段类型请参考[支持查询的字段类型](https://doc.xiaoshouyi.com/xoql_supportedFieldTypes.html)。
+ **其他说明**
    - 对每个查询字段需要有读的权限。
    - 查询结果返回字段的顺序与 Fieldlist 的字段顺序一致。
    - Fieldlist 可以使用聚合函数，例如 count()。关于聚合函数的详细信息请参考[支持使用的聚合函数](https://doc.xiaoshouyi.com/xoql_supportedAggregateFunctions.html)。
    - fieldList 可以包含子查询，关于子查询的详细信息请参考[XOQL关联查询说明](https://doc.xiaoshouyi.com/xoql_jointQueryExplanation.html)。
    - 支持使用别名，例如：

```plain
HTTP

SELECT accountName aname
FROM account
WHERE accountName = '仁科互动'
```

        * 关键字不能使用别名，关键字包括：AND、ASC、DESC、EXCLUDES、FIRST、FROM、GROUP、HAVING、IN、INCLUDES、LAST、LIKE、LIMIT、NOT、NULL、NULLS、OR、SELECT、WHERE、WITH。
        * name 不能作为字段的别名使用。
    - SELECT语句中，不支持使用通配符 *。例如，**不支持**以下查询方式：

```plain
SQL

SELECT * FROM account
```

**FROM**

+ **参数说明**

objectType：指定要查询的对象名称。

+ objectType 中的对象名称为对象的 API 名称，必须填写正确的 API 名称。
+ **其他说明**
    - 对查询对象需要有读的权限。
    - FROM 后不支持子查询和关联查询，即 FROM 后只能跟对象的 API 名称。例如，**不支持**以下查询方式：

```plain
SQL

SELECT accountName
FROM (
    SELECT accountName
    FROM account
) acc
```

