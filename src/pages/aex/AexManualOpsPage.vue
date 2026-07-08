<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Ручные операции AEX</div>

    <q-card>
      <q-card-section>
        <div class="text-subtitle1">Начисление / списание AEX</div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Ручное начисление или списание AEX пользователю с указанием причины
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <UserSelect
                v-model="form.userId"
                v-model:selected-user="selectedUser"
                label="Пользователь"
                placeholder="ID, username, имя, телефон"
                :rules="[(val) => !!val || 'Обязательное поле']"
              />
            </div>
          </div>

          <div class="column q-gutter-xs">
            <div class="text-caption text-grey-7">Тип операции</div>
            <q-btn-toggle
              v-model="form.operationType"
              no-caps
              unelevated
              spread
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              :options="[
                { label: 'Начисление', value: 'credit', icon: 'add_circle' },
                { label: 'Списание', value: 'debit', icon: 'remove_circle' },
              ]"
            />
          </div>

          <q-input
            v-model.number="form.amount"
            :label="form.operationType === 'credit' ? 'Сумма начисления (AEX)' : 'Сумма списания (AEX)'"
            type="number"
            min="0.01"
            step="0.01"
            dense
            outlined
            :rules="[
              (val) => !!val || 'Обязательное поле',
              (val) => val > 0 || 'Сумма должна быть больше 0',
            ]"
            style="max-width: 300px"
          />

          <q-input
            v-model="form.description"
            label="Описание"
            dense
            outlined
            type="textarea"
            rows="3"
            :rules="[(val) => !!val?.trim() || 'Укажите описание операции']"
          />

          <div>
            <q-btn
              type="submit"
              :color="form.operationType === 'credit' ? 'positive' : 'negative'"
              :label="form.operationType === 'credit' ? 'Начислить AEX' : 'Списать AEX'"
              :icon="form.operationType === 'credit' ? 'add_circle' : 'remove_circle'"
              :loading="submitting"
              :disable="!selectedUser"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Диалог подтверждения -->
    <q-dialog v-model="confirmDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">
            {{ form.operationType === 'credit' ? 'Подтверждение начисления' : 'Подтверждение списания' }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-gutter-sm">
            <div>
              <span class="text-grey-7">Пользователь:</span>
              <span class="text-weight-medium q-ml-sm">
                {{ selectedUser ? formatSelectedUser(selectedUser) : '—' }}
                (ID: {{ form.userId }})
              </span>
            </div>
            <div>
              <span class="text-grey-7">Операция:</span>
              <span class="text-weight-medium q-ml-sm">
                {{ form.operationType === 'credit' ? 'Начисление' : 'Списание' }}
              </span>
            </div>
            <div>
              <span class="text-grey-7">Сумма:</span>
              <span
                class="text-weight-medium q-ml-sm"
                :class="form.operationType === 'credit' ? 'text-positive' : 'text-negative'"
              >
                {{ form.operationType === 'credit' ? '+' : '-' }}{{ formatAmount(form.amount) }} AEX
              </span>
            </div>
            <div>
              <span class="text-grey-7">Описание:</span>
              <span class="text-weight-medium q-ml-sm">{{ form.description }}</span>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="grey-7" @click="confirmDialog = false" />
          <q-btn
            flat
            label="Подтвердить"
            :color="form.operationType === 'credit' ? 'positive' : 'negative'"
            :loading="submitting"
            @click="executeOperation"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

import { api } from '@boot/axios';
import UserSelect from '@components/admin/UserSelect.vue';
import type { AdminUserOption } from '@/types/admin-user';

const $q = useQuasar();

const form = ref({
  userId: null as number | null,
  operationType: 'credit' as 'credit' | 'debit',
  amount: 0,
  description: '',
});

const submitting = ref(false);
const confirmDialog = ref(false);
const selectedUser = ref<AdminUserOption | null>(null);

function onSubmit() {
  if (!form.value.userId || form.value.amount <= 0 || !form.value.description.trim()) return;
  if (!selectedUser.value) return;
  confirmDialog.value = true;
}

async function executeOperation() {
  submitting.value = true;
  try {
    const endpoint =
      form.value.operationType === 'credit'
        ? '/api/admin/aex/credit'
        : '/api/admin/aex/debit';

    await api.post(endpoint, {
      user_id: form.value.userId,
      amount: form.value.amount,
      description: form.value.description.trim(),
    });
    confirmDialog.value = false;
    form.value = { userId: null, operationType: 'credit', amount: 0, description: '' };
    selectedUser.value = null;
    $q.notify({
      type: 'positive',
      message: 'Операция выполнена успешно',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Не удалось выполнить операцию',
    });
  } finally {
    submitting.value = false;
  }
}

function formatAmount(value: number) {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSelectedUser(user: AdminUserOption): string {
  const firstName = user.first_name ?? user.firstName ?? '';
  const lastName = user.last_name ?? user.lastName ?? '';
  const name = user.fullName ?? user.name ?? [firstName, lastName].filter(Boolean).join(' ');
  if (user.username && name) {
    return `${name} (@${user.username})`;
  }
  if (user.username) {
    return `@${user.username}`;
  }
  return name || `ID ${user.id}`;
}
</script>
