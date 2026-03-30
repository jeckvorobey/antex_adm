import { describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';

vi.mock('quasar/wrappers', () => ({
  route: (fn: (ctx?: unknown) => unknown) => fn,
}));

describe('router/index', () => {
  it('создает роутер с базовыми маршрутами', async () => {
    process.env.VUE_ROUTER_MODE = 'history';
    process.env.VUE_ROUTER_BASE = '/';

    const routerFactory = (await import('src/router')).default as (ctx?: unknown) => Router;
    const router = routerFactory({});
    const paths = router.getRoutes().map((record) => record.path);

    expect(paths).toContain('/login');
    expect(paths).toContain('/');
    expect(paths).toContain('/broadcasts');
  });

  it('маршрут /login рендерится через layout, а не напрямую в QPage', async () => {
    process.env.VUE_ROUTER_MODE = 'history';
    process.env.VUE_ROUTER_BASE = '/';

    const routerFactory = (await import('src/router')).default as (ctx?: unknown) => Router;
    const router = routerFactory({});
    const loginMatch = router.resolve('/login');

    expect(loginMatch.matched).toHaveLength(2);
    expect(loginMatch.matched[0]?.path).toBe('/login');
    expect(loginMatch.matched[1]?.name).toBe('login');
  });
});
