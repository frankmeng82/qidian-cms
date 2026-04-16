import cron from 'node-cron';

import { prisma } from '../lib/prisma.js';

import { enqueueCollectJob } from './collect-queue.js';

let hasStarted = false;

export async function startCollectScheduler() {
  if (hasStarted) return;
  hasStarted = true;

  const rules = await prisma.collectRule.findMany({
    where: {
      status: 1,
      cronExpr: {
        not: null,
      },
    },
  });

  for (const rule of rules) {
    if (!rule.cronExpr) continue;
    if (!cron.validate(rule.cronExpr)) continue;
    cron.schedule(rule.cronExpr, async () => {
      try {
        await enqueueCollectJob({
          ruleId: rule.id,
          triggerType: 'cron',
        });
      } catch {
        // swallow scheduler errors to avoid crashing process
      }
    });
  }
}
