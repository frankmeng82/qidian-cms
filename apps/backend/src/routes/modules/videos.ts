import { Prisma } from '@prisma/client';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../middlewares/admin.js';
import { requireAuth } from '../../middlewares/auth.js';
import { ApiError } from '../../utils/api-error.js';
import { createVideoSchema, listVideosSchema, updateVideoSchema } from '../../validators/video.js';

const upload = multer({ dest: 'uploads/' });

export const videoRouter = Router();

videoRouter.post('/', requireAuth, requireAdmin, upload.single('cover'), async (req, res, next) => {
  try {
    const payload = createVideoSchema.parse(req.body);
    const video = await prisma.video.create({ data: payload });
    return res.status(201).json(video);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return next(new ApiError(409, '视频标题已存在'));
    }
    return next(error);
  }
});

videoRouter.get('/', async (req, res, next) => {
  try {
    const query = listVideosSchema.parse(req.query);
    const where: Prisma.VideoWhereInput = {
      status: query.status ?? 1,
      ...(query.keyword
        ? {
            title: {
              contains: query.keyword,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.year ? { year: query.year } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      prisma.video.count({ where }),
    ]);

    return res.json({
      items,
      pagination: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  } catch (error) {
    return next(error);
  }
});

videoRouter.get('/:id', async (req, res, next) => {
  try {
    const video = await prisma.video.findFirst({
      where: { id: req.params.id, status: 1 },
      include: {
        category: true,
        videoSources: {
          where: { status: 1 },
          include: {
            episodes: {
              where: { status: 1 },
              orderBy: { episodeNo: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!video) {
      throw new ApiError(404, '视频不存在');
    }
    return res.json(video);
  } catch (error) {
    return next(error);
  }
});

videoRouter.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = updateVideoSchema.parse(req.body);
    const exists = await prisma.video.findFirst({ where: { id: req.params.id, status: 1 } });
    if (!exists) {
      throw new ApiError(404, '视频不存在');
    }
    const video = await prisma.video.update({ where: { id: req.params.id }, data: payload });
    return res.json(video);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return next(new ApiError(409, '视频标题已存在'));
    }
    return next(error);
  }
});

videoRouter.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const video = await prisma.video.findFirst({ where: { id: req.params.id, status: 1 } });
    if (!video) {
      throw new ApiError(404, '视频不存在');
    }
    await prisma.video.update({ where: { id: req.params.id }, data: { status: 0 } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

videoRouter.get('/:id/play', async (req, res, next) => {
  try {
    const video = await prisma.video.findFirst({
      where: { id: req.params.id, status: 1 },
      include: {
        videoSources: {
          where: { status: 1 },
          orderBy: { sortOrder: 'asc' },
          include: {
            episodes: {
              where: { status: 1 },
              orderBy: { episodeNo: 'asc' },
            },
          },
        },
      },
    });
    if (!video) {
      throw new ApiError(404, '视频不存在');
    }

    const lines = video.videoSources.map((line) => ({
      id: line.id,
      name: line.name,
      type: line.sourceType,
      episodes: line.episodes.map((episode) => ({
        id: episode.id,
        title: episode.title,
        episodeNo: episode.episodeNo,
        url: episode.playUrl,
        quality: extractQualityLabel(episode.title),
        sourceType: line.sourceType,
      })),
    }));

    return res.json({
      id: video.id,
      title: video.title,
      coverImage: video.coverImage,
      lines,
    });
  } catch (error) {
    return next(error);
  }
});

const progressSchema = z.object({
  episodeId: z.string().optional(),
  progressSecond: z.coerce.number().int().min(0),
});

videoRouter.post('/:id/progress', requireAuth, async (req, res, next) => {
  try {
    const payload = progressSchema.parse(req.body);
    const userId = req.auth?.userId;
    if (!userId) {
      throw new ApiError(401, '未登录或登录已失效');
    }
    const video = await prisma.video.findFirst({
      where: { id: req.params.id, status: 1 },
    });
    if (!video) {
      throw new ApiError(404, '视频不存在');
    }
    const history = await prisma.userHistory.findFirst({
      where: {
        userId,
        videoId: video.id,
        episodeId: payload.episodeId ?? null,
        status: 1,
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (history) {
      await prisma.userHistory.update({
        where: { id: history.id },
        data: {
          progressSecond: payload.progressSecond,
          watchedAt: new Date(),
        },
      });
    } else {
      await prisma.userHistory.create({
        data: {
          userId,
          videoId: video.id,
          episodeId: payload.episodeId ?? null,
          progressSecond: payload.progressSecond,
        },
      });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

function extractQualityLabel(title: string): '480P' | '720P' | '1080P' | '4K' | 'AUTO' {
  const text = title.toUpperCase();
  if (text.includes('4K')) return '4K';
  if (text.includes('1080')) return '1080P';
  if (text.includes('720')) return '720P';
  if (text.includes('480')) return '480P';
  return 'AUTO';
}
