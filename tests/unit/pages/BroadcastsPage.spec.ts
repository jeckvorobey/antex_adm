import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import BroadcastsPage from '@pages/BroadcastsPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(BroadcastsPage, {
    global: { plugins: [[Quasar, {}]] },
  });
}

describe('BroadcastsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('загружает историю рассылок при монтировании', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    mountPage();
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/api/admin/broadcasts', {
      params: { limit: 20, offset: 0 },
    });
  });

  it('рендерит таблицу истории', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('.q-table').exists()).toBe(true);
  });

  it('показывает дату рассылки в едином admin-формате', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          text: 'Промо текст',
          status: 'completed',
          speed_mode_requested: 'free',
          total_count: 10,
          success_count: 9,
          failed_count: 1,
          createdAt: '1970-01-01T16:20:00Z',
        },
      ],
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.html()).toContain('01.01.1970 16:20');
  });

  it('показывает кнопку остановки для running рассылки', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          text: 'Промо текст',
          status: 'running',
          speed_mode_requested: 'free',
          total_count: 10,
          success_count: 3,
          failed_count: 0,
          createdAt: '1970-01-01T16:20:00Z',
        },
      ],
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.findAll('button').some((node) => node.text().includes('Остановить'))).toBe(true);
  });

  it('останавливает running рассылку и убирает кнопку', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          text: 'Промо текст',
          status: 'running',
          speed_mode_requested: 'free',
          total_count: 10,
          success_count: 3,
          failed_count: 0,
          createdAt: '1970-01-01T16:20:00Z',
        },
      ],
    });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: 1,
        text: 'Промо текст',
        status: 'stopped',
        speed_mode_requested: 'free',
        total_count: 10,
        success_count: 3,
        failed_count: 0,
        last_error: 'Остановлена администратором',
        createdAt: '1970-01-01T16:20:00Z',
      },
    });

    const wrapper = mountPage();
    await flushPromises();

    await wrapper.findAll('button').find((node) => node.text().includes('Остановить'))?.trigger('click');
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith('/api/admin/broadcasts/1/stop');
    expect(wrapper.html()).toContain('stopped');
    expect(wrapper.findAll('button').some((node) => node.text().includes('Остановить'))).toBe(false);
  });

  it('открывает подтверждение перед отправкой', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const wrapper = mountPage();
    await flushPromises();

    await wrapper.find('textarea').setValue('<p>Промо текст</p>');
    await wrapper.findAll('button').find((node) => node.text().includes('Отправить'))?.trigger('click');
    await flushPromises();

    expect(wrapper.html()).toContain('Подтверждение рассылки');
    expect(wrapper.html()).toContain('Промо текст');
  });

  it('после подтверждения вызывает API с free режимом по умолчанию', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: 1,
        text: 'Промо текст',
        status: 'pending',
        speed_mode_requested: 'free',
      },
    });

    const wrapper = mountPage();
    await flushPromises();

    await wrapper.find('textarea').setValue('<p>Промо текст</p>');
    await wrapper.findAll('button').find((node) => node.text().includes('Отправить'))?.trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find((node) => node.text().includes('Подтвердить'))?.trigger('click');
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith('/api/admin/broadcasts', {
      text: 'Промо текст',
      format: 'html',
      button_text: null,
      button_url: null,
      speed_mode: 'free',
    });
  });

  it('передаёт paid режим, если он выбран', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: 1,
        text: 'Платная рассылка',
        status: 'pending',
        speed_mode_requested: 'paid',
      },
    });

    const wrapper = mountPage();
    await flushPromises();

    await wrapper.find('textarea').setValue('<p>Платная рассылка</p>');
    await wrapper.find('.q-toggle').trigger('click');
    await wrapper.findAll('button').find((node) => node.text().includes('Отправить'))?.trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find((node) => node.text().includes('Подтвердить'))?.trigger('click');
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith('/api/admin/broadcasts', {
      text: 'Платная рассылка',
      format: 'html',
      button_text: null,
      button_url: null,
      speed_mode: 'paid',
    });
  });

  it('редактор и preview используют одинаковые карточки по высоте', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const wrapper = mountPage();
    await flushPromises();

    const cards = wrapper.findAll('.broadcast-panel');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.classes()).toContain('full-height');
    expect(cards[1]?.classes()).toContain('full-height');
  });

  it('вставляет эмодзи в HTML редактор', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const wrapper = mountPage();
    await flushPromises();

    await wrapper.find('textarea').setValue('<p>Привет</p>');
    await wrapper.find('.emoji-button').trigger('click');
    await flushPromises();

    expect(wrapper.find('textarea').element.value).toContain('😀');
  });

  it('не открывает подтверждение для пустого editor html', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const wrapper = mountPage();
    await flushPromises();

    await wrapper.find('textarea').setValue('<p></p>');
    await wrapper.findAll('button').find((node) => node.text().includes('Отправить'))?.trigger('click');
    await flushPromises();

    expect(wrapper.html()).not.toContain('Подтверждение рассылки');
    expect(api.post).not.toHaveBeenCalled();
  });
});
