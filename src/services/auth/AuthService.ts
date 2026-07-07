import { apiClient } from '@/services/network/ApiClient';
import type { GuestAuthResponse } from '@/types/api.types';
import { sanitizeDisplayName } from '@/utils/displayName';

const DEVICE_KEY = 'ngoboatrace_device_id';
const TOKEN_KEY = 'ngoboatrace_token';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export class AuthService {
  async ensureGuest(displayName = 'Người chơi'): Promise<GuestAuthResponse | null> {
    const safeName = sanitizeDisplayName(displayName);
    const cached = localStorage.getItem(TOKEN_KEY);
    if (cached) {
      apiClient.setToken(cached);
      return { token: cached, playerId: '', displayName: safeName };
    }

    const res = await apiClient.post<GuestAuthResponse>('/auth/guest', {
      deviceId: getDeviceId(),
      displayName: safeName,
    });

    if (!res.ok) return null;

    localStorage.setItem(TOKEN_KEY, res.data.token);
    apiClient.setToken(res.data.token);
    return res.data;
  }

  getToken(): string | null {
    return apiClient.getToken() ?? localStorage.getItem(TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    apiClient.setToken(null);
  }
}

export const authService = new AuthService();
