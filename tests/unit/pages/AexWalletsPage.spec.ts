import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import AexWalletsPage from '@pages/aex/AexWalletsPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(AexWalletsPage, {
    global: { plugins: [[Quasar]] },
  });
}

describe('AexWalletsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: [] });
  });

  it('вызывает /api/admin/aex/wallets при монтировании', async () => {
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/aex/wallets', {
      params: { limit: 20, offset: 0 },
    });
  });

  it('отображает список кошельков', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { id: 1, userId: 100, username: 'alice', available: 100.5, reserved: 20.3, updatedAt: '2026-06-24T10:00:00Z' },
        { id: 2, userId: 200, username: 'bob', available: 0, reserved: 5.0, updatedAt: '2026-06-24T11:00:00Z' },
      ],
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('alice');
    expect(wrapper.html()).toContain('bob');
  });

  it('отображает балансы (available, reserved, total)', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { id: 1, userId: 100, username: 'alice', available: 100.5, reserved: 20.3, updatedAt: '2026-06-24T10:00:00Z' },
      ],
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('100,50');
    expect(wrapper.html()).toContain('20,30');
    expect(wrapper.html()).toContain('120,80');
  });

  it('передаёт search параметр при поиске', async () => {
    const wrapper = mountPage();
    await flushPromises();
    const searchInput = wrapper.find('input');
    await searchInput.setValue('alice');
    await flushPromises();
    // debounce 300ms, подождём
    await new Promise((r) => setTimeout(r, 350));
    await flushPromises();
    expect(api.get).toHaveBeenLastCalledWith('/api/admin/aex/wallets', {
      params: { limit: 20, offset: 0, search: 'alice' },
    });
  });

  it('не падает при ошибке загрузки', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });

  it('показывает "Нет данных" при пустом списке', async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Нет данных');
  });
});
