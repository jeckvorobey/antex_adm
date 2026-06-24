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
  useRoute: () => ({ path: '/dashboard' }),
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

  it('рендерит пункты навигации включая AEX', () => {
    const wrapper = mountLayout();
    // 7 обычных + 4 дочерних AEX (expansion item stub всегда показывает детей) + 1 header = 12
    const items = wrapper.findAll('.q-item');
    expect(items.length).toBe(12);
  });

  it('содержит expansion item для AEX', () => {
    const wrapper = mountLayout();
    expect(wrapper.find('.q-expansion-item').exists()).toBe(true);
  });

  it('меню содержит все основные routes', () => {
    const wrapper = mountLayout();
    const html = wrapper.html();
    for (const route of ['/dashboard', '/orders', '/site-leads', '/users', '/admins', '/rates', '/broadcasts', '/settings']) {
      expect(html).toContain(route);
    }
    expect(html).not.toContain('/cards');
    expect(html).not.toContain('/banks');
  });

  it('меню содержит ссылки на AEX подстраницы', () => {
    const wrapper = mountLayout();
    const html = wrapper.html();
    expect(html).toContain('/aex/rates');
    expect(html).toContain('/aex/wallets');
    expect(html).toContain('/aex/journal');
    expect(html).toContain('/aex/manual-ops');
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
