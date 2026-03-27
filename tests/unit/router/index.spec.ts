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
  });
});
