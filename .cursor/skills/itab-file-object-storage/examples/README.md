# file-object-storage 示例

本目录给出最小的**可直接复制**的样板文件，辅助在 `server/` 接入通用文件上传/下载能力。规范以 [../references/](../references/) 为准。

## 快速跳转（相对本文件）

- [integration-checklist.md](./integration-checklist.md)：最小接入步骤
- SQL 双方言（版本号占位 `NNNNNN`，复制后按目标仓库最大版本号递增）：
  - [sql/sqlite/NNNNNN_file_object.up.sql](./sql/sqlite/NNNNNN_file_object.up.sql)
  - [sql/mysql/NNNNNN_file_object.up.sql](./sql/mysql/NNNNNN_file_object.up.sql)
  - [sql/sqlite/NNNNNN_customer_file.up.sql](./sql/sqlite/NNNNNN_customer_file.up.sql)
  - [sql/mysql/NNNNNN_customer_file.up.sql](./sql/mysql/NNNNNN_customer_file.up.sql)
- 配置占位：[config/storage.config.example.yaml](./config/storage.config.example.yaml)

更细的规范、服务接口、API 契约见 [../references/implementation-spec.md](../references/implementation-spec.md)；前端接入见 [../references/frontend-integration.md](../references/frontend-integration.md)。

## 本示例覆盖范围

- `file_object`（全局元数据表）DDL 双方言样板。
- `customer_file`（业务关联表）DDL 双方言样板，示范多对多挂接方式。
- `storage` 配置段示例（driver/endpoint/bucket/credentials/presignTTL + 白名单）。

**不覆盖**：

- 具体 Go 实现（`pkg/storage/`、`service/file/`、`controller/file/`）。实现以契约为准，不做镜像代码。
- `gf gen dao` 生成产物。执行迁移后由目标工程自行生成。
- S3 事件回调、病毒扫描、CDN 公开通道等进阶扩展。

## 版本号规则

本示例 SQL 文件名使用 **`NNNNNN_*.up.sql`** 占位。实际落盘时：

1. 查看目标仓库 `server/manifest/migrate/sqlite/` 与 `server/manifest/migrate/mysql/` 当前最大版本号。
2. 两个方言用**同一个**递增版本号，例如 `000002_file_object.up.sql`。
3. 如果一次变更包含 `file_object` + `customer_file`，两张表可以放**同一个**迁移脚本里，也可以拆成两个递增版本号；**不要**让两个方言的版本号错开。
4. 双方言语法差异允许，**语义必须一致**；命名规范参考 [../../itab-db-versioned-migrations/SKILL.md](../../itab-db-versioned-migrations/SKILL.md)。
