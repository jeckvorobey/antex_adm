import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import DailyMetricsDialog from '@/components/marketing/DailyMetricsDialog.vue';

const { upsertMock } = vi.hoisted(() => ({ upsertMock: vi.fn() }));
vi.mock('@/services/marketing', () => ({
  marketingApi: { upsertDailyMetric: upsertMock },
}));

describe('DailyMetricsDialog', () => {
  it('задает non-negative controls и отправляет upsert', async () => {
    upsertMock.mockResolvedValue({});
    const wrapper = mount(DailyMetricsDialog);
    wrapper.vm.open!({ id: 7, name: 'Campaign' });
    await wrapper.vm.$nextTick();

    const numericInputs = wrapper.findAll('input[type="number"]');
    expect(numericInputs).toHaveLength(4);
    expect(numericInputs.every((input) => input.attributes('min') === '0')).toBe(true);
    await numericInputs[0]!.setValue('100');
    await numericInputs[1]!.setValue('10');
    await numericInputs[2]!.setValue('25');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(upsertMock).toHaveBeenCalledWith(
      7,
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      expect.objectContaining({ impressions: 100, starts: 10, spend: 25 }),
    );
  });

  it('отправляет выбранный день метрик в ISO-формате', async () => {
    upsertMock.mockResolvedValue({});
    const wrapper = mount(DailyMetricsDialog);
    wrapper.vm.open!({ id: 7, name: 'Campaign' });
    await wrapper.vm.$nextTick();

    await wrapper
      .findComponent({ name: 'AdminDateInput' })
      .vm.$emit('update:modelValue', '2026-07-17');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(upsertMock).toHaveBeenCalledWith(7, '2026-07-17', expect.any(Object));
  });
});
