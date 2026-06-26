import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import SiteLeadsPage from '@pages/SiteLeadsPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(SiteLeadsPage, {
    global: { plugins: [[Quasar, {}]] },
  });
}

describe('SiteLeadsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('вызывает /api/admin/site-leads при монтировании', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/site-leads', {
      params: { limit: 20, offset: 0 },
    });
  });

  it('показывает заявки сайта в таблице', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          messenger: 'Max',
          contact: '@client',
          topic: 'Обмен',
          message: 'Нужен обмен RUB на USDT',
          source: 'tets.antex.pro',
          createdAt: '1970-01-01T16:20:00Z',
        },
      ],
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.html()).toContain('@client');
    expect(wrapper.html()).toContain('tets.antex.pro');
    expect(wrapper.html()).toContain('01.01.1970 16:20');
  });
});
