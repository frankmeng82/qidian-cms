import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/api-error.js';

type TriggerType = 'manual' | 'cron' | 'queue';

type CollectItem = {
  title: string;
  year?: number;
  description?: string;
  coverImage?: string;
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
});

export async function executeCollectRule(
  ruleId: string,
  triggerType: TriggerType,
  limitOverride?: number,
) {
  const rule = await prisma.collectRule.findFirst({
    where: { id: ruleId, status: 1 },
  });
  if (!rule) {
    throw new ApiError(404, '采集规则不存在');
  }

  const latestLog = await prisma.collectLog.findFirst({
    where: { ruleId },
    orderBy: { createdAt: 'desc' },
  });
  if (latestLog && Date.now() - latestLog.createdAt.getTime() < rule.minIntervalMs) {
    throw new ApiError(429, '采集触发过于频繁，请稍后重试');
  }

  const started = await prisma.collectLog.create({
    data: {
      ruleId,
      status: 'running',
      triggerType,
      message: '任务执行中',
    },
  });

  try {
    const response = await axios.get<string>(rule.sourceUrl, {
      timeout: 30000,
      responseType: 'text',
    });
    const list = normalizeCollectItems(response.data, rule.sourceType);
    const maxItems = Math.min(limitOverride ?? rule.maxItems, 100);
    const picked = list.slice(0, maxItems);

    let created = 0;
    let skipped = 0;
    let failed = 0;
    for (const item of picked) {
      try {
        const exists = await prisma.video.findFirst({
          where: {
            title: item.title,
            year: item.year ?? null,
            status: 1,
          },
        });
        if (exists) {
          skipped += 1;
          continue;
        }
        await prisma.video.create({
          data: {
            title: item.title,
            year: item.year ?? null,
            description: item.description,
            coverImage: item.coverImage,
            status: 1,
          },
        });
        created += 1;
      } catch {
        failed += 1;
      }
    }

    await prisma.collectLog.update({
      where: { id: started.id },
      data: {
        status: failed > 0 ? 'partial' : 'success',
        message: `采集完成，新增${created}条，跳过${skipped}条，失败${failed}条`,
        total: picked.length,
        created,
        skipped,
        failed,
      },
    });

    return {
      taskId: started.id,
      status: failed > 0 ? 'partial' : 'success',
      total: picked.length,
      created,
      skipped,
      failed,
    };
  } catch (error) {
    await prisma.collectLog.update({
      where: { id: started.id },
      data: {
        status: 'failed',
        message: error instanceof Error ? error.message : '采集任务异常',
      },
    });
    throw error;
  }
}

function normalizeCollectItems(raw: string, type: string): CollectItem[] {
  if (type === 'json') {
    const json = JSON.parse(raw);
    const list = Array.isArray(json?.list) ? json.list : Array.isArray(json) ? json : [];
    return list
      .map(toItem)
      .filter((item: CollectItem | null): item is CollectItem => Boolean(item?.title));
  }

  const xml = xmlParser.parse(raw);
  const candidates =
    xml?.rss?.list?.video ?? xml?.rss?.list?.vod ?? xml?.list?.video ?? xml?.list?.vod ?? [];
  const list = Array.isArray(candidates) ? candidates : [candidates];
  return list
    .map(toItem)
    .filter((item: CollectItem | null): item is CollectItem => Boolean(item?.title));
}

function toItem(raw: unknown): CollectItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const title = String(data.title ?? data.vod_name ?? '').trim();
  if (!title) return null;

  const yearRaw = data.year ?? data.vod_year;
  const parsedYear = Number(yearRaw);
  const year = Number.isInteger(parsedYear) ? parsedYear : undefined;

  const description = String(data.description ?? data.vod_content ?? '').trim() || undefined;
  const coverImage = String(data.coverImage ?? data.pic ?? data.vod_pic ?? '').trim() || undefined;
  return {
    title,
    year,
    description,
    coverImage,
  };
}
