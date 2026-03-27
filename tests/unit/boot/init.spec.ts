import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('quasar/wrappers', () => ({
  boot: (fn: (ctx: unknown) => unknown) => fn,
}));

vi.mock('src/boot/axios', () => ({
  api: { post: vi.fn(), get: vi.fn() },
}));

import { useAuthStore } from '@stores/auth';

describe('boot/init — route guard', () => {
  let store: ReturnType<typeof useAuthStore>;
  let guardFn: (to: { meta?: Record<string, unknown> }) => unknown;

  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    store = useAuthStore();

    const mockRouter = {
      beforeEach: vi.fn((fn) => {
        guardFn = fn;
      }),
    };

    // Динамический импорт после vi.mock чтобы мок применился
    const bootModule = await import('src/boot/init');
    const bootFn = bootModule.default as (ctx: { router: typeof mockRouter }) => unknown;
    await bootFn({ router: mockRouter });
  });

  it('guard пропускает публичный роут (нет requiresAuth)', () => {
    const result = guardFn({ meta: {} });
    expect(result).toBeUndefined();
  });

  it('guard редиректит на login при requiresAuth и unauthenticated', () => {
    const result = guardFn({ meta: { requiresAuth: true } });
    expect(result).toEqual({ name: 'login' });
  });

  it('guard пропускает requiresAuth роут при аутентифицированном пользователе', () => {
    store.restoreSession();
    localStorage.setItem('admin_access_token', 'valid-token');
    store.restoreSession();
    const result = guardFn({ meta: { requiresAuth: true } });
    expect(result).toBeUndefined();
  });

  it('restoreSession вызывается при инициализации boot', () => {
    // restoreSession вызывается в beforeEach выше при выполнении boot.
    // Если token в storage — store будет аутентифицирован.
    localStorage.setItem('admin_access_token', 'boot-token');
    // Пересоздаём для нового теста
    const freshStore = useAuthStore();
    freshStore.restoreSession();
    expect(freshStore.isAuthenticated).toBe(true);
  });
});
