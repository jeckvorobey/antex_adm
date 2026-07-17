import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MarketingCampaignCodeField from '@/components/marketing/MarketingCampaignCodeField.vue';

describe('MarketingCampaignCodeField', () => {
  it('показывает read-only код и запрашивает перегенерацию', async () => {
    const wrapper = mount(MarketingCampaignCodeField, {
      props: {
        modelValue: 'market_BDF7J9J8JH',
        loading: false,
        disabled: false,
        errorMessage: '',
      },
    });

    const input = wrapper.get('input[name="code"]');
    expect((input.element as HTMLInputElement).readOnly).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe('market_BDF7J9J8JH');

    await wrapper.get('[data-testid="regenerate-code"]').trigger('click');

    expect(wrapper.emitted('regenerate')).toHaveLength(1);
  });
});
