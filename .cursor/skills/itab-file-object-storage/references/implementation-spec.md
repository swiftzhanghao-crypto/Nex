# file-object-storage 实现规范

## 0. 参考实现（demo 代码位置）

本能力在仓库中的建议落盘位置（链接相对本文件，可点击）：

| 能力 | 目标位置 |
|------|----------|
| 低层 S3 客户端（endpoint / bucket / presign） | `server/internal/pkg/storage/`（与 `pkg/xiaoshouyi/` 同层） |
| 元数据服务与业务规则 | `server/internal/service/file/` |
| HTTP 契约 | `server/api/file/v1/` |
| 控制器 | `server/internal/controller/file/` |
| DAO / 实体 / DO | `server/internal/dao/file_object.go`、`model/entity/file_object.go`、`model/do/file_object.go`（按 `gf gen dao` 生成规范） |
| 迁移 SQL | `server/manifest/migrate/{sqlite,mysql}/NNNNNN_file_object.up.sql` |
| 配置段 | `server/manifest/config/config.{dev,test,prod}.yaml` 的 `storage.default.*` |
| 启动接线 | `server/internal/cmd/cmd.go`(注册 `file.NewV1()` 到已存在的 group) |

## 1. 目标能力

- 业务一次上传得到一个稳定的 `file_id`；业务表只引用 ID，不感知 bucket/key/url。
- 支持**小文件多部分上传**与**大文件预签直传**两条路径，逻辑在 `FileService` 汇总。
- 下载统一经后端鉴权与 `biz_scope` 权限分派，默认 302 预签 GET URL。
- 兼容 dev(bbolt-store-s3) / test(MinIO) / prod(MinIO)：上层只依赖 S3 协议与统一配置。
- 配合 `user_auth.MiddlewareAuth`：所有 `/files/*` 路由必须经登录态。

## 2. 标准调用链

小文件上传：

1. 前端 `POST /ai-base-demo/api/files`（multipart，字段 `file`、`biz_scope`，可选 `content_type`）。
2. 控制器 → `FileService.Put(ctx, PutInput)`。
3. `FileService` 校验 `biz_scope` 与 MIME 白名单；生成 `object_key`；用 S3 客户端 `PutObject`；计算 `sha256`、`size`。
4. 插入 `file_object(status=ready, ...)`；返回 `{file_id, original_name, size_bytes, content_type}`。

大文件上传（两段式）：

1. `POST /ai-base-demo/api/files/presign-upload` 请求体 `{biz_scope, original_name, content_type, size_bytes?}`。
2. 服务端生成 `object_key`，插入 `file_object(status=pending)`，返回 `{file_id, upload_url, method:"PUT", headers, expires_at}`。
3. 前端对 `upload_url` 发起 `PUT`，直接传到对象层。
4. `POST /ai-base-demo/api/files/:id/commit` 触发 `HeadObject` 校验 size 与 content-type，更新 `file_object.size_bytes/sha256(etag 或重算)/status=ready`。
5. 提交失败或超时：后台任务清理仍为 `pending` 的对象与行。

下载：

1. 前端 `GET /ai-base-demo/api/files/:id`。
2. 中间件鉴权通过 → `FileService.Resolve(ctx, id)` 读取元数据。
3. 按 `biz_scope` 路由到各业务授权回调（如 `customer_attach` → `CustomerService.CanAccessFile(ctx, authUser, fileID)`）。
4. 通过后生成短期预签 GET URL，302 返回；失败返回 401/403。

业务装配（以客户为例）：

1. 前端先得到 `file_id`（上面任一路径）。
2. 前端 `POST /ai-base-demo/api/customers/:id/files` 体 `{file_id, category, sort_order?, remark?}`。
3. `CustomerService` 校验 `customer_id` 的可见性 + `file_object.owner_user_id` 归属（可选严格模式），插入 `customer_file`。
4. 列表接口只返回 `{rel_id, file_id, original_name, size_bytes, content_type, download_url}`，`download_url` 为 `GET /files/:id` 的相对路径。

## 3. 配置契约

必须存在以下配置键（键名与示例一致，见 [examples/config/storage.config.example.yaml](../examples/config/storage.config.example.yaml)）：

- `storage.default.driver`（字符串；固定 `s3`）
- `storage.default.endpoint`（字符串；dev 指向 bbolt-store-s3 暴露端口，prod 指向 MinIO）
- `storage.default.region`（字符串；MinIO 默认 `us-east-1`）
- `storage.default.bucket`（字符串）
- `storage.default.accessKey`（字符串）
- `storage.default.secretKey`（字符串）
- `storage.default.usePathStyle`（布尔；MinIO / bbolt-store-s3 建议 `true`）
- `storage.default.presignTTL`（时长字符串；例 `15m`）
- `storage.default.root`（字符串；dev 本地对象层落盘目录，`EnsureStorageRoot` 会建）

