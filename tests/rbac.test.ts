import { describe, it, expect, beforeAll, vi } from 'vitest';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../server/auth.ts';

let rbac: typeof import('../server/rbac');

beforeAll(async () => {
  rbac = await import('../server/rbac');
});

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; body: unknown };
}

describe('hasPermission', () => {
  it('Admin can create orders', () => {
    expect(rbac.hasPermission(['Admin'], 'order', 'create')).toBe(true);
  });

  it('Sales can create orders', () => {
    expect(rbac.hasPermission('Sales', 'order', 'create')).toBe(true);
  });

  it('Technical cannot create orders', () => {
    expect(rbac.hasPermission(['Technical'], 'order', 'create')).toBe(false);
  });

  it('unknown permission key returns false', () => {
    expect(rbac.hasPermission(['Admin'], 'nonexistent', 'action')).toBe(false);
  });

  it('any matrix role can list users', () => {
    expect(rbac.hasPermission(['Commerce'], 'user', 'list')).toBe(true);
  });
});

describe('checkPermission middleware', () => {
  it('returns 401 when user is missing', () => {
    const middleware = rbac.checkPermission('order', 'list');
    const req = {} as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: '未认证' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when roles is not an array', () => {
    const middleware = rbac.checkPermission('order', 'list');
    const req = { user: { userId: 'u1', roles: 'Admin' as unknown as string[] } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect((res.body as { error: string }).error).toContain('令牌格式异常');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for undefined permission key', () => {
    const middleware = rbac.checkPermission('bogus', 'action');
    const req = { user: { userId: 'u1', roles: ['Admin'] } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: '权限未定义' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when role lacks permission', () => {
    const middleware = rbac.checkPermission('order', 'create');
    const req = { user: { userId: 'u1', roles: ['Technical'] } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect((res.body as { error: string }).error).toContain('权限不足');
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when role is allowed', () => {
    const middleware = rbac.checkPermission('order', 'create');
    const req = { user: { userId: 'u1', roles: ['Sales'] } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });
});
