import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import DashboardPage from '@pages/DashboardPage.vue';
import dashboardSource from '@pages/DashboardPage.vue?raw';

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
    { currency: 'ATXG', today: 300, total: 1300 },
  ],
  rates: [
    {
      pairId: 'rub-thb',
      label: 'GEL/RUB',
      baseRate: 2.44,
      baseRateDisplay: '2.44',
      finalRate: 31.27,
      finalRateDisplay: '31.27',
      rateText: '1 GEL = 31.27 RUB',
      updatedAt: '2026-07-31T06:20:00Z',
    },
    {
      pairId: 'usdt-thb',
      label: 'USDT/THB',
      baseRate: 30.5,
      baseRateDisplay: '30.50',
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
    expect(wrapper.get('[data-testid="turnover-marker-USDT"]').attributes('alt')).toBe('USDT');
    expect(wrapper.get('[data-testid="turnover-marker-ATXG"]').attributes('alt')).toBe('ATXG');
    expect(wrapper.get('[data-testid="turnover-marker-RUB"]').text()).toContain('🇷🇺');
    expect(wrapper.get('[data-testid="turnover-marker-USDT"]').attributes('width')).toBe('32');
    expect(wrapper.get('[data-testid="turnover-marker-ATXG"]').attributes('height')).toBe('32');
    expect(dashboardSource).toContain('DashboardCurrencyMarker');
    expect(dashboardSource).not.toContain('q-avatar');
    expect(dashboardSource).not.toContain('currencyColor');
  });

  it('выводит все курсы в читаемом виде', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: summaryFixture });

    const wrapper = mountDashboard();
    await flushPromises();

    expect(wrapper.text()).toContain('от 31.27 RUB');
    expect(wrapper.text()).toContain('от 30.17');
    expect(wrapper.get('[data-testid="rate-rub-thb"]').text()).toContain('1 GEL');
    expect(wrapper.get('[data-testid="rate-rub-thb"]').text()).toContain('от 31.27 RUB');
    expect(wrapper.get('[data-testid="rate-usdt-thb"]').text()).toContain('БЦ 30.50');
    expect(wrapper.get('[data-testid="rate-marker-rub-thb-GEL"]').text()).toContain('🇬🇪');
    expect(wrapper.get('[data-testid="rate-marker-rub-thb-RUB"]').text()).toContain('🇷🇺');
    expect(wrapper.get('[data-testid="rate-marker-usdt-thb-USDT"]').attributes('width')).toBe('25');
    expect(wrapper.findAll('[data-testid^="rate-marker-"]')).toHaveLength(4);
    expect(dashboardSource).not.toContain('rate-row__side');
    expect(dashboardSource).toContain('rate-row__quote');
    expect(dashboardSource).not.toContain('Базовая цена:');
    expect(wrapper.text()).toContain('Все курсы');
  });

  it('занимает всю ширину desktop-контейнера и центрирует значения Сегодня', () => {
    expect(dashboardSource).toContain('.dashboard-shell {\n  width: 100%;');
    expect(dashboardSource).not.toContain('width: min(100%, 1440px)');
    expect(dashboardSource).toContain(
      '.compact-metrics div {\n  min-width: 0;\n  text-align: center;',
    );
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
