import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middlewares/auth.js';
import { ApiError } from '../../utils/api-error.js';

export const userRouter = Router();

userRouter.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new ApiError(401, '未登录或登录已失效');
    }
    const user = await prisma.user.findFirst({
      where: { id: userId, status: 1 },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        vipExpireAt: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }
    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

const favoriteSchema = z.object({
  videoId: z.string().uuid(),
});

userRouter.get('/favorites', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new ApiError(401, '未登录或登录已失效');
    }
    const favorites = await prisma.userFavorite.findMany({
      where: { userId, status: 1 },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            year: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(favorites.filter((item) => item.video.status === 1));
  } catch (error) {
    return next(error);
  }
});

userRouter.post('/favorites', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new ApiError(401, '未登录或登录已失效');
    }
    const payload = favoriteSchema.parse(req.body);
    const video = await prisma.video.findFirst({
      where: { id: payload.videoId, status: 1 },
    });
    if (!video) {
      throw new ApiError(404, '视频不存在');
    }
    const favorite = await prisma.userFavorite.upsert({
      where: { userId_videoId: { userId, videoId: payload.videoId } },
      create: {
        userId,
        videoId: payload.videoId,
      },
      update: {
        status: 1,
      },
    });
    return res.status(201).json(favorite);
  } catch (error) {
    return next(error);
  }
});

userRouter.delete('/favorites/:videoId', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new ApiError(401, '未登录或登录已失效');
    }
    const favorite = await prisma.userFavorite.findFirst({
      where: {
        userId,
        videoId: req.params.videoId,
        status: 1,
      },
    });
    if (!favorite) {
      throw new ApiError(404, '收藏不存在');
    }
    await prisma.userFavorite.update({
      where: { id: favorite.id },
      data: { status: 0 },
    });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

userRouter.get('/history', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new ApiError(401, '未登录或登录已失效');
    }
    const history = await prisma.userHistory.findMany({
      where: {
        userId,
        status: 1,
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            year: true,
            status: true,
          },
        },
      },
      orderBy: { watchedAt: 'desc' },
      take: 200,
    });
    return res.json(history.filter((item) => item.video.status === 1));
  } catch (error) {
    return next(error);
  }
});
