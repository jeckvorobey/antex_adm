<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Рекламный дашборд</div>
    <MarketingFilters
      :model-value="filters"
      :campaign-options="campaignOptions"
      @apply="applyFilters"
    />
    <q-banner v-if="error" class="bg-negative text-white q-mt-md">
      Не удалось загрузить маркетинговую аналитику
      <q-btn data-testid="dashboard-retry" flat color="white" label="Повторить" @click="load" />
    </q-banner>
    <div v-else-if="loading" class="text-grey-7 q-pa-xl text-center">Загрузка...</div>
    <template v-else-if="dashboard">
      <MarketingKpiCards :summary="dashboard.summary" class="q-mt-md" />
      <q-banner v-if="isEmpty" class="bg-grey-2 text-grey-8 q-mt-md"
        >Нет данных за выбранный период</q-banner
      >
      <div v-else class="row q-col-gutter-md q-mt-xs">
        <div class="col-12">
          <q-card flat bordered
            ><q-card-section
              ><div class="text-h6 q-mb-md">Динамика</div>
              <MarketingChart
                :options="timeOptions"
                :series="timeSeries"
                :height="260" /></q-card-section
          ></q-card>
        </div>
        <div class="col-12">
          <q-card flat bordered
            ><q-card-section
              ><div class="text-h6 q-mb-md">Сравнение кампаний</div>
              <MarketingChart
                :options="comparisonOptions"
                :series="comparisonSeries" /></q-card-section
          ></q-card>
        </div>
      </div>
      <q-card v-if="dashboard.spendByCurrency.length" flat bordered class="q-mt-md"
        ><q-card-section
          ><div class="text-subtitle1">Расходы по валютам</div>
          <div class="row q-gutter-md q-mt-sm">
            <q-badge v-for="item in dashboard.spendByCurrency" :key="item.currency" color="primary"
              >{{ item.currency }}: {{ item.spend }}</q-badge
            >
          </div></q-card-section
        ></q-card
      >
    </template>
  </q-page>
</template>

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts';
import { computed, onMounted, reactive, ref } from 'vue';

import MarketingChart from '@/components/marketing/MarketingChart.vue';
import MarketingFilters from '@/components/marketing/MarketingFilters.vue';
import MarketingKpiCards from '@/components/marketing/MarketingKpiCards.vue';
import { marketingApi } from '@/services/marketing';
import type { MarketingDashboard } from '@/types/marketing';
import {
  chartTickAmount,
  dateRangeForPeriod,
  formatChartCategory,
  integerYAxis,
  type MarketingPeriod,
} from '@/utils/marketingDashboard';

const initialRange = dateRangeForPeriod('month');
const filters = reactive({
  ...initialRange,
  campaignId: null as number | null,
  currency: null as string | null,
});
const campaignOptions = ref<Array<{ label: string; value: number }>>([]);
const dashboard = ref<MarketingDashboard | null>(null);
const activePeriod = ref<MarketingPeriod>('month');
const loading = ref(false);
const error = ref(false);
const isEmpty = computed(
  () =>
    !dashboard.value ||
    Number(dashboard.value.summary.newUsers ?? 0) +
      Number(dashboard.value.summary.returningUsers ?? 0) +
      Number(dashboard.value.summary.touches ?? 0) +
      Number(dashboard.value.summary.applications ?? 0) ===
      0,
);
const timeOptions = computed<ApexOptions>(() => ({
  chart: { type: 'line', height: 260, toolbar: { show: false } },
  xaxis: {
    categories:
      dashboard.value?.timeSeries.map((row) =>
        formatChartCategory(String(row.date), activePeriod.value),
      ) ?? [],
    tickAmount: chartTickAmount(dashboard.value?.timeSeries.length ?? 0),
  },
  yaxis: integerYAxis(timeSeries.value.map((item) => item.data.map(Number))),
  stroke: { curve: 'smooth' },
  tooltip: { shared: true },
}));
const timeSeries = computed<ApexAxisChartSeries>(() => [
  {
    name: 'Новые',
    data: dashboard.value?.timeSeries.map((row) => Number(row.newUsers)) ?? [],
  },
  {
    name: 'Вернувшиеся',
    data: dashboard.value?.timeSeries.map((row) => Number(row.returningUsers)) ?? [],
  },
  {
    name: 'Касания',
    data: dashboard.value?.timeSeries.map((row) => Number(row.touches)) ?? [],
  },
  {
    name: 'Заявки',
    data: dashboard.value?.timeSeries.map((row) => Number(row.applications)) ?? [],
  },
  {
    name: 'Завершённые заявки',
    data: dashboard.value?.timeSeries.map((row) => Number(row.completedApplications)) ?? [],
  },
]);
const comparisonOptions = computed<ApexOptions>(() => ({
  chart: { type: 'bar', toolbar: { show: false } },
  xaxis: { categories: dashboard.value?.campaignComparison.map((row) => row.campaignName) ?? [] },
  plotOptions: { bar: { horizontal: false } },
  tooltip: { shared: true },
}));
const comparisonSeries = computed<ApexAxisChartSeries>(() => [
  {
    name: 'Новые',
    data: dashboard.value?.campaignComparison.map((row) => row.newUsers) ?? [],
  },
  {
    name: 'Вернувшиеся',
    data: dashboard.value?.campaignComparison.map((row) => row.returningUsers) ?? [],
  },
  {
    name: 'Касания',
    data: dashboard.value?.campaignComparison.map((row) => row.touches) ?? [],
  },
  {
    name: 'Заявки',
    data: dashboard.value?.campaignComparison.map((row) => row.applications) ?? [],
  },
  {
    name: 'Завершённые',
    data: dashboard.value?.campaignComparison.map((row) => row.completedApplications) ?? [],
  },
]);
async function load() {
  loading.value = true;
  error.value = false;
  try {
    dashboard.value = await marketingApi.dashboard({ ...filters });
  } catch {
    dashboard.value = null;
    error.value = true;
  } finally {
    loading.value = false;
  }
}
function applyFilters(value: typeof filters, period: MarketingPeriod = 'interval') {
  Object.assign(filters, value);
  activePeriod.value = period;
  void load();
}
onMounted(async () => {
  const campaigns = await marketingApi.listCampaigns({ limit: 100, offset: 0 });
  campaignOptions.value = campaigns.items.map((item) => ({ label: item.name, value: item.id }));
  await load();
});
</script>
