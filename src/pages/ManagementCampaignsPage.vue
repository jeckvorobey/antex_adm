<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5">Компании</div>
        <div class="text-body2 text-grey-7">Создание доступно только в генераторе ссылок</div>
      </div>
      <q-btn
        flat
        color="primary"
        icon="link"
        label="Открыть генератор"
        to="/management/generator"
      />
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section class="row q-col-gutter-md">
        <q-input
          v-model="filters.search"
          debounce="300"
          label="Поиск по названию или коду"
          outlined
          dense
          class="col-12 col-md-5"
        />
        <MarketingPlatformSelect
          v-model="filters.provider"
          label="Платформа"
          outlined
          dense
          clearable
          class="col-12 col-sm-6 col-md-3"
        />
        <q-select
          v-model="filters.status"
          :options="statusOptions"
          label="Статус"
          outlined
          dense
          clearable
          emit-value
          map-options
          class="col-12 col-sm-6 col-md-3"
        />
        <div class="col-12 col-md-1">
          <q-btn color="primary" icon="search" class="full-width" @click="reload" />
        </div>
      </q-card-section>
    </q-card>

    <AppResponsiveTable
      :rows="campaigns"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :mobile="mobileConfig"
      :pagination="pagination"
      :has-more="campaigns.length < pagination.rowsNumber"
      :loading-more="loadingMore"
      flat
      bordered
      @request="onRequest"
      @load-more="loadMore"
    >
      <template #body-cell-actions="props">
        <q-td :props="props">
          <div class="row no-wrap q-gutter-xs">
            <q-btn
              data-testid="campaign-action-copy-desktop"
              flat
              dense
              icon="content_copy"
              aria-label="Копировать ссылку"
              @click="copyLink(props.row)"
            >
              <q-tooltip>Копировать ссылку</q-tooltip>
            </q-btn>
            <q-btn
              data-testid="campaign-action-edit-desktop"
              flat
              dense
              icon="edit"
              aria-label="Изменить"
              @click="openEdit(props.row)"
            >
              <q-tooltip>Изменить</q-tooltip>
            </q-btn>
            <q-btn
              data-testid="campaign-action-metrics-desktop"
              flat
              dense
              icon="bar_chart"
              aria-label="Открыть метрики"
              @click="metricsDialog?.open(props.row)"
            >
              <q-tooltip>Открыть метрики</q-tooltip>
            </q-btn>
            <q-btn
              v-if="props.row.status !== 'archived'"
              data-testid="campaign-action-archive-desktop"
              flat
              dense
              color="negative"
              icon="archive"
              label="Архивировать"
              aria-label="Архивировать кампанию"
              @click="archive(props.row)"
            >
              <q-tooltip>Архивировать кампанию</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
      <template #mobile-actions="{ row }">
        <div data-testid="campaign-mobile-actions" class="row items-center justify-between">
          <span class="text-caption text-grey-7">Действия</span>
          <div class="row q-gutter-xs">
            <q-btn
              data-testid="campaign-action-copy-mobile"
              flat
              round
              dense
              color="primary"
              icon="content_copy"
              aria-label="Копировать ссылку"
              @click="copyLink(row)"
            >
              <q-tooltip>Копировать ссылку</q-tooltip>
            </q-btn>
            <q-btn
              data-testid="campaign-action-metrics-mobile"
              flat
              round
              dense
              color="primary"
              icon="bar_chart"
              aria-label="Открыть метрики"
              @click="metricsDialog?.open(row)"
            >
              <q-tooltip>Открыть метрики</q-tooltip>
            </q-btn>
            <q-btn
              v-if="row.status !== 'archived'"
              data-testid="campaign-action-archive-mobile"
              flat
              round
              dense
              color="negative"
              icon="archive"
              aria-label="Архивировать кампанию"
              @click="archive(row)"
            >
              <q-tooltip>Архивировать кампанию</q-tooltip>
            </q-btn>
          </div>
        </div>
      </template>
    </AppResponsiveTable>

    <DailyMetricsDialog ref="metricsDialog" @saved="reload" />
    <q-dialog v-model="editOpened">
      <q-card style="width: 520px; max-width: 95vw">
        <q-card-section class="text-h6">Изменить компанию</q-card-section>
        <q-card-section
          ><q-form class="q-gutter-md" @submit="saveEdit">
            <q-input v-model.trim="editForm.name" label="Наименование" outlined />
            <q-input v-model.trim="editForm.objective" label="Цель" outlined />
            <q-select
              v-model="editForm.status"
              :options="statusOptions"
              emit-value
              map-options
              label="Статус"
              outlined
            />
            <q-input :model-value="editing?.code" label="Код (неизменяемый)" readonly outlined />
            <q-input
              :model-value="editing?.provider"
              label="Платформа (неизменяемая)"
              readonly
              outlined
            />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Отмена" @click="editOpened = false" /><q-btn
                type="submit"
                color="primary"
                label="Сохранить"
              />
            </div> </q-form
        ></q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { copyToClipboard, type QTableColumn, useQuasar } from 'quasar';
