# GROUP BY 子句语法
**更新时间: 2025-12-31 11:33:49**

## 作用
用于实现按指定字段进行分组统计，而不需要返回所有数据。GROUP BY 子句需要配合聚合函数使用，例如 SUM、MAX。 关于聚合函数的详细信息请参考[支持的聚合函数](https://doc.xiaoshouyi.com/xoql_supportedAggregateFunctions.html)。

## 语句结构
```plain
SQL

GROUP BY {fieldGroupByList}
```

| **参数** | **说明** |
| --- | --- |
| fieldGroupByList | 指定按照哪些字段进行分组，可以按照一个或者多个字段进行分组，多个字段之间使用逗号进行分隔。 |


## 示例
```plain
SQL

SELECT COUNT(accountName)
FROM account
GROUP BY state
```

查询语句中的聚合字段支持使用字段别名，例如：

```plain
SQL

SELECT COUNT(accountName) amount
FROM account
GROUP BY state
```

