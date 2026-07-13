<template>
  <q-dialog v-model="opened">
    <q-card style="width: 560px; max-width: 95vw">
      <q-card-section class="text-h6">Дневные метрики — {{ campaign?.name }}</q-card-section>
      <q-card-section>
        <q-form class="q-gutter-md" @submit="save">
          <q-input
            v-model="metricDate"
            type="date"
            stack-label
            label="Дата *"
            outlined
            :rules="[(v) => Boolean(v) || 'Укажите дату']"
          />
          <q-input
            v-model.number="form.impressions"
            type="number"
            min="0"
            label="Показы"
            outlined
            :rules="[nonNegative]"
          />
          <q-input
            v-model.number="form.starts"
            type="number"
            min="0"
            label="Переходы / starts"
            outlined
            :rules="[nonNegative]"
          />
          <q-input
            v-model.number="form.spend"
            type="number"
            min="0"
            step="0.01"
            label="Расход"
            outlined
            :rules="[nonNegative]"
          />
          <q-input
            v-model.number="form.platformCpm"
            type="number"
            min="0"
            step="0.01"
            label="Platform CPM"
            outlined
            :rules="[optionalNonNegative]"
          />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Отмена" @click="opened = false" />
            <q-btn type="submit" color="primary" label="Сохранить" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';

import { marketingApi } from '@/services/marketing';
import type { MarketingCampaign } from '@/types/marketing';

const $q = useQuasar();
const emit = defineEmits<{ saved: [] }>();
const opened = ref(false);
const loading = ref(false);
const campaign = ref<MarketingCampaign | null>(null);
const metricDate = ref(new Date().toISOString().slice(0, 10));
const form = reactive({
  impressions: 0,
  starts: 0,
  spend: 0,
  platformCpm: undefined as number | undefined,
});
const nonNegative = (value: number) => value >= 0 || 'Значение не может быть отрицательным';
const optionalNonNegative = (value?: number) =>
  value === undefined || value >= 0 || 'Значение не может быть отрицательным';

function open(value: MarketingCampaign) {
  campaign.value = value;
  opened.value = true;
}

async function save() {
  if (!campaign.value) return;
  loading.value = true;
  try {
    await marketingApi.upsertDailyMetric(campaign.value.id, metricDate.value, { ...form });
    opened.value = false;
    emit('saved');
    $q.notify({ type: 'positive', message: 'Дневные метрики сохранены' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось сохранить метрики' });
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>
