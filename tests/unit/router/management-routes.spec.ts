import { describe, expect, it } from 'vitest';

import routes from '@/router/routes';

describe('management routes', () => {
  it('объявляет четыре lazy route и dashboard по умолчанию', () => {
    const root = routes.find((route) => route.path === '/');
    const management = root?.children?.filter((route) =>
      String(route.path).startsWith('management/'),
    );

    expect(management?.map((route) => route.path)).toEqual([
      'management/dashboard',
      'management/campaigns',
      'management/applications',
      'management/generator',
    ]);
    expect(root?.children).toContainEqual({
      path: 'management',
      redirect: '/management/dashboard',
    });
  });
});
