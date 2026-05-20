#!/usr/bin/env bash
# 每日数据库备份（可加入 crontab）
# 示例: 0 2 * * * cd /path/to/业务平台 && ./scripts/schedule-backup.sh >> logs/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
npm run db:backup
