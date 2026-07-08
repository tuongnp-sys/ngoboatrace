import { apiClient } from '@/services/network/ApiClient';
import type { GuestAuthResponse } from '@/types/api.types';
import { sanitizeDisplayName, getDefaultDisplayName } from '@/utils/displayName';

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
  /** Validate cached token or register a fresh guest (e.g. after server DB reset). */
  async ensureGuest(displayName?: string): Promise<GuestAuthResponse | null> {
    const safeName = sanitizeDisplayName(displayName ?? getDefaultDisplayName());
    const cached = localStorage.getItem(TOKEN_KEY);

    if (cached) {
      apiClient.setToken(cached);
      const me = await apiClient.get<{ profile: Record<string, unknown>; updatedAt: number }>(
        '/player/me',
      );
      if (me.ok) {
        return { token: cached, playerId: '', displayName: safeName };
      }
      this.logout();
    }

    return this.registerGuest(safeName);
  }

  getToken(): string | null {
    return apiClient.getToken() ?? localStorage.getItem(TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    apiClient.setToken(null);
  }

  private async registerGuest(displayName: string): Promise<GuestAuthResponse | null> {
    const res = await apiClient.post<GuestAuthResponse>('/auth/guest', {
      deviceId: getDeviceId(),
      displayName,
    });

    if (!res.ok) return null;

    localStorage.setItem(TOKEN_KEY, res.data.token);
    apiClient.setToken(res.data.token);
    return res.data;
  }
}

export const authService = new AuthService();
