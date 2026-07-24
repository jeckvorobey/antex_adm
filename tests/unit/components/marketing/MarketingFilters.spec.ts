import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MarketingFilters from '@/components/marketing/MarketingFilters.vue';

describe('MarketingFilters', () => {
  it('передаёт выбранный быстрый период вместе с фильтрами', async () => {
    const wrapper = mount(MarketingFilters, {
      props: {
        modelValue: {
          dateFrom: '2026-07-01',
          dateTo: '2026-07-24',
          campaignId: null,
          currency: null,
        },
        campaignOptions: [],
      },
      global: {
        stubs: {
          AdminDateInput: true,
          MarketingCurrencySelect: true,
        },
      },
    });

    const weekButton = wrapper
      .findAll('.q-btn-toggle button')
      .find((button) => button.text() === 'Неделя');
    await weekButton!.trigger('click');

    expect(wrapper.emitted('apply')?.[0]?.[1]).toBe('week');
  });
});
