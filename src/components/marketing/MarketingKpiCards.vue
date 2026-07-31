<template>
  <div class="column q-gutter-lg">
    <section v-for="section in sections" :key="section.key">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ section.label }}</div>
      <div class="row q-col-gutter-md">
        <div v-for="item in section.items" :key="item.key" class="col-6 col-sm-6 col-lg-3">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-h5 q-mt-xs">{{ format(item.value, item.percent) }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { MarketingDashboardSummary } from '@/types/marketing';

const props = defineProps<{ summary: MarketingDashboardSummary }>();

interface KpiItem {
  key: string;
  label: string;
  value: number | null | undefined;
  percent?: boolean;
}

const sections = computed<Array<{ key: string; label: string; items: KpiItem[] }>>(() => [
  {
    key: 'traffic',
    label: 'Трафик',
    items: [
      { key: 'newUsers', label: 'Новые пользователи', value: props.summary.newUsers },
      {
        key: 'returningUsers',
        label: 'Вернувшиеся пользователи',
        value: props.summary.returningUsers,
      },
      { key: 'touches', label: 'Переходы всего', value: props.summary.touches },
      {
        key: 'uniqueTouchedUsers',
        label: 'Уникальные переходы',
        value: props.summary.uniqueTouchedUsers,
      },
    ],
  },
  {
    key: 'conversion',
    label: 'Конверсии',
    items: [
      { key: 'applications', label: 'Заявки', value: props.summary.applications },
      {
        key: 'uniqueApplicants',
        label: 'Уникальные заявители',
        value: props.summary.uniqueApplicants,
      },
      {
        key: 'completedApplications',
        label: 'Завершённые заявки',
        value: props.summary.completedApplications,
      },
      {
        key: 'attributionToApplicationRate',
        label: 'Уникальный переход → заявка',
        value: props.summary.attributionToApplicationRate,
        percent: true,
      },
      {
        key: 'applicationCompletionRate',
        label: 'Заявка → завершение',
        value: props.summary.applicationCompletionRate,
        percent: true,
      },
    ],
  },
  {
    key: 'cost',
    label: 'Стоимость',
    items: [
      {
        key: 'costPerApplication',
        label: 'Стоимость заявки',
        value: props.summary.costPerApplication,
      },
      {
        key: 'costPerNewUser',
        label: 'Стоимость нового пользователя',
        value: props.summary.costPerNewUser,
      },
      {
        key: 'costPerCompletedApplication',
        label: 'Стоимость завершённой заявки',
        value: props.summary.costPerCompletedApplication,
      },
    ],
  },
]);

function format(value: number | null | undefined, percent = false) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}${percent ? '%' : ''}`;
}
</script>
