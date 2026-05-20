import type { Request, Response, NextFunction } from 'express';
import { createLogger } from './logger.ts';

const httpLog = createLogger('http');

const CSRF_SKIP_PATHS = new Set(['/api/health', '/api/errors', '/api/metrics/vitals']);

let reqCount = 0;
let errorCount = 0;
let totalResponseMs = 0;

function recordRequest(statusCode: number, durationMs: number): void {
  reqCount++;
  totalResponseMs += durationMs;
  if (statusCode >= 400) errorCount++;
}

export function getMetrics() {
  return {
    reqCount,
    errorCount,
    avgResponseMs: reqCount > 0 ? Math.round(totalResponseMs / reqCount) : 0,
  };
}

export function requestTimingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    recordRequest(res.statusCode, durationMs);
    if (durationMs > 500) {
      httpLog.warn('slow request', {
        method: req.method,
        path: req.path,
        durationMs,
        status: res.statusCode,
      });
    }
  });
  next();
}

function originFromReferer(referer: string): string | null {
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function csrfProtection(allowedOrigins: string[]) {
  const allowed = new Set(allowedOrigins);

  return (req: Request, res: Response, next: NextFunction): void => {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      next();
      return;
    }
    if (CSRF_SKIP_PATHS.has(req.path)) {
      next();
      return;
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const source = origin || (referer ? originFromReferer(referer) : null);

    if (!source) {
      res.status(403).json({ error: 'CSRF 校验失败：缺少 Origin/Referer' });
      return;
    }
    if (!allowed.has(source)) {
      httpLog.warn('csrf blocked', { method, path: req.path, source });
      res.status(403).json({ error: 'CSRF 校验失败：来源不在白名单' });
      return;
    }
    next();
  };
}
