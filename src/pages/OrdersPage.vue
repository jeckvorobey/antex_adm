<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Заявки</div>
    <AppResponsiveTable
      :rows="orders"
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
      <template #body-cell-status="{ row }">
        <q-td>
          <q-badge :color="getStatusColor(row.status)">
            {{ getStatusLabel(row.status) }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-actions="{ row }">
        <q-td>
          <q-btn
            v-if="row.status === 1"
            :data-testid="`confirm-order-${row.id}`"
            dense
            flat
            color="primary"
            label="Взять в работу"
            @click="updateStatus(row.id, 2)"
          />
          <q-btn
            v-if="row.status === 2"
            :data-testid="`complete-order-${row.id}`"
            dense
            flat
            color="positive"
            label="Завершить"
            @click="updateStatus(row.id, 3)"
          />
        </q-td>
      </template>

      <template #mobile-actions="{ row }">
        <div class="row q-gutter-sm">
          <q-btn
            v-if="row.status === 1"
            :data-testid="`confirm-order-${row.id}`"
            dense
            flat
            color="primary"
            label="Взять в работу"
            @click="updateStatus(row.id, 2)"
          />
          <q-btn
            v-if="row.status === 2"
            :data-testid="`complete-order-${row.id}`"
            dense
            flat
            color="positive"
            label="Завершить"
            @click="updateStatus(row.id, 3)"
          />
        </div>
      </template>
    </AppResponsiveTable>
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { onMounted, ref } from 'vue';

import { api } from '@boot/axios';
import AppResponsiveTable from '@components/ui/AppResponsiveTable.vue';
import { formatAdminDateTime } from '@utils/date';

interface AdminOrder {
  id: number;
  publicNumber: string;
  UserId: number;
  CityId?: number;
  currencySell: string;
  amountSell: number;
  currencyBuy: string;
  amountBuy: number | null;
  rate: number | null;
  status: number;
  contactTelegram?: string | null;
  methodGet?: string | null;
  createdAt: string;
  user?: {
    username: string | null;
    first_name: string | null;
  } | null;
  city?: {
    name: string;
  } | null;
}

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

const PAGE_SIZE = 20;

const orders = ref<AdminOrder[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(false);
const total = ref(0);
const pagination = ref({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: PAGE_SIZE,
  rowsNumber: 0,
});

const columns: QTableColumn<AdminOrder>[] = [
  { name: 'id', label: 'Номер', field: 'publicNumber', sortable: true, align: 'left', style: 'width: 11%' },
  { name: 'user', label: 'Пользователь', field: formatUser, align: 'left', style: 'width: 14%' },
  { name: 'city', label: 'Город', field: (row) => row.city?.name ?? row.CityId ?? '—', align: 'left', style: 'width: 11%' },
  { name: 'currencySell', label: 'Отдаёт', field: (row) => `${row.amountSell} ${row.currencySell}`, align: 'right', style: 'width: 12%' },
  { name: 'currencyBuy', label: 'Получает', field: (row) => `${row.amountBuy ?? '—'} ${row.currencyBuy}`, align: 'right', style: 'width: 12%' },
  { name: 'rate', label: 'Курс', field: (row) => row.rate ?? '—', align: 'right', style: 'width: 9%' },
  { name: 'status', label: 'Статус', field: 'status', align: 'left', style: 'width: 10%' },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'left', style: 'width: 12%' },
  {
    name: 'createdAt',
    label: 'Создана',
    field: 'createdAt',
    align: 'left',
    style: 'width: 13%',
    format: (value) => formatAdminDateTime(String(value)),
  },
];

const mobileConfig = {
  title: (row: AdminOrder) => `Заявка ${row.publicNumber}`,
  subtitle: (row: AdminOrder) => formatAdminDateTime(row.createdAt),
  badge: (row: AdminOrder) => ({
    label: getStatusLabel(row.status),
    color: getStatusColor(row.status),
  }),
  fields: [
    { name: 'user', label: 'Пользователь' },
    { name: 'city', label: 'Город' },
    { name: 'currencySell', label: 'Отдаёт' },
    { name: 'currencyBuy', label: 'Получает' },
    { name: 'rate', label: 'Курс' },
  ],
};

onMounted(async () => {
  await fetchOrders();
});

async function fetchOrders(options?: { append?: boolean; offset?: number; limit?: number }) {
  const append = options?.append ?? false;
  const limit = options?.limit ?? pagination.value.rowsPerPage;
  const offset = options?.offset ?? (pagination.value.page - 1) * limit;

  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
  }

  try {
    const res = await api.get<PaginatedResponse<AdminOrder>>('/api/admin/orders', {
      params: { limit, offset },
    });
    const payload = Array.isArray(res.data)
      ? { items: res.data, total: res.data.length, limit, offset }
      : res.data;
    const nextRows = payload.items ?? [];
    orders.value = append ? [...orders.value, ...nextRows] : nextRows;
    total.value = payload.total;
    hasMore.value = offset + nextRows.length < payload.total;
    pagination.value = {
      ...pagination.value,
      page: Math.floor(offset / limit) + 1,
      rowsPerPage: limit,
      rowsNumber: payload.total,
    };
  } catch {
    if (!append) {
      orders.value = [];
      total.value = 0;
      hasMore.value = false;
      pagination.value = { ...pagination.value, rowsNumber: 0 };
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

async function handleTableRequest(payload: { pagination: { page: number; rowsPerPage: number } }) {
  pagination.value = { ...pagination.value, ...payload.pagination };
  await fetchOrders({
    offset: (payload.pagination.page - 1) * payload.pagination.rowsPerPage,
    limit: payload.pagination.rowsPerPage,
  });
}

function handlePaginationUpdate(value: Record<string, unknown>) {
  pagination.value = { ...pagination.value, ...value };
}

async function handleLoadMore({ done }: { done: () => void }) {
  await fetchOrders({
    append: true,
    offset: orders.value.length,
    limit: pagination.value.rowsPerPage,
  });
  done();
}

async function updateStatus(orderId: number, status: number) {
  const response = await api.patch<AdminOrder>(`/api/admin/orders/${orderId}/status`, { status });
  orders.value = orders.value.map((order) => (
    order.id === orderId ? response.data : order
  ));
}

function formatUser(row: AdminOrder) {
  if (row.user?.username) {
    return `@${row.user.username}`;
  }
  if (row.user?.first_name) {
    return row.user.first_name;
  }
  return row.UserId;
}

function getStatusLabel(status: number) {
  const labels: Record<number, string> = {
    1: 'Новая',
    2: 'В работе',
    3: 'Выполнена',
    4: 'Отменена',
  };
  return labels[status] ?? `Статус ${status}`;
}

function getStatusColor(status: number) {
  const colors: Record<number, string> = {
    1: 'orange',
    2: 'blue',
    3: 'green',
    4: 'grey',
  };
  return colors[status] ?? 'grey';
}
</script>
