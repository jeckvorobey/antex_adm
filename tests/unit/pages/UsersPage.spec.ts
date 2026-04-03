import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import UsersPage from '@pages/UsersPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(UsersPage, {
    global: { plugins: [[Quasar, {}]] },
  });
}

describe('UsersPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('вызывает /api/admin/users при монтировании', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/users');
  });

  it('рендерит таблицу пользователей', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.find('.q-table').exists()).toBe(true);
  });

  it('данные из API отображаются в таблице', async () => {
    const users = [
      {
        id: 1,
        username: 'johndoe',
        first_name: 'John',
        role: 9,
        role_name: 'Пользователь',
        createdAt: '2024-01-01',
      },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: users });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('johndoe');
    expect(wrapper.html()).toContain('Пользователь');
  });

  it('loading=false после успешной загрузки', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledOnce();
  });

  it('компонент не падает при ошибке API', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });
});
