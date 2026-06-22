<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md q-gutter-sm">
      <div class="text-h5">Администраторы</div>
      <q-btn
        data-test="open-create-admin"
        color="primary"
        label="Добавить"
        icon="person_add"
        @click="openCreateDialog"
      />
    </div>

    <AppResponsiveTable
      :rows="admins"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :mobile="mobileConfig"
      flat
      bordered
    >
      <template #body-cell-actions="props">
        <q-td :props="props">
          <div class="row q-gutter-sm">
            <q-btn
              :data-test="`change-password-${props.row.id}`"
              flat
              dense
              color="primary"
              label="Сменить пароль"
              @click="openPasswordDialog(props.row)"
            />
            <q-btn
              :data-test="`delete-admin-${props.row.id}`"
              flat
              dense
              color="negative"
              label="Удалить"
              @click="openDeleteDialog(props.row)"
            />
          </div>
        </q-td>
      </template>

      <template #mobile-actions="{ row }">
        <div class="column q-gutter-sm">
          <q-btn
            :data-test="`change-password-${row.id}`"
            flat
            dense
            color="primary"
            label="Сменить пароль"
            @click="openPasswordDialog(row as AdminRow)"
          />
          <q-btn
            :data-test="`delete-admin-${row.id}`"
            flat
            dense
            color="negative"
            label="Удалить"
            @click="openDeleteDialog(row as AdminRow)"
          />
        </div>
      </template>
    </AppResponsiveTable>

    <q-dialog v-model="createDialog">
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">Новый администратор</div>
        </q-card-section>
        <q-card-section>
          <q-form class="column q-gutter-md" @submit.prevent="submitCreateAdmin">
            <q-input
              v-model.trim="createForm.username"
              data-test="create-admin-username"
              outlined
              label="Логин"
              :rules="[(v) => !!v || 'Обязательное поле']"
            />
            <q-input
              v-model.trim="createForm.email"
              data-test="create-admin-email"
              outlined
              label="Email"
              type="email"
              :rules="[(v) => !!v || 'Обязательное поле']"
            />
            <q-input
              v-model="createForm.password"
              data-test="create-admin-password"
              outlined
              label="Пароль"
              type="password"
              :rules="[(v) => (v?.length ?? 0) >= 8 || 'Минимум 8 символов']"
            />
            <q-card-actions align="right">
              <q-btn flat label="Отмена" @click="createDialog = false" />
              <q-btn
                data-test="submit-create-admin"
                type="submit"
                color="primary"
                label="Сохранить"
                :loading="submittingCreate"
                :disable="submittingCreate"
              />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="passwordDialog">
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">Сменить пароль</div>
        </q-card-section>
        <q-card-section class="column q-gutter-md">
          <div class="text-body2 text-grey-8">
            {{ passwordTarget?.username }}
          </div>
          <q-input
            v-model="passwordForm.password"
            data-test="change-password-input"
            outlined
            label="Новый пароль"
            type="password"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" @click="passwordDialog = false" />
          <q-btn
            data-test="submit-change-password"
            color="primary"
            label="Сохранить"
            :loading="submittingPassword"
            @click="submitPasswordChange"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteDialog">
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">Удалить администратора</div>
        </q-card-section>
        <q-card-section>
          Вы уверены, что хотите удалить {{ deleteTarget?.username }}?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" @click="deleteDialog = false" />
          <q-btn
            data-test="confirm-delete-admin"
            color="negative"
            label="Удалить"
            :loading="submittingDelete"
            @click="submitDeleteAdmin"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { api } from '@boot/axios';
import AppResponsiveTable from '@components/ui/AppResponsiveTable.vue';

import type { QTableColumn } from 'quasar';
import { useQuasar } from 'quasar';
import { onMounted, reactive, ref } from 'vue';

type AdminRow = {
  id: number;
  username: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
};

const $q = useQuasar();

const admins = ref<AdminRow[]>([]);
const loading = ref(false);

const createDialog = ref(false);
const submittingCreate = ref(false);
const createForm = reactive({
  username: '',
  email: '',
  password: '',
});

const passwordDialog = ref(false);
const submittingPassword = ref(false);
const passwordTarget = ref<AdminRow | null>(null);
const passwordForm = reactive({ password: '' });

const deleteDialog = ref(false);
const submittingDelete = ref(false);
const deleteTarget = ref<AdminRow | null>(null);

const columns: QTableColumn<AdminRow>[] = [
  { name: 'username', label: 'Имя', field: 'username', align: 'left' },
  { name: 'email', label: 'Email', field: (row) => row.email ?? '—', align: 'left' },
  {
    name: 'actions',
    label: 'Действия',
    field: () => 'actions',
    align: 'left',
  },
];

const mobileConfig = {
  title: (row: AdminRow) => row.username,
  subtitle: (row: AdminRow) => row.email ?? '—',
  fields: [
    { name: 'username', label: 'Имя' },
    { name: 'email', label: 'Email', field: (row: AdminRow) => row.email ?? '—' },
  ],
};

onMounted(async () => {
  await loadAdmins();
});

async function loadAdmins() {
  loading.value = true;
  try {
    const response = await api.get<AdminRow[]>('/api/admin/list');
    admins.value = response.data;
  } catch {
    admins.value = [];
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  createForm.username = '';
  createForm.email = '';
  createForm.password = '';
  createDialog.value = true;
}

async function submitCreateAdmin() {
  if (submittingCreate.value) {
    return;
  }

  submittingCreate.value = true;
  try {
    const response = await api.post<AdminRow>('/api/admin/add', {
      username: createForm.username,
      email: createForm.email,
      password: createForm.password,
    });
    admins.value = [...admins.value, response.data];
    createDialog.value = false;
    $q.notify({ type: 'positive', message: 'Администратор создан' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось создать администратора' });
  } finally {
    submittingCreate.value = false;
  }
}

function openPasswordDialog(admin: AdminRow) {
  passwordTarget.value = admin;
  passwordForm.password = '';
  passwordDialog.value = true;
}

async function submitPasswordChange() {
  if (!passwordTarget.value) {
    return;
  }

  submittingPassword.value = true;
  try {
    await api.put('/api/admin/password', {
      admin_id: passwordTarget.value.id,
      password: passwordForm.password,
    });
    passwordDialog.value = false;
    $q.notify({ type: 'positive', message: 'Пароль администратора обновлён' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось обновить пароль' });
  } finally {
    submittingPassword.value = false;
  }
}

function openDeleteDialog(admin: AdminRow) {
  deleteTarget.value = admin;
  deleteDialog.value = true;
}

async function submitDeleteAdmin() {
  if (!deleteTarget.value) {
    return;
  }

  submittingDelete.value = true;
  try {
    await api.delete(`/api/admin/delete/${deleteTarget.value.id}`);
    admins.value = admins.value.filter((admin) => admin.id !== deleteTarget.value?.id);
    deleteDialog.value = false;
    $q.notify({ type: 'positive', message: 'Администратор удалён' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось удалить администратора' });
  } finally {
    submittingDelete.value = false;
  }
}
</script>
