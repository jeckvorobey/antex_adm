import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { Quasar, Screen } from 'quasar';

import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';

const rows = [
  {
    id: 1,
    number: '2026050001',
    status: 'Новая',
    amount: '100 RUB',
    createdAt: '01.01.1970 16:20',
  },
];

const columns = [
  { name: 'number', label: 'Номер', field: 'number', align: 'left' as const },
  { name: 'status', label: 'Статус', field: 'status', align: 'left' as const },
  { name: 'amount', label: 'Сумма', field: 'amount', align: 'right' as const },
  { name: 'createdAt', label: 'Дата', field: 'createdAt', align: 'left' as const },
];

function setScreenXs(value: boolean) {
  const screen = Screen as unknown as { xs: boolean; md: boolean; name: string; width: number };
  screen.xs = value;
  screen.md = !value;
  screen.name = value ? 'xs' : 'md';
  screen.width = value ? 390 : 1280;
}

function mountTable(screenXs = false, withTooltip = false) {
  setScreenXs(screenXs);

  return mount(AppResponsiveTable, {
    props: {
      rows,
      columns,
      rowKey: 'id',
      mobile: {
        title: (row: (typeof rows)[number]) => `Заявка ${row.number}`,
        subtitle: (row: (typeof rows)[number]) => row.createdAt,
        badge: (row: (typeof rows)[number]) =>
          withTooltip
            ? {
                label: '10%',
                color: 'negative',
                icon: 'info',
                class: 'q-px-sm q-py-xs q-gutter-xs',
                tooltip: 'Курс показан реверсивно',
              }
            : { label: row.status, color: 'orange' },
        fields: [
          { name: 'amount', label: 'Сумма' },
          { name: 'createdAt', label: 'Дата' },
        ],
      },
    },
    slots: {
      'mobile-actions': '<button class="mobile-action">Открыть</button>',
    },
    global: { plugins: [[Quasar, {}]] },
  });
}

describe('AppResponsiveTable', () => {
  it('оставляет только QTable для desktop-версии', () => {
    const wrapper = mountTable();

    expect(wrapper.find('.app-responsive-table__desktop .q-table').exists()).toBe(true);
    expect(wrapper.find('.app-responsive-table__desktop').classes()).toContain('gt-xs');
    expect(wrapper.find('.app-responsive-table__mobile').exists()).toBe(false);
    expect(wrapper.find('.q-infinite-scroll').exists()).toBe(false);
  });

  it('рендерит мобильные строки как карточки с lazy-load только в mobile-режиме', () => {
    const wrapper = mountTable(true);

    expect(wrapper.find('.app-responsive-table__mobile').classes()).toContain('xs');
    expect(wrapper.find('.app-responsive-table__desktop').exists()).toBe(false);
    expect(wrapper.findAll('.app-responsive-table__card')).toHaveLength(1);
    expect(wrapper.html()).toContain('Заявка 2026050001');
    expect(wrapper.html()).toContain('Сумма');
    expect(wrapper.html()).toContain('100 RUB');
    expect(wrapper.html()).toContain('Открыть');
  });

  it('показывает tooltip для mobile badge и сохраняет доступность', () => {
    const wrapper = mountTable(true, true);

    const badge = wrapper.find('.app-responsive-table__badge');
    expect(badge.attributes('aria-label')).toBe('Реверсивный курс');
    expect(badge.attributes('tabindex')).toBe('0');
    expect(badge.classes()).toContain('q-px-sm');
    expect(badge.classes()).toContain('q-py-xs');
    expect(wrapper.html()).toContain('info');
    expect(wrapper.html()).toContain('Курс показан реверсивно');
  });
});
