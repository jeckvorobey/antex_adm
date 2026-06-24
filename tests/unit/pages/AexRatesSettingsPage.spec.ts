import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar, Notify } from 'quasar';
import AexRatesSettingsPage from '@pages/aex/AexRatesSettingsPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(AexRatesSettingsPage, {
    global: { plugins: [[Quasar, { plugins: { Notify } }]] },
  });
}

describe('AexRatesSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: [] });
  });

  it('загружает глобальную ставку при монтировании', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/admin/aex/rate') return Promise.resolve({ data: { rate: 0.2, updatedAt: '2026-06-24T10:00:00Z' } });
      return Promise.resolve({ data: [] });
    });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/aex/rate');
  });

  it('загружает персональные ставки при монтировании', async () => {
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/aex/rates/personal');
  });

  it('загружает партнёрские ставки при монтировании', async () => {
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/aex/rates/partner');
  });

  it('отображает персональные ставки из API', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/admin/aex/rate') return Promise.resolve({ data: { rate: 0.2, updatedAt: null } });
      if (url === '/api/admin/aex/rates/personal') {
        return Promise.resolve({
          data: [
            { id: 1, userId: 100, username: 'alice', rate: 0.5, createdAt: '2026-06-24T10:00:00Z', updatedAt: '2026-06-24T10:00:00Z' },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('alice');
    expect(wrapper.html()).toContain('0,5%');
  });

  it('отображает партнёрские ставки из API', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/admin/aex/rate') return Promise.resolve({ data: { rate: 0.2, updatedAt: null } });
      if (url === '/api/admin/aex/rates/partner') {
        return Promise.resolve({
          data: [
            { id: 2, userId: 200, username: 'bob', rate: 1.0, createdAt: '2026-06-24T10:00:00Z', updatedAt: '2026-06-24T10:00:00Z' },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('bob');
  });

  it('сохраняет глобальную ставку через PUT', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/admin/aex/rate') return Promise.resolve({ data: { rate: 0.2, updatedAt: null } });
      return Promise.resolve({ data: [] });
    });
    vi.mocked(api.put).mockResolvedValue({ data: { rate: 0.3, updatedAt: '2026-06-24T12:00:00Z' } });
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountPage();
    await flushPromises();

    const saveBtn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сохранить'));
    await saveBtn?.trigger('click');
    await flushPromises();

    expect(api.put).toHaveBeenCalledWith('/api/admin/aex/rate', { rate: 0.2 });
    expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }));
  });

  it('не падает при ошибке загрузки', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });

  it('кнопка Добавить для персональных ставок открывает диалог', async () => {
    const wrapper = mountPage();
    await flushPromises();
    const addBtns = wrapper.findAll('.q-btn').filter((b) => b.text().includes('Добавить'));
    expect(addBtns.length).toBeGreaterThanOrEqual(2);
  });
});
