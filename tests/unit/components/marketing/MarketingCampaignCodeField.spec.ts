import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MarketingCampaignCodeField from '@/components/marketing/MarketingCampaignCodeField.vue';

describe('MarketingCampaignCodeField', () => {
  it('показывает read-only код и запрашивает перегенерацию', async () => {
    const wrapper = mount(MarketingCampaignCodeField, {
      props: {
        modelValue: 'BDF7J9J8JH',
        loading: false,
        disabled: false,
        errorMessage: '',
      },
    });

    const input = wrapper.get('input[name="code"]');
    expect((input.element as HTMLInputElement).readOnly).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe('BDF7J9J8JH');
    expect(wrapper.text()).not.toContain('market_');
    expect(wrapper.get('[data-testid="campaign-code-field"]').classes()).toEqual(
      expect.arrayContaining(['col-12']),
    );
    expect(wrapper.get('[data-testid="campaign-code-field"]').classes()).not.toContain(
      'q-col-gutter-sm',
    );
    expect(input.classes()).toEqual(expect.arrayContaining(['col-12', 'col-md-6']));

    await wrapper.get('[data-testid="regenerate-code"]').trigger('click');

    expect(wrapper.emitted('regenerate')).toHaveLength(1);
    expect(wrapper.get('[data-testid="regenerate-code"]').attributes('round')).toBeDefined();
    expect(wrapper.text()).not.toContain('Обновить код');
  });
});
