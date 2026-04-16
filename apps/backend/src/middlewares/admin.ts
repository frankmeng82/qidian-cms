import type { NextFunction, Request, Response } from 'express';

import { ApiError } from '../utils/api-error.js';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.auth?.role !== 'ADMIN') {
    return next(new ApiError(403, '需要管理员权限'));
  }
  return next();
}
