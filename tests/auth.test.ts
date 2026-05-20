import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';

let auth: typeof import('../server/auth');

beforeAll(async () => {
  auth = await import('../server/auth');
});

const TEST_PAYLOAD = { userId: 'user-test-1', roles: ['Admin'] };

describe('JWT auth', () => {
  it('token signed by signToken can be verified', () => {
    const token = auth.signToken(TEST_PAYLOAD);
    const decoded = auth.verifyToken(token);
    expect(decoded.userId).toBe(TEST_PAYLOAD.userId);
    expect(decoded.roles).toEqual(TEST_PAYLOAD.roles);
  });

  it('rejects expired token', () => {
    const secret = process.env.JWT_SECRET!;
    const expired = jwt.sign(TEST_PAYLOAD, secret, { expiresIn: '-1s' });
    expect(() => auth.verifyToken(expired)).toThrow();
  });

  it('rejects invalid token', () => {
    expect(() => auth.verifyToken('not.a.valid.jwt')).toThrow();
  });

  it('refresh token round-trip', () => {
    const refresh = auth.signRefreshToken(TEST_PAYLOAD);
    const decoded = auth.verifyRefreshToken(refresh);
    expect(decoded.userId).toBe(TEST_PAYLOAD.userId);
    expect(decoded.roles).toEqual(TEST_PAYLOAD.roles);
  });

  it('rejects refresh token used as access token', () => {
    const refresh = auth.signRefreshToken(TEST_PAYLOAD);
    expect(() => auth.verifyToken(refresh)).toThrow();
  });

  it('revoked token is rejected', () => {
    const secret = process.env.JWT_SECRET!;
    const jti = 'revoke-test-jti';
    const token = jwt.sign({ ...TEST_PAYLOAD, jti, type: 'access' }, secret, { expiresIn: '1h' });
    auth.revokeToken(jti);
    expect(auth.isTokenRevoked(jti)).toBe(true);
    expect(() => auth.verifyToken(token)).toThrow();
  });
});
