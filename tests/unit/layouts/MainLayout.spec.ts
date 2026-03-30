import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { Quasar } from 'quasar';
import MainLayout from '@layouts/MainLayout.vue';

vi.mock('src/boot/axios', () => ({
  api: { post: vi.fn(), get: vi.fn() },
}));

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  RouterView: { template: '<div />' },
}));

function mountLayout() {
  return mount(MainLayout, {
    global: {
      plugins: [
        [Quasar, {}],
        createTestingPinia({ createSpy: vi.fn, stubActions: true }),
      ],
      stubs: {
        'router-view': true,
        'q-page-container': { template: '<div><slot /></div>' },
      },
    },
  });
}

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерит 8 пунктов навигации', () => {
    const wrapper = mountLayout();
    const items = wrapper.findAll('.q-item');
    expect(items.length).toBe(8);
  });

  it('меню содержит все ожидаемые роуты', () => {
    const wrapper = mountLayout();
    const html = wrapper.html();
    for (const route of ['/dashboard', '/orders', '/users', '/cards', '/banks', '/rates', '/broadcasts', '/settings']) {
      expect(html).toContain(route);
    }
  });

  it('logout кнопка вызывает authStore.logout', async () => {
    const wrapper = mountLayout();
    const { useAuthStore } = await import('src/stores/auth');
    const authStore = useAuthStore();
    const logoutBtn = wrapper.find('[icon="logout"]');
    await logoutBtn.trigger('click');
    await flushPromises();
    expect(authStore.logout).toHaveBeenCalled();
  });

  it('handleLogout редиректит на /login после logout', async () => {
    const wrapper = mountLayout();
    const logoutBtn = wrapper.find('[icon="logout"]');
    await logoutBtn.trigger('click');
    await flushPromises();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
