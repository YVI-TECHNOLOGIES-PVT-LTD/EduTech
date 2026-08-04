import { SecureStorageService } from './secure-storage.service';

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const mobileApiClient = {
  async fetch(url: string, options: RequestOptions = {}): Promise<Response> {
    const token = await SecureStorageService.getAccessToken();
    const workspaceId = await SecureStorageService.getWorkspaceId();
    const requestId = `req-mobile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(workspaceId && { 'X-Workspace-Id': workspaceId }),
      ...(options.headers || {}),
    };

    return fetch(url, {
      ...options,
      headers,
    });
  },

  async get<T>(url: string): Promise<T> {
    const res = await this.fetch(url, { method: 'GET' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async post<T>(url: string, body: any): Promise<T> {
    const res = await this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${res.status}`);
    }
    return res.json();
  },
};
