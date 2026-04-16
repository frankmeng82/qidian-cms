import Bull from 'bull';

import { env } from '../config/env.js';

import { executeCollectRule } from './collect-service.js';

type CollectJobData = {
  ruleId: string;
  triggerType: 'manual' | 'cron';
  limit?: number;
};

export const collectQueue = new Bull<CollectJobData>('collect-queue', env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

collectQueue.process(async (job) => {
  await executeCollectRule(job.data.ruleId, 'queue', job.data.limit);
});

export async function enqueueCollectJob(data: CollectJobData) {
  const job = await collectQueue.add(data, {
    jobId: `${data.ruleId}-${Date.now()}`,
  });
  return job.id;
}
