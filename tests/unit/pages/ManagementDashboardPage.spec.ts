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

const chartStub = { template: '<div class="chart-stub" />', props: ['series', 'options'] };

function mountPage() {
  return mount(ManagementDashboardPage, {
    global: { stubs: { MarketingChart: chartStub } },
  });
}

describe('ManagementDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dashboardMock.mockResolvedValue({
      summary: {
        newUsers: 0,
        returningUsers: 0,
        touches: 0,
        uniqueTouchedUsers: 0,
        applications: 0,
        uniqueApplicants: 0,
        completedApplications: 0,
        attributionToApplicationRate: null,
        applicationCompletionRate: null,
        spendTotal: null,
        costPerApplication: null,
        costPerNewUser: null,
        costPerCompletedApplication: null,
      },
      funnel: [],
      timeSeries: [],
      campaignComparison: [],
      spendByCurrency: [],
      appliedFilters: { dateFrom: '2026-07-01', dateTo: '2026-07-13' },
    });
  });

  it('загружает dashboard и не выводит NaN или Infinity', async () => {
    const wrapper = mountPage();
    await flushPromises();

    expect(dashboardMock).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('Нет данных за выбранный период');
    expect(wrapper.text()).not.toMatch(/NaN|Infinity/);
    expect(wrapper.text()).toContain('Рекламный дашборд');
  });

  it('показывает ошибку и позволяет повторить загрузку', async () => {
    dashboardMock.mockRejectedValueOnce(new Error('network'));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.text()).toContain('Не удалось загрузить маркетинговую аналитику');

    await wrapper.get('[data-testid="dashboard-retry"]').trigger('click');
    await flushPromises();
    expect(dashboardMock).toHaveBeenCalledTimes(2);
  });

  it('не скрывает графики при активности только вернувшихся пользователей', async () => {
    dashboardMock.mockResolvedValueOnce({
      summary: { newUsers: 0, returningUsers: 1, touches: 0, applications: 0 },
      funnel: [],
      timeSeries: [],
      campaignComparison: [],
      spendByCurrency: [],
      appliedFilters: {},
    });
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).not.toContain('Нет данных за выбранный период');
    expect(wrapper.text()).toContain('Динамика');
  });

  it('группирует KPI и использует понятные русские названия', async () => {
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
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.vm.timeSeries.map((series: { name: string }) => series.name)).toEqual(
      expect.arrayContaining(['Новые', 'Вернувшиеся', 'Переходы', 'Заявки']),
    );
    const kpiCards = wrapper.findComponent({ name: 'MarketingKpiCards' });
    expect(kpiCards.text()).toContain('Трафик');
    expect(kpiCards.text()).toContain('Конверсии');
    expect(kpiCards.text()).toContain('Стоимость');
    expect(kpiCards.text()).toContain('Переходы всего');
    expect(kpiCards.text()).toContain('Уникальные переходы');
    expect(kpiCards.text()).toContain('Уникальный переход → заявка');
    expect(kpiCards.findAll('.col-6')).toHaveLength(12);
    expect(wrapper.text()).not.toContain('Attribution');
  });

  it('показывает на недельной оси X последовательные дни недели', async () => {
    dashboardMock.mockResolvedValue({
      summary: { newUsers: 1, returningUsers: 0, touches: 1, applications: 0 },
      funnel: [],
      timeSeries: [
        '2026-07-20',
        '2026-07-21',
        '2026-07-22',
        '2026-07-23',
        '2026-07-24',
        '2026-07-25',
        '2026-07-26',
      ].map((date) => ({
        date,
        newUsers: 0,
        returningUsers: 0,
        touches: 0,
        applications: 0,
        completedApplications: 0,
      })),
      campaignComparison: [],
      spendByCurrency: [],
      appliedFilters: {},
    });
    const wrapper = mountPage();
    await flushPromises();

    wrapper.vm.applyFilters(
      { dateFrom: '2026-07-20', dateTo: '2026-07-26', campaignId: null, currency: null },
      'week',
    );
    await flushPromises();

    expect(wrapper.vm.timeOptions.xaxis?.categories).toEqual([
      'пн',
      'вт',
      'ср',
      'чт',
      'пт',
      'сб',
      'вс',
    ]);
  });

  it('показывает воронку и локализует стадии API', async () => {
    dashboardMock.mockResolvedValueOnce({
      summary: { newUsers: 2, returningUsers: 0, touches: 4, applications: 1 },
      funnel: [
        { stage: 'New users', value: 2 },
        { stage: 'Marketing touches', value: 4 },
        { stage: 'Unique applicants', value: 1 },
        { stage: 'Completed applications', value: 1 },
      ],
      timeSeries: [],
      campaignComparison: [],
      spendByCurrency: [],
      appliedFilters: {},
    });
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain('Воронка');
    expect(wrapper.vm.funnelOptions.xaxis?.categories).toEqual([
      'Новые пользователи',
      'Переходы',
      'Уникальные заявители',
      'Завершённые заявки',
    ]);
  });

  it('показывает сравнение только для двух и более кампаний', async () => {
    const campaign = {
      campaignId: 1,
      campaignName: 'Кампания 1',
      code: 'one',
      provider: 'telegram',
      status: 'active',
      currency: 'EUR',
      attributedUsers: 1,
      newUsers: 1,
      returningUsers: 0,
      touches: 1,
      uniqueTouchedUsers: 1,
      applications: 1,
      newUserApplications: 1,
      returningUserApplications: 0,
      uniqueApplicants: 1,
      completedApplications: 1,
      attributionToApplicationRate: 100,
      newUserToApplicationRate: 100,
      touchToApplicationRate: 100,
      applicationCompletionRate: 100,
      spend: 10,
      costPerApplication: 10,
      costPerNewUser: 10,
      costPerCompletedApplication: 10,
    };
    dashboardMock.mockResolvedValueOnce({
      summary: { newUsers: 2, returningUsers: 0, touches: 2, applications: 2 },
      funnel: [],
      timeSeries: [],
      campaignComparison: [campaign, { ...campaign, campaignId: 2, campaignName: 'Кампания 2' }],
      spendByCurrency: [],
      appliedFilters: {},
    });
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain('Сравнение кампаний');
  });

  it('показывает расходы отдельно по валютам', async () => {
    dashboardMock.mockResolvedValueOnce({
      summary: { newUsers: 1, returningUsers: 0, touches: 1, applications: 1 },
      funnel: [],
      timeSeries: [],
      campaignComparison: [],
      spendByCurrency: [
        { currency: 'EUR', spend: 120.5 },
        { currency: 'USD', spend: 80 },
      ],
      appliedFilters: {},
    });
    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain('Расходы по валютам');
    expect(wrapper.text()).toContain('Валюты показаны отдельно и не суммируются между собой');
    expect(wrapper.text()).toContain('EUR');
    expect(wrapper.text()).toContain('USD');
  });
});
