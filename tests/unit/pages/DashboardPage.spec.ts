import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import DashboardPage from '@pages/DashboardPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@boot/axios';

describe('DashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  function mountDashboard() {
    return mount(DashboardPage, {
      global: {
        plugins: [[Quasar, {}]],
      },
    });
  }

  it('рендерится без ошибок', () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { ordersToday: 0, usersTotal: 0, featuredRates: [] },
    });
    expect(() => mountDashboard()).not.toThrow();
  });

  it('показывает карточки статистики', () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { ordersToday: 0, usersTotal: 0, featuredRates: [] },
    });
    const wrapper = mountDashboard();
    const cards = wrapper.findAll('.q-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it('загружает summary с backend', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        ordersToday: 3,
        usersTotal: 12,
        featuredRates: [
          {
            pairId: 'rub-thb',
            label: 'RUB/THB',
            finalRate: 0.41,
            finalRateDisplay: '0.41',
          },
        ],
      },
    });
    const wrapper = mountDashboard();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/summary');
    expect(wrapper.html()).toContain('3');
    expect(wrapper.html()).toContain('12');
    expect(wrapper.html()).toContain('RUB/THB');
    expect(wrapper.html()).toContain('0.41');
  });
});
