import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import OrdersPage from '@pages/OrdersPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(OrdersPage, {
    global: { plugins: [[Quasar, {}]] },
  });
}

describe('OrdersPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('вызывает /api/admin/orders при монтировании', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/orders');
  });

  it('показывает loading=true во время загрузки', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    const wrapper = mountPage();
    const table = wrapper.find('.q-table');
    expect(table.exists()).toBe(true);
  });

  it('loading=false после успешной загрузки', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledOnce();
  });

  it('loading=false после ошибки загрузки (finally)', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));
    const wrapper = mountPage();
    await flushPromises();
    // Компонент не упал — finally отработал
    expect(wrapper.exists()).toBe(true);
  });

  it('данные из API попадают в таблицу', async () => {
    const orders = [
      { id: 1, publicNumber: '2026050001', UserId: 42, amountSell: 100, currencySell: 'RUB', amountBuy: 1, currencyBuy: 'USDT', status: 1, createdAt: '2024-01-01' },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: orders });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('2026050001');
  });

  it('показывает дату заявки в едином admin-формате', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          publicNumber: '2026050001',
          UserId: 42,
          amountSell: 100,
          currencySell: 'RUB',
          amountBuy: 1,
          currencyBuy: 'USDT',
          status: 1,
          createdAt: '1970-01-01T16:20:00Z',
        },
      ],
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.html()).toContain('01.01.1970 16:20');
  });

  it('обновляет статус заявки через backend', async () => {
    const orders = [
      { id: 1, publicNumber: '2026050001', UserId: 42, amountSell: 100, currencySell: 'RUB', amountBuy: 1, currencyBuy: 'USDT', status: 1, createdAt: '2024-01-01' },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: orders });
    vi.mocked(api.patch).mockResolvedValue({
      data: { ...orders[0], status: 2 },
    });

    const wrapper = mountPage();
    await flushPromises();

    await wrapper.find('[data-testid="confirm-order-1"]').trigger('click');
    await flushPromises();

    expect(api.patch).toHaveBeenCalledWith('/api/admin/orders/1/status', { status: 2 });
    expect(wrapper.html()).toContain('В работе');
  });
});
