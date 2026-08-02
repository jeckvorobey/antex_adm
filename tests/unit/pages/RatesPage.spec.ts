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

  it('помечает только backend-обозначенные реверсивные пары', async () => {
    mockAdminGet({
      rates: [
        {
          id: 1,
          currency: 'RUBTHB',
          country: 'thailand',
          countryRuName: 'Таиланд',
          isReversed: true,
          displayCurrencySell: 'THB',
          displayCurrencyBuy: 'RUB',
          baseRate: 2.44,
          baseRateDisplay: '2.44',
          finalRate: 2.51,
          finalRateDisplay: '2.51',
          directBaseRate: 0.41,
          directBaseRateDisplay: '0.410000',
          directFinalRate: 0.3977,
          directFinalRateDisplay: '0.397700',
          margin: 3,
          updatedAt: '2026-05-12T10:00:00Z',
        },
        {
          id: 2,
          currency: 'RUBGEL',
          country: 'georgia',
          countryRuName: 'Грузия',
          isReversed: true,
          displayCurrencySell: 'GEL',
          displayCurrencyBuy: 'RUB',
          baseRate: 33.33,
          baseRateDisplay: '33.33',
          finalRate: 34.36,
          finalRateDisplay: '34.36',
          directBaseRate: 0.03,
          directBaseRateDisplay: '0.030000',
          directFinalRate: 0.0291,
          directFinalRateDisplay: '0.029100',
          margin: 3,
          updatedAt: '2026-05-12T10:00:00Z',
        },
        {
          id: 3,
          currency: 'RUBUSDT',
          country: null,
          countryRuName: null,
          isInternal: true,
          isReversed: true,
          displayCurrencySell: 'USDT',
          displayCurrencyBuy: 'RUB',
          baseRate: 90,
          baseRateDisplay: '90.00',
          finalRate: 92.78,
          finalRateDisplay: '92.78',
          directBaseRate: 0.011111111,
          directBaseRateDisplay: '0.011111',
          directFinalRate: 0.010777777,
          directFinalRateDisplay: '0.010778',
          margin: 3,
          updatedAt: '2026-05-12T10:00:00Z',
        },
        {
          id: 4,
          currency: 'USDTTHB',
          country: 'thailand',
          countryRuName: 'Таиланд',
          isReversed: false,
          displayCurrencySell: 'USDT',
          displayCurrencyBuy: 'THB',
          baseRate: 36.2,
          baseRateDisplay: '36.20',
          finalRate: 35.11,
          finalRateDisplay: '35.11',
          directBaseRate: 36.2,
          directBaseRateDisplay: '36.20',
          directFinalRate: 35.114,
          directFinalRateDisplay: '35.11',
          margin: 3,
          updatedAt: '2026-05-12T10:00:00Z',
        },
      ],
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.findAll('[aria-label="Реверсивный курс"]')).toHaveLength(3);
    expect(wrapper.html()).toContain('Курс показан реверсивно: 92.78 RUB за 1 USDT');
    expect(wrapper.html()).not.toContain('Курс показан реверсивно: 35.11');
  });

  it('редактирует наценку внутреннего RUB/USDT курса', async () => {
    mockAdminGet({
      rates: [
        {
          id: 7,
          currency: 'USDTRUB',
          country: null,
          countryRuName: null,
          isInternal: true,
          price: 90,
          priceDisplay: '90.00',
          baseRate: 90,
          baseRateDisplay: '90.00',
          finalRate: 87.3,
          finalRateDisplay: '87.30',
          margin: 3,
          createdAt: '2026-07-22T10:00:00Z',
          updatedAt: '2026-07-22T10:00:00Z',
        },
      ],
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.html()).toContain('USDTRUB');
    expect(wrapper.html()).toContain('Внутренний курс');
    expect(wrapper.findComponent({ name: 'QPopupEdit' }).exists()).toBe(true);

    vi.mocked(api.patch).mockResolvedValue({
      data: {
        id: 7,
        currency: 'USDTRUB',
        country: null,
        countryRuName: null,
        isInternal: true,
        price: 85.5,
        priceDisplay: '85.50',
        baseRate: 90,
        baseRateDisplay: '90.00',
        finalRate: 85.5,
        finalRateDisplay: '85.50',
        margin: 5,
        createdAt: '2026-07-22T10:00:00Z',
        updatedAt: '2026-07-22T10:05:00Z',
      },
    });
    wrapper.findComponent({ name: 'QPopupEdit' }).vm.$emit('save', 5);
    await flushPromises();

    expect(api.patch).toHaveBeenCalledWith('/api/admin/rates/7', { margin: 5 });
    expect(wrapper.html()).toContain('85.50');
  });

  it('показывает дату обновления курса в едином admin-формате', async () => {
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
          createdAt: '1970-01-01T16:20:00Z',
          updatedAt: '1970-01-01T16:20:00Z',
        },
      ],
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.html()).toContain('01.01.1970 16:20');
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
    expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }));
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

  it('кнопка ручного запуска имеет текст "Обновить курс"', async () => {
    const wrapper = mountPage();
    await flushPromises();
    const btns = wrapper.findAll('.q-btn').map((b) => b.text());
    expect(btns).toContain('Обновить курс');
  });
});
