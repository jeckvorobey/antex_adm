import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar, Notify } from 'quasar';
import AexManualOpsPage from '@pages/aex/AexManualOpsPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { post: vi.fn() },
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
    expect(wrapper.html()).toContain('ID пользователя');
    expect(wrapper.html()).toContain('Сумма начисления');
    expect(wrapper.html()).toContain('Причина');
  });

  it('по умолчанию выбрано начисление', async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Начислить AEX');
  });

  it('отображает кнопки переключения типа операции', async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Начисление');
    expect(wrapper.html()).toContain('Списание');
  });

  it('кнопка отправки содержит текст Начислить AEX по умолчанию', async () => {
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
    expect(wrapper.html()).toContain('Ручные операции AEX');
  });

  it('содержит q-form для валидации', async () => {
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.find('.q-form').exists()).toBe(true);
  });
});
