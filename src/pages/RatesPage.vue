<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5">Курсы и наценка</div>
      <q-space />
      <q-btn color="secondary" icon="refresh" label="Обновить курсы" :loading="refreshing" @click="refreshRates" />
    </div>

    <q-card>
      <q-card-section>
        <div class="text-subtitle1">Текущие курсы</div>
        <div class="text-caption text-grey-7 q-mt-xs">Наценка редактируется прямо в таблице</div>
      </q-card-section>

      <q-table
        :rows="rates"
        :columns="rateColumns"
        row-key="id"
        :loading="loadingRates"
        flat
        dense
        :pagination="{ rowsPerPage: 0 }"
      >
        <template #body-cell-margin="props">
          <q-td :props="props">
            <div class="row items-center justify-end q-gutter-xs">
              <span>{{ formatMargin(props.row.margin) }}</span>
              <q-icon name="edit" size="16px" color="grey-6" />
            </div>
            <q-popup-edit
              v-slot="scope"
              :model-value="props.row.margin"
              buttons
              label-set="Сохранить"
              label-cancel="Отмена"
              @save="(value) => updateMargin(props.row, Number(value))"
            >
              <q-input
                v-model.number="scope.value"
                type="number"
                min="0"
                max="100"
                step="0.1"
                dense
                autofocus
                outlined
              />
            </q-popup-edit>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

import { api } from '@boot/axios';

interface RateRow {
  id: number;
  currency: string;
  country: string;
  countryRuName: string;
  baseRate: number;
  baseRateDisplay: string;
  finalRate: number;
  finalRateDisplay: string;
  margin: number;
  updatedAt: string;
}

const $q = useQuasar();
const refreshing = ref(false);
const loadingRates = ref(false);
const rates = ref<RateRow[]>([]);
const rateColumns: QTableColumn<RateRow>[] = [
  {
    name: 'currency',
    label: 'Пара',
    field: 'currency',
    align: 'left',
    sortable: true,
  },
  {
    name: 'country',
    label: 'Страна',
    field: 'countryRuName',
    align: 'left',
    sortable: true,
  },
  {
    name: 'baseRate',
    label: 'Базовый курс',
    field: 'baseRateDisplay',
    align: 'right',
    sortable: true,
  },
  {
    name: 'finalRate',
    label: 'Итоговый курс',
    field: 'finalRateDisplay',
    align: 'right',
    sortable: true,
  },
  {
    name: 'margin',
    label: 'Наценка',
    field: 'margin',
    align: 'right',
    sortable: true,
    format: (value: number) => formatMargin(value),
  },
  {
    name: 'updatedAt',
    label: 'Обновлено',
    field: 'updatedAt',
    align: 'left',
    sortable: true,
    format: (value: string) => formatDate(value),
  },
];

onMounted(async () => {
  await loadRates();
});

async function loadRates() {
  loadingRates.value = true;
  try {
    const res = await api.get<RateRow[]>('/api/admin/rates');
    rates.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    rates.value = [];
  } finally {
    loadingRates.value = false;
  }
}

async function refreshRates() {
  refreshing.value = true;
  try {
    await api.post('/api/admin/rates/refresh');
    await loadRates();
    $q.notify({ type: 'positive', message: 'Курсы обновлены' });
  } finally {
    refreshing.value = false;
  }
}

async function updateMargin(row: RateRow, margin: number) {
  try {
    const res = await api.patch<RateRow>(`/api/admin/rates/${row.id}`, { margin });
    const index = rates.value.findIndex((item) => item.id === row.id);
    if (index >= 0) {
      rates.value[index] = res.data;
    }
    $q.notify({ type: 'positive', message: 'Наценка сохранена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось сохранить наценку' });
  }
}

function formatMargin(value: number) {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}%`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU');
}
</script>
