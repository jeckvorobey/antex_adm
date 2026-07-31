import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DashboardCurrencyMarker from '@components/dashboard/DashboardCurrencyMarker.vue';

describe('DashboardCurrencyMarker', () => {
  it('использует фирменный SVG USDT с размером оборота 32px', () => {
    const wrapper = mount(DashboardCurrencyMarker, {
      props: { currency: 'USDT', size: 'turnover' },
    });

    const marker = wrapper.get('img');
    expect(marker.attributes('src')).toContain('Usdt-icon.svg');
    expect(marker.attributes('width')).toBe('32');
    expect(marker.attributes('height')).toBe('32');
    expect(marker.attributes('alt')).toBe('USDT');
    expect(marker.attributes('style')).toBeUndefined();
  });

  it('использует фирменный SVG ATXG с размером курса 25px', () => {
    const wrapper = mount(DashboardCurrencyMarker, {
      props: { currency: 'ATXG', size: 'rate' },
    });

    const marker = wrapper.get('img');
    expect(marker.attributes('src')).toContain('atxg.svg');
    expect(marker.attributes('width')).toBe('25');
    expect(marker.attributes('height')).toBe('25');
    expect(marker.attributes('alt')).toBe('ATXG');
  });

  it('показывает флаг валюты без декоративного контейнера', () => {
    const wrapper = mount(DashboardCurrencyMarker, {
      props: { currency: 'GEL', size: 'rate' },
    });

    const marker = wrapper.get('[role="img"]');
    expect(marker.text()).toBe('🇬🇪');
    expect(marker.attributes('aria-label')).toBe('GEL');
    expect(marker.attributes('data-marker-size')).toBe('25');
    expect(wrapper.find('q-avatar').exists()).toBe(false);
  });
});
