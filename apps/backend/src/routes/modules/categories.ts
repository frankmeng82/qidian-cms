import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../middlewares/admin.js';
import { requireAuth } from '../../middlewares/auth.js';
import { ApiError } from '../../utils/api-error.js';
import { createCategorySchema, updateCategorySchema } from '../../validators/category.js';

export const categoryRouter = Router();
type CategoryTreeItem = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  videoCount: number;
  children: CategoryTreeItem[];
};

const listCategorySchema = z.object({
  onlyWithContent: z.coerce.boolean().default(true),
});

categoryRouter.get('/', async (req, res, next) => {
  try {
    const query = listCategorySchema.parse(req.query);
    const categories = await prisma.category.findMany({
      where: { status: 1 },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        videos: {
          where: { status: 1 },
          select: { id: true },
        },
      },
    });

    const byId = new Map(categories.map((category) => [category.id, category]));
    const childrenMap = new Map<string, typeof categories>();
    for (const category of categories) {
      if (!category.parentId) continue;
      if (!childrenMap.has(category.parentId)) {
        childrenMap.set(category.parentId, []);
      }
      childrenMap.get(category.parentId)!.push(category);
    }

    function hasContent(id: string): boolean {
      const item = byId.get(id);
      if (!item) return false;
      if (item.videos.length > 0) return true;
      const children = childrenMap.get(id) ?? [];
      return children.some((child) => hasContent(child.id));
    }

    function toTree(parentId: string | null): CategoryTreeItem[] {
      const list = categories.filter((item) => (item.parentId ?? null) === parentId);
      return list
        .filter((item) => (!query.onlyWithContent ? true : hasContent(item.id)))
        .map((item) => ({
          id: item.id,
          name: item.name,
          parentId: item.parentId,
          sortOrder: item.sortOrder,
          videoCount: item.videos.length,
          children: toTree(item.id),
        }));
    }

    return res.json(toTree(null));
  } catch (error) {
    return next(error);
  }
});

categoryRouter.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = createCategorySchema.parse(req.body);
    const category = await prisma.category.create({ data: payload });
    return res.status(201).json(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return next(new ApiError(409, '分类名称已存在'));
    }
    return next(error);
  }
});

categoryRouter.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = updateCategorySchema.parse(req.body);
    const exists = await prisma.category.findFirst({
      where: { id: req.params.id, status: 1 },
    });
    if (!exists) {
      throw new ApiError(404, '分类不存在');
    }
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: payload,
    });
    return res.json(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return next(new ApiError(409, '分类名称已存在'));
    }
    return next(error);
  }
});

categoryRouter.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const category = await prisma.category.findFirst({
      where: { id: req.params.id, status: 1 },
      include: {
        videos: {
          where: { status: 1 },
          select: { id: true },
        },
      },
    });
    if (!category) {
      throw new ApiError(404, '分类不存在');
    }
    if (category.videos.length > 0) {
      throw new ApiError(400, '分类下存在内容，无法删除');
    }
    await prisma.category.update({
      where: { id: req.params.id },
      data: { status: 0 },
    });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});
