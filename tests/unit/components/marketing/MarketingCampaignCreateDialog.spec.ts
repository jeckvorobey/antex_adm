import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MarketingCampaignCreateDialog from '@/components/marketing/MarketingCampaignCreateDialog.vue';

const { createMock, previewMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  previewMock: vi.fn(),
}));

vi.mock('@/services/marketing', () => ({
  marketingApi: { createCampaign: createMock, generateCampaignCode: previewMock },
}));

describe('MarketingCampaignCreateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewMock.mockResolvedValue({ code: 'BDF7J9J8JH', token: 'preview-token-1' });
  });

  it('сохраняет create-flow в диалоге и сообщает об успешном создании', async () => {
    createMock.mockResolvedValue({
      id: 1,
      code: 'BDF7J9J8JH',
      link: 'https://t.me/antex_bot?startapp=market_BDF7J9J8JH',
      marketParameter: 'market=BDF7J9J8JH',
    });
    const wrapper = mount(MarketingCampaignCreateDialog, { props: { modelValue: true } });
    await flushPromises();

    expect(wrapper.get('[data-testid="campaign-create-dialog"]').classes()).toContain(
      'campaign-create-dialog',
    );
    expect(wrapper.get('[data-testid="campaign-dialog-toolbar"]').classes()).toEqual(
      expect.arrayContaining(['no-wrap']),
    );
    expect(wrapper.text()).toContain('Новая компания');
    expect(wrapper.text()).not.toContain('Новая рекламная компания');
    expect(wrapper.get('[data-testid="campaign-data-fields"]').classes()).toEqual(
      expect.arrayContaining(['q-mx-none']),
    );
    await wrapper.get('input[name="name"]').setValue('Telegram Ads July');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Telegram Ads July', codeToken: 'preview-token-1' }),
    );
    expect(wrapper.emitted('created')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toContainEqual([false]);
  });

  it('запрашивает новый preview-код при каждом открытии', async () => {
    const wrapper = mount(MarketingCampaignCreateDialog, { props: { modelValue: false } });
    await wrapper.setProps({ modelValue: true });
    await flushPromises();
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });
    await flushPromises();

    expect(previewMock).toHaveBeenCalledTimes(2);
  });
});
