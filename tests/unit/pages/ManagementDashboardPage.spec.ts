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
    const wrapper = mount(ManagementDashboardPage);
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
});
