import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Notify, Quasar, Dialog } from 'quasar';
import { nextTick } from 'vue';
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
    expect(api.get).toHaveBeenCalledWith('/api/admin/users', {
      params: { limit: 20, offset: 0 },
    });
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

  it('на mobile-карточке не рендерит лишний referralAction-ряд', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          username: 'johndoe',
          first_name: 'John',
          role: 9,
          role_name: 'Пользователь',
          createdAt: '2024-01-01',
          referral_code: 'ABC12345',
          referral_rate_percent: '0.2',
          referred_by: 2,
          balance: '1240.5',
        },
      ],
    });
    const wrapper = mountPage();
    await flushPromises();

    const mobileLabels = wrapper
      .find('.app-responsive-table__mobile')
      .findAll('.app-responsive-table__field-label')
      .map((node) => node.text());

    expect(mobileLabels).toEqual([
      'ID',
      'Имя',
      'Роль',
      'Реф. код',
      '% начисл.',
      'Реферер',
      'Баланс',
      'Регистрация',
    ]);
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
    expect(wrapper.html()).not.toContain('Администратор');
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

  it('не отправляет повторное сохранение роли, пока предыдущий запрос не завершён', async () => {
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

    let resolvePatch: ((value: { data: Record<string, unknown> }) => void) | undefined;
    vi.mocked(api.patch).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePatch = resolve;
        }) as ReturnType<typeof api.patch>
    );

    const wrapper = mountPage();
    await flushPromises();

    const popup = wrapper.findComponent({ name: 'QPopupEdit' });
    popup.vm.$emit('save', 2);
    await nextTick();
    popup.vm.$emit('save', 9);
    await nextTick();

    expect(api.patch).toHaveBeenCalledTimes(1);

    resolvePatch?.({
      data: {
        id: 1,
        username: 'johndoe',
        first_name: 'John',
        role: 2,
        role_name: 'Менеджер',
        createdAt: '2024-01-01',
      },
    });
    await flushPromises();
    expect(api.patch).toHaveBeenCalledTimes(1);
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

  describe('генерация referral_code', () => {
    it('показывает кнопку «Сгенерировать коды» если есть пользователи без referral_code', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [
          {
            id: 1,
            username: 'alice',
            first_name: 'Alice',
            role: 9,
            role_name: 'Пользователь',
            createdAt: '2024-01-01',
            referral_code: null,
          },
          {
            id: 2,
            username: 'bob',
            first_name: 'Bob',
            role: 9,
            role_name: 'Пользователь',
            createdAt: '2024-01-01',
            referral_code: 'ABC12345',
          },
        ],
      });
      const wrapper = mountPage();
      await flushPromises();

      const btn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сгенерировать коды'));
      expect(btn).toBeTruthy();
    });

    it('не показывает кнопку если у всех пользователей есть referral_code', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [
          {
            id: 1,
            username: 'alice',
            first_name: 'Alice',
            role: 9,
            role_name: 'Пользователь',
            createdAt: '2024-01-01',
            referral_code: 'ABC12345',
          },
        ],
      });
      const wrapper = mountPage();
      await flushPromises();

      const btn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сгенерировать коды'));
      expect(btn).toBeFalsy();
    });

    it('не показывает кнопку если нет пользователей', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });
      const wrapper = mountPage();
      await flushPromises();

      const btn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сгенерировать коды'));
      expect(btn).toBeFalsy();
    });

    it('при нажатии вызывает confirm dialog', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [
          {
            id: 1,
            username: 'alice',
            first_name: 'Alice',
            role: 9,
            role_name: 'Пользователь',
            createdAt: '2024-01-01',
            referral_code: null,
          },
        ],
      });
      const onOk = vi.fn();
      const dialogSpy = vi.spyOn(Dialog, 'create').mockReturnValue({
        onOk: () => ({ onCancel: vi.fn() }),
      } as ReturnType<typeof Dialog.create>);

      const wrapper = mountPage();
      await flushPromises();

      const btn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сгенерировать коды'));
      expect(btn).toBeTruthy();
      await btn!.trigger('click');
      await nextTick();

      expect(dialogSpy).toHaveBeenCalled();
      dialogSpy.mockRestore();
    });

    it('после подтверждения вызывает POST /api/admin/aex/generate-referral-codes', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [
          {
            id: 1,
            username: 'alice',
            first_name: 'Alice',
            role: 9,
            role_name: 'Пользователь',
            createdAt: '2024-01-01',
            referral_code: null,
          },
        ],
      });
      vi.mocked(api.post).mockResolvedValue({ data: { generated: 1 } });

      let okCallback: (() => void) | undefined;
      const dialogSpy = vi.spyOn(Dialog, 'create').mockReturnValue({
        onOk: (cb: () => void) => {
          okCallback = cb;
          return { onCancel: vi.fn() };
        },
      } as ReturnType<typeof Dialog.create>);

      const wrapper = mountPage();
      await flushPromises();

      const btn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сгенерировать коды'));
      await btn!.trigger('click');
      await nextTick();

      // Simulate user confirming the dialog
      okCallback?.();
      await flushPromises();

      expect(api.post).toHaveBeenCalledWith('/api/admin/aex/generate-referral-codes');
      dialogSpy.mockRestore();
    });

    it('после успешной генерации показывает notification и обновляет таблицу', async () => {
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: [
            {
              id: 1,
              username: 'alice',
              first_name: 'Alice',
              role: 9,
              role_name: 'Пользователь',
              createdAt: '2024-01-01',
              referral_code: null,
            },
          ],
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 1,
              username: 'alice',
              first_name: 'Alice',
              role: 9,
              role_name: 'Пользователь',
              createdAt: '2024-01-01',
              referral_code: 'ABC12345',
            },
          ],
        });
      vi.mocked(api.post).mockResolvedValue({ data: { generated: 1 } });

      let okCallback: (() => void) | undefined;
      const dialogSpy = vi.spyOn(Dialog, 'create').mockReturnValue({
        onOk: (cb: () => void) => {
          okCallback = cb;
          return { onCancel: vi.fn() };
        },
      } as ReturnType<typeof Dialog.create>);

      const notifySpy = vi.spyOn(Notify, 'create');
      const wrapper = mountPage();
      await flushPromises();

      const btn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сгенерировать коды'));
      await btn!.trigger('click');
      await nextTick();

      okCallback?.();
      await flushPromises();

      expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }));
      // Table should have refreshed — GET called twice (mount + after generate)
      expect(api.get).toHaveBeenCalledTimes(2);
      dialogSpy.mockRestore();
    });

    it('при ошибке генерации показывает negative notification', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [
          {
            id: 1,
            username: 'alice',
            first_name: 'Alice',
            role: 9,
            role_name: 'Пользователь',
            createdAt: '2024-01-01',
            referral_code: null,
          },
        ],
      });
      vi.mocked(api.post).mockRejectedValue({
        response: { data: { detail: 'Generation failed' } },
      });

      let okCallback: (() => void) | undefined;
      const dialogSpy = vi.spyOn(Dialog, 'create').mockReturnValue({
        onOk: (cb: () => void) => {
          okCallback = cb;
          return { onCancel: vi.fn() };
        },
      } as ReturnType<typeof Dialog.create>);

      const notifySpy = vi.spyOn(Notify, 'create');
      const wrapper = mountPage();
      await flushPromises();

      const btn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сгенерировать коды'));
      await btn!.trigger('click');
      await nextTick();

      okCallback?.();
      await flushPromises();

      expect(notifySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'negative',
          message: 'Generation failed',
        }),
      );
      dialogSpy.mockRestore();
    });

    it('кнопка в состоянии loading во время запроса генерации', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [
          {
            id: 1,
            username: 'alice',
            first_name: 'Alice',
            role: 9,
            role_name: 'Пользователь',
            createdAt: '2024-01-01',
            referral_code: null,
          },
        ],
      });

      let resolvePost: ((value: { data: Record<string, unknown> }) => void) | undefined;
      vi.mocked(api.post).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePost = resolve;
          }) as ReturnType<typeof api.post>,
      );

      let okCallback: (() => void) | undefined;
      const dialogSpy = vi.spyOn(Dialog, 'create').mockReturnValue({
        onOk: (cb: () => void) => {
          okCallback = cb;
          return { onCancel: vi.fn() };
        },
      } as ReturnType<typeof Dialog.create>);

      const wrapper = mountPage();
      await flushPromises();

      const btn = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сгенерировать коды'));
      await btn!.trigger('click');
      await nextTick();

      okCallback?.();
      await nextTick();

      // Button should be in loading state
      const btnAfterClick = wrapper.findAll('.q-btn').find((b) => b.text().includes('Сгенерировать коды'));
      expect(btnAfterClick?.attributes('loading')).toBe('true');

      resolvePost?.({ data: { generated: 1 } });
      await flushPromises();

      dialogSpy.mockRestore();
    });
  });
});