可选：

- `storage.default.publicBaseUrl`（仅当使用 CDN 回源直读公开桶时填）
- `storage.default.maxUploadBytes`（整数；小文件上传上限，超过必须走 presign）
- `storage.default.allowedMime`（字符串列表或 glob；为空表示不过滤）
- `storage.default.allowedBizScopes`（字符串列表；白名单，空则拒绝）

**密钥不得明文进 git**：test/prod 建议用环境变量覆盖（`STORAGE_DEFAULT_ACCESS_KEY`、`STORAGE_DEFAULT_SECRET_KEY`），与现有 `CRM_XSY_*` 覆盖风格一致。

## 4. 数据契约

`file_object` 字段（双方言语义一致，MySQL 加 `COMMENT`，SQLite 用 `--` 段落）：

| 列 | 类型（MySQL / SQLite） | 必填 | 说明 |
|----|-------------------------|------|------|
| `id` | `BIGINT PK AUTO_INCREMENT` / `INTEGER PRIMARY KEY AUTOINCREMENT` | 是 | 业务表引用此 id |
| `bucket` | `VARCHAR(128)` | 是 | 桶名，便于多租户/冷热分桶 |
| `object_key` | `VARCHAR(512)` | 是 | S3 key；**不对外暴露** |
| `original_name` | `VARCHAR(512)` | 是 | 原始文件名；展示用 |
| `content_type` | `VARCHAR(128)` | 是 | MIME |
| `size_bytes` | `BIGINT` | 是 | 字节数；pending 态可为 0 |
| `sha256` | `CHAR(64)` | 否 | 预签模式 commit 后回填 |
| `storage_class` | `VARCHAR(32)` | 否 | 预留 |
| `status` | `TINYINT` | 是 | `0=pending / 1=ready / 2=deleted` |
| `biz_scope` | `VARCHAR(32)` | 是 | 业务域；权限分派键 |
| `owner_user_id` | `BIGINT` | 是 | 上传者（对齐 `user_auth.AuthUser` 的稳定标识） |
| `created_at / updated_at / deleted_at` | `DATETIME` | 是/是/否 | 软删 |

索引：

- `UNIQUE(bucket, object_key)`
- `INDEX(sha256)`
- `INDEX(owner_user_id, created_at)`
- `INDEX(biz_scope, status)`

完整 DDL 见 [database-schema.md](./database-schema.md) 与 [sql 样板](../examples/sql/)。

## 5. 服务与中间件行为契约

`pkg/storage` 抽象接口（实现基于 S3 SDK，dev / prod 同一份代码）：

- `PutObject(ctx, bucket, key, body, meta) (etag, err)`
- `GetObject(ctx, bucket, key) (stream, meta, err)`
- `HeadObject(ctx, bucket, key) (meta, err)`
- `DeleteObject(ctx, bucket, key) error`
- `PresignPut(ctx, bucket, key, ttl, contentType) (url, headers, err)`
- `PresignGet(ctx, bucket, key, ttl, overrideFilename) (url, err)`

`FileService`（`server/internal/service/file/`）必须实现：

- `Put(ctx, PutInput) (*FileObject, error)`：完整同步上传；内部计算 sha256；insert `status=ready`。
- `PresignUpload(ctx, PresignUploadInput) (*PresignUploadOutput, error)`：insert `status=pending` 并返回 URL。
- `Commit(ctx, id) (*FileObject, error)`：`HeadObject` 校验；更新 `status=ready` 与 `size_bytes`。
- `Resolve(ctx, id) (*FileObject, error)`：读元数据；`status!=ready` 禁止下载。
- `PresignDownload(ctx, id, ttl, overrideFilename) (url, error)`：仅服务内部使用，由控制器判权后调用。
- `Delete(ctx, id) error`：软删；不立即删对象层，由生命周期任务处理。
- `RegisterScopeAuthorizer(scope string, fn ScopeAuthorizer)`：供各业务域注册"能否访问此 file 的回调"。

**`biz_scope` 白名单与权限分派（强制）**：

