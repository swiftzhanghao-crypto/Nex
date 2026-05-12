# 最小接入步骤

本清单用于在 `server/` 中接入**通用文件上传 / 下载**能力。完整契约参考 [../references/implementation-spec.md](../references/implementation-spec.md)；链接相对本文件（`examples/integration-checklist.md`）。

## 1. 版本化迁移

- 根据目标仓库当前最大版本号，复制：
  - [sql/sqlite/NNNNNN_file_object.up.sql](./sql/sqlite/NNNNNN_file_object.up.sql) → `server/manifest/migrate/sqlite/00000X_file_object.up.sql`
  - [sql/mysql/NNNNNN_file_object.up.sql](./sql/mysql/NNNNNN_file_object.up.sql) → `server/manifest/migrate/mysql/00000X_file_object.up.sql`
- 若业务要挂"客户-文件"关联，同版本或后继版本追加：
  - [sql/sqlite/NNNNNN_customer_file.up.sql](./sql/sqlite/NNNNNN_customer_file.up.sql)
  - [sql/mysql/NNNNNN_customer_file.up.sql](./sql/mysql/NNNNNN_customer_file.up.sql)
- 迁移由 `server/internal/boot/migrate.go` 按 `schema_migrations` 幂等执行，但**前提**是 `server/internal/cmd/cmd.go` 的 `mainFunc` 顶部已经调用 `boot.Run(ctx)`（见 [itab-server/SKILL.md](../../itab-server/SKILL.md) 的「强制契约（MUST）」与 [itab-server/references/bootstrap-wiring.md](../../itab-server/references/bootstrap-wiring.md)）。若主工程此前漏接该调用，新增表同样不会落库，先补齐再验证。

## 2. 合并配置

- 将 [config/storage.config.example.yaml](./config/storage.config.example.yaml) 中的 `storage` 段合并进 `server/manifest/config/config.{dev,test,prod}.yaml`：
  - dev：`endpoint` 指向 bbolt-store-s3 对外暴露端口；`accessKey/secretKey` 用 dev 默认值；保留 `root: ./data/s3` 供本地落盘。
  - test/prod：`endpoint` 指向 MinIO；`accessKey/secretKey` 用环境变量覆盖（`STORAGE_DEFAULT_ACCESS_KEY` / `STORAGE_DEFAULT_SECRET_KEY`），**不要**明文提交。
- 按需配置 `allowedBizScopes`、`allowedMime`、`maxUploadBytes`、`presignTTL`。

## 3. 目录与包落盘

- 新建 `server/internal/pkg/storage/`：封装 S3 SDK（建议 `github.com/aws/aws-sdk-go-v2` 或 `github.com/minio/minio-go/v7`），暴露 `Put/Get/Head/Delete/PresignPut/PresignGet` 六个方法。
- 新建 `server/internal/service/file/`：
  - `types.go`（输入输出类型、`ScopeAuthorizer` 接口、`ctx` key）
  - `errors.go`（业务错误集中）
  - `service.go` + `service_impl.go`（`Put/PresignUpload/Commit/Resolve/PresignDownload/Delete/RegisterScopeAuthorizer`）
  - `key.go`（`object_key` 生成策略）
- 新建 `server/api/file/v1/`：`upload.go`、`presign_upload.go`、`commit.go`、`get.go`、`meta.go`、`delete.go`（请求响应结构与路由注解）。
- 新建 `server/internal/controller/file/`：`file_controller.go`（`NewV1()`）+ 每个接口一个文件。
- 迁移执行后运行 `gf gen dao` 生成 `dao/file_object.go`、`model/entity/file_object.go`、`model/do/file_object.go`。

## 4. 路由接线

在 `server/internal/cmd/cmd.go` 已有的 group 中追加：

```go
group.Bind(
    userauthctl.NewAuthUserV1(),
    ledger.NewV1(),
    file.NewV1(),       // 新增：/files/*
    // 业务控制器：customer.NewV1() 等
)
```

同时确认 `mainFunc` 顶部已存在 `if err := boot.Run(ctx); err != nil { return err }`（否则迁移不会执行，`file_object` 表不会建立）。

**不要**把 `/files/*` 写进 `user_auth.ignoreAuthPaths`。

## 5. 业务方注册 `ScopeAuthorizer`

每个使用文件能力的业务域在自身服务层 `Init` 时注册权限回调：

```go
// server/internal/service/customer/service_impl.go（示意）
func (s *ServiceImpl) Init(ctx context.Context) {
    filesvc.FileService().RegisterScopeAuthorizer(
        "customer_attach",
        s.canAccessCustomerFile,
    )
    filesvc.FileService().RegisterScopeAuthorizer(
        "customer_photo",
        s.canAccessCustomerFile,
    )
}
```

未注册的 `biz_scope` 默认 deny;上传接口做白名单过滤 + `ScopeAuthorizer` 双重保险。

## 6. 业务装配接口

以客户为例：

- `POST /ai-base-demo/api/customers/:id/files` → `{file_id, category, sort_order?, remark?}` 插 `customer_file`。
- `DELETE /ai-base-demo/api/customers/:id/files/:rel_id` → 软删关联。
- `GET /ai-base-demo/api/customers/:id/files?category=...` → 联查 `customer_file + file_object`，返回 `{rel_id, file_id, original_name, size_bytes, content_type, download_url}`。

## 7. 验收

- dev：上传小文件后本地 `./data/s3/` 下可见新对象；`DELETE` 后重新 `GET` 404。
- dev：大文件走 presign 三段式，浏览器 DevTools 能看到 `PUT` 直连 bbolt-store-s3 endpoint。
- dev/prod 行为一致：切换配置后同一前端无需改动即可工作。
- 权限：未登录 401；登录但 `biz_scope` 未注册 / 不允许 403；正常业务 200/302。
- 生命周期：过期 `pending` 自动清理；软删后对象在 M 天后物理删除（按生命周期任务策略）。

## 8. 依赖提示

`go.mod` 新增：

- `github.com/aws/aws-sdk-go-v2/*` 或 `github.com/minio/minio-go/v7`
- `github.com/google/uuid`（或用已存在的 ID 方案）

**不要**在 `server/` 依赖 bbolt-store-s3 的私有 Go API；一律走 S3 协议。
