import { describe, expect, it } from 'vitest';

import { loginSchema, registerSchema } from './auth.js';

describe('auth validators', () => {
  it('accepts valid register payload', () => {
    const result = registerSchema.safeParse({
      email: 'demo@example.com',
      username: 'demo',
      password: 'abc12345',
    });
    expect(result.success).toBe(true);
  });

  it('rejects weak password', () => {
    const result = registerSchema.safeParse({
      email: 'demo@example.com',
      username: 'demo',
      password: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid login payload', () => {
    const result = loginSchema.safeParse({
      email: 'demo@example.com',
      password: 'abc12345',
    });
    expect(result.success).toBe(true);
  });
});