1. 上传时 `biz_scope` 必须在 `storage.default.allowedBizScopes`；不在则 400。
2. 下载/删除时按 `file_object.biz_scope` 路由到注册的 `ScopeAuthorizer`；未注册视为拒绝（默认 denyAll）。
3. `ScopeAuthorizer` 输入 `(ctx, authUser, fileObject)`，返回 `(allowed bool, err error)`；`err` 按 500 处理，`!allowed` 返回 403。

**MIME / 扩展名白名单**：

- 服务端读取上传流的前若干字节嗅探（或直接信任 `content_type`，由业务域按 `biz_scope` 决定严格程度）。
- 在 `FileService.Put` 与 `PresignUpload` 两路共享同一份校验。

**幂等与重试**：

- `Put` 成功后若同 sha256 + bucket 已存在 `ready` 对象，可直接复用 `object_key`（共享物理对象、新建元数据行），初期可不做。
- `Commit` 重复调用对同一 `ready` 记录应返回 200 + 当前元数据。

## 6. HTTP 契约

**所有路径都走 `user_auth.MiddlewareAuth`；不得写进 `ignoreAuthPaths`。**

`POST /ai-base-demo/api/files`（multipart）

- 表单：`file` 必填；`biz_scope` 必填；`content_type` 可选（否则嗅探/取上传值）。
- 成功：`{code:0, data:{file_id, original_name, size_bytes, content_type, sha256}}`。
- 失败：`400`（size 超限 / MIME 不允许 / biz_scope 不在白名单）、`401/403`。

`POST /ai-base-demo/api/files/presign-upload`

- 体：`{biz_scope, original_name, content_type, size_bytes?}`。
- 成功：`{code:0, data:{file_id, upload_url, method:"PUT", headers:{...}, expires_at}}`。

`POST /ai-base-demo/api/files/:id/commit`

- 体：空或 `{etag?}`（前端收到的 `ETag` 可回传以便校验）。
- 成功：`{code:0, data:{file_id, size_bytes, sha256, content_type, status:"ready"}}`。
- 幂等：对已 `ready` 的返回 200 当前态。

`GET /ai-base-demo/api/files/:id`

- 行为：鉴权 + `biz_scope` 授权后，**302** 到预签 GET URL；可带 `?disposition=attachment|inline` 控制 `Content-Disposition`。
- 失败：`401/403/404`。

`GET /ai-base-demo/api/files/:id/meta`

- 成功：`{code:0, data:{file_id, original_name, size_bytes, content_type, created_at, biz_scope}}`。
- 失败：`401/403/404`；注意 `object_key/bucket/endpoint` **不得**出现在响应体里。

`DELETE /ai-base-demo/api/files/:id`

- 行为：软删（`status=deleted`、写 `deleted_at`）；不删对象层。
- 权限：`biz_scope` 对应 `ScopeAuthorizer` 判定"可删"。

## 7. 错误与可观测性规范

- 业务错误集中在 `service/file/errors.go`（参考 `service/user_auth/errors.go`）。
- 外部调用错误用 `gerror.Wrap` 包上下文（bucket、key、file_id 不进错误消息，进 `g.Log()`）。
- 失败日志：`g.Log().Error(ctx, err)` + 结构化字段 `{biz_scope, file_id, bucket, op}`。
- 访问日志：`file.access` 带 `{authUser.username, file_id, biz_scope, op:"get"|"put"|"commit"|"delete"}`。

## 8. 生命周期与清理

- **孤儿**：`status=pending` 且 `created_at < now()-N min` → 后台任务 `DeleteObject` + 行软删；N 建议 30 min。
- **软删→物删**：`status=deleted` 且 `deleted_at < now()-M day` → 物理删对象，行可物理删或保留审计（按业务需要）；M 建议 7 天。
- **引用计数**（可选）：业务关联表每次写入/删除时调用 `FileService.IncRef/DecRef`；或用定期扫描"未被任何业务表引用且 M 天无关联"的 ready 对象做回收。初期只做**孤儿清理**即可。

## 9. 安全注意事项

- 桶必须 **private**；前端任何场景下不直拉 `endpoint + key`。
- 预签 TTL 默认 15 分钟，最长不超过 1 小时；生产拒绝签发 > 1 小时的 URL。
- 上传 `object_key` **一律服务端生成**；前端若传入 `key` 直接忽略。
- `original_name` 回显前端做 HTML 转义；`Content-Disposition` 使用 RFC 5987 编码文件名。
- 生产 `accessKey/secretKey` 不入仓库；使用环境变量或密钥中心。
- 如启用 CDN 公开直读，单独一条通道（另一张表或 `file_object.visibility=public` 字段），不与主流程复用鉴权逻辑。
