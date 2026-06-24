<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Кошельки AEX</div>

    <q-input
      v-model="search"
      debounce="300"
      dense
      outlined
      placeholder="Поиск по ID, username, имени..."
      class="q-mb-md"
      style="max-width: 400px"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <AppResponsiveTable
      :rows="wallets"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :mobile="mobileConfig"
      table-style="table-layout: fixed; width: 100%"
      flat
      bordered
      :pagination="{ rowsPerPage: 20 }"
    >
      <template #body-cell-available="props">
        <q-td :props="props">
          <span class="text-weight-medium">{{ formatAmount(props.row.available) }}</span>
        </q-td>
      </template>

      <template #body-cell-reserved="props">
        <q-td :props="props">
          <span>{{ formatAmount(props.row.reserved) }}</span>
        </q-td>
      </template>

      <template #body-cell-total="props">
        <q-td :props="props">
          <span class="text-weight-medium text-primary">
            {{ formatAmount(props.row.available + props.row.reserved) }}
          </span>
        </q-td>
      </template>

      <template #mobile-field-available="{ row }">
        <span class="text-weight-medium">{{ formatAmount(row.available) }}</span>
      </template>

      <template #mobile-field-reserved="{ row }">
        <span>{{ formatAmount(row.reserved) }}</span>
      </template>

      <template #mobile-field-total="{ row }">
        <span class="text-weight-medium text-primary">
          {{ formatAmount(row.available + row.reserved) }}
        </span>
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

interface AexWalletRow {
  id: number;
  userId: number;
  username?: string | null;
  firstName?: string | null;
  available: number;
  reserved: number;
  updatedAt: string;
}

const wallets = ref<AexWalletRow[]>([]);
const loading = ref(false);
const search = ref('');

const columns: QTableColumn<AexWalletRow>[] = [
  { name: 'userId', label: 'ID', field: 'userId', align: 'left', sortable: true, style: 'width: 8%' },
  {
    name: 'username',
    label: 'Пользователь',
    field: (row: AexWalletRow) => row.username ? `@${row.username}` : row.firstName ?? `ID ${row.userId}`,
    align: 'left',
    style: 'width: 24%',
  },
  {
    name: 'available',
    label: 'Доступно',
    field: 'available',
    align: 'right',
    sortable: true,
    style: 'width: 17%',
  },
  {
    name: 'reserved',
    label: 'Зарезервировано',
    field: 'reserved',
    align: 'right',
    sortable: true,
    style: 'width: 17%',
  },
  {
    name: 'total',
    label: 'Итого',
    field: (row: AexWalletRow) => row.available + row.reserved,
    align: 'right',
    sortable: true,
    style: 'width: 17%',
  },
  {
    name: 'updatedAt',
    label: 'Обновлено',
    field: 'updatedAt',
    align: 'left',
    sortable: true,
    format: (value: string) => formatAdminDateTime(value),
    style: 'width: 17%',
  },
];

const mobileConfig = {
  title: (row: AexWalletRow) => row.username ? `@${row.username}` : row.firstName ?? `ID ${row.userId}`,
  subtitle: (row: AexWalletRow) => formatAdminDateTime(row.updatedAt),
  badge: (row: AexWalletRow) => ({
    label: formatAmount(row.available + row.reserved),
    color: 'primary',
  }),
  fields: [
    { name: 'available', label: 'Доступно' },
    { name: 'reserved', label: 'Зарезервировано' },
    { name: 'total', label: 'Итого' },
    { name: 'updatedAt', label: 'Обновлено' },
  ],
};

async function fetchWallets() {
  loading.value = true;
  try {
    const params = search.value ? { search: search.value } : undefined;
    const res = await api.get<AexWalletRow[]>('/api/admin/aex/wallets', { params });
    wallets.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    wallets.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchWallets);
watch(search, fetchWallets);

function formatAmount(value: number) {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>
