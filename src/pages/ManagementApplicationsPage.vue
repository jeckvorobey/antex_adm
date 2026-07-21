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
      row-key="orderId"
      :loading="loading"
      :mobile="mobileConfig"
      :pagination="pagination"
      flat
      bordered
      @request="onRequest"
    >
      <template #body-cell-touchAt="props">
        <q-td :props="props">{{ formatAdminDateTime(props.row.touchAt) }}</q-td>
      </template>
      <template #body-cell-applicationAt="props">
        <q-td :props="props">{{ formatAdminDateTime(props.row.applicationAt) }}</q-td>
      </template>
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
import type { MarketingApplicationAttribution } from '@/types/marketing';
import { formatAdminDateTime } from '@/utils/date';

const today = new Date();
const dateTo = today.toISOString().slice(0, 10);
today.setDate(today.getDate() - 29);
const filters = reactive({
  dateFrom: today.toISOString().slice(0, 10),
  dateTo,
  provider: null as string | null,
  status: null as string | null,
});
const rows = ref<MarketingApplicationAttribution[]>([]);
const loading = ref(false);
const pagination = ref({ page: 1, rowsPerPage: 20, rowsNumber: 0 });
const statusOptions = MARKETING_CAMPAIGN_STATUS_OPTIONS;
const columns: QTableColumn<MarketingApplicationAttribution>[] = [
  { name: 'campaignName', label: 'Компания', field: 'campaignName', align: 'left' },
  {
    name: 'userState',
    label: 'Пользователь',
    field: 'userState',
    align: 'left',
    format: (value) => (value === 'new' ? 'Новый' : 'Вернувшийся'),
  },
  {
    name: 'attributionType',
    label: 'Тип атрибуции',
    field: 'attributionType',
    align: 'left',
  },
  {
    name: 'touchAt',
    label: 'Касание',
    field: 'touchAt',
    align: 'left',
    format: (value) => formatAdminDateTime(String(value)),
  },
  {
    name: 'applicationAt',
    label: 'Заявка',
    field: 'applicationAt',
    align: 'left',
    format: (value) => formatAdminDateTime(String(value)),
  },
  {
    name: 'hoursToApplication',
    label: 'Часов до заявки',
    field: 'hoursToApplication',
    align: 'right',
  },
  {
    name: 'completed',
    label: 'Завершена',
    field: 'completed',
    align: 'left',
    format: (value) => (value ? 'Да' : 'Нет'),
  },
  {
    name: 'status',
    label: 'Статус заявки',
    field: 'status',
    align: 'left',
    format: (value) => formatOrderStatus(Number(value)),
  },
];
const mobileConfig = {
  title: (row: MarketingApplicationAttribution) => row.campaignName,
  subtitle: (row: MarketingApplicationAttribution) => `Заявка ${row.publicNumber}`,
  badge: (row: MarketingApplicationAttribution) => ({
    label: formatOrderStatus(row.status),
    color: row.status === 3 ? 'positive' : row.status === 4 ? 'negative' : 'grey',
  }),
  fields: columns.slice(1).map((column) => ({ name: column.name, label: column.label })),
};
const orderStatusLabels: Record<number, string> = {
  1: 'Создана',
  2: 'В обработке',
  3: 'Завершена',
  4: 'Отменена',
};
const formatOrderStatus = (value: number) => orderStatusLabels[value] ?? `Статус ${value}`;
async function fetchRows() {
  loading.value = true;
  try {
    const data = await marketingApi.listApplicationAttributions({
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
