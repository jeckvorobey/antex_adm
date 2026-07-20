import { describe, expect, it } from 'vitest';

import routes from '@/router/routes';

describe('management routes', () => {
  it('объявляет три lazy route без генератора ссылок и dashboard по умолчанию', () => {
    const root = routes.find((route) => route.path === '/');
    const management = root?.children?.filter((route) =>
      String(route.path).startsWith('management/'),
    );

    expect(management?.map((route) => route.path)).toEqual([
      'management/dashboard',
      'management/campaigns',
      'management/applications',
    ]);
    expect(root?.children).toContainEqual({
      path: 'management',
      redirect: '/management/dashboard',
    });
  });
});
