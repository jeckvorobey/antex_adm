<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Настройки ставок AEX</div>

    <!-- Глобальная ставка -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1">Глобальная ставка AEX</div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Базовая ставка начисления AEX для всех пользователей
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row items-center q-gutter-md">
          <q-input
            v-model.number="globalRate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            dense
            outlined
            label="Ставка (%)"
            style="max-width: 200px"
            :disable="savingGlobal"
          />
          <q-btn
            color="primary"
            label="Сохранить"
            :loading="savingGlobal"
            @click="saveGlobalRate"
          />
          <span v-if="globalRateUpdatedAt" class="text-caption text-grey-7">
            Обновлено: {{ formatAdminDateTime(globalRateUpdatedAt) }}
          </span>
        </div>
      </q-card-section>
    </q-card>

    <!-- Персональные ставки -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center">
          <div class="text-subtitle1">Персональные ставки</div>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Добавить"
            dense
            @click="openPersonalDialog"
          />
        </div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Индивидуальные ставки для конкретных пригласивших
        </div>
      </q-card-section>

      <AppResponsiveTable
        :rows="personalRates"
        :columns="personalColumns"
        row-key="id"
        :loading="loadingPersonal"
        :loading-more="loadingMorePersonal"
        :has-more="hasMorePersonal"
        :pagination="personalPagination"
        :mobile="personalMobileConfig"
        table-style="table-layout: fixed; width: 100%"
        flat
        dense
        @request="handlePersonalTableRequest"
        @update:pagination="handlePersonalPaginationUpdate"
        @load-more="handlePersonalLoadMore"
      >
        <template #body-cell-rate="props">
          <q-td :props="props">
            <div class="row items-center justify-end q-gutter-xs">
              <span>{{ formatRate(props.row.rate) }}</span>
              <q-icon name="edit" size="16px" color="grey-6" />
            </div>
            <q-popup-edit
              v-slot="scope"
              :model-value="props.row.rate"
              buttons
              label-set="Сохранить"
              label-cancel="Отмена"
              @save="(value) => updatePersonalRate(props.row, Number(value))"
            >
              <q-input
                v-model.number="scope.value"
                type="number"
                min="0"
                max="100"
                step="0.01"
                dense
                autofocus
                outlined
              />
            </q-popup-edit>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              size="sm"
              @click="deletePersonalRate(props.row)"
            />
          </q-td>
        </template>

        <template #mobile-field-rate="{ row }">
          <div class="row items-center justify-end q-gutter-xs">
            <span>{{ formatRate(row.rate) }}</span>
            <q-icon name="edit" size="16px" color="grey-6" />
          </div>
          <q-popup-edit
            v-slot="scope"
            :model-value="row.rate"
            buttons
            label-set="Сохранить"
            label-cancel="Отмена"
            @save="(value) => updatePersonalRate(row, Number(value))"
          >
            <q-input
              v-model.number="scope.value"
              type="number"
              min="0"
              max="100"
              step="0.01"
              dense
              autofocus
              outlined
            />
          </q-popup-edit>
        </template>
      </AppResponsiveTable>
    </q-card>

    <!-- Партнёрские ставки -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center">
          <div class="text-subtitle1">Партнёрские ставки</div>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Добавить"
            dense
            @click="openPartnerDialog"
          />
        </div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Ставки для партнёров программы
        </div>
      </q-card-section>

      <AppResponsiveTable
        :rows="partnerRates"
        :columns="partnerColumns"
        row-key="id"
        :loading="loadingPartner"
        :loading-more="loadingMorePartner"
        :has-more="hasMorePartner"
        :pagination="partnerPagination"
        :mobile="partnerMobileConfig"
        table-style="table-layout: fixed; width: 100%"
        flat
        dense
        @request="handlePartnerTableRequest"
        @update:pagination="handlePartnerPaginationUpdate"
        @load-more="handlePartnerLoadMore"
      >
        <template #body-cell-rate="props">
          <q-td :props="props">
            <div class="row items-center justify-end q-gutter-xs">
              <span>{{ formatRate(props.row.rate) }}</span>
              <q-icon name="edit" size="16px" color="grey-6" />
            </div>
            <q-popup-edit
              v-slot="scope"
              :model-value="props.row.rate"
              buttons
              label-set="Сохранить"
              label-cancel="Отмена"
              @save="(value) => updatePartnerRate(props.row, Number(value))"
            >
              <q-input
                v-model.number="scope.value"
                type="number"
                min="0"
                max="100"
                step="0.01"
                dense
                autofocus
                outlined
              />
            </q-popup-edit>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              size="sm"
              @click="deletePartnerRate(props.row)"
            />
          </q-td>
        </template>

        <template #mobile-field-rate="{ row }">
          <div class="row items-center justify-end q-gutter-xs">
            <span>{{ formatRate(row.rate) }}</span>
            <q-icon name="edit" size="16px" color="grey-6" />
          </div>
          <q-popup-edit
            v-slot="scope"
            :model-value="row.rate"
            buttons
            label-set="Сохранить"
            label-cancel="Отмена"
            @save="(value) => updatePartnerRate(row, Number(value))"
          >
            <q-input
              v-model.number="scope.value"
              type="number"
              min="0"
              max="100"
              step="0.01"
              dense
              autofocus
              outlined
            />
          </q-popup-edit>
        </template>
      </AppResponsiveTable>
    </q-card>

    <!-- Диалог добавления персональной ставки -->
    <q-dialog v-model="personalDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Персональная ставка</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="personalForm.userId"
            label="ID пользователя"
            type="number"
            dense
            outlined
            class="q-mb-md"
            :rules="[(val) => !!val || 'Обязательное поле']"
          />
          <q-input
            v-model.number="personalForm.rate"
            label="Ставка (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            dense
            outlined
            :rules="[(val) => val > 0 || 'Ставка должна быть больше 0']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="grey-7" @click="personalDialog = false" />
          <q-btn
            flat
            label="Сохранить"
            color="primary"
            :loading="savingPersonal"
            @click="createPersonalRate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Диалог добавления партнёрской ставки -->
    <q-dialog v-model="partnerDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Партнёрская ставка</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="partnerForm.userId"
            label="ID пользователя"
            type="number"
            dense
            outlined
            class="q-mb-md"
            :rules="[(val) => !!val || 'Обязательное поле']"
          />
          <q-input
            v-model.number="partnerForm.rate"
            label="Ставка (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            dense
            outlined
            :rules="[(val) => val > 0 || 'Ставка должна быть больше 0']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="grey-7" @click="partnerDialog = false" />
          <q-btn
            flat
            label="Сохранить"
            color="primary"
            :loading="savingPartner"
            @click="createPartnerRate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

