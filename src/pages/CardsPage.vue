<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5">Карты</div>
      <q-space />
      <q-btn color="primary" icon="add" label="Добавить" @click="showAdd = true" />
    </div>
    <q-table :rows="cards" :columns="columns" row-key="id" :loading="loading" flat bordered>
      <template #body-cell-isActive="props">
        <q-td :props="props">
          <q-badge :color="props.value ? 'green' : 'red'">
            {{ props.value ? 'Активна' : 'Неактивна' }}
          </q-badge>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@boot/axios';

const cards = ref([]);
const loading = ref(false);
const showAdd = ref(false);

const columns = [
  { name: 'id', label: '#', field: 'id' },
  { name: 'bank', label: 'Банк', field: 'bank' },
  { name: 'name', label: 'Название', field: 'name' },
  { name: 'number', label: 'Номер', field: 'number' },
  { name: 'isActive', label: 'Статус', field: 'isActive' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/admin/cards');
    cards.value = res.data;
  } catch {
    cards.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
