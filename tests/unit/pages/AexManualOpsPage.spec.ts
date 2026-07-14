import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar, Notify } from 'quasar';
import AexManualOpsPage from '@pages/aex/AexManualOpsPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(AexManualOpsPage, {
    global: { plugins: [[Quasar, { plugins: { Notify } }]] },
  });
}

describe('AexManualOpsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('отображает форму с полями userId, amount, reason', async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Пользователь');
    expect(wrapper.html()).toContain('Сумма начисления');
    expect(wrapper.html()).toContain('Описание');
  });

  it('по умолчанию выбрано начисление', async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Начислить ATXG');
  });

  it('отображает кнопки переключения типа операции', async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Начисление');
    expect(wrapper.html()).toContain('Списание');
  });

  it('кнопка отправки содержит текст Начислить ATXG по умолчанию', async () => {
    const wrapper = mountPage();
    await flushPromises();
    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Начислить'));
    expect(submitBtn).toBeTruthy();
  });

  it('не падает при рендере', async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });

  it('отображает заголовок страницы', async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Ручные операции ATXG');
  });

  it('содержит q-form для валидации', async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.find('.q-form').exists()).toBe(true);
  });

  it('отправляет выбранный из autocomplete user_id', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [
          {
            id: 42,
            username: 'alice',
            first_name: 'Alice',
            last_name: null,
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      },
    });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    const wrapper = mountPage();
    await flushPromises();

    await wrapper.find('.q-select__input').setValue('alice');
    await flushPromises();

    await wrapper.find('select').setValue('42');
    await flushPromises();

    await wrapper.find('input[type="number"]').setValue('15');
    await wrapper.find('input[type="textarea"]').setValue('Ручная корректировка');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    const confirm = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Подтвердить'));
    expect(confirm).toBeTruthy();
    await confirm?.trigger('click');
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith('/api/admin/aex/credit', {
      user_id: 42,
      amount: 15,
      description: 'Ручная корректировка',
    });
  });

  it('кнопка отправки отключена без выбранного пользователя', async () => {
    const wrapper = mountPage();
    await flushPromises();

    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Начислить'));

    expect(submitBtn?.attributes('disable')).toBe('true');
  });

  it('переключает тип операции на списание', async () => {
    const wrapper = mountPage();
    await flushPromises();

    const debitButton = wrapper
      .findAll('.q-btn-toggle button')
      .find((button) => button.text() === 'Списание');
    await debitButton?.trigger('click');
    await flushPromises();

    expect(wrapper.html()).toContain('Списать ATXG');
    expect(wrapper.html()).toContain('Сумма списания');
  });
});
