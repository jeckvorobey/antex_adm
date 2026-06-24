<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Журнал операций AEX</div>

    <!-- Фильтры -->
    <div class="row q-gutter-sm q-mb-md items-end">
      <q-input
        v-model="filterUserId"
        debounce="300"
        dense
        outlined
        placeholder="ID пользователя"
        type="number"
        style="max-width: 160px"
      >
        <template #prepend>
          <q-icon name="person" />
        </template>
      </q-input>

      <q-select
        v-model="filterType"
        :options="typeOptions"
        option-value="value"
        option-label="label"
        emit-value
        map-options
        dense
        outlined
        clearable
        placeholder="Тип операции"
        style="max-width: 220px"
      />

      <q-input
        v-model="filterDateFrom"
        dense
        outlined
        type="date"
        label="С даты"
        style="max-width: 170px"
      />

      <q-input
        v-model="filterDateTo"
        dense
        outlined
        type="date"
        label="По дату"
        style="max-width: 170px"
      />

      <q-btn
        color="secondary"
        icon="refresh"
        label="Обновить"
        dense
        :loading="loading"
        @click="fetchOperations"
      />
    </div>

    <AppResponsiveTable
      :rows="operations"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :mobile="mobileConfig"
      table-style="table-layout: fixed; width: 100%"
      flat
      bordered
    >
      <template #body-cell-amount="props">
        <q-td :props="props">
          <span :class="props.row.amount >= 0 ? 'text-positive' : 'text-negative'">
            {{ props.row.amount >= 0 ? '+' : '' }}{{ formatAmount(props.row.amount) }}
          </span>
        </q-td>
      </template>

      <template #body-cell-type="props">
        <q-td :props="props">
          <q-badge :color="getTypeColor(props.row.type)">
            {{ getTypeLabel(props.row.type) }}
          </q-badge>
        </q-td>
      </template>

      <template #mobile-field-amount="{ row }">
        <span :class="row.amount >= 0 ? 'text-positive' : 'text-negative'">
          {{ row.amount >= 0 ? '+' : '' }}{{ formatAmount(row.amount) }}
        </span>
      </template>

      <template #mobile-field-type="{ row }">
        <q-badge :color="getTypeColor(row.type)">
          {{ getTypeLabel(row.type) }}
        </q-badge>
      </template>
    </AppResponsiveTable>

    <!-- Пагинация -->
    <div v-if="totalPages > 1" class="row justify-center q-mt-md">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="7"
        boundary-numbers
        direction-links
        @update:model-value="fetchOperations"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { onMounted, ref, watch } from 'vue';

import { api } from '@boot/axios';
import AppResponsiveTable from '@components/ui/AppResponsiveTable.vue';
import { formatAdminDateTime } from '@utils/date';

interface AexOperationRow {
  id: number;
  userId: number;
  username?: string | null;
  firstName?: string | null;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason?: string | null;
  createdAt: string;
}

const operations = ref<AexOperationRow[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 20;

// Фильтры
const filterUserId = ref<string>('');
const filterType = ref<string | null>(null);
const filterDateFrom = ref<string>('');
const filterDateTo = ref<string>('');

const typeOptions = [
  { value: 'credit', label: 'Начисление' },
  { value: 'debit', label: 'Списание' },
  { value: 'referral', label: 'Реферальное' },
  { value: 'partner', label: 'Партнёрское' },
  { value: 'manual_credit', label: 'Ручное начисление' },
  { value: 'manual_debit', label: 'Ручное списание' },
];

const columns: QTableColumn<AexOperationRow>[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true, style: 'width: 7%' },
  { name: 'userId', label: 'User ID', field: 'userId', align: 'left', sortable: true, style: 'width: 9%' },
  {
    name: 'username',
    label: 'Пользователь',
    field: (row: AexOperationRow) => row.username ? `@${row.username}` : row.firstName ?? `ID ${row.userId}`,
    align: 'left',
    style: 'width: 18%',
  },
  {
    name: 'type',
    label: 'Тип',
    field: 'type',
    align: 'left',
    sortable: true,
    style: 'width: 13%',
  },
  {
    name: 'amount',
    label: 'Сумма',
    field: 'amount',
    align: 'right',
    sortable: true,
    style: 'width: 12%',
  },
  {
    name: 'balanceBefore',
    label: 'До',
    field: 'balanceBefore',
    align: 'right',
    format: (value: number) => formatAmount(value),
    style: 'width: 12%',
  },
  {
    name: 'balanceAfter',
    label: 'После',
    field: 'balanceAfter',
    align: 'right',
    format: (value: number) => formatAmount(value),
    style: 'width: 12%',
  },
  {
    name: 'createdAt',
    label: 'Дата',
    field: 'createdAt',
    align: 'left',
    sortable: true,
    format: (value: string) => formatAdminDateTime(value),
    style: 'width: 17%',
  },
];

const mobileConfig = {
  title: (row: AexOperationRow) => row.username ? `@${row.username}` : row.firstName ?? `ID ${row.userId}`,
  subtitle: (row: AexOperationRow) => formatAdminDateTime(row.createdAt),
  badge: (row: AexOperationRow) => ({
    label: getTypeLabel(row.type),
    color: getTypeColor(row.type),
  }),
  fields: [
    { name: 'type', label: 'Тип' },
    { name: 'amount', label: 'Сумма' },
    { name: 'balanceBefore', label: 'До' },
    { name: 'balanceAfter', label: 'После' },
    { name: 'createdAt', label: 'Дата' },
  ],
};

async function fetchOperations() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: currentPage.value,
      limit: pageSize,
    };
    if (filterUserId.value) params.userId = filterUserId.value;
    if (filterType.value) params.type = filterType.value;
    if (filterDateFrom.value) params.dateFrom = filterDateFrom.value;
    if (filterDateTo.value) params.dateTo = filterDateTo.value;

    const res = await api.get<{ data: AexOperationRow[]; total: number }>('/api/admin/aex/operations', { params });
    operations.value = Array.isArray(res.data.data) ? res.data.data : [];
    totalPages.value = Math.ceil((res.data.total || 0) / pageSize);
  } catch {
    operations.value = [];
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchOperations);

// Сброс на первую страницу при изменении фильтров
watch([filterUserId, filterType, filterDateFrom, filterDateTo], () => {
  currentPage.value = 1;
  fetchOperations();
});

function getTypeLabel(type: string): string {
  const found = typeOptions.find((t) => t.value === type);
  return found?.label ?? type;
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'credit':
    case 'manual_credit':
    case 'referral':
    case 'partner':
      return 'positive';
    case 'debit':
    case 'manual_debit':
      return 'negative';
    default:
      return 'grey';
  }
}

function formatAmount(value: number) {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>
