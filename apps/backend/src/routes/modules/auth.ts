import { Prisma } from '@prisma/client';
import { Router } from 'express';

import { comparePassword, hashPassword, signAccessToken, verifyAccessToken } from '../../lib/auth.js';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { loginSchema, refreshSchema, registerSchema } from '../../validators/auth.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const password = await hashPassword(payload.password);
    const userCount = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        username: payload.username,
        password,
        role: userCount === 0 ? 'ADMIN' : 'USER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });
    return res.status(201).json(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return next(new ApiError(409, '邮箱或用户名已存在'));
    }
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: {
        email: payload.email,
        status: 1,
      },
    });
    if (!user) {
      throw new ApiError(401, '账号或密码错误');
    }
    const matched = await comparePassword(payload.password, user.password);
    if (!matched) {
      throw new ApiError(401, '账号或密码错误');
    }
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    return res.json({
      accessToken,
      expiresIn: '7d',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { token } = refreshSchema.parse(req.body);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: { id: payload.userId, status: 1 },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new ApiError(401, '登录已失效，请重新登录');
    }
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    return res.json({
      accessToken,
      expiresIn: '7d',
    });
  } catch (error) {
    return next(error);
  }
});
