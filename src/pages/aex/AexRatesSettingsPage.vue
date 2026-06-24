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
        :mobile="personalMobileConfig"
        table-style="table-layout: fixed; width: 100%"
        flat
        dense
        :pagination="{ rowsPerPage: 10 }"
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
        :mobile="partnerMobileConfig"
        table-style="table-layout: fixed; width: 100%"
        flat
        dense
        :pagination="{ rowsPerPage: 10 }"
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
const personalDialog = ref(false);
const savingPersonal = ref(false);
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
const partnerDialog = ref(false);
const savingPartner = ref(false);
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
  loadingPersonal.value = true;
  try {
    const res = await api.get<AexRateRow[]>('/api/admin/aex/rates/personal');
    personalRates.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    personalRates.value = [];
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
  loadingPartner.value = true;
  try {
    const res = await api.get<AexRateRow[]>('/api/admin/aex/rates/partner');
    partnerRates.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    partnerRates.value = [];
  } finally {
    loadingPartner.value = false;
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
