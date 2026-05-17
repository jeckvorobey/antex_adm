<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Дашборд</div>
    <div class="row q-gutter-md">
      <q-card class="col-xs-12 col-sm-6 col-md-3">
        <q-card-section>
          <div class="text-subtitle2 text-grey">Заявок сегодня</div>
          <div class="text-h4">{{ summary?.ordersToday ?? '—' }}</div>
        </q-card-section>
      </q-card>
      <q-card class="col-xs-12 col-sm-6 col-md-3">
        <q-card-section>
          <div class="text-subtitle2 text-grey">Пользователей</div>
          <div class="text-h4">{{ summary?.usersTotal ?? '—' }}</div>
        </q-card-section>
      </q-card>
      <q-card class="col-xs-12 col-sm-6 col-md-3">
        <q-card-section>
          <div class="text-subtitle2 text-grey">Ключевые пары</div>
          <div v-for="rate in summary?.featuredRates ?? []" :key="rate.pairId" class="q-mt-sm">
            <div class="text-caption text-grey-7">{{ rate.label }}</div>
            <div class="text-h6">{{ rate.finalRateDisplay }}</div>
          </div>
          <div v-if="!summary?.featuredRates?.length" class="text-h4">—</div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@boot/axios';

interface DashboardSummary {
  ordersToday: number;
  usersTotal: number;
  featuredRates: Array<{
    pairId: string;
    label: string;
    finalRate: number;
    finalRateDisplay: string;
  }>;
}

const summary = ref<DashboardSummary | null>(null);

onMounted(async () => {
  await loadSummary();
});

/**
 * Загружает MVP-метрики дашборда из backend.
 */
async function loadSummary() {
  try {
    const response = await api.get<DashboardSummary>('/api/admin/summary');
    summary.value = response.data;
  } catch {
    summary.value = null;
  }
}
</script>
