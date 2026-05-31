<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Заявки</div>
    <AppResponsiveTable
      :rows="orders"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :mobile="mobileConfig"
      table-style="table-layout: fixed; width: 100%"
      flat
      bordered
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

const orders = ref<AdminOrder[]>([]);
const loading = ref(false);

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
  loading.value = true;
  try {
    const res = await api.get('/api/admin/orders');
    orders.value = res.data;
  } catch {
    orders.value = [];
  } finally {
    loading.value = false;
  }
});

/**
 * Меняет статус заявки и обновляет строку таблицы ответом backend.
 */
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
