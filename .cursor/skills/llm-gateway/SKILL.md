---
name: llm-gateway
description: >-
  LLM 网关接入技能（GoFrame 后端）。沉淀自 server/internal/service/llm：统一配置加载、
  Chat Completions 调用、流式消费、JSON 结果提取、API/Controller/Service 三层接线。
  适用于在业务接口中快速接入可配置的大模型能力并保持可运维性。Use when LLM, 大模型, chat completions,
  AI Gateway, 流式输出, GoFrame AI 接入.
---

# LLM Gateway 接入技能

本技能用于将 `it-ai-base` 中已实践的 LLM 网关接入模式迁移到其他 GoFrame 后端项目。

核心覆盖：
- `llm.gateway.*` 配置约定与初始化策略。
- Chat Completions 同步/流式调用。
- 业务层“提示词 + JSON 数据”输入与“结构化 JSON 输出”解析。
- API、Controller、Service 的最小闭环示例。

## 适用场景

- 需要在业务接口中调用大模型，并通过网关统一鉴权与治理。
- 需要模型名可配置，并支持请求级覆盖模型。
- 需要把模型输出尽量收敛为可反序列化 JSON，便于后续业务处理。

## 不包含的内容

- 不包含复杂 Agent 编排、多工具调用框架。
- 不包含向量检索、知识库构建、RAG 数据管道。
- 不替代项目内统一鉴权、审计、限流策略。

## 快速导航

- 集成场景与实施步骤：`references/场景与集成说明.md`
- 接口契约与排障建议：`references/接口契约与排障.md`
- LLM 服务示例：`examples/llm_service_example.go`
- API 与控制器示例：`examples/llm_api_controller_example.go`
- 配置示例：`examples/config.llm.example.yaml`

## 推荐落地顺序

1) 按 `examples/config.llm.example.yaml` 配置网关连接参数。
2) 落地 `examples/llm_service_example.go`，先打通最小 `Query` 能力。
3) 参考 `examples/llm_api_controller_example.go` 挂路由并联调。
4) 结合 `references/接口契约与排障.md` 加强超时、重试、错误日志与敏感信息保护。

## 来源映射

- API 契约：`server/api/llm/v1/query.go`
- Controller 接线：`server/internal/controller/llm/llm_v1_query.go`
- 核心服务：`server/internal/service/llm/llm.go`
- 配置示例：`server/manifest/config/config.dev.yaml`
