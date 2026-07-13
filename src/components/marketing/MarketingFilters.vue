<template>
  <q-card flat bordered>
    <q-card-section class="row q-col-gutter-md items-end">
      <q-input
        v-model="local.dateFrom"
        type="date"
        stack-label
        label="С даты"
        outlined
        dense
        class="col-12 col-sm-6 col-md-3"
      />
      <q-input
        v-model="local.dateTo"
        type="date"
        stack-label
        label="По дату"
        outlined
        dense
        class="col-12 col-sm-6 col-md-3"
      />
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
      <q-select
        v-model="local.currency"
        :options="currencyOptions"
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
const currencyOptions = ['USDT', 'RUB', 'THB', 'VND', 'GEL'];
watch(
  () => props.modelValue,
  (value) => Object.assign(local, value),
  { deep: true },
);
</script>
