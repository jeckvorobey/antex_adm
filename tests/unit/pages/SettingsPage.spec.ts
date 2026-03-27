import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar, Notify } from 'quasar';
import SettingsPage from '@pages/SettingsPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(SettingsPage, {
    global: { plugins: [[Quasar, { plugins: { Notify } }]] },
  });
}

describe('SettingsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('вызывает /api/admin/config при монтировании', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { enabled: true } });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/config');
  });

  it('botEnabled=false когда API вернул enabled:false', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { enabled: false } });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Бот выключен');
  });

  it('botEnabled=true когда API вернул enabled:true', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { enabled: true } });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Бот включён');
  });

  it('toggleBot вызывает POST /api/admin/config/toggle', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { enabled: true } });
    vi.mocked(api.post).mockResolvedValue({ data: { enabled: false } });
    const wrapper = mountPage();
    await flushPromises();
    const toggle = wrapper.find('.q-toggle');
    await toggle.trigger('click');
    await flushPromises();
    expect(api.post).toHaveBeenCalledWith('/api/admin/config/toggle');
  });

  it('toggleBot показывает positive уведомление при успехе', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { enabled: true } });
    vi.mocked(api.post).mockResolvedValue({ data: { enabled: false } });
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountPage();
    await flushPromises();
    const toggle = wrapper.find('.q-toggle');
    await toggle.trigger('click');
    await flushPromises();
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive' })
    );
  });

  it('toggleBot показывает error уведомление при ошибке', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { enabled: true } });
    vi.mocked(api.post).mockRejectedValue(new Error('500'));
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountPage();
    await flushPromises();
    const toggle = wrapper.find('.q-toggle');
    await toggle.trigger('click');
    await flushPromises();
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative', message: 'Ошибка' })
    );
  });
});
