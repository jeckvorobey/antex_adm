import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { marketingApi } from '@/services/marketing';
import type { MarketingCurrency, MarketingPlatform } from '@/types/marketing';

export const useMarketingReferencesStore = defineStore('marketingReferences', () => {
  const platforms = ref<MarketingPlatform[]>([]);
  const currencies = ref<MarketingCurrency[]>([]);
  let platformsRequest: Promise<MarketingPlatform[]> | null = null;
  let currenciesRequest: Promise<MarketingCurrency[]> | null = null;

  const platformOptions = computed(() =>
    platforms.value.map((item) => ({ label: item.name, value: item.slug })),
  );
  const currencyOptions = computed(() =>
    currencies.value.map((item) => ({ label: item.code, value: item.code })),
  );

  async function loadPlatforms(force = false) {
    if (!force && platforms.value.length) return platforms.value;
    platformsRequest ??= marketingApi.listPlatforms().then((items) => {
      platforms.value = items;
      return items;
    }).finally(() => { platformsRequest = null; });
    return platformsRequest;
  }

  async function loadCurrencies(force = false) {
    if (!force && currencies.value.length) return currencies.value;
    currenciesRequest ??= marketingApi.listCurrencies().then((items) => {
      currencies.value = items;
      return items;
    }).finally(() => { currenciesRequest = null; });
    return currenciesRequest;
  }

  return { platforms, currencies, platformOptions, currencyOptions, loadPlatforms, loadCurrencies };
});
