import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from 'quasar';

import ManagementGeneratorPage from '@/pages/ManagementGeneratorPage.vue';

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock('@/services/marketing', () => ({
  marketingApi: { createCampaign: postMock },
}));

describe('ManagementGeneratorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('не содержит редактируемого поля code и отправляет метаданные', async () => {
    postMock.mockResolvedValue({
      id: 1,
      code: 'BDF7J9J8JH',
      link: 'https://t.me/antex_bot?startapp=market_BDF7J9J8JH',
      marketParameter: 'market=BDF7J9J8JH',
    });
    const wrapper = mount(ManagementGeneratorPage);
    const inputs = wrapper.findAll('input');
    expect(wrapper.find('[name="code"]').exists()).toBe(false);

    await inputs[0]!.setValue('Telegram Ads July');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(postMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Telegram Ads July',
        provider: 'telegram_ads',
      }),
    );
    expect(wrapper.text()).toContain('BDF7J9J8JH');
    expect(wrapper.text()).toContain('market=BDF7J9J8JH');
  });

  it('копирует готовую ссылку', async () => {
    postMock.mockResolvedValue({
      id: 1,
      code: 'BDF7J9J8JH',
      link: 'https://t.me/antex_bot?startapp=market_BDF7J9J8JH',
      marketParameter: 'market=BDF7J9J8JH',
    });
    const wrapper = mount(ManagementGeneratorPage);
    await wrapper.find('input').setValue('Campaign');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    await wrapper.get('[data-testid="copy-link"]').trigger('click');

    expect(copyToClipboard).toHaveBeenCalledWith(
      'https://t.me/antex_bot?startapp=market_BDF7J9J8JH',
    );
  });

  it('сохраняет данные формы при ошибке API', async () => {
    postMock.mockRejectedValue(new Error('network'));
    const wrapper = mount(ManagementGeneratorPage);
    await wrapper.find('input').setValue('Keep me');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Keep me');
  });
});
