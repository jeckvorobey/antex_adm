<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5">Курсы и наценка</div>
      <q-space />
      <q-btn
        color="secondary"
        icon="refresh"
        label="Обновить курс"
        :loading="refreshing"
        @click="refreshRates"
      />
    </div>

    <q-card>
      <q-card-section>
        <div class="text-subtitle1">Текущие курсы</div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Наценка любого курса редактируется прямо в таблице
        </div>
      </q-card-section>

      <AppResponsiveTable
        :rows="rates"
        :columns="rateColumns"
        row-key="id"
        :loading="loadingRates"
        :mobile="mobileConfig"
        table-style="table-layout: fixed; width: 100%"
        flat
        dense
        :pagination="{ rowsPerPage: 0 }"
      >
        <template #body-cell-currency="props">
          <q-td :props="props">
            <span
              >{{ props.row.currency }}
              <q-badge
                v-if="props.row.isReversed"
                color="red"
                outline
                aria-label="Реверсивный курс"
                tabindex="0"
              >
                <q-icon name="info" size="14px" />
                <q-tooltip>{{ getReversedRateHint(props.row) }}</q-tooltip>
              </q-badge>
            </span>
          </q-td>
        </template>

        <template #body-cell-country="props">
          <q-td :props="props">
            {{ getRateScopeLabel(props.row) }}
          </q-td>
        </template>

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

        <template #body-cell-displayMode="props">
          <q-td :props="props">
            <q-toggle
              :model-value="props.row.isReversed"
              :label="props.row.isReversed ? 'Обратный' : 'Прямой'"
              :disable="displayUpdating.has(props.row.id)"
              :data-testid="`rate-display-reversed-${props.row.id}`"
              @update:model-value="(value) => updateDisplayReversed(props.row, value)"
            />
          </q-td>
        </template>

        <template #mobile-field-margin="{ row }">
          <div class="row items-center justify-end q-gutter-xs">
            <span>{{ formatMargin(row.margin) }}</span>
            <q-icon name="edit" size="16px" color="grey-6" />
          </div>
          <q-popup-edit
            v-slot="scope"
            :model-value="row.margin"
            buttons
            label-set="Сохранить"
            label-cancel="Отмена"
            @save="(value) => updateMargin(row, Number(value))"
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
        </template>

        <template #mobile-field-displayMode="{ row }">
          <q-toggle
            :model-value="row.isReversed"
            :label="row.isReversed ? 'Обратный' : 'Прямой'"
            :disable="displayUpdating.has(row.id)"
            :data-testid="`rate-display-reversed-${row.id}`"
            @update:model-value="(value) => updateDisplayReversed(row, value)"
          />
        </template>
      </AppResponsiveTable>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

import { api } from '@boot/axios';
import AppResponsiveTable from '@components/ui/AppResponsiveTable.vue';
import { formatAdminDateTime } from '@utils/date';

interface RateRow {
  id: number;
  currency: string;
  country: string | null;
  countryRuName: string | null;
  isInternal: boolean;
  baseRate: number;
  baseRateDisplay: string;
  finalRate: number;
  finalRateDisplay: string;
  margin: number;
  isReversed: boolean;
  displayCurrencySell: string;
  displayCurrencyBuy: string;
  directBaseRate: number;
  directBaseRateDisplay: string;
  directFinalRate: number;
  directFinalRateDisplay: string;
  updatedAt: string;
}

