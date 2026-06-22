<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Заявки сайта</div>
    <AppResponsiveTable
      :rows="siteLeads"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :mobile="mobileConfig"
      table-style="table-layout: fixed; width: 100%"
      flat
      bordered
      wrap-cells
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

const siteLeads = ref<SiteLeadRow[]>([]);
const loading = ref(false);

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
  loading.value = true;
  try {
    const response = await api.get<SiteLeadRow[]>('/api/admin/site-leads');
    siteLeads.value = response.data;
  } catch {
    siteLeads.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
