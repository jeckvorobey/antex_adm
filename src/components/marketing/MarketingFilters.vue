<template>
  <q-card flat bordered>
    <q-card-section>
      <q-btn-toggle
        v-model="period"
        :options="periodOptions"
        color="grey-3"
        text-color="grey-8"
        toggle-color="primary"
        toggle-text-color="white"
        unelevated
        @update:model-value="applyPeriod"
      />
      <div class="row q-col-gutter-md items-center q-mt-sm">
        <AdminDateInput
          v-show="period === 'interval'"
          v-model="local.dateFrom"
          label="С даты"
          class="col-12 col-sm-6 col-md-3"
        />
        <AdminDateInput
          v-show="period === 'interval'"
          v-model="local.dateTo"
          label="По дату"
          class="col-12 col-sm-6 col-md-3"
        />
        <q-select
          v-model="local.campaignId"
          :options="campaignOptions"
          label="Компания"
          outlined
          dense
          clearable
          emit-value
          map-options
          class="col-12 col-sm-6 col-md-3"
        />
        <MarketingCurrencySelect
          v-model="local.currency"
          label="Валюта расходов"
          outlined
          dense
          clearable
          class="col-12 col-sm-6 col-md-2"
        />
        <div class="col-12 col-md-1 self-center">
          <q-btn
            color="primary"
            icon="filter_alt"
            label="Применить"
            class="full-width"
            @click="$emit('apply', { ...local })"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

import AdminDateInput from '@/components/ui/AdminDateInput.vue';
import MarketingCurrencySelect from '@/components/marketing/MarketingCurrencySelect.vue';
import { dateRangeForPeriod, type MarketingPeriod } from '@/utils/marketingDashboard';

const props = defineProps<{
  modelValue: {
    dateFrom: string;
    dateTo: string;
    campaignId: number | null;
    currency: string | null;
  };
  campaignOptions: Array<{ label: string; value: number }>;
}>();
const emit = defineEmits<{ apply: [filters: typeof props.modelValue] }>();
const local = reactive({ ...props.modelValue });
const period = ref<MarketingPeriod>('month');
const periodOptions = [
  { label: 'Квартал', value: 'quarter' },
  { label: 'Месяц', value: 'month' },
  { label: 'Неделя', value: 'week' },
  { label: 'Интервал', value: 'interval' },
];

function applyPeriod(value: MarketingPeriod) {
  if (value === 'interval') return;
  Object.assign(local, dateRangeForPeriod(value));
  emit('apply', { ...local });
}
watch(
  () => props.modelValue,
  (value) => Object.assign(local, value),
  { deep: true },
);
</script>
