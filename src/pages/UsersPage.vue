<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Пользователи</div>
    <q-table :rows="users" :columns="columns" row-key="id" :loading="loading" flat bordered />
  </q-page>
</template>

<script setup lang="ts">
import { api } from '@boot/axios';
import { onMounted, ref } from 'vue';

type UserRow = {
  id: number;
  username: string | null;
  first_name: string | null;
  role: number;
  role_name?: string;
  createdAt: string;
};

const roleTitles: Record<number, string> = {
  2: 'Менеджер',
  3: 'Администратор',
  8: 'Оператор',
  9: 'Пользователь',
};

const users = ref<UserRow[]>([]);
const loading = ref(false);

const columns = [
  { name: 'id', label: 'ID', field: 'id', sortable: true },
  { name: 'username', label: 'Username', field: 'username' },
  { name: 'first_name', label: 'Имя', field: 'first_name' },
  {
    name: 'role',
    label: 'Роль',
    field: (row: UserRow) => row.role_name ?? roleTitles[row.role] ?? `Роль ${row.role}`,
  },
  { name: 'createdAt', label: 'Регистрация', field: 'createdAt' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/admin/users');
    users.value = res.data;
  } catch {
    users.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
