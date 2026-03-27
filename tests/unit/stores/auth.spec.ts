import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('src/boot/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('isAuthenticated is false initially', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    expect(store.accessToken).toBeNull();
  });

  it('restoreSession читает токены из localStorage', () => {
    localStorage.setItem('admin_access_token', 'tok-access');
    localStorage.setItem('admin_refresh_token', 'tok-refresh');
    const store = useAuthStore();
    store.restoreSession();
    expect(store.accessToken).toBe('tok-access');
    expect(store.isAuthenticated).toBe(true);
  });

  it('restoreSession с пустым localStorage оставляет store неаутентифицированным', () => {
    const store = useAuthStore();
    store.restoreSession();
    expect(store.isAuthenticated).toBe(false);
  });

  it('login сохраняет токены и устанавливает isAuthenticated', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { access_token: 'access-123', refresh_token: 'refresh-456' },
    });
    const store = useAuthStore();
    await store.login('admin', 'secret');
    expect(store.accessToken).toBe('access-123');
    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.getItem('admin_access_token')).toBe('access-123');
    expect(localStorage.getItem('admin_refresh_token')).toBe('refresh-456');
  });

  it('login вызывает правильный endpoint с credentials', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { access_token: 'a', refresh_token: 'r' },
    });
    const store = useAuthStore();
    await store.login('myuser', 'mypass');
    expect(api.post).toHaveBeenCalledWith('/api/admin/login', {
      username: 'myuser',
      password: 'mypass',
    });
  });

  it('login пробрасывает ошибки', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('401 Unauthorized'));
    const store = useAuthStore();
    await expect(store.login('bad', 'creds')).rejects.toThrow('401 Unauthorized');
  });

  it('logout очищает токены и localStorage', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    localStorage.setItem('admin_access_token', 'tok-access');
    localStorage.setItem('admin_refresh_token', 'tok-refresh');
    const store = useAuthStore();
    store.restoreSession();
    await store.logout();
    expect(store.accessToken).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem('admin_access_token')).toBeNull();
    expect(localStorage.getItem('admin_refresh_token')).toBeNull();
  });

  it('logout вызывает /api/admin/logout', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    const store = useAuthStore();
    await store.logout();
    expect(api.post).toHaveBeenCalledWith('/api/admin/logout');
  });

  it('logout молча игнорирует ошибки API', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Network error'));
    const store = useAuthStore();
    await expect(store.logout()).resolves.toBeUndefined();
  });
});