import { api } from '@boot/axios';
import AppResponsiveTable from '@components/ui/AppResponsiveTable.vue';
import { formatAdminDateTime } from '@utils/date';

interface AexRateRow {
  id: number;
  userId: number;
  username?: string | null;
  firstName?: string | null;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

const $q = useQuasar();

// --- Глобальная ставка ---
const globalRate = ref<number>(0.2);
const globalRateUpdatedAt = ref<string | null>(null);
const savingGlobal = ref(false);

// --- Персональные ставки ---
const personalRates = ref<AexRateRow[]>([]);
const loadingPersonal = ref(false);
const loadingMorePersonal = ref(false);
const hasMorePersonal = ref(false);
const personalDialog = ref(false);
const savingPersonal = ref(false);
const personalPagination = ref({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});
const personalForm = ref<{ userId: number | null; rate: number }>({
  userId: null,
  rate: 0,
});

const personalColumns: QTableColumn<AexRateRow>[] = [
  { name: 'userId', label: 'ID', field: 'userId', align: 'left', sortable: true, style: 'width: 12%' },
  {
    name: 'username',
    label: 'Пользователь',
    field: (row: AexRateRow) => row.username ? `@${row.username}` : row.firstName ?? `ID ${row.userId}`,
    align: 'left',
    style: 'width: 30%',
  },
  {
    name: 'rate',
    label: 'Ставка',
    field: 'rate',
    align: 'right',
    sortable: true,
    format: (value: number) => formatRate(value),
    style: 'width: 20%',
  },
  {
    name: 'updatedAt',
    label: 'Обновлено',
    field: 'updatedAt',
    align: 'left',
    sortable: true,
    format: (value: string) => formatAdminDateTime(value),
    style: 'width: 28%',
  },
  { name: 'actions', label: '', field: 'id', align: 'right', style: 'width: 10%' },
];

const personalMobileConfig = {
  title: (row: AexRateRow) => row.username ? `@${row.username}` : row.firstName ?? `ID ${row.userId}`,
  subtitle: (row: AexRateRow) => formatAdminDateTime(row.updatedAt),
  badge: (row: AexRateRow) => ({ label: formatRate(row.rate), color: 'primary' }),
  fields: [
    { name: 'rate', label: 'Ставка' },
    { name: 'updatedAt', label: 'Обновлено' },
  ],
};

// --- Партнёрские ставки ---
const partnerRates = ref<AexRateRow[]>([]);
const loadingPartner = ref(false);
const loadingMorePartner = ref(false);
const hasMorePartner = ref(false);
const partnerDialog = ref(false);
const savingPartner = ref(false);
const partnerPagination = ref({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});
const partnerForm = ref<{ userId: number | null; rate: number }>({
  userId: null,
  rate: 0,
});

const partnerColumns: QTableColumn<AexRateRow>[] = [
  { name: 'userId', label: 'ID', field: 'userId', align: 'left', sortable: true, style: 'width: 12%' },
  {
    name: 'username',
    label: 'Партнёр',
    field: (row: AexRateRow) => row.username ? `@${row.username}` : row.firstName ?? `ID ${row.userId}`,
    align: 'left',
    style: 'width: 30%',
  },
  {
    name: 'rate',
    label: 'Ставка',
    field: 'rate',
    align: 'right',
    sortable: true,
    format: (value: number) => formatRate(value),
    style: 'width: 20%',
  },
  {
    name: 'updatedAt',
    label: 'Обновлено',
    field: 'updatedAt',
    align: 'left',
    sortable: true,
    format: (value: string) => formatAdminDateTime(value),
    style: 'width: 28%',
  },
  { name: 'actions', label: '', field: 'id', align: 'right', style: 'width: 10%' },
];

const partnerMobileConfig = {
  title: (row: AexRateRow) => row.username ? `@${row.username}` : row.firstName ?? `ID ${row.userId}`,
  subtitle: (row: AexRateRow) => formatAdminDateTime(row.updatedAt),
  badge: (row: AexRateRow) => ({ label: formatRate(row.rate), color: 'secondary' }),
  fields: [
    { name: 'rate', label: 'Ставка' },
    { name: 'updatedAt', label: 'Обновлено' },
  ],
};

// --- Lifecycle ---
onMounted(async () => {
  await Promise.all([loadGlobalRate(), loadPersonalRates(), loadPartnerRates()]);
});

// --- API: Глобальная ставка ---
async function loadGlobalRate() {
  try {
    const res = await api.get<{ rate: number; updatedAt: string }>('/api/admin/aex/rate');
    globalRate.value = res.data.rate;
    globalRateUpdatedAt.value = res.data.updatedAt;
  } catch {
    // fallback to default
  }
}

async function saveGlobalRate() {
  savingGlobal.value = true;
  try {
    const res = await api.put<{ rate: number; updatedAt: string }>('/api/admin/aex/rate', {
      rate: globalRate.value,
    });
    globalRate.value = res.data.rate;
    globalRateUpdatedAt.value = res.data.updatedAt;
    $q.notify({ type: 'positive', message: 'Глобальная ставка сохранена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось сохранить ставку' });
  } finally {
    savingGlobal.value = false;
  }
}

// --- API: Персональные ставки ---
async function loadPersonalRates() {
  const limit = personalPagination.value.rowsPerPage;
  const offset = (personalPagination.value.page - 1) * limit;
  loadingPersonal.value = true;
  try {
    const res = await api.get<{
      items: AexRateRow[];
      total: number;
      limit: number;
      offset: number;
    }>('/api/admin/aex/rates/personal', { params: { limit, offset } });
    const payload = Array.isArray(res.data)
      ? { items: res.data, total: res.data.length, limit, offset }
      : res.data;
    personalRates.value = Array.isArray(payload.items) ? payload.items : [];
    personalPagination.value = {
      ...personalPagination.value,
      rowsNumber: payload.total,
      rowsPerPage: payload.limit,
      page: Math.floor(payload.offset / payload.limit) + 1,
    };
    hasMorePersonal.value = payload.offset + personalRates.value.length < payload.total;
  } catch {
    personalRates.value = [];
    personalPagination.value = { ...personalPagination.value, rowsNumber: 0 };
    hasMorePersonal.value = false;
  } finally {
    loadingPersonal.value = false;
  }
}

function openPersonalDialog() {
  personalForm.value = { userId: null, rate: 0 };
  personalDialog.value = true;
}

async function createPersonalRate() {
  if (!personalForm.value.userId || personalForm.value.rate <= 0) return;
  savingPersonal.value = true;
  try {
    await api.post('/api/admin/aex/rates/personal', {
      userId: personalForm.value.userId,
      rate: personalForm.value.rate,
    });
    personalDialog.value = false;
    await loadPersonalRates();
    $q.notify({ type: 'positive', message: 'Персональная ставка создана' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось создать ставку' });
  } finally {
    savingPersonal.value = false;
  }
}

async function updatePersonalRate(row: AexRateRow, rate: number) {
  try {
    await api.patch(`/api/admin/aex/rates/personal/${row.id}`, { rate });
    await loadPersonalRates();
    $q.notify({ type: 'positive', message: 'Ставка обновлена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось обновить ставку' });
  }
}

async function deletePersonalRate(row: AexRateRow) {
  try {
    await api.delete(`/api/admin/aex/rates/personal/${row.id}`);
    await loadPersonalRates();
    $q.notify({ type: 'positive', message: 'Ставка удалена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось удалить ставку' });
  }
}

// --- API: Партнёрские ставки ---
async function loadPartnerRates() {
  const limit = partnerPagination.value.rowsPerPage;
  const offset = (partnerPagination.value.page - 1) * limit;
  loadingPartner.value = true;
  try {
    const res = await api.get<{
      items: AexRateRow[];
      total: number;
      limit: number;
      offset: number;
    }>('/api/admin/aex/rates/partner', { params: { limit, offset } });
    const payload = Array.isArray(res.data)
      ? { items: res.data, total: res.data.length, limit, offset }
      : res.data;
    partnerRates.value = Array.isArray(payload.items) ? payload.items : [];
    partnerPagination.value = {
      ...partnerPagination.value,
      rowsNumber: payload.total,
      rowsPerPage: payload.limit,
      page: Math.floor(payload.offset / payload.limit) + 1,
    };
    hasMorePartner.value = payload.offset + partnerRates.value.length < payload.total;
  } catch {
    partnerRates.value = [];
    partnerPagination.value = { ...partnerPagination.value, rowsNumber: 0 };
    hasMorePartner.value = false;
  } finally {
    loadingPartner.value = false;
  }
}

async function handlePersonalTableRequest(payload: { pagination: { page: number; rowsPerPage: number } }) {
  personalPagination.value = { ...personalPagination.value, ...payload.pagination };
  await loadPersonalRates();
}

function handlePersonalPaginationUpdate(value: Record<string, unknown>) {
  personalPagination.value = { ...personalPagination.value, ...value };
}

async function handlePersonalLoadMore({ done }: { done: () => void }) {
  if (loadingMorePersonal.value || !hasMorePersonal.value) {
    done();
    return;
  }
  loadingMorePersonal.value = true;
  try {
    const res = await api.get<{
      items: AexRateRow[];
      total: number;
      limit: number;
      offset: number;
    }>('/api/admin/aex/rates/personal', {
      params: {
        limit: personalPagination.value.rowsPerPage,
        offset: personalRates.value.length,
      },
    });
    const payload = Array.isArray(res.data)
      ? { items: res.data, total: res.data.length, limit: personalPagination.value.rowsPerPage, offset: personalRates.value.length }
      : res.data;
    personalRates.value = [...personalRates.value, ...payload.items];
    personalPagination.value = { ...personalPagination.value, rowsNumber: payload.total };
    hasMorePersonal.value = payload.offset + payload.items.length < payload.total;
  } finally {
    loadingMorePersonal.value = false;
    done();
  }
}

async function handlePartnerTableRequest(payload: { pagination: { page: number; rowsPerPage: number } }) {
  partnerPagination.value = { ...partnerPagination.value, ...payload.pagination };
  await loadPartnerRates();
}

function handlePartnerPaginationUpdate(value: Record<string, unknown>) {
  partnerPagination.value = { ...partnerPagination.value, ...value };
}

async function handlePartnerLoadMore({ done }: { done: () => void }) {
  if (loadingMorePartner.value || !hasMorePartner.value) {
    done();
    return;
  }
  loadingMorePartner.value = true;
  try {
    const res = await api.get<{
      items: AexRateRow[];
      total: number;
      limit: number;
      offset: number;
    }>('/api/admin/aex/rates/partner', {
      params: {
        limit: partnerPagination.value.rowsPerPage,
        offset: partnerRates.value.length,
      },
    });
    const payload = Array.isArray(res.data)
      ? { items: res.data, total: res.data.length, limit: partnerPagination.value.rowsPerPage, offset: partnerRates.value.length }
      : res.data;
    partnerRates.value = [...partnerRates.value, ...payload.items];
    partnerPagination.value = { ...partnerPagination.value, rowsNumber: payload.total };
    hasMorePartner.value = payload.offset + payload.items.length < payload.total;
  } finally {
    loadingMorePartner.value = false;
    done();
  }
}

function openPartnerDialog() {
  partnerForm.value = { userId: null, rate: 0 };
  partnerDialog.value = true;
}

async function createPartnerRate() {
  if (!partnerForm.value.userId || partnerForm.value.rate <= 0) return;
  savingPartner.value = true;
  try {
    await api.post('/api/admin/aex/rates/partner', {
      userId: partnerForm.value.userId,
      rate: partnerForm.value.rate,
    });
    partnerDialog.value = false;
    await loadPartnerRates();
    $q.notify({ type: 'positive', message: 'Партнёрская ставка создана' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось создать ставку' });
  } finally {
    savingPartner.value = false;
  }
}

async function updatePartnerRate(row: AexRateRow, rate: number) {
  try {
    await api.patch(`/api/admin/aex/rates/partner/${row.id}`, { rate });
    await loadPartnerRates();
    $q.notify({ type: 'positive', message: 'Ставка обновлена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось обновить ставку' });
  }
}

async function deletePartnerRate(row: AexRateRow) {
  try {
    await api.delete(`/api/admin/aex/rates/partner/${row.id}`);
    await loadPartnerRates();
    $q.notify({ type: 'positive', message: 'Ставка удалена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось удалить ставку' });
  }
}

// --- Утилиты ---
function formatRate(value: number) {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}%`;
}
</script>
