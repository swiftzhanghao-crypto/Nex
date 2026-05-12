# XOQL 生成 SQL 规范（skill 内置版）

本规范用于约束“生成 XOQL 查询语句”时的最小正确性与可运维性，适用于：
- `QueryXOQL`
- `QueryXOQLPaged`
- demo SQL 查询接口

## 1. 基础语法规则（必须）

来源：`references/xoql/XOQL语法结构/XOQL语法结构.md`

- 语句必须以 `SELECT` 开始，核心骨架为：`SELECT ... FROM ...`
- 不允许 `SELECT *`
- `FROM` 后只能是对象 API 名称，不支持子查询作为 `FROM` 源
- 语句总长度不超过 20000 字符
- 字段/API 名称必须使用对象与字段的 API Name，不用展示名

建议模板：

SELECT field_list
FROM object_api
WHERE ...
GROUP BY ...
ORDER BY ...
LIMIT ...
OFFSET ...

## 2. WHERE 条件规范（必须）

来源：`references/xoql/XOQL语法结构/WHERE子句语法.md`

- `conditionExpression` 最多 4000 字符
- 多条件必须显式使用 `AND` / `OR`，复杂条件用括号
- 日期/时间条件保持与字段口径一致（部分场景为毫秒时间戳）
- `LIKE` 仅用于字符串字段，值必须单引号包裹

## 3. ORDER BY / LIMIT / OFFSET 规范（必须）

来源：
- `references/xoql/XOQL语法结构/ORDERBY子句语法.md`
- `references/xoql/XOQL语法结构/LIMIT子句语法.md`
- `references/xoql/XOQL语法结构/OFFSET子句语法.md`
- `references/xoql/查询规范补充/查询结果说明.md`

- 分页查询时必须带稳定排序（建议时间字段 + 主键次排序）
- 单对象单次最大返回 3000 条（父子记录总和也受 3000 限制）
- `LIMIT/OFFSET` 分页必须与 `ORDER BY` 配合，否则翻页不稳定
- 深分页成本高，优先增量条件而不是过深 offset

## 4. GROUP BY 与聚合函数规范（必须）

来源：
- `references/xoql/XOQL语法结构/GROUPBY子句语法.md`
- `references/xoql/XOQL语法结构/支持的聚合函数.md`

- 使用聚合函数且同时返回非聚合字段时，必须 `GROUP BY` 非聚合字段
- 支持聚合函数：`AVG` / `COUNT` / `COUNT_DISTINCT` / `MIN` / `MAX` / `SUM`
- `COUNT()` 空参数写法不支持，必须 `COUNT(field)`

## 5. 字段类型专项规范（必须）

来源：
- `references/xoql/查询规范补充/单选和多选字段的查询方式.md`
- `references/xoql/查询规范补充/多态字段的查询方式.md`

- 单选/多选字段：明确是否需要 code 值（`useSimpleCode=true`）还是文本值
- 多态字段：
  - 作为返回字段时，注意 `_compound` 与拆分字段返回结构
  - 作为过滤条件时，不直接用 `_compound`，而用对象 ID / 数据 ID 字段

## 6. 结果处理规范（必须）

来源：`references/xoql/查询规范补充/查询结果说明.md`

- 返回是 JSON 字符串语义，业务层需按字段类型做必要转换
- 不应依赖 value 为 NULL 的行为（通常 key/value 不会出现 NULL 形态）
- 未显式 `ORDER BY` 时，结果顺序不保证稳定

## 7. 安全与接口边界（必须）

来源：`docs/xsy/接口文档.md` 与技能经验

- demo SQL 接口只允许只读 `SELECT`
- 拒绝 `UPDATE/INSERT/DELETE/DROP/ALTER/TRUNCATE` 等关键字
- 限制 SQL 最大长度（建议 2000）
- 对外暴露前必须接入鉴权与调用限流

## 8. 生成 SQL 前检查清单（执行）

1) 是否 `SELECT ... FROM ...`，且未使用 `*`  
2) 字段和对象是否为 API 名称  
3) 分页是否同时具备 `ORDER BY + LIMIT + OFFSET`  
4) 聚合与 `GROUP BY` 是否匹配  
5) 单选/多选、多态字段是否按规范使用  
6) 是否超过平台/接口约束（长度、返回条数、只读限制）
