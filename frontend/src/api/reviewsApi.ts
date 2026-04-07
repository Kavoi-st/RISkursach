import { apiClient } from './apiClient';
import type { PageResponse } from './productsApi';

export type ReviewDto = {
  id: string;
  productId: string;
  authorId: string;
  authorFullName?: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

export async function listReviewsForProduct(
  productId: string,
  page = 0,
  size = 20
): Promise<PageResponse<ReviewDto>> {
  const { data } = await apiClient.get<PageResponse<ReviewDto>>('/reviews', {
    params: { productId, page, size }
  });
  return data;
}

export type CreateReviewPayload = {
  productId: string;
  orderId?: string;
  rating: number;
  comment?: string;
};

export async function createReview(payload: CreateReviewPayload): Promise<ReviewDto> {
  const { data } = await apiClient.post<ReviewDto>('/reviews', payload);
  return data;
}
