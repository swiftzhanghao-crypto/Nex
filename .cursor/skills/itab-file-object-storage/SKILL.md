---
name: itab-file-object-storage
description: >-
  通用文件上传 / 下载与对象存储接入（前后端一体）。后端统一走 S3 协议（dev = bbolt-store-s3，test/prod = MinIO），
  元数据表 file_object 全局共享，业务表只引用 id；小文件 multipart 同步上传，大文件 presign 三段式直传，
  下载默认 302 到短期预签 GET URL。覆盖后端 Go/GoFrame 契约（server/）与前端 Vue 接入（web/），含 SQLite/MySQL 双方言迁移 SQL 样板。
  Use when 文件上传, 文件下载, 对象存储, 附件, 图片, file_object, biz_scope, presign, multipart, MinIO, S3, bbolt-store-s3.
---

# 文件对象存储（file-object-storage）

在 it-ai-base 的 GoFrame 服务中接入**文件上传 / 下载**与**业务表引用文件**的一体化技能。对象层在 dev 为 **bbolt-store-s3**、在 test/prod 为 **MinIO**，上层只依赖 **S3 协议**；数据库侧在 SQLite/MySQL 双方言下落一张共享元数据表 **`file_object`**，业务表只通过 ID 引用。

本技能**横跨前后端**：

- **后端（`server/`）**：规范、API 契约、服务接口、迁移 SQL —— 权威。与 `.cursor/skills/itab-server/SKILL.md` 的基础约束一致；Go/GoFrame 实现约定见 `.cursor/skills/goframe-v2/SKILL.md`。
- **前端（`web/`）**：与上述契约配合的 Vue 接入（上传、下载、列表回显）。与 `.cursor/skills/itab-client/SKILL.md` 的基础约束一致。

路径若无特殊说明，均**相对本技能根**（`.cursor/skills/itab-file-object-storage/`）。

## 适用范围

- 业务需要**保存/展示文件**（附件、图片、合同、头像、批量导入原始 CSV 等）。
- 业务表只保存 **`file_object.id`**，不直接保存 `bucket/key/url`。
- 上传走**统一文件服务**，业务服务仅做**关联**；鉴权与权限判定集中在文件服务。
- 小文件（< 20 MB）多部分表单上传；大文件走**预签名 PUT + commit** 两段式。
- 下载默认后端校验权限后 **302 到预签 GET URL**，需要脱敏/水印时再切流式透传。

## 命名

| 名称 | 说明 |
|------|------|
| `file_object` | 元数据表；全局共享 |
| `FileObject` | Go 实体；`entity.FileObject` |
| `FileService` | 业务服务层；负责 `Put/Get/Presign/Commit/Delete/Stat` 与权限判定 |
| `pkg/storage` | 低层 S3 客户端抽象（endpoint/bucket/presign） |
| `biz_scope` | 文件业务域标签（如 `customer_attach`、`customer_photo`）；权限分派键 |

## 实现要点（缺一不可）

1. **配置**：`storage.default.driver/endpoint/region/bucket/accessKey/secretKey/usePathStyle/presignTTL`；dev 保留 `storage.default.root` 供 bbolt-store-s3 落盘。
2. **元数据表**：统一 `file_object`，至少含 `id/bucket/object_key/original_name/content_type/size_bytes/sha256/status/biz_scope/owner_user_id/created_at/updated_at/deleted_at`。
3. **业务关联**：多文件用独立关联表（如 `customer_file`），单文件可在业务表直接存 `xxx_file_id BIGINT NULL`。
4. **对象 Key 服务端生成**：`{biz_scope}/{yyyy}/{mm}/{dd}/{uuid}{ext}`；仅保留扩展名，原始文件名入元数据。
5. **两阶段大文件上传**：`presign-upload` 写入 `status=pending` → 前端 PUT 到对象层 → `commit` 由后端 HeadObject 校验、置 `status=ready`。
6. **下载鉴权**：`GET /files/:id` 必走 `MiddlewareAuth`；按 `biz_scope` 分派权限判定；默认 302 到短期预签 URL。
7. **安全**：桶默认 private；不对前端暴露 `endpoint/bucket/object_key`；上传只允许白名单 `biz_scope`；扩展名/MIME 白名单。
8. **可观测性**：`biz_scope`、`file_id`、`owner_user_id`、`size`、`content_type` 必须进业务日志；对象层错误用 `gerror.Wrap` 包装。

## 规范、DDL 与前端

| 主题 | 文档 |
|------|------|
| 后端契约（配置 / 服务接口 / API / 中间件 / 错误） | [references/implementation-spec.md](./references/implementation-spec.md) |
| SQLite + MySQL 双方言 DDL 与关联表样例 | [references/database-schema.md](./references/database-schema.md) |
| 前端接入（小文件 / 大文件 / 下载 / 列表回显） | [references/frontend-integration.md](./references/frontend-integration.md) |

## 示例与最小接入

| 用途 | 位置 |
|------|------|
| 示例索引 | [examples/README.md](./examples/README.md) |
| 最小接入清单 | [examples/integration-checklist.md](./examples/integration-checklist.md) |
| 双方言 SQL 样板 | [examples/sql/sqlite/](./examples/sql/sqlite/)、[examples/sql/mysql/](./examples/sql/mysql/) |
| 配置占位 | [examples/config/storage.config.example.yaml](./examples/config/storage.config.example.yaml) |

## 边界与依赖

- **不替代** `it-ai-base` / `it-ai-base-web` 的基础约束（目录归属、端口、启动接线、迁移骨架）。涉及基础规范时回查两个 base 技能。
- **不替代** SSO / 登录链路：文件接口**必须**走 `user_auth.MiddlewareAuth`，且不得进入 `user_auth.ignoreAuthPaths`。登录契约以 `.cursor/skills/itab-kso-sso/` 技能为准。
- **迁移脚本命名与版本号**：遵守 [itab-db-versioned-migrations/SKILL.md](../itab-db-versioned-migrations/SKILL.md)；双方言同号、语义一致。

## 交付提示

- **业务表里永远只存 `file_object.id`**；`bucket/key/url` 进任何业务表都算本规范缺陷。
- dev / prod 行为对齐：bbolt-store-s3 也要以 **S3 endpoint** 形态启动，不要让业务代码去读 `./data/s3` 本地文件。
- 上传/下载接口不得进入 `user_auth.ignoreAuthPaths`。
- 预签 URL TTL 不超过 15 分钟；如需更长的公开链接走 CDN + 另一条"公开文件"通道，不复用 `file_object` 主流程。
