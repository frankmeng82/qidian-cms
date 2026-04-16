import { z } from 'zod';

export const createVideoSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.string().max(255).optional(),
  description: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  categoryId: z.string().uuid().optional(),
  coverImage: z.string().url().optional(),
});

export const updateVideoSchema = createVideoSchema.partial();

export const listVideosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  keyword: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  status: z.coerce.number().int().optional(),
});
