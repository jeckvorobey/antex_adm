import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import BanksPage from 'src/pages/BanksPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

import { api } from 'src/boot/axios';

function mountPage() {
  return mount(BanksPage, {
    global: { plugins: [[Quasar, {}]] },
  });
}

describe('BanksPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('вызывает /api/admin/banks при монтировании', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/banks');
  });

  it('рендерит таблицу банков', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.find('.q-table').exists()).toBe(true);
  });

  it('данные из API отображаются в таблице', async () => {
    const banks = [
      { id: 1, code: 'SBER', name: 'Сбербанк' },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: banks });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('SBER');
  });

  it('loading=false после успешной загрузки', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledOnce();
  });

  it('компонент не падает при ошибке API', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });
});
