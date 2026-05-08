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
          <div class="text-subtitle2 text-grey">Курс RUB/THB</div>
          <div class="text-h4">{{ summary?.rubThbRate ?? '—' }}</div>
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
  rubThbRate: number | null;
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
