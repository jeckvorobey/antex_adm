<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Банки</div>
    <q-table :rows="banks" :columns="columns" row-key="id" :loading="loading" flat bordered />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from 'src/boot/axios';

const banks = ref([]);
const loading = ref(false);

const columns = [
  { name: 'id', label: '#', field: 'id' },
  { name: 'code', label: 'Код', field: 'code' },
  { name: 'name', label: 'Название', field: 'name' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/admin/banks');
    banks.value = res.data;
  } catch {
    banks.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
