import { apiClient } from './apiClient';
import type { PageResponse } from './productsApi';

export type DisputeDto = {
  id: string;
  orderId: string;
  openedByUserId: string;
  againstSellerId: string;
  status: string;
  reason: string;
  description?: string | null;
  resolutionComment?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MessageDto = {
  id: string;
  disputeId: string;
  senderId: string;
  senderFullName?: string;
  content: string;
  createdAt: string;
};

export type DisputeDetailDto = {
  dispute: DisputeDto;
  messages: MessageDto[];
};

export async function getDispute(id: string): Promise<DisputeDetailDto> {
  const { data } = await apiClient.get<DisputeDetailDto>(`/disputes/${id}`);
  return data;
}

export async function postDisputeMessage(disputeId: string, content: string): Promise<MessageDto> {
  const { data } = await apiClient.post<MessageDto>(`/disputes/${disputeId}/messages`, {
    content
  });
  return data;
}

export async function openDispute(body: {
  orderId: string;
  reason: string;
  description?: string;
}): Promise<DisputeDto> {
  const { data } = await apiClient.post<DisputeDto>('/disputes', body);
  return data;
}

export async function listMyDisputes(page = 0, size = 20): Promise<PageResponse<DisputeDto>> {
  const { data } = await apiClient.get<PageResponse<DisputeDto>>('/disputes/mine', {
    params: { page, size }
  });
  return data;
}

export async function listAdminDisputes(
  status: string,
  page = 0,
  size = 20
): Promise<PageResponse<DisputeDto>> {
  const { data } = await apiClient.get<PageResponse<DisputeDto>>('/disputes/admin', {
    params: { status, page, size }
  });
  return data;
}

export async function takeDisputeUnderReview(disputeId: string): Promise<DisputeDto> {
  const { data } = await apiClient.post<DisputeDto>(`/disputes/${disputeId}/under-review`);
  return data;
}

export async function resolveDispute(
  disputeId: string,
  finalStatus: 'RESOLVED' | 'REJECTED',
  resolutionComment?: string
): Promise<DisputeDto> {
  const { data } = await apiClient.post<DisputeDto>(`/disputes/${disputeId}/resolve`, {
    finalStatus,
    resolutionComment: resolutionComment ?? ''
  });
  return data;
}
