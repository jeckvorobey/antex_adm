<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5">Курсы и надбавка</div>
      <q-space />
      <q-btn color="secondary" icon="refresh" label="Обновить курсы" :loading="refreshing" @click="refreshRates" />
    </div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1">Надбавка (allowance)</div>
        <div class="row items-center q-gutter-sm q-mt-sm">
          <q-input v-model.number="allowanceValue" type="number" step="0.001" outlined dense style="max-width: 150px" />
          <q-btn color="primary" label="Сохранить" :loading="savingAllowance" @click="saveAllowance" />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

const $q = useQuasar();
const allowanceValue = ref(0.02);
const refreshing = ref(false);
const savingAllowance = ref(false);

onMounted(async () => {
  const res = await api.get('/api/admin/allowance');
  allowanceValue.value = res.data.value;
});

async function refreshRates() {
  refreshing.value = true;
  try {
    await api.post('/api/admin/rates/refresh');
    $q.notify({ type: 'positive', message: 'Курсы обновлены' });
  } finally {
    refreshing.value = false;
  }
}

async function saveAllowance() {
  savingAllowance.value = true;
  try {
    await api.put('/api/admin/allowance', { value: allowanceValue.value });
    $q.notify({ type: 'positive', message: 'Надбавка сохранена' });
  } finally {
    savingAllowance.value = false;
  }
}
</script>
