import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar, Notify } from 'quasar';
import RatesPage from 'src/pages/RatesPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

import { api } from 'src/boot/axios';

function mountPage() {
  return mount(RatesPage, {
    global: { plugins: [[Quasar, { plugins: { Notify } }]] },
  });
}

describe('RatesPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('вызывает /api/admin/allowance при монтировании', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { value: 0.02 } });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/allowance');
  });

  it('allowanceValue устанавливается из ответа API', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { value: 0.05 } });
    const wrapper = mountPage();
    await flushPromises();
    const input = wrapper.find('input[type="number"]');
    expect(input.element.value).toBe('0.05');
  });

  it('saveAllowance вызывает PUT с текущим значением', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { value: 0.03 } });
    vi.mocked(api.put).mockResolvedValue({ data: {} });
    const wrapper = mountPage();
    await flushPromises();
    const saveBtn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сохранить'));
    await saveBtn?.trigger('click');
    await flushPromises();
    expect(api.put).toHaveBeenCalledWith('/api/admin/allowance', { value: 0.03 });
  });

  it('saveAllowance показывает positive уведомление', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { value: 0.02 } });
    vi.mocked(api.put).mockResolvedValue({ data: {} });
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountPage();
    await flushPromises();
    const saveBtn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сохранить'));
    await saveBtn?.trigger('click');
    await flushPromises();
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive' })
    );
  });

  it('refreshRates вызывает POST /api/admin/rates/refresh', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { value: 0.02 } });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    const wrapper = mountPage();
    await flushPromises();
    const refreshBtn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Обновить'));
    await refreshBtn?.trigger('click');
    await flushPromises();
    expect(api.post).toHaveBeenCalledWith('/api/admin/rates/refresh');
  });

  it('refreshRates показывает positive уведомление', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { value: 0.02 } });
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

  it('компонент не падает при ошибке загрузки allowance', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });

  it('кнопка Сохранить и кнопка Обновить присутствуют на странице', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { value: 0.02 } });
    const wrapper = mountPage();
    await flushPromises();
    const btns = wrapper.findAll('.q-btn').map((b) => b.text());
    expect(btns.some((t) => t.includes('Сохранить'))).toBe(true);
    expect(btns.some((t) => t.includes('Обновить'))).toBe(true);
  });
});
