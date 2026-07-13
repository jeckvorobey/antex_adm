import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { Quasar } from 'quasar';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MainLayout from '@layouts/MainLayout.vue';

vi.mock('src/boot/axios', () => ({
  api: { post: vi.fn(), get: vi.fn() },
}));

const mockPush = vi.fn();
const mockRoute = { path: '/dashboard' };
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
  RouterView: { template: '<div />' },
}));

function mountLayout() {
  return mount(MainLayout, {
    global: {
      plugins: [[Quasar, {}], createTestingPinia({ createSpy: vi.fn, stubActions: true })],
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
    mockRoute.path = '/dashboard';
  });

  it('показывает Менеджмент сразу после Дашборда', () => {
    const wrapper = mountLayout();
    const html = wrapper.html();

    expect(html.indexOf('Менеджмент')).toBeGreaterThan(html.indexOf('Дашборд'));
    expect(html.indexOf('Менеджмент')).toBeLessThan(html.indexOf('Заявки'));
    expect(html).toContain('Dashboard');
    expect(html).toContain('Кампании');
    expect(html).toContain('Заявки по кампаниям');
    expect(html).toContain('Генератор ссылок');
  });

  it('содержит отдельные раскрывающиеся группы Менеджмент и ATXG', () => {
    const wrapper = mountLayout();

    expect(wrapper.findAll('.q-expansion-item')).toHaveLength(2);
    expect(wrapper.html()).toContain('ATXG');
  });

  it('меню содержит основные и ATXG routes', () => {
    const wrapper = mountLayout();
    const html = wrapper.html();

    for (const route of [
      '/dashboard',
      '/orders',
      '/site-leads',
      '/users',
      '/admins',
      '/rates',
      '/broadcasts',
      '/settings',
      '/aex/rates',
      '/aex/wallets',
      '/aex/journal',
      '/aex/manual-ops',
    ]) {
      expect(html).toContain(route);
    }
    expect(html).not.toContain('/cards');
    expect(html).not.toContain('/banks');
  });

  it('logout кнопка вызывает authStore.logout', async () => {
    const wrapper = mountLayout();
    const { useAuthStore } = await import('src/stores/auth');
    const authStore = useAuthStore();

    await wrapper.find('[icon="logout"]').trigger('click');
    await flushPromises();

    expect(authStore.logout).toHaveBeenCalled();
  });

  it('handleLogout редиректит на /login после logout', async () => {
    const wrapper = mountLayout();

    await wrapper.find('[icon="logout"]').trigger('click');
    await flushPromises();

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('клик по заголовку Менеджмент открывает dashboard', async () => {
    const wrapper = mountLayout();

    await wrapper.get('[data-testid="management-menu"]').trigger('click');

    expect(mockPush).toHaveBeenCalledWith('/management/dashboard');
  });
});
