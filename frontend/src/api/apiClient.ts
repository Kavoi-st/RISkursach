import axios, { AxiosError } from 'axios';

/**
 * Базовый Axios‑клиент для общения с backend API.
 * Добавляет JWT‑токен в заголовки и обрабатывает ошибки.
 */

const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
/** В Docker за nginx используем относительный путь; в dev — прямой backend. */
const API_BASE_URL =
  envUrl != null && envUrl.length > 0
    ? envUrl
    : import.meta.env.DEV
      ? 'http://localhost:8080/api/v1'
      : '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false
});

/**
 * Хелперы для работы с токенами.
 * Здесь можно заменить на Zustand/Redux store по мере внедрения.
 */
const TOKEN_STORAGE_KEY = 'accessToken';

export function setAccessToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

// Интерсептор: добавление Authorization заголовка
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерсептор: базовая обработка ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response) {
      // Можно добавить централизованную обработку 401/403/500
      console.error(
        'API error:',
        error.response.status,
        error.response.data ?? error.response.statusText
      );
    } else if (error.request) {
      console.error('API error: no response from server');
    } else {
      console.error('API error:', error.message);
    }

    return Promise.reject(error);
  }
);

