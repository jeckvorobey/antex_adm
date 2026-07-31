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

      <q-banner v-if="isEmpty" class="bg-grey-2 text-grey-8 q-mt-md">
        Нет данных за выбранный период
      </q-banner>

      <div v-else class="row q-col-gutter-md q-mt-xs">
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md">Динамика</div>
              <MarketingChart :options="timeOptions" :series="timeSeries" :height="280" />
            </q-card-section>
          </q-card>
        </div>

        <div v-if="showFunnel" class="col-12 col-lg-6">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-xs">Воронка</div>
              <div class="text-caption text-grey-7 q-mb-md">
                Путь пользователя от рекламного перехода до завершённой заявки
              </div>
              <MarketingChart :options="funnelOptions" :series="funnelSeries" :height="300" />
            </q-card-section>
          </q-card>
        </div>

        <div v-if="showConversion" class="col-12" :class="showFunnel ? 'col-lg-6' : ''">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-xs">Конверсия по дням</div>
              <div class="text-caption text-grey-7 q-mb-md">
                Доля переходов, ставших заявками, и доля завершённых заявок
              </div>
              <MarketingChart
                :options="conversionOptions"
                :series="conversionSeries"
                :height="300"
              />
            </q-card-section>
          </q-card>
        </div>

        <div v-if="showCampaignComparison" class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-xs">Сравнение кампаний</div>
              <div class="text-caption text-grey-7 q-mb-md">
                Сопоставление результатов кампаний за выбранный период
              </div>
              <MarketingChart
                :options="comparisonOptions"
                :series="comparisonSeries"
                :height="320"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-card v-if="dashboard.spendByCurrency.length" flat bordered class="q-mt-md">
        <q-card-section>
          <div class="text-h6">Расходы по валютам</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Валюты показаны отдельно и не суммируются между собой
          </div>
          <div class="row q-col-gutter-md q-mt-xs">
            <div
              v-for="item in dashboard.spendByCurrency"
              :key="item.currency"
              class="col-6 col-sm-4 col-lg-3"
            >
              <q-card flat bordered class="full-height">
                <q-card-section>
                  <div class="text-caption text-grey-7">{{ item.currency }}</div>
                  <div class="text-h6 q-mt-xs">{{ formatNumber(item.spend) }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
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

const showFunnel = computed(
  () => dashboard.value?.funnel.some((item) => Number(item.value) > 0) ?? false,
);
const showConversion = computed(() => (dashboard.value?.timeSeries.length ?? 0) > 0);
const showCampaignComparison = computed(
  () => (dashboard.value?.campaignComparison.length ?? 0) >= 2,
);

const chartCategories = computed(
  () =>
    dashboard.value?.timeSeries.map((row) =>
      formatChartCategory(String(row.date), activePeriod.value),
    ) ?? [],
);

const timeOptions = computed<ApexOptions>(() => ({
  chart: { type: 'line', height: 280, toolbar: { show: false } },
  xaxis: {
    categories: chartCategories.value,
    tickAmount: chartTickAmount(dashboard.value?.timeSeries.length ?? 0),
  },
  yaxis: integerYAxis(timeSeries.value.map((item) => item.data.map(Number))),
  stroke: { curve: 'smooth' },
  tooltip: { shared: true },
}));

const timeSeries = computed<ApexAxisChartSeries>(() => [
  { name: 'Новые', data: dashboard.value?.timeSeries.map((row) => Number(row.newUsers)) ?? [] },
  {
    name: 'Вернувшиеся',
    data: dashboard.value?.timeSeries.map((row) => Number(row.returningUsers)) ?? [],
  },
  { name: 'Переходы', data: dashboard.value?.timeSeries.map((row) => Number(row.touches)) ?? [] },
  {
    name: 'Заявки',
    data: dashboard.value?.timeSeries.map((row) => Number(row.applications)) ?? [],
  },
  {
    name: 'Завершённые заявки',
    data: dashboard.value?.timeSeries.map((row) => Number(row.completedApplications)) ?? [],
  },
]);

const funnelLabels: Record<string, string> = {
  'New users': 'Новые пользователи',
  'Marketing touches': 'Переходы',
  'Unique applicants': 'Уникальные заявители',
  'Completed applications': 'Завершённые заявки',
};
const funnelOptions = computed<ApexOptions>(() => ({
  chart: { type: 'bar', toolbar: { show: false } },
  xaxis: {
    categories: dashboard.value?.funnel.map((item) => funnelLabels[item.stage] ?? item.stage) ?? [],
    labels: { formatter: (value) => Math.round(Number(value)).toLocaleString('ru-RU') },
  },
  plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
  dataLabels: { enabled: true, formatter: (value) => formatNumber(Number(value)) },
  legend: { show: false },
  tooltip: { y: { formatter: (value) => formatNumber(value) } },
}));
const funnelSeries = computed<ApexAxisChartSeries>(() => [
  { name: 'Пользователи', data: dashboard.value?.funnel.map((item) => Number(item.value)) ?? [] },
]);

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
}
const conversionSeries = computed<ApexAxisChartSeries>(() => [
  {
    name: 'Переход → заявка',
    data:
      dashboard.value?.timeSeries.map((row) =>
        rate(Number(row.applications), Number(row.touches)),
      ) ?? [],
  },
  {
    name: 'Заявка → завершение',
    data:
      dashboard.value?.timeSeries.map((row) =>
        rate(Number(row.completedApplications), Number(row.applications)),
      ) ?? [],
  },
]);
const conversionOptions = computed<ApexOptions>(() => ({
  chart: { type: 'line', toolbar: { show: false } },
  xaxis: {
    categories: chartCategories.value,
    tickAmount: chartTickAmount(dashboard.value?.timeSeries.length ?? 0),
  },
  yaxis: { min: 0, max: 100, labels: { formatter: (value) => `${Math.round(value)}%` } },
  stroke: { curve: 'smooth' },
  tooltip: { shared: true, y: { formatter: (value) => `${formatNumber(value)}%` } },
}));

const comparisonOptions = computed<ApexOptions>(() => ({
  chart: { type: 'bar', toolbar: { show: false } },
  xaxis: { categories: dashboard.value?.campaignComparison.map((row) => row.campaignName) ?? [] },
  plotOptions: { bar: { horizontal: false, borderRadius: 3 } },
  yaxis: integerYAxis(comparisonSeries.value.map((item) => item.data.map(Number))),
  tooltip: { shared: true },
}));
const comparisonSeries = computed<ApexAxisChartSeries>(() => [
  {
    name: 'Новые',
    data: dashboard.value?.campaignComparison.map((row) => row.newUsers) ?? [],
  },
  {
    name: 'Переходы',
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

function formatNumber(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
    : '—';
}

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
