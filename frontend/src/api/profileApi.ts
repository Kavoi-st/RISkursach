import { apiClient } from './apiClient';

export type MeDto = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  storeName?: string | null;
  storeDescription?: string | null;
  googleLinked?: boolean;
};

export async function getMe(): Promise<MeDto> {
  const { data } = await apiClient.get<MeDto>('/profile/me');
  return data;
}

export type BecomeSellerResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
  storeName: string;
};

export async function becomeSeller(body: {
  storeName: string;
  storeDescription?: string;
}): Promise<BecomeSellerResponse> {
  const { data } = await apiClient.post<BecomeSellerResponse>('/profile/become-seller', body);
  return data;
}

export async function linkGoogle(idToken: string): Promise<MeDto> {
  const { data } = await apiClient.post<MeDto>('/profile/link-google', { idToken });
  return data;
}

export async function unlinkGoogle(): Promise<MeDto> {
  const { data } = await apiClient.post<MeDto>('/profile/unlink-google');
  return data;
}
