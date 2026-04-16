import { z } from 'zod';

export const createCollectRuleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sourceUrl: z.string().url(),
  sourceType: z.enum(['xml', 'json']),
  cronExpr: z.string().trim().optional(),
  maxItems: z.coerce.number().int().min(1).max(100).default(100),
  minIntervalMs: z.coerce.number().int().min(300000).default(300000),
});

export const executeCollectSchema = z.object({
  ruleId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
