import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { Quasar, Notify } from 'quasar';
import LoginPage from '@pages/LoginPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { post: vi.fn(), get: vi.fn() },
}));

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { api } from '@boot/axios';

function mountLogin(stubActions = false) {
  return mount(LoginPage, {
    global: {
      plugins: [
        [Quasar, { plugins: { Notify } }],
        createTestingPinia({ createSpy: vi.fn, stubActions }),
      ],
    },
  });
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
  });

  it('рендерит форму с полями логина и пароля', () => {
    const wrapper = mountLogin();
    expect(wrapper.find('form').exists()).toBe(true);
    const inputs = wrapper.findAll('.q-input');
    expect(inputs.length).toBe(2);
  });

  it('успешный логин редиректит на /dashboard', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { access_token: 'tok', refresh_token: 'ref' },
    });
    const wrapper = mountLogin(false);
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('неверные credentials показывают error-уведомление', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('401'));
    const notifySpy = vi.spyOn(Notify, 'create');
    const wrapper = mountLogin(false);
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative' })
    );
  });

  it('username и password передаются в api.post', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { access_token: 'tok', refresh_token: 'ref' },
    });
    const wrapper = mountLogin(false);
    // Устанавливаем значения через vm
    const vm = wrapper.vm as unknown as { username: { value: string }; password: { value: string } };
    // Находим inputs и устанавливаем значения
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('testuser');
    await inputs[1].setValue('testpass');
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(api.post).toHaveBeenCalledWith('/api/admin/login', {
      username: 'testuser',
      password: 'testpass',
    });
  });

  it('loading false после успешного логина', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { access_token: 'tok', refresh_token: 'ref' },
    });
    const wrapper = mountLogin(false);
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    const btn = wrapper.find('.q-btn[type="submit"]');
    expect(btn.attributes('loading')).toBeFalsy();
  });

  it('loading false после ошибки логина (finally блок)', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('fail'));
    const wrapper = mountLogin(false);
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    const btn = wrapper.find('.q-btn[type="submit"]');
    expect(btn.attributes('loading')).toBeFalsy();
  });
});