import { onMounted, reactive, ref } from 'vue';

import DailyMetricsDialog from '@/components/marketing/DailyMetricsDialog.vue';
import MarketingPlatformSelect from '@/components/marketing/MarketingPlatformSelect.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import { MARKETING_CAMPAIGN_STATUS_OPTIONS } from '@/constants/marketing';
import { marketingApi } from '@/services/marketing';
import type { MarketingCampaign } from '@/types/marketing';
import { formatAdminDateTime } from '@/utils/date';

const $q = useQuasar();
const campaigns = ref<MarketingCampaign[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const metricsDialog = ref<InstanceType<typeof DailyMetricsDialog> | null>(null);
const filters = reactive({
  search: '',
  provider: null as string | null,
  status: null as string | null,
});
const pagination = ref({ page: 1, rowsPerPage: 20, rowsNumber: 0 });
const statusOptions = MARKETING_CAMPAIGN_STATUS_OPTIONS;
const columns: QTableColumn<MarketingCampaign>[] = [
  { name: 'name', label: 'Компания', field: 'name', align: 'left' },
  { name: 'code', label: 'Код', field: 'code', align: 'left' },
  { name: 'provider', label: 'Платформа', field: 'provider', align: 'left' },
  { name: 'status', label: 'Статус', field: 'status', align: 'left' },
  {
    name: 'campaignType',
    label: 'Тип',
    field: 'campaignType',
    align: 'left',
    format: (value) => (value === 'paid' ? 'Платная' : 'Бесплатная'),
  },
  { name: 'attributedUsers', label: 'Пользователи', field: 'attributedUsers', align: 'right' },
  { name: 'applications', label: 'Заявки', field: 'applications', align: 'right' },
  {
    name: 'budget',
    label: 'Бюджет',
    field: 'budget',
    align: 'right',
    format: (value, row) => (value == null ? '—' : `${value} ${row.currency ?? ''}`),
  },
  {
    name: 'createdAt',
    label: 'Создана',
    field: 'createdAt',
    align: 'left',
    format: (value) => formatAdminDateTime(String(value)),
  },
  { name: 'actions', label: 'Действия', field: 'id', align: 'right' },
];
const mobileConfig = {
  title: (row: MarketingCampaign) => row.name,
  subtitle: (row: MarketingCampaign) => `${row.code} · ${row.provider}`,
  badge: (row: MarketingCampaign) => ({
    label: row.status,
    color: row.status === 'active' ? 'positive' : 'grey',
  }),
  fields: [
    { name: 'attributedUsers', label: 'Пользователи' },
    { name: 'applications', label: 'Заявки' },
    { name: 'campaignType', label: 'Тип' },
    { name: 'budget', label: 'Бюджет' },
    { name: 'createdAt', label: 'Создана' },
  ],
};
const editOpened = ref(false);
const editing = ref<MarketingCampaign | null>(null);
const editForm = reactive({ name: '', objective: '', status: 'active' });

async function fetchCampaigns(append = false) {
  append ? (loadingMore.value = true) : (loading.value = true);
  const offset = append
    ? campaigns.value.length
    : (pagination.value.page - 1) * pagination.value.rowsPerPage;
  try {
    const data = await marketingApi.listCampaigns({
      ...filters,
      limit: pagination.value.rowsPerPage,
      offset,
    });
    campaigns.value = append ? [...campaigns.value, ...data.items] : data.items;
    pagination.value.rowsNumber = data.total;
  } catch {
    if (!append) campaigns.value = [];
    $q.notify({ type: 'negative', message: 'Не удалось загрузить кампании' });
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}
function reload() {
  pagination.value.page = 1;
  void fetchCampaigns();
}
function onRequest({ pagination: value }: { pagination: typeof pagination.value }) {
  pagination.value = value;
  void fetchCampaigns();
}
function loadMore({ done }: { done: () => void }) {
  void fetchCampaigns(true).finally(done);
}
async function copyLink(row: MarketingCampaign) {
  await copyToClipboard(row.link);
  $q.notify({ type: 'positive', message: 'Ссылка скопирована' });
}
async function archive(row: MarketingCampaign) {
  await marketingApi.updateCampaign(row.id, { status: 'archived' });
  reload();
}
function openEdit(row: MarketingCampaign) {
  editing.value = row;
  Object.assign(editForm, { name: row.name, objective: row.objective ?? '', status: row.status });
  editOpened.value = true;
}
async function saveEdit() {
  if (!editing.value) return;
  await marketingApi.updateCampaign(editing.value.id, { ...editForm });
  editOpened.value = false;
  reload();
}
onMounted(fetchCampaigns);
</script>
