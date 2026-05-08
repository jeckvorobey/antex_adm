<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Настройки</div>

    <q-card>
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">Статус бота</div>
        <q-toggle
          v-model="botEnabled"
          :label="botEnabled ? 'Бот включён' : 'Бот выключен'"
          color="green"
          @update:model-value="updateBotEnabled"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { api } from '@boot/axios';

const $q = useQuasar();
const botEnabled = ref(true);

onMounted(async () => {
  try {
    const res = await api.get('/api/admin/config');
    botEnabled.value = res.data.enabled;
  } catch {
    botEnabled.value = false;
  }
});

/**
 * Сохраняет статус бота через единый endpoint конфигурации.
 */
async function updateBotEnabled(enabled: boolean) {
  const previousValue = !enabled;
  try {
    const res = await api.patch('/api/admin/config', { enabled });
    botEnabled.value = res.data.enabled;
    $q.notify({ type: 'positive', message: botEnabled.value ? 'Бот включён' : 'Бот выключен' });
  } catch {
    botEnabled.value = previousValue;
    $q.notify({ type: 'negative', message: 'Ошибка' });
  }
}
</script>
