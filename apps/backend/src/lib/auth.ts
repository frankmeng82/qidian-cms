import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env.js';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function signAccessToken(payload: { userId: string; role: string }) {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    ...options,
  });
}

export function verifyAccessToken(token: string): { userId: string; role: string } {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
}
