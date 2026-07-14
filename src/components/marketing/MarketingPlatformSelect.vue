<template>
  <q-select v-bind="$attrs" :model-value="modelValue" :options="store.platformOptions" emit-value map-options @update:model-value="$emit('update:modelValue', $event)" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { useMarketingReferencesStore } from '@/stores/marketing-references';

defineProps<{ modelValue: string | null }>();
defineEmits<{ 'update:modelValue': [value: string | null] }>();
const store = useMarketingReferencesStore();
onMounted(() => {
  void store.loadPlatforms().catch(() => undefined);
});
</script>
