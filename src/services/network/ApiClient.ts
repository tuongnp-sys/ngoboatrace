import { env } from '@/config/env';
import type { ApiResponse } from '@/types/api.types';

export class ApiClient {
  private token: string | null = null;

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    try {
      const res = await fetch(`${env.apiUrl}${path}`, { ...options, headers });
      const json = (await res.json()) as ApiResponse<T>;
      return json;
    } catch {
      return { ok: false, error: { code: 'OFFLINE', message: 'Network unavailable' } };
    }
  }

  get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }
}

export const apiClient = new ApiClient();
