<template><div ref="element" style="min-height: 300px" /></template>

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{ options: ApexOptions; series: ApexAxisChartSeries }>();
const element = ref<HTMLElement | null>(null);
let chart: {
  render: () => Promise<void>;
  updateOptions: (options: ApexOptions) => Promise<void>;
  updateSeries: (series: ApexAxisChartSeries) => Promise<void>;
  destroy: () => void;
} | null = null;

onMounted(async () => {
  if (!element.value) return;
  const ApexCharts = (await import('apexcharts')).default;
  chart = new ApexCharts(element.value, { ...props.options, series: props.series });
  await chart.render();
});
watch(
  () => props.options,
  (value) => void chart?.updateOptions(value),
  { deep: true },
);
watch(
  () => props.series,
  (value) => void chart?.updateSeries(value),
  { deep: true },
);
onBeforeUnmount(() => chart?.destroy());
</script>
