import type { NextFunction, Request, Response } from 'express';

import { verifyAccessToken } from '../lib/auth.js';
import { ApiError } from '../utils/api-error.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new ApiError(401, '未登录或登录已失效');
    }
    const token = authorization.replace('Bearer ', '').trim();
    const payload = verifyAccessToken(token);
    req.auth = payload;
    return next();
  } catch {
    return next(new ApiError(401, '未登录或登录已失效'));
  }
}
