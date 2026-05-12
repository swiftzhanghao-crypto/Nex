---
name: crm-xoql
description: >-
  汇联易/销售易 CRM XOQL 集成技能（后端 GoFrame）。覆盖 token 获取、XOQL 单次/分页查询、
  Authorization 与 xsy-criteria 约定、错误码兼容、以及 demo SQL 查询接口落地。沉淀自 docs/xsy 与
  server/internal/service/crm/xsy_service.go；risk_board 仅保留演示接口，不绑定具体业务看板。
  Use when 汇联易, 销售易, xsy, XOQL, access_token, CRM 集成, GoFrame CRM 查询.
---

# 汇联易 CRM XOQL 集成技能

本技能用于把当前仓库已验证的 CRM 接入经验迁移到其他项目，重点覆盖三类能力：
- 获取与缓存 access token（password 模式）。
- 执行 XOQL（单次 + 自动分页聚合）。
- 输出可直接挂路由的 demo SQL 接口（仅演示，不携带风险看板业务口径）。

## 强制规范（生成 SQL 前必读）

当你需要“生成/改写 XOQL SQL”时，必须先遵守：
- `references/XOQL生成SQL规范.md`

该规范已在 skill 内置，包含语法、分页、聚合、字段类型（单选/多选、多态）与结果处理约束。  
未满足规范时，不应输出 SQL。

本技能路径以 `.agents/skills/crm-xoql/` 为根目录。

## 适用场景

- 新项目首次接入汇联易/销售易 OpenAPI，需要一个稳定的 XOQL 基础层。
- 现有项目已有 CRM 对接，但需要补齐 token 缓存、错误处理、分页查询标准化。
- 需要给前端或联调同学提供一个最小可调用的后端 demo 接口。

## 不包含的内容

- 不包含风险看板等业务聚合算法、白名单权限策略、复杂领域建模。
- 不包含前端 OAuth 跳转页面实现。
- 不替代项目内统一鉴权框架和权限模型。

## 快速导航

- 集成流程与边界说明：`references/场景与集成说明.md`
- 接口契约与排障建议：`references/接口契约与排障.md`
- XOQL 生成 SQL 规范（强制）：`references/XOQL生成SQL规范.md`
- 通用 XOQL 服务示例：`examples/xsy_service_example.go`
- demo 控制器示例：`examples/risk_board_demo_controller.go`
- 配置示例：`examples/config.crm.example.yaml`

## 推荐落地顺序

1) 先按 `examples/config.crm.example.yaml` 准备配置键。
2) 拷贝并改造 `examples/xsy_service_example.go` 为项目内 CRM 基础服务。
3) 按 `examples/risk_board_demo_controller.go` 暴露一个 demo 查询接口做联调验收。
4) 生成/改写 SQL 前，先按 `references/XOQL生成SQL规范.md` 自检。
5) 结合 `references/接口契约与排障.md` 完成错误码、限流、日志补齐。

## 来源映射（便于追溯）

- Token 与 XOQL 核心实现来源：`server/internal/service/crm/xsy_service.go`
- 业务看板上下文来源（仅提炼 demo 思路，不直接复制业务）：`server/internal/service/crm/risk_board.go`
- 控制器接线风格来源：`server/internal/controller/crm/risk_board.go`
- 外部接口文档来源：`docs/xsy/获取token.md`、`docs/xsy/接口文档.md`
- XOQL 规范内置副本：`references/xoql/`
