import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar, Notify } from 'quasar';
import RatesPage from '@pages/RatesPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

import { api } from '@boot/axios';

function mockAdminGet(params?: { rates?: unknown[] }) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    return Promise.resolve({ data: params?.rates ?? [] });
  });
}

function mountPage() {
  return mount(RatesPage, {
    global: { plugins: [[Quasar, { plugins: { Notify } }]] },
  });
}

describe('RatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminGet();
  });

  it('вызывает /api/admin/rates при монтировании', async () => {
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/rates');
  });

  it('refreshRates вызывает POST /api/admin/rates/refresh', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    const wrapper = mountPage();
    await flushPromises();
    const refreshBtn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Обновить'));
    await refreshBtn?.trigger('click');
    await flushPromises();
    expect(api.post).toHaveBeenCalledWith('/api/admin/rates/refresh');
  });

  it('показывает текущие курсы GEL и VND из backend', async () => {
    mockAdminGet({
      rates: [
        {
          id: 1,
          currency: 'RUBGEL',
          country: 'georgia',
          countryRuName: 'Грузия',
          price: 0.03,
          priceDisplay: '0.03',
          baseRate: 33.33,
          baseRateDisplay: '33.33',
          finalRate: 34.36,
          finalRateDisplay: '34.36',
          margin: 3,
          createdAt: '2026-05-12T10:00:00Z',
          updatedAt: '2026-05-12T10:00:00Z',
        },
        {
          id: 2,
          currency: 'USDTVND',
          country: 'vietnam',
          countryRuName: 'Вьетнам',
          price: 25500,
          priceDisplay: '25500.00',
          baseRate: 25500,
          baseRateDisplay: '25500.00',
          finalRate: 24735,
          finalRateDisplay: '24735.00',
          margin: 4.5,
          createdAt: '2026-05-12T10:00:00Z',
          updatedAt: '2026-05-12T10:00:00Z',
        },
      ],
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('RUBGEL');
    expect(wrapper.html()).toContain('USDTVND');
    expect(wrapper.html()).toContain('Грузия');
    expect(wrapper.html()).toContain('Вьетнам');
  });

  it('показывает колонку процента и не показывает allowance-блок', async () => {
    mockAdminGet({
      rates: [
        {
          id: 1,
          currency: 'RUBTHB',
          country: 'thailand',
          countryRuName: 'Таиланд',
          price: 0.41,
          priceDisplay: '0.41',
          baseRate: 2.44,
          baseRateDisplay: '2.44',
          finalRate: 2.51,
          finalRateDisplay: '2.51',
          margin: 3,
          createdAt: '2026-05-12T10:00:00Z',
          updatedAt: '2026-05-12T10:00:00Z',
        },
      ],
    });
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.html()).toContain('Наценка');
    expect(wrapper.html()).toContain('Таиланд');
    expect(wrapper.html()).not.toContain('allowance');
  });

  it('сохраняет процент строки через PATCH /api/admin/rates/:id', async () => {
    mockAdminGet({
      rates: [
        {
          id: 1,
          currency: 'RUBTHB',
          country: 'thailand',
          countryRuName: 'Таиланд',
          price: 0.41,
          priceDisplay: '0.41',
          baseRate: 2.44,
          baseRateDisplay: '2.44',
          finalRate: 2.51,
          finalRateDisplay: '2.51',
          margin: 3,
          createdAt: '2026-05-12T10:00:00Z',
          updatedAt: '2026-05-12T10:00:00Z',
        },
      ],
    });
    vi.mocked(api.patch).mockResolvedValue({
      data: {
        id: 1,
        currency: 'RUBTHB',
        country: 'thailand',
        countryRuName: 'Таиланд',
        price: 0.41,
        priceDisplay: '0.41',
        baseRate: 2.44,
        baseRateDisplay: '2.44',
        finalRate: 2.48,
        finalRateDisplay: '2.48',
        margin: 4.5,
        createdAt: '2026-05-12T10:00:00Z',
        updatedAt: '2026-05-12T10:05:00Z',
      },
    });
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountPage();
    await flushPromises();

    const popup = wrapper.findComponent({ name: 'QPopupEdit' });
    popup.vm.$emit('save', 4.5);
    await flushPromises();

    expect(api.patch).toHaveBeenCalledWith('/api/admin/rates/1', { margin: 4.5 });
    expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }));
  });

  it('после refresh перезагружает список курсов', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ok: true, rates: { RUBGEL: 0.03 } } });
    const wrapper = mountPage();
    await flushPromises();
    vi.mocked(api.get).mockClear();

    const refreshBtn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Обновить'));
    await refreshBtn?.trigger('click');
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/api/admin/rates');
  });

  it('refreshRates показывает positive уведомление', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountPage();
    await flushPromises();
    const refreshBtn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Обновить'));
    await refreshBtn?.trigger('click');
    await flushPromises();
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive' })
    );
  });

  it('компонент не падает при ошибке загрузки курсов', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });

  it('кнопка Обновить присутствует на странице', async () => {
    const wrapper = mountPage();
    await flushPromises();
    const btns = wrapper.findAll('.q-btn').map((b) => b.text());
    expect(btns.some((t) => t.includes('Обновить'))).toBe(true);
  });
});
