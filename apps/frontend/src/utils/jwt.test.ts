import { describe, expect, it } from 'vitest';

import { parseJwtPayload } from './jwt';

function createFakeToken(payload: object) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('parseJwtPayload', () => {
  it('returns parsed payload for valid token', () => {
    const token = createFakeToken({ exp: 1234567890, sub: 'u1' });
    expect(parseJwtPayload(token)).toEqual({ exp: 1234567890, sub: 'u1' });
  });

  it('returns null for malformed token', () => {
    expect(parseJwtPayload('invalid')).toBeNull();
  });
});
