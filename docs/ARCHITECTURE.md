# 架构说明

## 当前生产架构

```
浏览器 → Vite 构建的 dist/（静态）
              ↓
        server/production.ts (Express)
              ↓
        data/app.db (SQLite)
```

- **认证**：JWT + 可选 WPS SSO Cookie；支持 refresh token
- **权限**：`server/rbac.ts` 矩阵 + 行权限过滤
- **校验**：`server/validate.ts`（Zod）覆盖主要写接口

## 与 `backend/`（Go）的关系

| 项目 | `server/` | `backend/` |
|------|-----------|------------|
| 生产部署 | ✅ 使用 | ❌ 未使用 |
| 技术栈 | Node + Express | Go + Gin |
| 维护状态 | 活跃 | 备选/历史实现 |

若无计划迁移到 Go，可仅将 `backend/` 作为参考，新功能一律在 `server/` 实现。

## 数据模式

- **API 模式**（`VITE_API_MODE=true`）：读写 `data/app.db`
- **Mock 模式**：前端 `data/staticData.ts` + `generators.ts`，不启动 API

## 相关文档

- [README.md](../README.md) — 启动与命令
- [项目结构说明.md](./项目结构说明.md) — 目录与组件清单
