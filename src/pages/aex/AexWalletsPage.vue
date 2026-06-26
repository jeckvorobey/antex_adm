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
      <template #body-cell-available="props">
        <q-td :props="props">
          <span class="text-weight-medium">{{ formatAmount(Number(props.row.balance_available)) }}</span>
        </q-td>
      </template>

      <template #body-cell-reserved="props">
        <q-td :props="props">
          <span>{{ formatAmount(Number(props.row.balance_reserved)) }}</span>
        </q-td>
      </template>

      <template #body-cell-total="props">
        <q-td :props="props">
          <span class="text-weight-medium text-primary">
            {{ formatAmount(Number(props.row.balance_available) + Number(props.row.balance_reserved)) }}
          </span>
        </q-td>
      </template>

      <template #mobile-field-available="{ row }">
        <span class="text-weight-medium">{{ formatAmount(Number(row.balance_available)) }}</span>
      </template>

      <template #mobile-field-reserved="{ row }">
        <span>{{ formatAmount(Number(row.balance_reserved)) }}</span>
      </template>

      <template #mobile-field-total="{ row }">
        <span class="text-weight-medium text-primary">
          {{ formatAmount(Number(row.balance_available) + Number(row.balance_reserved)) }}
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
  user_id: number;
  username?: string | null;
  first_name?: string | null;
  balance_available: string;
  balance_reserved: string;
  createdAt: string;
}

const wallets = ref<AexWalletRow[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(false);
const search = ref('');
const pagination = ref({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

const columns: QTableColumn<AexWalletRow>[] = [
  { name: 'userId', label: 'ID', field: 'user_id', align: 'left', sortable: true, style: 'width: 8%' },
  {
    name: 'username',
    label: 'Пользователь',
    field: (row: AexWalletRow) => row.username ? `@${row.username}` : row.first_name ?? `ID ${row.user_id}`,
    align: 'left',
    style: 'width: 24%',
  },
  {
    name: 'available',
    label: 'Доступно',
    field: (row: AexWalletRow) => Number(row.balance_available),
    align: 'right',
    sortable: true,
    style: 'width: 17%',
  },
  {
    name: 'reserved',
    label: 'Зарезервировано',
    field: (row: AexWalletRow) => Number(row.balance_reserved),
    align: 'right',
    sortable: true,
    style: 'width: 17%',
  },
  {
    name: 'total',
    label: 'Итого',
    field: (row: AexWalletRow) => Number(row.balance_available) + Number(row.balance_reserved),
    align: 'right',
    sortable: true,
    style: 'width: 17%',
  },
  {
    name: 'createdAt',
    label: 'Обновлено',
    field: 'createdAt',
    align: 'left',
    sortable: true,
    format: (value: string) => formatAdminDateTime(value),
    style: 'width: 17%',
  },
];

const mobileConfig = {
  title: (row: AexWalletRow) => row.username ? `@${row.username}` : row.first_name ?? `ID ${row.user_id}`,
  subtitle: (row: AexWalletRow) => formatAdminDateTime(row.createdAt),
  badge: (row: AexWalletRow) => ({
    label: formatAmount(Number(row.balance_available) + Number(row.balance_reserved)),
    color: 'primary',
  }),
  fields: [
    { name: 'available', label: 'Доступно' },
    { name: 'reserved', label: 'Зарезервировано' },
    { name: 'total', label: 'Итого' },
    { name: 'createdAt', label: 'Обновлено' },
  ],
};

async function fetchWallets() {
  const limit = pagination.value.rowsPerPage;
  const offset = (pagination.value.page - 1) * limit;
  loading.value = true;
  try {
    const params: Record<string, unknown> = { limit, offset };
    if (search.value) {
      params.search = search.value;
    }
    const res = await api.get<{
      items: AexWalletRow[];
      total: number;
      limit: number;
      offset: number;
    }>('/api/admin/aex/wallets', { params });
    const payload = Array.isArray(res.data)
      ? { items: res.data, total: res.data.length, limit, offset }
      : res.data;
    wallets.value = Array.isArray(payload.items) ? payload.items.map(normalizeWallet) : [];
    pagination.value = {
      ...pagination.value,
      rowsNumber: payload.total,
      rowsPerPage: payload.limit,
      page: Math.floor(payload.offset / payload.limit) + 1,
    };
    hasMore.value = payload.offset + wallets.value.length < payload.total;
  } catch {
    wallets.value = [];
    pagination.value = { ...pagination.value, rowsNumber: 0 };
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchWallets);
watch(search, async () => {
  pagination.value = { ...pagination.value, page: 1 };
  await fetchWallets();
});

async function handleTableRequest(payload: { pagination: { page: number; rowsPerPage: number } }) {
  pagination.value = { ...pagination.value, ...payload.pagination };
  await fetchWallets();
}

function handlePaginationUpdate(value: Record<string, unknown>) {
  pagination.value = { ...pagination.value, ...value };
}

async function handleLoadMore({ done }: { done: () => void }) {
  if (loadingMore.value || !hasMore.value) {
    done();
    return;
  }
  loadingMore.value = true;
  try {
    const params: Record<string, unknown> = {
      limit: pagination.value.rowsPerPage,
      offset: wallets.value.length,
    };
    if (search.value) {
      params.search = search.value;
    }
    const res = await api.get<{
      items: AexWalletRow[];
      total: number;
      limit: number;
      offset: number;
    }>('/api/admin/aex/wallets', { params });
    const payload = Array.isArray(res.data)
      ? { items: res.data, total: res.data.length, limit: pagination.value.rowsPerPage, offset: wallets.value.length }
      : res.data;
    wallets.value = [...wallets.value, ...payload.items.map(normalizeWallet)];
    pagination.value = { ...pagination.value, rowsNumber: payload.total };
    hasMore.value = payload.offset + payload.items.length < payload.total;
  } finally {
    loadingMore.value = false;
    done();
  }
}

function formatAmount(value: number) {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizeWallet(row: Record<string, unknown>): AexWalletRow {
  return {
    id: Number(row.id),
    user_id: Number(row.user_id ?? row.userId),
    username: (row.username as string | null | undefined) ?? null,
    first_name: (row.first_name as string | null | undefined) ?? (row.firstName as string | null | undefined) ?? null,
    balance_available: String(row.balance_available ?? row.available ?? 0),
    balance_reserved: String(row.balance_reserved ?? row.reserved ?? 0),
    createdAt: String(row.createdAt ?? row.updatedAt ?? ''),
  };
}
</script>
