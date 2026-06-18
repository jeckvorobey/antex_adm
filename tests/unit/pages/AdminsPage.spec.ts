import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Notify, Quasar } from 'quasar';

import AdminsPage from '@pages/AdminsPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(AdminsPage, {
    global: { plugins: [[Quasar, { plugins: { Notify } }]] },
  });
}

describe('AdminsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('вызывает /api/admin/list при монтировании', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    mountPage();
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/api/admin/list');
  });

  it('рендерит таблицу админов из API', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          username: 'root',
          email: 'root@example.com',
          createdAt: '2026-06-18T10:00:00Z',
          updatedAt: '2026-06-18T10:00:00Z',
        },
      ],
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.html()).toContain('root');
    expect(wrapper.html()).toContain('root@example.com');
    expect(wrapper.html()).toContain('Сменить пароль');
    expect(wrapper.html()).toContain('Удалить');
  });

  it('создаёт администратора через POST /api/admin/add', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: 2,
        username: 'alice',
        email: 'alice@example.com',
        createdAt: '2026-06-18T10:00:00Z',
        updatedAt: '2026-06-18T10:00:00Z',
      },
    });

    const wrapper = mountPage();
    await flushPromises();

    await wrapper.get('[data-test="open-create-admin"]').trigger('click');
    await wrapper.get('[data-test="create-admin-username"] input').setValue('alice');
    await wrapper.get('[data-test="create-admin-email"] input').setValue('alice@example.com');
    await wrapper.get('[data-test="create-admin-password"] input').setValue('Secret123');
    await flushPromises();
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith('/api/admin/add', {
      username: 'alice',
      email: 'alice@example.com',
      password: 'Secret123',
    });
    expect(wrapper.html()).toContain('alice@example.com');
  });

  it('меняет пароль администратора через PUT /api/admin/password', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          username: 'root',
          email: 'root@example.com',
          createdAt: '2026-06-18T10:00:00Z',
          updatedAt: '2026-06-18T10:00:00Z',
        },
      ],
    });
    vi.mocked(api.put).mockResolvedValue({ data: { ok: true } });

    const wrapper = mountPage();
    await flushPromises();

    await wrapper.get('[data-test="change-password-1"]').trigger('click');
    await wrapper.get('[data-test="change-password-input"] input').setValue('NewSecret123');
    await wrapper.get('[data-test="submit-change-password"]').trigger('click');
    await flushPromises();

    expect(api.put).toHaveBeenCalledWith('/api/admin/password', {
      admin_id: 1,
      password: 'NewSecret123',
    });
  });

  it('удаляет администратора через DELETE /api/admin/delete/:id', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          username: 'root',
          email: 'root@example.com',
          createdAt: '2026-06-18T10:00:00Z',
          updatedAt: '2026-06-18T10:00:00Z',
        },
        {
          id: 2,
          username: 'alice',
          email: 'alice@example.com',
          createdAt: '2026-06-18T10:00:00Z',
          updatedAt: '2026-06-18T10:00:00Z',
        },
      ],
    });
    vi.mocked(api.delete).mockResolvedValue({ data: { ok: true } });

    const wrapper = mountPage();
    await flushPromises();

    await wrapper.get('[data-test="delete-admin-2"]').trigger('click');
    await wrapper.get('[data-test="confirm-delete-admin"]').trigger('click');
    await flushPromises();

    expect(api.delete).toHaveBeenCalledWith('/api/admin/delete/2');
    expect(wrapper.html()).not.toContain('alice@example.com');
  });
});
