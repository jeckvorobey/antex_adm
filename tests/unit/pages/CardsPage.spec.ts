import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import CardsPage from '@pages/CardsPage.vue';

vi.mock('src/boot/axios', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

import { api } from '@boot/axios';

function mountPage() {
  return mount(CardsPage, {
    global: { plugins: [[Quasar, {}]] },
  });
}

describe('CardsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('вызывает /api/admin/cards при монтировании', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    mountPage();
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('/api/admin/cards');
  });

  it('данные из API попадают в таблицу', async () => {
    const cards = [
      { id: 1, bank: 'SBER', name: 'Main', number: '4111111111111111', isActive: true },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: cards });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Main');
  });

  it('кнопка "Добавить" присутствует на странице', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.html()).toContain('Добавить');
  });

  it('рендерит зелёный badge для активной карты', async () => {
    const cards = [{ id: 1, bank: 'SBER', name: 'Active Card', number: '1234', isActive: true }];
    vi.mocked(api.get).mockResolvedValue({ data: cards });
    const wrapper = mountPage();
    await flushPromises();
    const badges = wrapper.findAll('.q-badge');
    const activeBadge = badges.find((b) => b.text() === 'Активна');
    expect(activeBadge).toBeDefined();
    expect(activeBadge?.classes()).toContain('bg-green');
  });

  it('рендерит красный badge для неактивной карты', async () => {
    const cards = [{ id: 2, bank: 'TINK', name: 'Inactive Card', number: '5678', isActive: false }];
    vi.mocked(api.get).mockResolvedValue({ data: cards });
    const wrapper = mountPage();
    await flushPromises();
    const badges = wrapper.findAll('.q-badge');
    const inactiveBadge = badges.find((b) => b.text() === 'Неактивна');
    expect(inactiveBadge).toBeDefined();
    expect(inactiveBadge?.classes()).toContain('bg-red');
  });

  it('компонент не падает при ошибке API', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.exists()).toBe(true);
  });
});
