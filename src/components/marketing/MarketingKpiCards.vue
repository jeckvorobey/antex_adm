<template>
  <div class="row q-col-gutter-md">
    <div v-for="item in items" :key="item.key" class="col-12 col-sm-6 col-lg-3">
      <q-card flat bordered class="full-height">
        <q-card-section>
          <div class="text-caption text-grey-7">{{ item.label }}</div>
          <div class="text-h5 q-mt-xs">{{ format(item.value, item.percent) }}</div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ summary: Record<string, number | null> }>();
const items = computed(() => [
  {
    key: 'attributedUsers',
    label: 'Атрибутированные пользователи',
    value: props.summary.attributedUsers,
  },
  { key: 'applications', label: 'Заявки', value: props.summary.applications },
  { key: 'uniqueApplicants', label: 'Уникальные заявители', value: props.summary.uniqueApplicants },
  {
    key: 'completedApplications',
    label: 'Завершённые заявки',
    value: props.summary.completedApplications,
  },
  {
    key: 'attributionToApplicationRate',
    label: 'Attribution → application',
    value: props.summary.attributionToApplicationRate,
    percent: true,
  },
  {
    key: 'applicationCompletionRate',
    label: 'Завершение заявок',
    value: props.summary.applicationCompletionRate,
    percent: true,
  },
  { key: 'costPerApplication', label: 'Стоимость заявки', value: props.summary.costPerApplication },
  {
    key: 'costPerAttributedUser',
    label: 'Стоимость пользователя',
    value: props.summary.costPerAttributedUser,
  },
]);

function format(value: number | null | undefined, percent = false) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}${percent ? '%' : ''}`;
}
</script>
