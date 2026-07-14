<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Заявки по компаниям</div>
    <q-card flat bordered class="q-mb-md"
      ><q-card-section class="row q-col-gutter-md">
        <AdminDateInput
          v-model="filters.dateFrom"
          label="С даты"
          class="col-12 col-sm-6 col-md-3"
        />
        <AdminDateInput v-model="filters.dateTo" label="По дату" class="col-12 col-sm-6 col-md-3" />
        <MarketingPlatformSelect
          v-model="filters.provider"
          clearable
          label="Платформа"
          outlined
          dense
          class="col-12 col-sm-6 col-md-2"
        />
        <q-select
          v-model="filters.status"
          :options="statusOptions"
          clearable
          emit-value
          map-options
          label="Статус"
          outlined
          dense
          class="col-12 col-sm-6 col-md-2"
        />
        <div class="col-12 col-md-2">
          <q-btn
            color="primary"
            label="Применить"
            icon="filter_alt"
            class="full-width"
            @click="reload"
          />
        </div> </q-card-section
    ></q-card>
    <AppResponsiveTable
      :rows="rows"
      :columns="columns"
      row-key="campaignId"
      :loading="loading"
      :mobile="mobileConfig"
      :pagination="pagination"
      flat
      bordered
      @request="onRequest"
    >
      <template #body-cell-attributionToApplicationRate="props"
        ><q-td :props="props">{{ percent(props.row.attributionToApplicationRate) }}</q-td></template
      >
      <template #body-cell-applicationCompletionRate="props"
        ><q-td :props="props">{{ percent(props.row.applicationCompletionRate) }}</q-td></template
      >
      <template #body-cell-costPerApplication="props"
        ><q-td :props="props">{{
          props.row.costPerApplication == null ? '—' : props.row.costPerApplication
        }}</q-td></template
      >
    </AppResponsiveTable>
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { onMounted, reactive, ref } from 'vue';

import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AdminDateInput from '@/components/ui/AdminDateInput.vue';
import MarketingPlatformSelect from '@/components/marketing/MarketingPlatformSelect.vue';
import { MARKETING_CAMPAIGN_STATUS_OPTIONS } from '@/constants/marketing';
import { marketingApi } from '@/services/marketing';
import type { MarketingApplicationRow } from '@/types/marketing';

const today = new Date();
const dateTo = today.toISOString().slice(0, 10);
today.setDate(today.getDate() - 29);
const filters = reactive({
  dateFrom: today.toISOString().slice(0, 10),
  dateTo,
  provider: null as string | null,
  status: null as string | null,
});
const rows = ref<MarketingApplicationRow[]>([]);
const loading = ref(false);
const pagination = ref({ page: 1, rowsPerPage: 20, rowsNumber: 0 });
const statusOptions = MARKETING_CAMPAIGN_STATUS_OPTIONS;
const percent = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(2)}%` : '—';
const columns: QTableColumn<MarketingApplicationRow>[] = [
  { name: 'campaignName', label: 'Компания', field: 'campaignName', align: 'left' },
  { name: 'attributedUsers', label: 'Пользователи', field: 'attributedUsers', align: 'right' },
  { name: 'applications', label: 'Заявки', field: 'applications', align: 'right' },
  { name: 'uniqueApplicants', label: 'Уникальные', field: 'uniqueApplicants', align: 'right' },
  {
    name: 'completedApplications',
    label: 'Завершённые',
    field: 'completedApplications',
    align: 'right',
  },
  {
    name: 'attributionToApplicationRate',
    label: 'Конверсия в заявку',
    field: 'attributionToApplicationRate',
    align: 'right',
    format: percent,
  },
  {
    name: 'applicationCompletionRate',
    label: 'Завершение',
    field: 'applicationCompletionRate',
    align: 'right',
    format: percent,
  },
  {
    name: 'costPerApplication',
    label: 'Стоимость заявки',
    field: 'costPerApplication',
    align: 'right',
    format: (value) => (value == null ? '—' : String(value)),
  },
];
const mobileConfig = {
  title: (row: MarketingApplicationRow) => row.campaignName,
  subtitle: (row: MarketingApplicationRow) => row.code,
  badge: (row: MarketingApplicationRow) => ({
    label: row.status,
    color: row.status === 'active' ? 'positive' : 'grey',
  }),
  fields: columns.slice(1).map((column) => ({ name: column.name, label: column.label })),
};
async function fetchRows() {
  loading.value = true;
  try {
    const data = await marketingApi.listApplications({
      ...filters,
      limit: pagination.value.rowsPerPage,
      offset: (pagination.value.page - 1) * pagination.value.rowsPerPage,
    });
    rows.value = data.items;
    pagination.value.rowsNumber = data.total;
  } finally {
    loading.value = false;
  }
}
function reload() {
  pagination.value.page = 1;
  void fetchRows();
}
function onRequest({ pagination: value }: { pagination: typeof pagination.value }) {
  pagination.value = value;
  void fetchRows();
}
onMounted(fetchRows);
</script>
