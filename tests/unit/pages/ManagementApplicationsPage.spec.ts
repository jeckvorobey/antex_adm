import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ManagementApplicationsPage from '@/pages/ManagementApplicationsPage.vue';

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));
vi.mock('@/services/marketing', () => ({
  marketingApi: {
    listApplications: listMock,
  },
}));

describe('ManagementApplicationsPage', () => {
  it('показывает counts и прочерк для nullable conversion', async () => {
    listMock.mockResolvedValue({
      items: [
        {
          campaignId: 1,
          campaignName: 'No conversions',
          code: 'BDF7J9J8JH',
          provider: 'telegram_ads',
          status: 'active',
          currency: 'USDT',
          attributedUsers: 0,
          applications: 3,
          uniqueApplicants: 2,
          completedApplications: 1,
          attributionToApplicationRate: null,
          applicationCompletionRate: 33.3333,
          spend: 10,
          costPerApplication: 3.3333,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
    const wrapper = mount(ManagementApplicationsPage);
    await flushPromises();

    expect(wrapper.text()).toContain('No conversions');
    expect(wrapper.text()).toContain('3');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('—');
  });
});
