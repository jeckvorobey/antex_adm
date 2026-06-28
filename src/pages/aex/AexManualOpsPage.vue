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
          <div style="max-width: 400px">
            <q-input
              v-model.number="form.userId"
              label="ID пользователя"
              type="number"
              dense
              outlined
              :rules="[(val) => !!val || 'Обязательное поле']"
              @update:model-value="onUserIdChange"
            />
            <!-- Информация о пользователе -->
            <div v-if="userLookup.loading" class="q-mt-xs">
              <q-spinner-dots size="16px" color="primary" />
              <span class="text-caption text-grey-7 q-ml-xs">Поиск пользователя...</span>
            </div>
            <div
              v-else-if="userLookup.name"
              class="q-mt-xs q-pa-xs bg-green-1 rounded-borders"
            >
              <q-icon name="check_circle" color="positive" size="16px" class="q-mr-xs" />
              <span class="text-caption text-weight-medium">
                {{ userLookup.name }}
                <span v-if="userLookup.username" class="text-grey-7">
                  (@{{ userLookup.username }})
                </span>
              </span>
            </div>
            <div
              v-else-if="userLookup.error"
              class="q-mt-xs q-pa-xs bg-red-1 rounded-borders"
            >
              <q-icon name="error" color="negative" size="16px" class="q-mr-xs" />
              <span class="text-caption text-negative">{{ userLookup.error }}</span>
            </div>
          </div>

          <div class="row q-gutter-sm">
            <q-btn-toggle
              v-model="form.operationType"
              no-caps
              rounded
              unelevated
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
              :disable="!userLookup.name"
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
                {{ userLookup.name }}
                <span v-if="userLookup.username" class="text-grey-7">
                  (@{{ userLookup.username }})
                </span>
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
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';

import { api } from '@boot/axios';

const $q = useQuasar();

const form = ref({
  userId: null as number | null,
  operationType: 'credit' as 'credit' | 'debit',
  amount: 0,
  description: '',
});

const submitting = ref(false);
const confirmDialog = ref(false);

const userLookup = reactive({
  loading: false,
  name: '',
  username: '',
  error: '',
});

let lookupAbortController: AbortController | null = null;
let lookupTimeout: ReturnType<typeof setTimeout> | null = null;

function onUserIdChange() {
  // Сбрасываем предыдущий таймер
  if (lookupTimeout) {
    clearTimeout(lookupTimeout);
  }

  // Сбрасываем состояние поиска при изменении ID
  userLookup.name = '';
  userLookup.username = '';
  userLookup.error = '';

  const userId = form.value.userId;
  if (!userId || userId <= 0) return;

  // Debounce 500ms
  lookupTimeout = setTimeout(() => {
    void lookupUser(userId);
  }, 500);
}

async function lookupUser(userId: number) {
  // Отменяем предыдущий запрос
  if (lookupAbortController) {
    lookupAbortController.abort();
  }
  lookupAbortController = new AbortController();

  userLookup.loading = true;
  userLookup.error = '';
  userLookup.name = '';
  userLookup.username = '';

  try {
    const response = await api.get(`/api/admin/users/${userId}`, {
      signal: lookupAbortController.signal,
    });
    const userData = response.data;
    userLookup.name = userData.name || userData.full_name || 'Без имени';
    userLookup.username = userData.username || '';
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'CanceledError') return;
    if (err instanceof Error && err.name === 'AbortError') return;
    userLookup.error = 'Пользователь не найден';
  } finally {
    userLookup.loading = false;
  }
}

function onSubmit() {
  if (!form.value.userId || form.value.amount <= 0 || !form.value.description.trim()) return;
  if (!userLookup.name) return;
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
    userLookup.name = '';
    userLookup.username = '';
    userLookup.error = '';
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
</script>
