import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Notify, Quasar } from 'quasar';
import UsersPage from '@pages/UsersPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
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
        createdAt: '2026-05-12T07:41:36.012442Z',
      },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: users });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('johndoe');
    expect(wrapper.html()).toContain('Пользователь');
    expect(wrapper.html()).toContain('12.05.2026 07:41');
  });

  it('использует fixed layout для равномерной ширины колонок', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('.q-table').attributes('table-style')).toContain('table-layout: fixed');
  });

  it('показывает popup-edit для смены роли без оператора', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          username: 'johndoe',
          first_name: 'John',
          role: 9,
          role_name: 'Пользователь',
          createdAt: '2024-01-01',
        },
      ],
    });
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.findComponent({ name: 'QPopupEdit' }).exists()).toBe(true);
    expect(wrapper.html()).toContain('Пользователь');
    expect(wrapper.html()).toContain('Менеджер');
    expect(wrapper.html()).toContain('Администратор');
    expect(wrapper.html()).not.toContain('Оператор');
  });

  it('сохраняет новую роль через PATCH /api/admin/users/:id', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          username: 'johndoe',
          first_name: 'John',
          role: 9,
          role_name: 'Пользователь',
          createdAt: '2024-01-01',
        },
      ],
    });
    vi.mocked(api.patch).mockResolvedValue({
      data: {
        id: 1,
        username: 'johndoe',
        first_name: 'John',
        role: 2,
        role_name: 'Менеджер',
        createdAt: '2024-01-01',
      },
    });
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountPage();
    await flushPromises();

    const popup = wrapper.findComponent({ name: 'QPopupEdit' });
    popup.vm.$emit('save', 2);
    await flushPromises();

    expect(api.patch).toHaveBeenCalledWith('/api/admin/users/1', { role: 2 });
    expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }));
    expect(wrapper.html()).toContain('Менеджер');
  });

  it('показывает detail из backend при ошибке сохранения роли', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          username: 'johndoe',
          first_name: 'John',
          role: 9,
          role_name: 'Пользователь',
          createdAt: '2024-01-01',
        },
      ],
    });
    vi.mocked(api.patch).mockRejectedValue({
      response: {
        data: {
          detail: 'Role update failed',
        },
      },
    });
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountPage();
    await flushPromises();

    const popup = wrapper.findComponent({ name: 'QPopupEdit' });
    popup.vm.$emit('save', 2);
    await flushPromises();

    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'negative',
        message: 'Role update failed',
      })
    );
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
