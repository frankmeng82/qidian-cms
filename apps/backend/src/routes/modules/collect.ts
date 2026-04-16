import { Prisma } from '@prisma/client';
import { Router } from 'express';

import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../middlewares/admin.js';
import { requireAuth } from '../../middlewares/auth.js';
import { enqueueCollectJob } from '../../services/collect-queue.js';
import { ApiError } from '../../utils/api-error.js';
import { createCollectRuleSchema, executeCollectSchema } from '../../validators/collect.js';

export const collectRouter = Router();

collectRouter.get('/rules', requireAuth, requireAdmin, async (_req, res) => {
  const rules = await prisma.collectRule.findMany({
    where: { status: 1 },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(rules);
});

collectRouter.post('/rules', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = createCollectRuleSchema.parse(req.body);
    const rule = await prisma.collectRule.create({ data: payload });
    return res.status(201).json(rule);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return next(new ApiError(409, '采集规则名称已存在'));
    }
    return next(error);
  }
});

collectRouter.post('/execute', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = executeCollectSchema.parse(req.body);
    const rule = await prisma.collectRule.findFirst({
      where: { id: payload.ruleId, status: 1 },
    });
    if (!rule) {
      throw new ApiError(404, '采集规则不存在');
    }
    const taskId = await enqueueCollectJob({
      ruleId: payload.ruleId,
      triggerType: 'manual',
      limit: payload.limit,
    });
    return res.json({
      taskId,
      status: 'queued',
      message: '采集任务已入队',
    });
  } catch (error) {
    return next(error);
  }
});

collectRouter.get('/logs', requireAuth, requireAdmin, async (_req, res) => {
  const logs = await prisma.collectLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      rule: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return res.json(logs);
});
