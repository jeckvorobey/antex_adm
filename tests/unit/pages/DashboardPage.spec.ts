import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import DashboardPage from '@pages/DashboardPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@boot/axios';

const summaryFixture = {
  ordersToday: 8,
  usersTotal: 1248,
  featuredRates: [],
  users: {
    total: 1248,
    newToday: 24,
    activeToday: 187,
  },
  orders: {
    total: 4821,
    today: 8,
    new: 3,
    inProgress: 5,
    completedToday: 12,
  },
  attentionOrders: [
    {
      id: 17,
      publicNumber: '2026070089',
      amountSell: 300,
      currencySell: 'USDT',
      amountBuy: 9081,
      currencyBuy: 'THB',
      status: 1,
      createdAt: '2026-07-31T06:00:00Z',
      ageMinutes: 45,
      reason: 'Не обработана вовремя',
      overdue: true,
    },
  ],
  turnover: [
    { currency: 'USDT', today: 12500, total: 282430 },
    { currency: 'RUB', today: 740000, total: 15840000 },
    { currency: 'THB', today: 439000, total: 9162000 },
  ],
  rates: [
    {
      pairId: 'rub-thb',
      label: 'THB/RUB',
      finalRate: 2.44,
      finalRateDisplay: '2.44',
      rateText: '1 THB = 2.44 RUB',
      updatedAt: '2026-07-31T06:20:00Z',
    },
    {
      pairId: 'usdt-thb',
      label: 'USDT/THB',
      finalRate: 30.17,
      finalRateDisplay: '30.17',
      rateText: '1 USDT = 30.17 THB',
      updatedAt: '2026-07-31T06:20:00Z',
    },
  ],
  generatedAt: '2026-07-31T06:23:00Z',
};

describe('DashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  function mountDashboard() {
    return mount(DashboardPage, {
      global: {
        plugins: [[Quasar, {}]],
      },
    });
  }

  it('показывает операционные блоки и не смешивает метрики с оборотом', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summaryFixture });

    const wrapper = mountDashboard();
    await flushPromises();

    expect(wrapper.text()).toContain('Требуют внимания');
    expect(wrapper.text()).toContain('Сегодня');
    expect(wrapper.text()).toContain('Пользователи');
    expect(wrapper.text()).toContain('Заявки');
    expect(wrapper.text()).toContain('Оборот завершённых');
    expect(wrapper.text()).toContain('Курсы');
    expect(wrapper.get('[data-testid="users-total"]').text()).toBe('1248');
    expect(wrapper.get('[data-testid="orders-total"]').text()).toBe('4821');
    expect(wrapper.text()).toContain('Новые');
    expect(wrapper.text()).toContain('Активные');
    expect(wrapper.text()).toContain('Создано');
    expect(wrapper.text()).toContain('Завершено');
  });

  it('показывает очередь внимания с направлением, возрастом и причиной', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summaryFixture });

    const wrapper = mountDashboard();
    await flushPromises();

    const row = wrapper.get('[data-testid="attention-order-17"]');
    expect(row.attributes('href')).toBe('/orders');
    expect(row.text()).toContain('2026070089');
    expect(row.text()).toContain('300 USDT');
    expect(row.text()).toContain('9 081 THB');
    expect(row.text()).toContain('45 мин');
    expect(row.text()).toContain('Не обработана вовремя');
  });

  it('выводит обороты отдельно по валютам', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summaryFixture });

    const wrapper = mountDashboard();
    await flushPromises();

    expect(wrapper.get('[data-testid="turnover-USDT"]').text()).toContain('USDT');
    expect(wrapper.get('[data-testid="turnover-RUB"]').text()).toContain('RUB');
    expect(wrapper.get('[data-testid="turnover-THB"]').text()).toContain('THB');
  });

  it('выводит все курсы в читаемом виде', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summaryFixture });

    const wrapper = mountDashboard();
    await flushPromises();

    expect(wrapper.text()).toContain('1 THB = 2.44 RUB');
    expect(wrapper.text()).toContain('1 USDT = 30.17 THB');
    expect(wrapper.text()).toContain('Все курсы');
  });

  it('повторно загружает summary по кнопке обновления', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summaryFixture });

    const wrapper = mountDashboard();
    await flushPromises();
    await wrapper.get('[data-testid="dashboard-refresh"]').trigger('click');
    await flushPromises();

    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenCalledWith('/api/admin/summary');
  });

  it('показывает контролируемую ошибку загрузки', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('network'));

    const wrapper = mountDashboard();
    await flushPromises();

    expect(wrapper.text()).toContain('Не удалось загрузить сводку');
  });
});
