import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar, Notify } from 'quasar';
import SettingsPage from '@pages/SettingsPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
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

  it('toggleBot вызывает PATCH /api/admin/config', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { enabled: true } });
    vi.mocked(api.patch).mockResolvedValue({ data: { enabled: false } });
    const wrapper = mountPage();
    await flushPromises();
    const toggle = wrapper.find('.q-toggle');
    await toggle.trigger('click');
    await flushPromises();
    expect(api.patch).toHaveBeenCalledWith('/api/admin/config', { enabled: false });
  });

  it('сохраняет окно атрибуции через существующий config API', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { enabled: true, marketingAttributionWindowDays: 7 },
    });
    vi.mocked(api.patch).mockResolvedValue({ data: { marketingAttributionWindowDays: 14 } });
    const wrapper = mountPage();
    await flushPromises();
    const input = wrapper.find('input[type="number"]');
    await input.setValue('14');
    await input.trigger('submit');
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(api.patch).toHaveBeenCalledWith('/api/admin/config', {
      marketingAttributionWindowDays: 14,
    });
  });

  it('не принимает дробное окно атрибуции', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { enabled: true, marketingAttributionWindowDays: 7 },
    });
    const wrapper = mountPage();
    await flushPromises();
    const input = wrapper.find('input[type="number"]');
    await input.setValue('7.5');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(input.attributes('step')).toBe('1');
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('сохраняет график менеджеров в UTC после ввода в МСК', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        enabled: true,
        managerScheduleEnabled: true,
        managerStartTimeUtc: '06:00',
        managerEndTimeUtc: '18:00',
        managerWorkingDaysUtc: [1, 2, 3, 4, 5, 6, 7],
      },
    });
    vi.mocked(api.patch).mockResolvedValue({ data: {} });
    const wrapper = mountPage();
    await flushPromises();

    const timeInputs = wrapper.findAll('input[type="time"]');
    await timeInputs[0].setValue('10:00');
    await timeInputs[1].setValue('22:00');
    await wrapper.findAll('form')[1].trigger('submit');
    await flushPromises();

    expect(api.patch).toHaveBeenCalledWith('/api/admin/config', {
      managerScheduleEnabled: true,
      managerWorkingDaysUtc: [1, 2, 3, 4, 5, 6, 7],
      managerStartTimeUtc: '07:00',
      managerEndTimeUtc: '19:00',
    });
  });

  it('toggleBot показывает positive уведомление при успехе', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { enabled: true } });
    vi.mocked(api.patch).mockResolvedValue({ data: { enabled: false } });
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountPage();
    await flushPromises();
    const toggle = wrapper.find('.q-toggle');
    await toggle.trigger('click');
    await flushPromises();
    expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }));
  });

  it('toggleBot показывает error уведомление при ошибке', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { enabled: true } });
    vi.mocked(api.patch).mockRejectedValue(new Error('500'));
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountPage();
    await flushPromises();
    const toggle = wrapper.find('.q-toggle');
    await toggle.trigger('click');
    await flushPromises();
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative', message: 'Ошибка' }),
    );
  });
});
