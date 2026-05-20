import { getDb } from '../db.ts';
import Database from 'better-sqlite3';

export class BaseRepository {
  protected get db(): Database.Database {
    return getDb();
  }

  /**
   * 执行单个查询，返回单个对象
   */
  protected getOne<T>(sql: string, ...params: any[]): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  /**
   * 执行查询，返回对象数组
   */
  protected getAll<T>(sql: string, ...params: any[]): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  /**
   * 执行写操作（INSERT/UPDATE/DELETE），返回改变的行数或插入 ID
   */
  protected run(sql: string, ...params: any[]): Database.RunResult {
    return this.db.prepare(sql).run(...params);
  }

  /**
   * 执行事务
   */
  public transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  /**
   * 统一插入审计日志
   */
  public insertAuditLog(log: {
    userId: string;
    userName: string;
    action: string;
    resource: string;
    resourceId: string;
    detail?: string;
    ip?: string;
  }): void {
    this.run(
      `INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      log.userId,
      log.userName,
      log.action,
      log.resource,
      log.resourceId,
      log.detail ?? null,
      log.ip ?? null
    );
  }
}
