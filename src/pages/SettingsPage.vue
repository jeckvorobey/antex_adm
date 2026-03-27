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
          @update:model-value="toggleBot"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

const $q = useQuasar();
const botEnabled = ref(true);

onMounted(async () => {
  const res = await api.get('/api/admin/config');
  botEnabled.value = res.data.enabled;
});

async function toggleBot() {
  try {
    const res = await api.post('/api/admin/config/toggle');
    botEnabled.value = res.data.enabled;
    $q.notify({ type: 'positive', message: botEnabled.value ? 'Бот включён' : 'Бот выключен' });
  } catch {
    $q.notify({ type: 'negative', message: 'Ошибка' });
  }
}
</script>
