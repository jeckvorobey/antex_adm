<template>
  <q-input
    :model-value="displayValue"
    :label="label"
    dense
    outlined
    clearable
    mask="##.##.####"
    v-bind="$attrs"
    @update:model-value="updateFromInput"
    @clear="clear"
  >
    <template #append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date
            :model-value="displayValue"
            mask="DD.MM.YYYY"
            @update:model-value="updateFromCalendar"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import { serializeAdminDateForApi } from '@/utils/date';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
  }>(),
  { modelValue: '' },
);
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

/** Преобразует API-день в европейское представление для поля Quasar. */
function formatDisplayValue(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : '';
}

const displayValue = ref('');

// Внешнее ISO-значение обновляет поле после выбора в календаре или смены данных формы.
watch(
  () => props.modelValue,
  (value) => {
    displayValue.value = formatDisplayValue(value);
  },
  { immediate: true },
);

/** Нормализует введённое вручную значение и сохраняет API-совместимый день. */
function updateFromInput(value: string | number | null): void {
  const inputValue = String(value ?? '');
  displayValue.value = inputValue;

  const apiValue = serializeAdminDateForApi(inputValue);
  // Не сбрасываем частичный ввод: QInput эмитит его на каждом нажатии клавиши.
  if (apiValue || inputValue === '') {
    emit('update:modelValue', apiValue);
  }
}

/** Принимает выбранный Quasar-календарём день в маске `DD.MM.YYYY`. */
function updateFromCalendar(value: string): void {
  displayValue.value = value;
  emit('update:modelValue', serializeAdminDateForApi(value));
}

/** Очищает значение фильтра или формы. */
function clear(): void {
  displayValue.value = '';
  emit('update:modelValue', '');
}
</script>
