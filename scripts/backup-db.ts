/**
 * SQLite 数据库备份脚本
 *
 * 用法：
 *   npx tsx scripts/backup-db.ts           # 生成一份带时间戳的备份
 *   npx tsx scripts/backup-db.ts --keep 7  # 保留最近 7 份，清理更早的
 *
 * 备份文件存放在 data/backups/ 目录下（已 gitignore）。
 * 建议配合 cron / Windows 任务计划定时执行。
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'app.db');
const BACKUP_DIR = path.join(__dirname, '..', 'data', 'backups');

function pad(n: number) { return String(n).padStart(2, '0'); }

function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanOld(keep: number) {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('app_') && f.endsWith('.db'))
    .sort()
    .reverse();
  if (files.length <= keep) return;
  const toDelete = files.slice(keep);
  for (const f of toDelete) {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
    console.log(`  [cleanup] Deleted old backup: ${f}`);
  }
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`[backup] Database not found at ${DB_PATH}`);
    process.exit(1);
  }

  ensureDir(BACKUP_DIR);

  const ts = timestamp();
  const backupName = `app_${ts}.db`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  console.log(`[backup] Source: ${DB_PATH}`);
  console.log(`[backup] Target: ${backupPath}`);

  const db = new Database(DB_PATH, { readonly: true });
  db.backup(backupPath)
    .then(() => {
      db.close();
      const sizeKB = Math.round(fs.statSync(backupPath).size / 1024);
      console.log(`[backup] Done! ${backupName} (${sizeKB} KB)`);

      const args = process.argv.slice(2);
      const keepIdx = args.indexOf('--keep');
      if (keepIdx !== -1) {
        const keep = parseInt(args[keepIdx + 1]) || 7;
        cleanOld(keep);
      }
    })
    .catch((err) => {
      db.close();
      console.error('[backup] Failed:', err);
      process.exit(1);
    });
}

main();
