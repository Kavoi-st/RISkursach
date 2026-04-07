import { apiClient } from './apiClient';

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
};

export async function listCategories(): Promise<CategoryDto[]> {
  const { data } = await apiClient.get<CategoryDto[]>('/categories');
  return data;
}

/** UUID из миграции V8 — категория «Объявления» */
export const DEFAULT_LISTINGS_CATEGORY_ID = '11111111-1111-1111-1111-111111111101';
