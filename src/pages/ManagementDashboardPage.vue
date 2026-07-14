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
        <div class="col-12 col-lg-8">
          <q-card flat bordered
            ><q-card-section
              ><div class="text-h6 q-mb-md">Динамика</div>
              <MarketingChart :options="timeOptions" :series="timeSeries" /></q-card-section
          ></q-card>
        </div>
        <div class="col-12 col-lg-4">
          <q-card flat bordered class="full-height"
            ><q-card-section
              ><div class="text-h6 q-mb-md">Воронка</div>
              <div v-for="stage in dashboard.funnel" :key="stage.stage" class="q-mb-md">
                <div class="row justify-between">
                  <span>{{ stage.stage }}</span
                  ><b>{{ stage.value }}</b>
                </div>
                <q-linear-progress
                  :value="funnelRatio(stage.value)"
                  color="primary"
                  rounded
                  class="q-mt-xs"
                /></div></q-card-section
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

const now = new Date();
const dateTo = now.toISOString().slice(0, 10);
now.setDate(now.getDate() - 29);
const filters = reactive({
  dateFrom: now.toISOString().slice(0, 10),
  dateTo,
  campaignId: null as number | null,
  currency: null as string | null,
});
const campaignOptions = ref<Array<{ label: string; value: number }>>([]);
const dashboard = ref<MarketingDashboard | null>(null);
const loading = ref(false);
const error = ref(false);
const isEmpty = computed(
  () =>
    !dashboard.value ||
    Number(dashboard.value.summary.attributedUsers ?? 0) +
      Number(dashboard.value.summary.applications ?? 0) ===
      0,
);
const timeOptions = computed<ApexOptions>(() => ({
  chart: { type: 'line', toolbar: { show: false } },
  xaxis: { categories: dashboard.value?.timeSeries.map((row) => String(row.date)) ?? [] },
  stroke: { curve: 'smooth' },
  tooltip: { shared: true },
}));
const timeSeries = computed<ApexAxisChartSeries>(() => [
  {
    name: 'Атрибутированные пользователи',
    data: dashboard.value?.timeSeries.map((row) => Number(row.attributedUsers)) ?? [],
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
    name: 'Пользователи',
    data: dashboard.value?.campaignComparison.map((row) => row.attributedUsers) ?? [],
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
function applyFilters(value: typeof filters) {
  Object.assign(filters, value);
  void load();
}
function funnelRatio(value: number) {
  const first = dashboard.value?.funnel[0]?.value ?? 0;
  return first > 0 ? value / first : 0;
}
onMounted(async () => {
  const campaigns = await marketingApi.listCampaigns({ limit: 100, offset: 0 });
  campaignOptions.value = campaigns.items.map((item) => ({ label: item.name, value: item.id }));
  await load();
});
</script>
