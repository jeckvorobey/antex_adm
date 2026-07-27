import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AdminDateInput from '@/components/ui/AdminDateInput.vue';

describe('AdminDateInput', () => {
  it('отображает ISO-день в европейском формате', () => {
    const wrapper = mount(AdminDateInput, {
      props: { modelValue: '2026-07-17', label: 'С даты' },
    });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('17.07.2026');
    expect(wrapper.find('.q-date').attributes('mask')).toBe('DD.MM.YYYY');
  });

  it('отдаёт API-safe ISO-день после выбора в календаре', async () => {
    const wrapper = mount(AdminDateInput, {
      props: { modelValue: '', label: 'Дата' },
    });

    await wrapper.find('.q-date').setValue('17.07.2026');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-07-17']]);
  });

  it('сохраняет промежуточный ручной ввод до полной даты', async () => {
    const wrapper = mount(AdminDateInput, {
      props: { modelValue: '', label: 'Дата' },
    });

    await wrapper.find('input').setValue('17.');

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('17.');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('отдаёт ISO-день после завершения ручного ввода', async () => {
    const wrapper = mount(AdminDateInput, {
      props: { modelValue: '', label: 'Дата' },
    });

    await wrapper.find('input').setValue('17.07.2026');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-07-17']]);
  });

  it('очищает v-model', async () => {
    const wrapper = mount(AdminDateInput, {
      props: { modelValue: '2026-07-17', label: 'Дата' },
    });

    await wrapper.findComponent({ name: 'QInputStub' }).vm.$emit('clear');

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
  });
});
