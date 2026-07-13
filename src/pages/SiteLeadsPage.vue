<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Заявки сайта</div>
    <AppResponsiveTable
      :rows="siteLeads"
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
      wrap-cells
      @request="handleTableRequest"
      @update:pagination="handlePaginationUpdate"
      @load-more="handleLoadMore"
    />
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { onMounted, ref } from 'vue';

import { api } from '@boot/axios';
import AppResponsiveTable from '@components/ui/AppResponsiveTable.vue';
import { formatAdminDateTime } from '@utils/date';

interface SiteLeadRow {
  id: number;
  messenger: string | null;
  contact: string;
  topic: string | null;
  message: string;
  source: string;
  createdAt: string;
}

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

const siteLeads = ref<SiteLeadRow[]>([]);
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

const columns: QTableColumn<SiteLeadRow>[] = [
  {
    name: 'createdAt',
    label: 'Создана',
    field: 'createdAt',
    align: 'left',
    sortable: true,
    style: 'width: 14%',
    format: (value) => formatAdminDateTime(String(value)),
  },
  { name: 'messenger', label: 'Мессенджер', field: (row) => row.messenger ?? '—', align: 'left', style: 'width: 12%' },
  { name: 'contact', label: 'Контакт', field: 'contact', align: 'left', style: 'width: 15%' },
  { name: 'topic', label: 'Тема', field: (row) => row.topic ?? '—', align: 'left', style: 'width: 15%' },
  { name: 'message', label: 'Сообщение', field: 'message', align: 'left', style: 'width: 30%' },
  { name: 'source', label: 'Источник', field: 'source', align: 'left', style: 'width: 14%' },
];

const mobileConfig = {
  title: (row: SiteLeadRow) => row.contact,
  subtitle: (row: SiteLeadRow) => formatAdminDateTime(row.createdAt),
  fields: [
    { name: 'messenger', label: 'Мессенджер' },
    { name: 'topic', label: 'Тема' },
    { name: 'message', label: 'Сообщение' },
    { name: 'source', label: 'Источник' },
  ],
};

onMounted(async () => {
  await fetchSiteLeads();
});

async function fetchSiteLeads(options?: { append?: boolean; offset?: number; limit?: number }) {
  const append = options?.append ?? false;
  const limit = options?.limit ?? pagination.value.rowsPerPage;
  const offset = options?.offset ?? (pagination.value.page - 1) * limit;

  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
  }

  try {
    const response = await api.get<PaginatedResponse<SiteLeadRow>>('/api/admin/site-leads', {
      params: { limit, offset },
    });
    const payload = Array.isArray(response.data)
      ? { items: response.data, total: response.data.length, limit, offset }
      : response.data;
    const nextRows = payload.items;
    siteLeads.value = append ? [...siteLeads.value, ...nextRows] : nextRows;
    pagination.value = {
      ...pagination.value,
      page: Math.floor(payload.offset / payload.limit) + 1,
      rowsPerPage: payload.limit,
      rowsNumber: payload.total,
    };
    hasMore.value = payload.offset + nextRows.length < payload.total;
  } catch {
    if (!append) {
      siteLeads.value = [];
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
  await fetchSiteLeads();
}

function handlePaginationUpdate(value: Record<string, unknown>) {
  pagination.value = { ...pagination.value, ...value };
}

async function handleLoadMore({ done }: { done: () => void }) {
  await fetchSiteLeads({
    append: true,
    offset: siteLeads.value.length,
    limit: pagination.value.rowsPerPage,
  });
  done();
}
</script>
