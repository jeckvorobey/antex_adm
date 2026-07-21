import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Screen } from 'quasar';

import ManagementApplicationsPage from '@/pages/ManagementApplicationsPage.vue';

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));
vi.mock('@/services/marketing', () => ({
  marketingApi: {
    listApplicationAttributions: listMock,
  },
}));

describe('ManagementApplicationsPage', () => {
  beforeEach(() => {
    const screen = Screen as unknown as { xs: boolean; md: boolean; name: string; width: number };
    screen.xs = false;
    screen.md = true;
    screen.name = 'md';
    screen.width = 1280;
  });
  it('показывает snapshot касания и тип атрибуции заявки', async () => {
    listMock.mockResolvedValue({
      items: [
        {
          campaignId: 1,
          campaignName: 'No conversions',
          orderId: 10,
          publicNumber: '0000000010',
          userId: 20,
          userState: 'returning',
          attributionType: 'reengagement',
          touchAt: '2026-07-20T10:00:00Z',
          applicationAt: '2026-07-20T14:00:00Z',
          hoursToApplication: 4,
          status: 2,
          completed: true,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
    const wrapper = mount(ManagementApplicationsPage);
    await flushPromises();

    expect(wrapper.text()).toContain('No conversions');
    expect(wrapper.text()).toContain('Вернувшийся');
    expect(wrapper.text()).toContain('reengagement');
    expect(wrapper.text()).toContain('4');
    expect(wrapper.text()).toContain('Да');
  });

  it('передаёт выбранные даты фильтра в API в ISO-формате', async () => {
    listMock.mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 });
    const wrapper = mount(ManagementApplicationsPage);
    await flushPromises();
    listMock.mockClear();

    const dates = wrapper.findAllComponents({ name: 'AdminDateInput' });
    await dates[0]?.vm.$emit('update:modelValue', '2026-07-17');
    await dates[1]?.vm.$emit('update:modelValue', '2026-07-31');
    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(listMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ dateFrom: '2026-07-17', dateTo: '2026-07-31' }),
    );
  });

  it('показывает русские статусы и передаёт их API value в фильтр', async () => {
    listMock.mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 });
    const wrapper = mount(ManagementApplicationsPage);
    await flushPromises();
    listMock.mockClear();

    expect(wrapper.text()).toContain('Черновик');
    expect(wrapper.text()).toContain('Активна');
    expect(wrapper.text()).toContain('Приостановлена');
    expect(wrapper.text()).toContain('В архиве');

    await wrapper.findAll('select')[1]?.setValue('active');
    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('на mobile различает заявки одной компании и форматирует даты и статус', async () => {
    const screen = Screen as unknown as { xs: boolean; md: boolean; name: string; width: number };
    screen.xs = true;
    screen.md = false;
    screen.name = 'xs';
    screen.width = 390;
    listMock.mockResolvedValue({
      items: [10, 11].map((orderId) => ({
        campaignId: 1,
        campaignName: 'Одна компания',
        orderId,
        publicNumber: String(orderId),
        userId: orderId,
        userState: 'returning',
        attributionType: 'reengagement',
        touchAt: '2026-07-20T10:00:00Z',
        applicationAt: '2026-07-20T14:00:00Z',
        hoursToApplication: 4,
        status: orderId === 10 ? 2 : 4,
        completed: false,
      })),
      total: 2,
      limit: 20,
      offset: 0,
    });
    const wrapper = mount(ManagementApplicationsPage);
    await flushPromises();

    expect(wrapper.findAll('.app-responsive-table__card')).toHaveLength(2);
    expect(wrapper.text()).toContain('20.07.2026 10:00');
    expect(wrapper.text()).toContain('В обработке');
    expect(wrapper.text()).toContain('Отменена');
    expect(wrapper.text()).not.toContain('2026-07-20T10:00:00Z');
  });
});
