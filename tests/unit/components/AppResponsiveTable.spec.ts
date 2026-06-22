import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { Quasar } from 'quasar';

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

function mountTable() {
  return mount(AppResponsiveTable, {
    props: {
      rows,
      columns,
      rowKey: 'id',
      mobile: {
        title: (row: (typeof rows)[number]) => `Заявка ${row.number}`,
        subtitle: (row: (typeof rows)[number]) => row.createdAt,
        badge: (row: (typeof rows)[number]) => ({ label: row.status, color: 'orange' }),
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
  it('оставляет QTable для desktop-версии', () => {
    const wrapper = mountTable();

    expect(wrapper.find('.app-responsive-table__desktop .q-table').exists()).toBe(true);
    expect(wrapper.find('.app-responsive-table__desktop').classes()).toContain('gt-xs');
  });

  it('рендерит мобильные строки как карточки', () => {
    const wrapper = mountTable();

    expect(wrapper.find('.app-responsive-table__mobile').classes()).toContain('xs');
    expect(wrapper.findAll('.app-responsive-table__card')).toHaveLength(1);
    expect(wrapper.html()).toContain('Заявка 2026050001');
    expect(wrapper.html()).toContain('Сумма');
    expect(wrapper.html()).toContain('100 RUB');
    expect(wrapper.html()).toContain('Открыть');
  });
});
