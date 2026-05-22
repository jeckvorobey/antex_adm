<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Пользователи</div>
    <q-table
      :rows="users"
      :columns="columns"
      row-key="id"
      :loading="loading"
      table-style="table-layout: fixed; width: 100%"
      flat
      bordered
    >
      <template #body-cell-role="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-xs">
            <span>{{ getRoleTitle(props.row) }}</span>
            <q-icon name="edit" size="16px" color="grey-6" />
          </div>
          <q-popup-edit
            v-slot="scope"
            :model-value="props.row.role"
            buttons
            label-set="Сохранить"
            label-cancel="Отмена"
            :disable="isRoleSaving(props.row.id)"
            @save="(value) => updateRole(props.row, Number(value))"
          >
            <q-select
              v-model="scope.value"
              :options="getRoleOptions(props.row)"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              dense
              outlined
              autofocus
              :loading="isRoleSaving(props.row.id)"
              :disable="isRoleSaving(props.row.id)"
            />
          </q-popup-edit>
        </q-td>
      </template>

      <template #body-cell-createdAt="props">
        <q-td :props="props">
          {{ formatAdminDateTime(props.row.createdAt) }}
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { api } from '@boot/axios';
import type { QTableColumn } from 'quasar';
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';

import { getRoleOptionsForUser } from '@pages/users/role-options';
import { formatAdminDateTime } from '@utils/date';

type UserRow = {
  id: number;
  username: string | null;
  first_name: string | null;
  role: number;
  role_name?: string;
  createdAt: string;
};

const $q = useQuasar();

const roleTitles: Record<number, string> = {
  2: 'Менеджер',
  1: 'Администратор',
  9: 'Пользователь',
};

const users = ref<UserRow[]>([]);
const loading = ref(false);
const savingRoleIds = ref<number[]>([]);

const columns: QTableColumn<UserRow>[] = [
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left', style: 'width: 8%' },
  { name: 'username', label: 'Username', field: 'username', align: 'left', style: 'width: 24%' },
  { name: 'first_name', label: 'Имя', field: 'first_name', align: 'left', style: 'width: 18%' },
  {
    name: 'role',
    label: 'Роль',
    field: (row: UserRow) => getRoleTitle(row),
    align: 'left',
    style: 'width: 20%',
  },
  {
    name: 'createdAt',
    label: 'Регистрация',
    field: 'createdAt',
    align: 'left',
    style: 'width: 20%',
  },
];

onMounted(async () => {
  loading.value = true;
  try {
    const res = await api.get<UserRow[]>('/api/admin/users');
    users.value = res.data;
  } catch {
    users.value = [];
  } finally {
    loading.value = false;
  }
});

function getRoleTitle(row: UserRow) {
  return row.role_name ?? roleTitles[row.role] ?? `Роль ${row.role}`;
}

function hasAssignedManager() {
  return users.value.some((row) => row.role === 2)
}

function getRoleOptions(row: UserRow) {
  return getRoleOptionsForUser({
    editedUserRole: row.role,
    hasAssignedManager: hasAssignedManager(),
  })
}

function isRoleSaving(userId: number) {
  return savingRoleIds.value.includes(userId)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'detail' in error.response.data &&
    typeof error.response.data.detail === 'string'
  ) {
    return error.response.data.detail;
  }
  return fallback;
}

async function updateRole(row: UserRow, role: number) {
  if (isRoleSaving(row.id)) {
    return
  }

  savingRoleIds.value = [...savingRoleIds.value, row.id]
  try {
    const res = await api.patch<UserRow>(`/api/admin/users/${row.id}`, { role });
    const index = users.value.findIndex((item) => item.id === row.id);
    if (index >= 0) {
      users.value[index] = res.data;
    }
    $q.notify({ type: 'positive', message: 'Роль пользователя сохранена' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'Не удалось сохранить роль пользователя'),
    });
  } finally {
    savingRoleIds.value = savingRoleIds.value.filter((id) => id !== row.id)
  }
}
</script>
