<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Пользователи</div>
    <q-table :rows="users" :columns="columns" row-key="id" :loading="loading" flat bordered />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from 'src/boot/axios';

const users = ref([]);
const loading = ref(false);

const columns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true },
  { name: 'username', label: 'Username', field: 'username' },
  { name: 'first_name', label: 'Имя', field: 'first_name' },
  { name: 'role', label: 'Роль', field: 'role' },
  { name: 'createdAt', label: 'Регистрация', field: 'createdAt' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/admin/users');
    users.value = res.data;
  } finally {
    loading.value = false;
  }
});
</script>
