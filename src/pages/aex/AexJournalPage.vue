<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Журнал операций AEX</div>

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
      :loading-more="loadingMore"
      :has-more="hasMore"
      :pagination="pagination"
      :mobile="mobileConfig"
      table-style="table-layout: fixed; width: 100%"
      flat
      bordered
      @request="handleTableRequest"
      @update:pagination="handlePaginationUpdate"
      @load-more="handleLoadMore"
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

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

const operations = ref<AexOperationRow[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(false);
const pagination = ref({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

const filterUserId = ref<string>('');
const filterType = ref<string | null>(null);
const filterDateFrom = ref<string>('');
const filterDateTo = ref<string>('');

const typeOptions = [
  { value: 'credit', label: 'Начисление' },
  { value: 'debit', label: 'Списание' },
  { value: 'hold', label: 'Холд' },
  { value: 'release', label: 'Разморозка' },
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
  { name: 'type', label: 'Тип', field: 'type', align: 'left', sortable: true, style: 'width: 13%' },
  { name: 'amount', label: 'Сумма', field: 'amount', align: 'right', sortable: true, style: 'width: 12%' },
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

onMounted(fetchOperations);

watch([filterUserId, filterType, filterDateFrom, filterDateTo], async () => {
  pagination.value = { ...pagination.value, page: 1 };
  await fetchOperations();
});

async function fetchOperations(options?: { append?: boolean; offset?: number; limit?: number }) {
  const append = options?.append ?? false;
  const limit = options?.limit ?? pagination.value.rowsPerPage;
  const offset = options?.offset ?? (pagination.value.page - 1) * limit;
  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
  }
  try {
    const params: Record<string, unknown> = { limit, offset };
    if (filterUserId.value) params.userId = Number(filterUserId.value);
    if (filterType.value) params.type = filterType.value;
    if (filterDateFrom.value) params.dateFrom = filterDateFrom.value;
    if (filterDateTo.value) params.dateTo = filterDateTo.value;

    const res = await api.get<PaginatedResponse<AexOperationRow>>('/api/admin/aex/operations', { params });
    const payload = Array.isArray(res.data)
      ? { items: res.data, total: res.data.length, limit, offset }
      : ('data' in res.data && Array.isArray((res.data as { data?: AexOperationRow[] }).data))
        ? { items: (res.data as { data: AexOperationRow[]; total: number }).data, total: (res.data as { total: number }).total, limit, offset }
        : res.data;
    const nextRows = Array.isArray(payload.items) ? payload.items : [];
    operations.value = append ? [...operations.value, ...nextRows] : nextRows;
    pagination.value = {
      ...pagination.value,
      rowsNumber: payload.total,
      rowsPerPage: payload.limit,
      page: Math.floor(payload.offset / payload.limit) + 1,
    };
    hasMore.value = payload.offset + nextRows.length < payload.total;
  } catch {
    if (!append) {
      operations.value = [];
      pagination.value = { ...pagination.value, rowsNumber: 0 };
      hasMore.value = false;
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

async function handleTableRequest(payload: { pagination: { page: number; rowsPerPage: number } }) {
  pagination.value = { ...pagination.value, ...payload.pagination };
  await fetchOperations();
}

function handlePaginationUpdate(value: Record<string, unknown>) {
  pagination.value = { ...pagination.value, ...value };
}

async function handleLoadMore({ done }: { done: () => void }) {
  await fetchOperations({
    append: true,
    offset: operations.value.length,
    limit: pagination.value.rowsPerPage,
  });
  done();
}

function getTypeLabel(type: string): string {
  const found = typeOptions.find((item) => item.value === type);
  return found?.label ?? type;
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'credit':
    case 'release':
      return 'positive';
    case 'debit':
    case 'hold':
      return 'negative';
    default:
      return 'grey';
  }
}

function formatAmount(value: number) {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>