const $q = useQuasar();
const refreshing = ref(false);
const loadingRates = ref(false);
const rates = ref<RateRow[]>([]);
const displayUpdating = ref(new Set<number>());
const rateMutationTails = new Map<number, Promise<void>>();
const rateColumns: QTableColumn<RateRow>[] = [
  {
    name: 'currency',
    label: 'Пара',
    field: 'currency',
    align: 'left',
    sortable: true,
    style: 'width: 12%',
  },
  {
    name: 'country',
    label: 'Страна',
    field: (row) => getRateScopeLabel(row),
    align: 'left',
    sortable: true,
    style: 'width: 14%',
  },
  {
    name: 'baseRate',
    label: 'Базовый курс',
    field: 'baseRateDisplay',
    align: 'right',
    sortable: true,
    style: 'width: 14%',
  },
  {
    name: 'finalRate',
    label: 'Итоговый курс',
    field: 'finalRateDisplay',
    align: 'right',
    sortable: true,
    style: 'width: 14%',
  },
  {
    name: 'displayMode',
    label: 'Отображение',
    field: (row) => (row.isReversed ? 'Обратный' : 'Прямой'),
    align: 'left',
    sortable: true,
    style: 'width: 15%',
  },
  {
    name: 'margin',
    label: 'Наценка',
    field: 'margin',
    align: 'right',
    sortable: true,
    format: (value: number) => formatMargin(value),
    style: 'width: 12%',
  },
  {
    name: 'updatedAt',
    label: 'Обновлено',
    field: 'updatedAt',
    align: 'left',
    sortable: true,
    format: (value: string) => formatAdminDateTime(value),
    style: 'width: 19%',
  },
];

const mobileConfig = {
  title: (row: RateRow) => row.currency,
  subtitle: (row: RateRow) => getRateScopeLabel(row),
  badge: (row: RateRow) =>
    row.isReversed
      ? {
          label: formatMargin(row.margin),
          color: 'negative',
          icon: 'info',
          tooltip: getReversedRateHint(row),
        }
      : { label: formatMargin(row.margin), color: 'primary' },
  fields: [
    { name: 'baseRate', label: 'Базовый курс' },
    { name: 'finalRate', label: 'Итоговый курс' },
    { name: 'displayMode', label: 'Отображение' },
    { name: 'margin', label: 'Наценка' },
    { name: 'updatedAt', label: 'Обновлено' },
  ],
};

onMounted(async () => {
  await loadRates();
});

/** Загружает актуальные курсы и их серверную ориентацию отображения. */
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

/** Обновляет внешние курсы и повторно загружает их представление. */
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

/** Сохраняет клиентскую наценку выбранной валютной пары. */
async function updateMargin(row: RateRow, margin: number) {
  await serializeRateMutation(row.id, async () => {
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
  });
}

/** Переключает только ориентацию показа курса, не меняя прямой курс расчёта. */
async function updateDisplayReversed(row: RateRow, displayReversed: boolean) {
  displayUpdating.value = new Set(displayUpdating.value).add(row.id);
  try {
    await serializeRateMutation(row.id, async () => {
      try {
        const res = await api.patch<RateRow>(`/api/admin/rates/${row.id}`, {
          displayReversed,
        });
        const index = rates.value.findIndex((item) => item.id === row.id);
        if (index >= 0) {
          rates.value[index] = res.data;
        }
        $q.notify({ type: 'positive', message: 'Отображение курса сохранено' });
      } catch {
        $q.notify({ type: 'negative', message: 'Не удалось изменить отображение курса' });
      }
    });
  } finally {
    const next = new Set(displayUpdating.value);
    next.delete(row.id);
    displayUpdating.value = next;
  }
}

/** Последовательно выполняет изменения одной пары и не блокирует остальные строки. */
async function serializeRateMutation(rateId: number, mutation: () => Promise<void>) {
  const previous = rateMutationTails.get(rateId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(mutation);
  rateMutationTails.set(rateId, current);
  try {
    await current;
  } finally {
    if (rateMutationTails.get(rateId) === current) {
      rateMutationTails.delete(rateId);
    }
  }
}

function formatMargin(value: number) {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}%`;
}

function getRateScopeLabel(row: RateRow) {
  return row.isInternal ? 'Внутренний курс' : (row.countryRuName ?? '—');
}

function getReversedRateHint(row: RateRow) {
  return `Курс показан реверсивно: ${row.finalRateDisplay} ${row.displayCurrencyBuy} за 1 ${row.displayCurrencySell}. Прямой курс: ${row.directFinalRateDisplay} ${row.displayCurrencySell} за 1 ${row.displayCurrencyBuy}.`;
}
</script>
