import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  parentId: z.string().uuid().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();
