import type { AuthRequest } from './auth.ts';
import type { Response, NextFunction } from 'express';

/**
 * Centralized RBAC permission matrix.
 * Maps resource:action to the list of role IDs allowed.
 *
 * Role IDs must match those in data/staticData.ts initialRoles:
 *   Admin, Sales, Business, Technical, Executive, Commerce
 */
const PERMISSION_MATRIX: Record<string, string[]> = {
  // --- Users ---
  'user:list':           ['Admin', 'Sales', 'Business', 'Technical', 'Executive', 'Commerce'],
  'user:read':           ['Admin', 'Sales', 'Business', 'Technical', 'Executive', 'Commerce'],
  'user:update':         ['Admin'],
  'role:create':         ['Admin'],
  'role:update':         ['Admin'],
  'role:delete':         ['Admin'],
  'role:copy':           ['Admin'],

  // --- Orders ---
  'order:list':          ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'order:read':          ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'order:create':        ['Admin', 'Sales', 'Business'],
  'order:update':        ['Admin', 'Sales', 'Business'],
  'order:delete':        ['Admin', 'Sales'],
  'order:approve':       ['Admin', 'Business', 'Commerce'],
  'order:submit':        ['Admin', 'Sales', 'Business'],

  // --- Customers ---
  'customer:list':       ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'customer:read':       ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'customer:create':     ['Admin', 'Sales', 'Business'],
  'customer:update':     ['Admin', 'Sales', 'Business'],
  'customer:delete':     ['Admin', 'Sales', 'Business'],

  // --- Products ---
  'product:list':        ['Admin', 'Sales', 'Business', 'Technical', 'Executive', 'Commerce'],
  'product:read':        ['Admin', 'Sales', 'Business', 'Technical', 'Executive', 'Commerce'],
  'product:create':      ['Admin'],
  'product:update':      ['Admin'],
  'product:delete':      ['Admin'],

  // --- Channels ---
  'channel:list':        ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'channel:read':        ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'channel:create':      ['Admin'],
  'channel:update':      ['Admin'],
  'channel:delete':      ['Admin'],

  // --- Finance: Contracts ---
  'contract:list':       ['Admin', 'Business', 'Sales', 'Executive', 'Commerce'],
  'contract:read':       ['Admin', 'Business', 'Sales', 'Executive', 'Commerce'],
  'contract:create':     ['Admin', 'Business', 'Commerce'],
  'contract:update':     ['Admin', 'Business', 'Commerce'],
  'contract:delete':     ['Admin', 'Business'],

  // --- Finance: Remittances ---
  'remittance:list':     ['Admin', 'Business', 'Executive', 'Commerce'],
  'remittance:read':     ['Admin', 'Business', 'Executive', 'Commerce'],
  'remittance:create':   ['Admin', 'Business'],
  'remittance:update':   ['Admin', 'Business'],
  'remittance:delete':   ['Admin', 'Business'],

  // --- Finance: Invoices ---
  'invoice:list':        ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'invoice:read':        ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'invoice:create':      ['Admin', 'Business'],
  'invoice:update':      ['Admin', 'Business'],
  'invoice:delete':      ['Admin', 'Business'],

  // --- Finance: Performances ---
  'performance:list':    ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'performance:read':    ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],

  // --- Finance: Authorizations ---
  'authorization:list':  ['Admin', 'Business', 'Sales', 'Technical', 'Executive', 'Commerce'],
  'authorization:read':  ['Admin', 'Business', 'Sales', 'Technical', 'Executive', 'Commerce'],
  'authorization:create':['Admin', 'Business'],

  // --- Finance: Delivery Infos ---
  'delivery:list':       ['Admin', 'Business', 'Sales', 'Technical', 'Executive', 'Commerce'],
  'delivery:read':       ['Admin', 'Business', 'Sales', 'Technical', 'Executive', 'Commerce'],
  'delivery:create':     ['Admin', 'Business'],

  // --- Finance: Audit Logs ---
  'auditlog:list':       ['Admin', 'Business'],

  // --- Opportunities ---
  'opportunity:list':    ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'opportunity:read':    ['Admin', 'Sales', 'Business', 'Executive', 'Commerce'],
  'opportunity:create':  ['Admin', 'Sales', 'Business'],
  'opportunity:update':  ['Admin', 'Sales', 'Business'],
  'opportunity:delete':  ['Admin', 'Sales', 'Business'],
};

export function checkPermission(resource: string, action: string): (req: AuthRequest, res: Response, next: NextFunction) => void {
  const key = `${resource}:${action}`;
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }
    const allowedRoles = PERMISSION_MATRIX[key];
    if (!allowedRoles) {
      console.warn(`[rbac] unknown permission key: ${key}, denying access`);
      res.status(403).json({ error: '权限未定义' });
      return;
    }
    if (req.user.roles.some(r => allowedRoles.includes(r))) {
      next();
      return;
    }
    res.status(403).json({ error: `权限不足 (需要: ${allowedRoles.join('/')})` });
  };
}

export function hasPermission(roles: string | string[], resource: string, action: string): boolean {
  const key = `${resource}:${action}`;
  const allowedRoles = PERMISSION_MATRIX[key];
  if (!allowedRoles) return false;
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr.some(r => allowedRoles.includes(r));
}

export { PERMISSION_MATRIX };
