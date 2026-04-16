import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { ApiError } from '../utils/api-error.js';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  void next;
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: '请求参数校验失败',
      details: error.flatten(),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return res.status(404).json({
      message: '资源不存在',
    });
  }

  return res.status(500).json({
    message: '服务器开小差了，请稍后重试',
  });
}
