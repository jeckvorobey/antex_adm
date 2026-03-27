import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { Quasar } from 'quasar';
import DashboardPage from 'src/pages/DashboardPage.vue';

describe('DashboardPage', () => {
  function mountDashboard() {
    return mount(DashboardPage, {
      global: {
        plugins: [[Quasar, {}]],
      },
    });
  }

  it('рендерится без ошибок', () => {
    expect(() => mountDashboard()).not.toThrow();
  });

  it('показывает карточки статистики', () => {
    const wrapper = mountDashboard();
    const cards = wrapper.findAll('.q-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });
});
