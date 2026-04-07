import { apiClient } from './apiClient';

export type ProductDto = {
  id: string;
  sellerId: string;
  sellerFullName?: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  availableQuantity: number;
  active: boolean;
  city?: string;
  district?: string;
  imageUrl?: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export async function listProducts(page = 0, size = 20): Promise<PageResponse<ProductDto>> {
  const { data } = await apiClient.get<PageResponse<ProductDto>>('/products', {
    params: { page, size }
  });
  return data;
}

export async function getProduct(id: string): Promise<ProductDto> {
  const { data } = await apiClient.get<ProductDto>(`/products/${id}`);
  return data;
}

export async function listMyProducts(page = 0, size = 50): Promise<PageResponse<ProductDto>> {
  const { data } = await apiClient.get<PageResponse<ProductDto>>('/products/mine', {
    params: { page, size }
  });
  return data;
}

export type CreateProductPayload = {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  availableQuantity: number;
  city: string;
  district: string;
  imageUrl?: string;
};

export async function createProduct(payload: CreateProductPayload): Promise<ProductDto> {
  const { data } = await apiClient.post<ProductDto>('/products', payload);
  return data;
}
