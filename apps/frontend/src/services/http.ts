import axios from 'axios';

export const http = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('qidian_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { __retry?: boolean }) | undefined;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.__retry &&
      !String(originalRequest.url).includes('/auth/refresh')
    ) {
      originalRequest.__retry = true;
      const token = localStorage.getItem('qidian_access_token');
      if (token) {
        try {
          const { data } = await http.post<{ accessToken: string }>('/auth/refresh', { token });
          localStorage.setItem('qidian_access_token', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return http(originalRequest);
        } catch {
          localStorage.removeItem('qidian_access_token');
        }
      }
    }
    return Promise.reject(error);
  },
);
