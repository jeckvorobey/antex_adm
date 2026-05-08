<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Заявки</div>
    <q-table
      :rows="orders"
      :columns="columns"
      row-key="id"
      :loading="loading"
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
            label="Подтвердить"
            @click="updateStatus(row.id, 2)"
          />
          <q-btn
            v-if="[1, 2, 3].includes(row.status)"
            :data-testid="`complete-order-${row.id}`"
            dense
            flat
            color="positive"
            label="Завершить"
            @click="updateStatus(row.id, 4)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@boot/axios';

interface AdminOrder {
  id: number;
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

const columns = [
  { name: 'id', label: '#', field: 'id', sortable: true },
  { name: 'user', label: 'Пользователь', field: formatUser },
  { name: 'city', label: 'Город', field: (row: AdminOrder) => row.city?.name ?? row.CityId ?? '—' },
  { name: 'currencySell', label: 'Отдаёт', field: (row: AdminOrder) => `${row.amountSell} ${row.currencySell}` },
  { name: 'currencyBuy', label: 'Получает', field: (row: AdminOrder) => `${row.amountBuy ?? '—'} ${row.currencyBuy}` },
  { name: 'rate', label: 'Курс', field: (row: AdminOrder) => row.rate ?? '—' },
  { name: 'status', label: 'Статус', field: 'status' },
  { name: 'actions', label: 'Действия', field: 'actions' },
  { name: 'createdAt', label: 'Создана', field: 'createdAt' },
];

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
    2: 'Подтверждена',
    3: 'В обработке',
    4: 'Выполнена',
    5: 'Отменена',
  };
  return labels[status] ?? `Статус ${status}`;
}

function getStatusColor(status: number) {
  const colors: Record<number, string> = {
    1: 'orange',
    2: 'blue',
    3: 'purple',
    4: 'green',
    5: 'grey',
  };
  return colors[status] ?? 'grey';
}
</script>
