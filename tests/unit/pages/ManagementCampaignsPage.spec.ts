import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Screen } from 'quasar';

import ManagementCampaignsPage from '@/pages/ManagementCampaignsPage.vue';

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));
vi.mock('@/services/marketing', () => ({
  marketingApi: {
    listCampaigns: listMock,
    updateCampaign: vi.fn(),
    upsertDailyMetric: vi.fn(),
  },
}));

function setScreenXs(value: boolean) {
  const screen = Screen as unknown as { xs: boolean; md: boolean; name: string; width: number };
  screen.xs = value;
  screen.md = !value;
  screen.name = value ? 'xs' : 'md';
  screen.width = value ? 390 : 1280;
}

describe('ManagementCampaignsPage', () => {
  beforeEach(() => {
    setScreenXs(false);
    listMock.mockResolvedValue({
      items: [
        {
          id: 1,
          code: 'BDF7J9J8JH',
          name: 'Telegram July',
          provider: 'telegram_ads',
          status: 'active',
          currency: 'USDT',
          budget: 100,
          link: 'https://t.me/bot?startapp=market_BDF7J9J8JH',
          marketParameter: 'market=BDF7J9J8JH',
          createdAt: '2026-07-13T00:00:00Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
  });

  it('загружает server page и не предлагает создать кампанию', async () => {
    const wrapper = mount(ManagementCampaignsPage);
    await flushPromises();

    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ limit: 20, offset: 0 }));
    expect(wrapper.text()).toContain('Компании');
    expect(wrapper.text()).toContain('Telegram July');
    expect(wrapper.text()).not.toContain('Создать кампанию');
    expect(wrapper.text()).toContain('Открыть метрики');
    expect(wrapper.text()).toContain('Архивировать');
  });

  it('использует те же русские lifecycle-статусы в фильтре', async () => {
    const wrapper = mount(ManagementCampaignsPage);
    await flushPromises();

    const statusFilterOptions = wrapper
      .findAll('select')[1]
      ?.findAll('option')
      .map((option) => ({
        label: option.text(),
        value: option.element.value,
      }));

    expect(statusFilterOptions).toEqual([
      { label: 'Черновик', value: 'draft' },
      { label: 'Активна', value: 'active' },
      { label: 'Приостановлена', value: 'paused' },
      { label: 'В архиве', value: 'archived' },
    ]);
  });

  it('скрывает архив по умолчанию и передаёт выбор checkbox в API', async () => {
    const wrapper = mount(ManagementCampaignsPage);
    await flushPromises();

    const archiveCheckbox = wrapper.get('[data-testid="campaign-show-archive"]');

    expect(archiveCheckbox.text()).toContain('Показать архив');
    expect((archiveCheckbox.get('input').element as HTMLInputElement).checked).toBe(false);
    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ include_archived: false, limit: 20, offset: 0 }),
    );

    await archiveCheckbox.get('input').setValue(true);
    await wrapper.get('button[icon="search"]').trigger('click');
    await flushPromises();

    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ include_archived: true, limit: 20, offset: 0 }),
    );
  });

  it('показывает в диалоге редактирования название «Изменить компанию»', async () => {
    const wrapper = mount(ManagementCampaignsPage);
    await flushPromises();

    await wrapper.get('button[icon="edit"]').trigger('click');

    expect(wrapper.text()).toContain('Изменить компанию');
    expect(wrapper.text()).not.toContain('Изменить кампанию');
  });

  it('показывает компактные семантические действия кампании на мобильной карточке', async () => {
    const desktopWrapper = mount(ManagementCampaignsPage);
    await flushPromises();
    const desktopActions = [
      ['copy', 'Копировать ссылку', 'content_copy'],
      ['edit', 'Изменить', 'edit'],
      ['metrics', 'Открыть метрики', 'bar_chart'],
    ] as const;

    for (const [name, label, icon] of desktopActions) {
      const desktopButton = desktopWrapper.get(`[data-testid="campaign-action-${name}-desktop"]`);

      expect(desktopButton.attributes('aria-label')).toBe(label);
      expect(desktopButton.find('.q-btn__label').exists()).toBe(false);
      expect(desktopButton.get('.q-tooltip').text()).toBe(label);
      expect(desktopButton.html()).toContain(icon);
    }

    setScreenXs(true);
    const mobileWrapper = mount(ManagementCampaignsPage);
    await flushPromises();
    const actions = [
      ['copy', 'Копировать ссылку', 'content_copy'],
      ['metrics', 'Открыть метрики', 'bar_chart'],
      ['archive', 'Архивировать кампанию', 'archive'],
    ] as const;
    const mobileActions = mobileWrapper.get('[data-testid="campaign-mobile-actions"]');

    expect(mobileActions.text()).toContain('Действия');
    expect(mobileActions.classes()).toEqual(
      expect.arrayContaining(['row', 'items-center', 'justify-between']),
    );

    for (const [name, label, icon] of actions) {
      const mobileButton = mobileWrapper.get(`[data-testid="campaign-action-${name}-mobile"]`);

      expect(mobileButton.attributes('flat')).toBe('');
      expect(mobileButton.attributes('outline')).toBeUndefined();
      expect(mobileButton.attributes('round')).toBe('');
      expect(mobileButton.attributes('aria-label')).toBe(label);
      expect(mobileButton.html()).toContain(icon);
    }
  });
});
