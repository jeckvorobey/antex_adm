import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dialog, Screen } from 'quasar';

import ManagementCampaignsPage from '@/pages/ManagementCampaignsPage.vue';

const { listMock, updateMock } = vi.hoisted(() => ({ listMock: vi.fn(), updateMock: vi.fn() }));
vi.mock('@/services/marketing', () => ({
  marketingApi: {
    listCampaigns: listMock,
    updateCampaign: updateMock,
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
    vi.clearAllMocks();
    setScreenXs(false);
    vi.mocked(Dialog.create).mockReturnValue({ onOk: vi.fn() } as never);
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
          newUsers: 2,
          returningUsers: 3,
          touches: 7,
          applications: 4,
          completedApplications: 1,
          costPerNewUser: 50,
          costPerApplication: 25,
          costPerCompletedApplication: 100,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
  });

  it('загружает server page и открывает создание компании без генератора ссылок', async () => {
    const wrapper = mount(ManagementCampaignsPage);
    await flushPromises();

    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ limit: 20, offset: 0 }));
    expect(wrapper.text()).toContain('Компании');
    expect(wrapper.text()).toContain('Telegram July');
    expect(wrapper.text()).toContain('Добавить компанию');
    expect(wrapper.text()).not.toContain('генератор');
    expect(wrapper.text()).toContain('Открыть метрики');
    expect(wrapper.get('[data-testid="campaign-create"]')).toBeTruthy();
    const labels = wrapper
      .findComponent({ name: 'AppResponsiveTable' })
      .props('columns')
      .map((column: { label: string }) => column.label);
    expect(labels).toEqual(
      expect.arrayContaining(['Новые', 'Вернувшиеся', 'Касания', 'Стоимость завершённой']),
    );
    expect(wrapper.findComponent({ name: 'MarketingCampaignCreateDialog' }).exists()).toBe(true);
  });

  it('показывает status компании на русском в desktop-таблице', async () => {
    const wrapper = mount(ManagementCampaignsPage);
    await flushPromises();

    expect(wrapper.findAll('.q-table-row .q-table-cell')[3].text()).toBe('Активна');
  });

  it('подтверждает возврат архивной компании в активный статус', async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 2,
          code: 'ARCHIVED00',
          name: 'Архивная компания',
          provider: 'telegram_ads',
          status: 'archived',
          currency: 'USDT',
          budget: 100,
          link: 'https://t.me/bot?startapp=market_ARCHIVED00',
          marketParameter: 'market=ARCHIVED00',
          createdAt: '2026-07-13T00:00:00Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
    const wrapper = mount(ManagementCampaignsPage);
    await flushPromises();

    const restore = wrapper.get('[data-testid="campaign-action-restore-desktop"]');
    expect(restore.attributes('aria-label')).toBe('Вернуть из архива');
    expect(restore.find('.q-btn__label').exists()).toBe(false);

    let confirmRestore: (() => void) | undefined;
    vi.mocked(Dialog.create).mockReturnValue({
      onOk(callback: () => void) {
        confirmRestore = callback;
        return this;
      },
    } as never);

    await restore.trigger('click');

    expect(updateMock).not.toHaveBeenCalled();
    expect(Dialog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Вернуть из архива',
        ok: expect.objectContaining({ label: 'Вернуть' }),
      }),
    );

    confirmRestore?.();
    await flushPromises();

    expect(updateMock).toHaveBeenCalledWith(2, { status: 'active' });
  });

  it('подтверждает добавление компании в архив', async () => {
    let confirmArchive: (() => void) | undefined;
    vi.mocked(Dialog.create).mockReturnValue({
      onOk(callback: () => void) {
        confirmArchive = callback;
        return this;
      },
    } as never);
    const wrapper = mount(ManagementCampaignsPage);
    await flushPromises();

    await wrapper.get('[data-testid="campaign-action-archive-desktop"]').trigger('click');

    expect(updateMock).not.toHaveBeenCalled();
    expect(Dialog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Архивировать компанию',
        ok: expect.objectContaining({ label: 'Архивировать' }),
      }),
    );

    confirmArchive?.();
    await flushPromises();

    expect(updateMock).toHaveBeenCalledWith(1, { status: 'archived' });
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
    await flushPromises();

    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ include_archived: true, limit: 20, offset: 0 }),
    );

    await archiveCheckbox.get('input').setValue(false);
    await flushPromises();

    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ include_archived: false, limit: 20, offset: 0 }),
    );
  });

  it('применяет search и status фильтры сразу без кнопки поиска', async () => {
    const wrapper = mount(ManagementCampaignsPage);
    await flushPromises();

    expect(wrapper.find('button[icon="search"]').exists()).toBe(false);

    await wrapper.get('input[placeholder=""]').setValue('July');
    await flushPromises();

    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'July', status: null, limit: 20, offset: 0 }),
    );

    await wrapper.findAll('select')[1].setValue('archived');
    await flushPromises();

    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'July', status: 'archived', limit: 20, offset: 0 }),
    );
  });

  it('не заменяет новый список устаревшим ответом после смены архива', async () => {
    let resolveInitialRequest!: (value: unknown) => void;
    const initialRequest = new Promise((resolve) => {
      resolveInitialRequest = resolve;
    });
    listMock
      .mockImplementationOnce(() => initialRequest)
      .mockResolvedValueOnce({
        items: [
          {
            id: 2,
            code: 'ARCHIVED',
            name: 'Архивная компания',
            provider: 'telegram_ads',
            status: 'archived',
            currency: 'USDT',
            budget: 100,
            link: 'https://t.me/bot?startapp=market_ARCHIVED',
            marketParameter: 'market=ARCHIVED',
            createdAt: '2026-07-13T00:00:00Z',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      });
    const wrapper = mount(ManagementCampaignsPage);

    await wrapper.get('[data-testid="campaign-show-archive"] input').setValue(true);
    await flushPromises();

    expect(wrapper.text()).toContain('Архивная компания');

    resolveInitialRequest({
      items: [
        {
          id: 1,
          code: 'ACTIVE',
          name: 'Активная компания',
          provider: 'telegram_ads',
          status: 'active',
          currency: 'USDT',
          budget: 100,
          link: 'https://t.me/bot?startapp=market_ACTIVE',
          marketParameter: 'market=ACTIVE',
          createdAt: '2026-07-13T00:00:00Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Архивная компания');
    expect(wrapper.text()).not.toContain('Активная компания');
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
    expect(
      Array.from(
        desktopWrapper.get('[data-testid="campaign-action-copy-desktop"]').element.parentElement
          ?.classList ?? [],
      ),
    ).toEqual(expect.arrayContaining(['justify-end']));

    for (const [name, label, icon] of desktopActions) {
      const desktopButton = desktopWrapper.get(`[data-testid="campaign-action-${name}-desktop"]`);

      expect(desktopButton.attributes('aria-label')).toBe(label);
      expect(desktopButton.find('.q-btn__label').exists()).toBe(false);
      expect(desktopButton.get('.q-tooltip').text()).toBe(label);
      expect(desktopButton.html()).toContain(icon);
    }

    const archiveDesktopButton = desktopWrapper.get(
      '[data-testid="campaign-action-archive-desktop"]',
    );
    expect(archiveDesktopButton.attributes('aria-label')).toBe('Архивировать кампанию');
    expect(archiveDesktopButton.find('.q-btn__label').exists()).toBe(false);
    expect(archiveDesktopButton.html()).toContain('archive');

    setScreenXs(true);
    const mobileWrapper = mount(ManagementCampaignsPage);
    await flushPromises();
    const actions = [
      ['copy', 'Копировать ссылку', 'content_copy'],
      ['edit', 'Изменить', 'edit'],
      ['metrics', 'Открыть метрики', 'bar_chart'],
      ['archive', 'Архивировать кампанию', 'archive'],
    ] as const;
    const mobileActions = mobileWrapper.get('[data-testid="campaign-mobile-actions"]');

    expect(mobileWrapper.text()).toContain('50 USDT');

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
