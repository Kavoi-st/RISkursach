import { apiClient } from './apiClient';
import type { PageResponse } from './productsApi';

export type OrderLineDto = {
  productId: string;
  productName: string;
  sellerId: string;
  unitPrice: number;
  currency: string;
  quantity: number;
};

export type OrderDto = {
  id: string;
  buyerId: string;
  totalAmount: number;
  currency: string;
  status: string;
  lines?: OrderLineDto[];
};

export type CreateOrderPayload = {
  productIds: string[];
  shippingCountry: string;
  shippingCity: string;
  shippingStreet: string;
  shippingZip: string;
};

export async function createOrder(payload: CreateOrderPayload): Promise<OrderDto> {
  const { data } = await apiClient.post<OrderDto>('/orders', payload);
  return data;
}

export async function listMyOrders(page = 0, size = 20): Promise<PageResponse<OrderDto>> {
  const { data } = await apiClient.get<PageResponse<OrderDto>>('/orders/mine', {
    params: { page, size }
  });
  return data;
}

export async function getOrder(id: string): Promise<OrderDto> {
  const { data } = await apiClient.get<OrderDto>(`/orders/${id}`);
  return data;
}

export async function patchOrderStatus(id: string, status: string): Promise<OrderDto> {
  const { data } = await apiClient.patch<OrderDto>(`/orders/${id}/status`, null, {
    params: { status }
  });
  return data;
}
