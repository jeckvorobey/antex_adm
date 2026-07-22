import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ManagementDashboardPage from '@/pages/ManagementDashboardPage.vue';

const { dashboardMock } = vi.hoisted(() => ({ dashboardMock: vi.fn() }));
vi.mock('@/services/marketing', () => ({
  marketingApi: {
    dashboard: dashboardMock,
    listCampaigns: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

describe('ManagementDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dashboardMock.mockResolvedValue({
      summary: {
        attributedUsers: 0,
        applications: 0,
        uniqueApplicants: 0,
        completedApplications: 0,
        attributionToApplicationRate: null,
        applicationCompletionRate: null,
        spendTotal: null,
        costPerApplication: null,
        costPerAttributedUser: null,
      },
      funnel: [],
      timeSeries: [],
      campaignComparison: [],
      spendByCurrency: [],
      appliedFilters: { dateFrom: '2026-07-01', dateTo: '2026-07-13' },
    });
  });

  it('загружает dashboard и не выводит NaN или Infinity', async () => {
    const wrapper = mount(ManagementDashboardPage, {
      global: { stubs: { MarketingChart: { template: '<div />', props: ['series'] } } },
    });
    await flushPromises();

    expect(dashboardMock).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('Нет данных за выбранный период');
    expect(wrapper.text()).not.toMatch(/NaN|Infinity/);
    expect(wrapper.text()).toContain('Рекламный дашборд');
  });

  it('показывает ошибку и позволяет повторить загрузку', async () => {
    dashboardMock.mockRejectedValueOnce(new Error('network'));
    const wrapper = mount(ManagementDashboardPage);
    await flushPromises();
    expect(wrapper.text()).toContain('Не удалось загрузить маркетинговую аналитику');

    await wrapper.get('[data-testid="dashboard-retry"]').trigger('click');
    await flushPromises();
    expect(dashboardMock).toHaveBeenCalledTimes(2);
  });

  it('не скрывает графики при активности только вернувшихся пользователей', async () => {
    dashboardMock.mockResolvedValueOnce({
      summary: {
        attributedUsers: 0,
        newUsers: 0,
        returningUsers: 1,
        touches: 0,
        applications: 0,
        completedApplications: 0,
      },
      funnel: [],
      timeSeries: [],
      campaignComparison: [],
      spendByCurrency: [],
      appliedFilters: {},
    });
    const wrapper = mount(ManagementDashboardPage, {
      global: { stubs: { MarketingChart: { template: '<div />', props: ['series'] } } },
    });
    await flushPromises();

    expect(wrapper.text()).not.toContain('Нет данных за выбранный период');
    expect(wrapper.text()).toContain('Динамика');
  });

  it('разделяет новые, вернувшиеся касания и заявки в дневном графике', async () => {
    dashboardMock.mockResolvedValueOnce({
      summary: { newUsers: 1, returningUsers: 1, touches: 2, applications: 1 },
      funnel: [],
      timeSeries: [
        {
          date: '2026-07-20',
          newUsers: 1,
          returningUsers: 1,
          touches: 2,
          applications: 1,
          completedApplications: 0,
        },
      ],
      campaignComparison: [],
      spendByCurrency: [],
      appliedFilters: {},
    });
    const wrapper = mount(ManagementDashboardPage, {
      global: { stubs: { MarketingChart: { template: '<div />', props: ['series'] } } },
    });
    await flushPromises();

    expect(wrapper.vm.timeSeries.map((series: { name: string }) => series.name)).toEqual(
      expect.arrayContaining(['Новые', 'Вернувшиеся', 'Касания', 'Заявки']),
    );
    expect(wrapper.text()).not.toContain('Атрибутированные пользователи');
  });
});
