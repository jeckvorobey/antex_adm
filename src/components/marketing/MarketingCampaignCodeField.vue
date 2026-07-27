<template>
  <div data-testid="campaign-code-field" class="row items-center col-12">
    <q-input
      name="code"
      :model-value="modelValue"
      label="Код компании"
      outlined
      dense
      readonly
      :loading="loading"
      :error="Boolean(errorMessage)"
      :error-message="errorMessage"
      input-class="text-weight-bold campaign-code-input"
      class="col-12 col-md-6"
    >
      <template #append>
        <q-btn
          data-testid="regenerate-code"
          type="button"
          round
          flat
          dense
          color="primary"
          icon="autorenew"
          :loading="loading"
          :disable="disabled"
          aria-label="Сгенерировать новый рекламный код"
          @click="emit('regenerate')"
        >
          <q-tooltip>Сгенерировать новый код</q-tooltip>
        </q-btn>
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  loading: boolean;
  disabled: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  regenerate: [];
}>();
</script>

<style scoped>
:deep(.campaign-code-input) {
  font-family: monospace;
  letter-spacing: 0.08em;
}
</style>
