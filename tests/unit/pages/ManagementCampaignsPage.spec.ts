import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ManagementCampaignsPage from '@/pages/ManagementCampaignsPage.vue';

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));
vi.mock('@/services/marketing', () => ({
  marketingApi: {
    listCampaigns: listMock,
    updateCampaign: vi.fn(),
    upsertDailyMetric: vi.fn(),
  },
}));

describe('ManagementCampaignsPage', () => {
  beforeEach(() => {
    listMock.mockResolvedValue({
      items: [
        {
          id: 1,
          code: 'BDF7J9J8JH',
          name: 'Telegram July',
          provider: 'telegram_ads',
          status: 'active',
          currency: 'USDT',
          budget: 100,
          link: 'https://t.me/bot?startapp=market_BDF7J9J8JH',
          marketParameter: 'market=BDF7J9J8JH',
          createdAt: '2026-07-13T00:00:00Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
  });

  it('загружает server page и не предлагает создать кампанию', async () => {
    const wrapper = mount(ManagementCampaignsPage);
    await flushPromises();

    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ limit: 20, offset: 0 }));
    expect(wrapper.text()).toContain('Telegram July');
    expect(wrapper.text()).not.toContain('Создать кампанию');
    expect(wrapper.text()).toContain('Метрики');
    expect(wrapper.text()).toContain('Архивировать');
  });
});
