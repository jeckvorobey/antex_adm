<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5">Курсы и надбавка</div>
      <q-space />
      <q-btn color="secondary" icon="refresh" label="Обновить курсы" :loading="refreshing" @click="refreshRates" />
    </div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1">Надбавка (allowance)</div>
        <div class="row items-center q-gutter-sm q-mt-sm">
          <q-input v-model.number="allowanceValue" type="number" step="0.001" outlined dense style="max-width: 150px" />
          <q-btn color="primary" label="Сохранить" :loading="savingAllowance" @click="saveAllowance" />
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section>
        <div class="text-subtitle1">Текущие курсы</div>
      </q-card-section>

      <q-table
        :rows="rates"
        :columns="rateColumns"
        row-key="id"
        :loading="loadingRates"
        flat
        dense
        :pagination="{ rowsPerPage: 0 }"
      />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from '@boot/axios';

interface RateRow {
  id: number;
  currency: string;
  price: number;
  updatedAt: string;
}

const $q = useQuasar();
const allowanceValue = ref(0.02);
const refreshing = ref(false);
const savingAllowance = ref(false);
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
    name: 'price',
    label: 'Курс',
    field: 'price',
    align: 'right',
    sortable: true,
    format: (value: number) => formatRate(value),
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
  await Promise.all([loadAllowance(), loadRates()]);
});

/**
 * Загружает текущую надбавку обменника.
 */
async function loadAllowance() {
  try {
    const res = await api.get('/api/admin/allowance');
    allowanceValue.value = res.data.value;
  } catch {
    allowanceValue.value = 0.02;
  }
}

/**
 * Загружает список сохранённых курсов для таблицы администратора.
 */
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

async function saveAllowance() {
  savingAllowance.value = true;
  try {
    await api.put('/api/admin/allowance', { value: allowanceValue.value });
    $q.notify({ type: 'positive', message: 'Надбавка сохранена' });
  } finally {
    savingAllowance.value = false;
  }
}

/**
 * Форматирует курс без потери малых значений RUB-пар.
 */
function formatRate(value: number) {
  return value >= 1 ? value.toLocaleString('ru-RU', { maximumFractionDigits: 4 }) : value.toFixed(6);
}

/**
 * Форматирует дату обновления курса для админской таблицы.
 */
function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU');
}
</script>
