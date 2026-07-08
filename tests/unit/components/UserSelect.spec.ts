import { flushPromises, mount } from '@vue/test-utils';
import { Quasar } from 'quasar';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserSelect from '@components/admin/UserSelect.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@boot/axios';

function mountSelect(props: Record<string, unknown> = {}) {
  return mount(UserSelect, {
    props: {
      modelValue: null,
      ...props,
    },
    global: { plugins: [[Quasar]] },
  });
}

describe('UserSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [
          {
            id: 42,
            telegram_id: 900042,
            username: 'alice',
            first_name: 'Alice',
            last_name: 'Example',
            phone: '+660001',
            aex_balance: '12.50000000',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      },
    });
  });

  it('ищет пользователей через admin users endpoint', async () => {
    const wrapper = mountSelect();

    await wrapper.find('.q-select__input').setValue('alice');
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/api/admin/users', {
      params: { search: 'alice', limit: 20, offset: 0 },
      signal: expect.any(AbortSignal),
    });
  });

  it('показывает identity пользователя в options', async () => {
    const wrapper = mountSelect();

    await wrapper.find('.q-select__input').setValue('alice');
    await flushPromises();

    expect(wrapper.html()).toContain('@alice');
    expect(wrapper.html()).toContain('Alice Example');
    expect(wrapper.html()).toContain('ID 42');
    expect(wrapper.html()).toContain('TG 900042');
  });

  it('отдает наружу выбранный user id', async () => {
    const wrapper = mountSelect();

    await wrapper.find('.q-select__input').setValue('alice');
    await flushPromises();
    await wrapper.find('select').setValue('42');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([42]);
  });

  it('гидратирует начальный modelValue через detail endpoint', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        id: 7,
        telegram_id: 900007,
        username: 'bob',
        first_name: 'Bob',
        last_name: null,
        phone: null,
      },
    });

    const wrapper = mountSelect({ modelValue: 7 });
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/api/admin/users/7', {
      signal: expect.any(AbortSignal),
    });
    expect(wrapper.html()).toContain('@bob');
  });
});
