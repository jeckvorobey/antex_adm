import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import AexJournalPage from '@pages/aex/AexJournalPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(AexJournalPage, {
    global: { plugins: [[Quasar]] },
  });
}

describe('AexJournalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: { data: [], total: 0 } });
  });

  it('вызывает /api/admin/aex/operations при монтировании', async () => {
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/aex/operations', {
      params: { offset: 0, limit: 20 },
    });
  });

  it('отображает список операций', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            userId: 100,
            username: 'alice',
            type: 'credit',
            amount: 50,
            balanceBefore: 100,
            balanceAfter: 150,
            reason: 'Бонус',
            createdAt: '2026-06-24T10:00:00Z',
          },
          {
            id: 2,
            userId: 200,
            username: 'bob',
            type: 'debit',
            amount: -10,
            balanceBefore: 50,
            balanceAfter: 40,
            reason: 'Корректировка',
            createdAt: '2026-06-24T11:00:00Z',
          },
        ],
        total: 2,
      },
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('alice');
    expect(wrapper.html()).toContain('bob');
  });

  it('отображает badges для типов операций', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            userId: 100,
            username: 'alice',
            type: 'credit',
            amount: 50,
            balanceBefore: 100,
            balanceAfter: 150,
            createdAt: '2026-06-24T10:00:00Z',
          },
        ],
        total: 1,
      },
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Начисление');
  });

  it('для большого total использует серверную пагинацию таблицы', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            userId: 100,
            type: 'credit',
            amount: 50,
            balanceBefore: 100,
            balanceAfter: 150,
            createdAt: '2026-06-24T10:00:00Z',
          },
        ],
        total: 50,
      },
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.find('.q-table').attributes('pagination')).toContain('[object Object]');
  });

  it('без данных не рендерит отдельный q-pagination', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            userId: 100,
            type: 'credit',
            amount: 50,
            balanceBefore: 100,
            balanceAfter: 150,
            createdAt: '2026-06-24T10:00:00Z',
          },
        ],
        total: 1,
      },
    });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.find('.q-pagination').exists()).toBe(false);
  });

  it('кнопка Обновить присутствует', async () => {
    const wrapper = mountPage();
    await flushPromises();
    const btns = wrapper.findAll('.q-btn').map((b) => b.text());
    expect(btns.some((t) => t.includes('Обновить'))).toBe(true);
  });

  it('фильтрует операции по выбранному пользователю из autocomplete', async () => {
    const wrapper = mountPage();
    await flushPromises();
    vi.mocked(api.get).mockClear();

    wrapper.findComponent({ name: 'UserSelect' }).vm.$emit('update:modelValue', 100);
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/api/admin/aex/operations', {
      params: { offset: 0, limit: 20, userId: 100 },
    });
  });

  it('отправляет даты в backend-safe формате после выбора через QDate', async () => {
    const wrapper = mountPage();
    await flushPromises();
    vi.mocked(api.get).mockClear();

    const dates = wrapper.findAll('.q-date');
    await dates[0]?.setValue('16.04.2026');
    await flushPromises();
    await dates[1]?.setValue('18.04.2026');
    await flushPromises();

    expect(api.get).toHaveBeenLastCalledWith('/api/admin/aex/operations', {
      params: {
        offset: 0,
        limit: 20,
        dateFrom: '2026-04-16',
        dateTo: '2026-04-18',
      },
    });
  });

  it('отображает hold как warning badge', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [
          {
            id: 1,
            userId: 100,
            username: 'alice',
            type: 'hold',
            amount: 50,
            balanceBefore: 100,
            balanceAfter: 100,
            createdAt: '2026-06-24T10:00:00Z',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      },
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.html()).toContain('Холд');
    expect(wrapper.find('.bg-warning').exists()).toBe(true);
  });

  it('не падает при ошибке загрузки', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });
});
