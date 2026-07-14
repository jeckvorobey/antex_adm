import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from 'quasar';

import ManagementGeneratorPage from '@/pages/ManagementGeneratorPage.vue';

const { createMock, previewMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  previewMock: vi.fn(),
}));

vi.mock('@/services/marketing', () => ({
  marketingApi: { createCampaign: createMock, generateCampaignCode: previewMock },
}));

describe('ManagementGeneratorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewMock.mockResolvedValue({ code: 'BDF7J9J8JH', token: 'preview-token-1' });
  });

  it('использует компактную responsive-композицию общего стиля admin', async () => {
    const wrapper = mount(ManagementGeneratorPage);
    await flushPromises();

    expect(wrapper.get('[data-testid="generator-title"]').classes()).toContain('text-h5');
    expect(wrapper.text()).not.toContain('РЕКЛАМА');
    expect(wrapper.text()).not.toContain('Код назначает сервер');
    expect(wrapper.text()).not.toContain('Поля со звёздочкой обязательны');
    expect(wrapper.get('[data-testid="campaign-fields-column"]').classes()).toEqual(
      expect.arrayContaining(['col-12', 'col-lg-8']),
    );
    expect(wrapper.get('[data-testid="campaign-code-column"]').classes()).toEqual(
      expect.arrayContaining(['col-12', 'col-lg-4']),
    );
    expect(wrapper.get('[data-testid="submit-campaign"]').classes()).toContain('full-width');
  });

  it('показывает серверный код в read-only поле и отправляет его с метаданными', async () => {
    createMock.mockResolvedValue({
      id: 1,
      code: 'BDF7J9J8JH',
      link: 'https://t.me/antex_bot?startapp=market_BDF7J9J8JH',
      marketParameter: 'market=BDF7J9J8JH',
    });
    const wrapper = mount(ManagementGeneratorPage);
    await flushPromises();

    const codeInput = wrapper.get('input[name="code"]');
    expect((codeInput.element as HTMLInputElement).readOnly).toBe(true);
    expect((codeInput.element as HTMLInputElement).value).toBe('market_BDF7J9J8JH');
    expect(wrapper.text()).toContain('Код ещё не сохранён в базе данных');

    await wrapper.get('input[name="name"]').setValue('Telegram Ads July');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Telegram Ads July',
        provider: 'telegram_ads',
        codeToken: 'preview-token-1',
      }),
    );
    expect(wrapper.text()).toContain('BDF7J9J8JH');
    expect(wrapper.text()).toContain('market=BDF7J9J8JH');
  });

  it('перегенерирует код и заменяет прежнее значение во временном состоянии', async () => {
    previewMock
      .mockResolvedValueOnce({ code: 'BDF7J9J8JH', token: 'preview-token-1' })
      .mockResolvedValueOnce({ code: 'NEWW8X2K4Q', token: 'preview-token-2' });
    const wrapper = mount(ManagementGeneratorPage);
    await flushPromises();

    await wrapper.get('[data-testid="regenerate-code"]').trigger('click');
    await flushPromises();

    expect(previewMock).toHaveBeenCalledTimes(2);
    expect((wrapper.get('input[name="code"]').element as HTMLInputElement).value).toBe(
      'market_NEWW8X2K4Q',
    );
    expect(wrapper.text()).not.toContain('market_BDF7J9J8JH');
  });

  it('копирует готовую ссылку', async () => {
    createMock.mockResolvedValue({
      id: 1,
      code: 'BDF7J9J8JH',
      link: 'https://t.me/antex_bot?startapp=market_BDF7J9J8JH',
      marketParameter: 'market=BDF7J9J8JH',
    });
    const wrapper = mount(ManagementGeneratorPage);
    await flushPromises();
    await wrapper.get('input[name="name"]').setValue('Campaign');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    await wrapper.get('[data-testid="copy-link"]').trigger('click');

    expect(copyToClipboard).toHaveBeenCalledWith(
      'https://t.me/antex_bot?startapp=market_BDF7J9J8JH',
    );
  });

  it('сохраняет данные формы при ошибке API', async () => {
    createMock.mockRejectedValue(new Error('network'));
    const wrapper = mount(ManagementGeneratorPage);
    await flushPromises();
    await wrapper.get('input[name="name"]').setValue('Keep me');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect((wrapper.get('input[name="name"]').element as HTMLInputElement).value).toBe('Keep me');
  });

  it('отправляет даты кампании в ISO-формате', async () => {
    createMock.mockResolvedValue({
      id: 1,
      code: 'BDF7J9J8JH',
      link: 'https://t.me/antex_bot',
    });
    const wrapper = mount(ManagementGeneratorPage);
    await flushPromises();

    await wrapper.get('input[name="name"]').setValue('Campaign');
    const dates = wrapper.findAllComponents({ name: 'AdminDateInput' });
    await dates[0]?.vm.$emit('update:modelValue', '2026-07-17');
    await dates[1]?.vm.$emit('update:modelValue', '2026-07-31');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ startsAt: '2026-07-17', endsAt: '2026-07-31' }),
    );
  });
});
