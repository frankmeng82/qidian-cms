import type { CategoryNode } from '../types/category';

import { http } from './http';

export async function fetchCategories(onlyWithContent = true): Promise<CategoryNode[]> {
  const { data } = await http.get<CategoryNode[]>('/categories', {
    params: { onlyWithContent },
  });
  return data;
}

export async function createCategory(payload: {
  name: string;
  parentId?: string;
  sortOrder?: number;
}) {
  const { data } = await http.post('/categories', payload);
  return data;
}

export async function updateCategory(
  id: string,
  payload: {
    name?: string;
    parentId?: string;
    sortOrder?: number;
  },
) {
  const { data } = await http.put(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string) {
  await http.delete(`/categories/${id}`);
}
