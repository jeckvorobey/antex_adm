<template>
  <q-card flat bordered>
    <q-card-section class="row q-col-gutter-md items-end">
      <AdminDateInput v-model="local.dateFrom" label="С даты" class="col-12 col-sm-6 col-md-3" />
      <AdminDateInput v-model="local.dateTo" label="По дату" class="col-12 col-sm-6 col-md-3" />
      <q-select
        v-model="local.campaignId"
        :options="campaignOptions"
        label="Кампания"
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
      <div class="col-12 col-md-1">
        <q-btn
          color="primary"
          icon="filter_alt"
          label="Применить"
          class="full-width"
          @click="$emit('apply', { ...local })"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';

import AdminDateInput from '@/components/ui/AdminDateInput.vue';
import MarketingCurrencySelect from '@/components/marketing/MarketingCurrencySelect.vue';

const props = defineProps<{
  modelValue: {
    dateFrom: string;
    dateTo: string;
    campaignId: number | null;
    currency: string | null;
  };
  campaignOptions: Array<{ label: string; value: number }>;
}>();
defineEmits<{ apply: [filters: typeof props.modelValue] }>();
const local = reactive({ ...props.modelValue });
watch(
  () => props.modelValue,
  (value) => Object.assign(local, value),
  { deep: true },
);
</script>
