import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';

import { authRouter } from './modules/auth.js';
import { categoryRouter } from './modules/categories.js';
import { collectRouter } from './modules/collect.js';
import { userRouter } from './modules/user.js';
import { videoRouter } from './modules/videos.js';

export const apiRouter = Router();

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

apiRouter.use(apiLimiter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/user', userRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/collect', collectRouter);
apiRouter.use('/videos', videoRouter);

apiRouter.get('/tags', async (_req, res) => {
  const tags = await prisma.tag.findMany({
    where: { status: 1 },
    orderBy: { name: 'asc' },
  });
  return res.json(tags);
});

apiRouter.get('/search', async (req, res, next) => {
  try {
    const query = z
      .object({
        keyword: z.string().trim().min(1),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(50).default(12),
      })
      .parse(req.query);
    const where = {
      status: 1,
      title: {
        contains: query.keyword,
        mode: 'insensitive' as const,
      },
    };
    const [items, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.video.count({ where }),
    ]);
    return res.json({
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  } catch (error) {
    return next(error);
  }
});
