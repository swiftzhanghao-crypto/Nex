// 后端共用工具函数
//
// 这些 helper 在多个 routes 中重复实现，集中收敛到一处便于：
//   1. 行为一致（分页上限、JSON 容错策略统一）；
//   2. 后续若改写为带类型的 helper，仅需改一处。
//
// 暂保留各 routes 中的本地副本以避免一次性大改的风险，新代码请优先使用此文件。

import type Database from 'better-sqlite3';

/**
 * 安全 JSON 解析：失败/空值返回 fallback，避免单条脏数据让接口 5xx。
 *
 * 重载：
 *   - 不带 fallback：返回 any，兼容旧用法（如 `safeJsonParse(row.extra)` 视为对象）；
 *   - 带 fallback：返回 typeof fallback。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeJsonParse(str: string | null | undefined): any;
export function safeJsonParse<T>(str: string | null | undefined, fallback: T): T;
export function safeJsonParse(str: string | null | undefined, fallback: unknown = {}): unknown {
    if (!str) return fallback;
    try { return JSON.parse(str); }
    catch { return fallback; }
}

/** 取审计日志用的用户名，找不到返回空串 */
export function getUserName(db: Database.Database, userId: string): string {
    const row = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name?: string } | undefined;
    return row?.name || '';
}

/** 分页参数解析：page>=1，size 1~200，返回 { limit, offset, pageNum } */
export function safePagination(
    page: string | undefined,
    size: string | undefined,
    maxSize = 200,
): { limit: number; offset: number; pageNum: number } {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(size || '50', 10) || 50), maxSize);
    return { limit, offset: (pageNum - 1) * limit, pageNum };
}

/** 兼容旧格式：DB 列原为 'Admin'，新格式为 '["Admin","Sales"]' */
export function parseRoles(raw: string | null): string[] {
    if (!raw) return [];
    const s = raw.trim();
    if (s.startsWith('[')) {
        try { return JSON.parse(s) as string[]; } catch { return [s]; }
    }
    return [s];
}

/**
 * 订单明细数据清洗：
 * - 业务规则：当一个订单存在多条产品明细时，不应包含任何下级单位授权信息。
 * - 这里做“服务端兜底”，避免历史脏数据/手工写库导致 UI 异常。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeOrderItemsSubUnits(items: any, buyerType?: string): any[] {
    if (!Array.isArray(items)) return [];
    const shouldStrip = buyerType === 'SelfDeal' || items.length > 1;
    if (!shouldStrip) return items;
    let changed = false;
    const next = items.map((it: any) => {
        if (!it || typeof it !== 'object') return it;
        if (it.subUnitAuthMode !== undefined || it.subUnits !== undefined) {
            changed = true;
            const { subUnitAuthMode: _m, subUnits: _s, ...rest } = it;
            return rest;
        }
        return it;
    });
    return changed ? next : items;
}
