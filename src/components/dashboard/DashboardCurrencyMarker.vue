<template>
  <img
    v-if="iconSource"
    :src="iconSource"
    :alt="currency"
    :width="markerSize"
    :height="markerSize"
    :data-marker-size="markerSize"
    class="dashboard-currency-marker"
    :class="`dashboard-currency-marker--${size}`"
  />
  <span
    v-else-if="flag"
    role="img"
    :aria-label="currency"
    :data-marker-size="markerSize"
    class="dashboard-currency-marker dashboard-currency-marker--flag"
    :class="`dashboard-currency-marker--${size}`"
  >
    {{ flag }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import atxgIcon from '@assets/images/atxg.svg';
import usdtIcon from '@assets/images/Usdt-icon.svg';

type DashboardCurrencyMarkerSize = 'turnover' | 'rate';

const props = withDefaults(
  defineProps<{
    currency: string;
    size: DashboardCurrencyMarkerSize;
  }>(),
  { size: 'rate' },
);

const iconSources: Record<string, string> = {
  USDT: usdtIcon,
  ATXG: atxgIcon,
};

const flags: Record<string, string> = {
  RUB: '🇷🇺',
  THB: '🇹🇭',
  GEL: '🇬🇪',
  VND: '🇻🇳',
};

const normalizedCurrency = computed(() => props.currency.toUpperCase());
const iconSource = computed(() => iconSources[normalizedCurrency.value] ?? '');
const flag = computed(() => flags[normalizedCurrency.value] ?? '');
const markerSize = computed(() => (props.size === 'turnover' ? 32 : 25));
</script>

<style scoped lang="scss">
.dashboard-currency-marker {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 25px;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  line-height: 1;
  object-fit: contain;
  vertical-align: middle;
}

.dashboard-currency-marker--turnover {
  width: 32px;
  height: 32px;
}

.dashboard-currency-marker--flag {
  font-size: 18px;
}

.dashboard-currency-marker--turnover.dashboard-currency-marker--flag {
  font-size: 22px;
}
</style>
