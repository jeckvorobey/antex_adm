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
          <q-input
            v-model.number="form.userId"
            label="ID пользователя"
            type="number"
            dense
            outlined
            :rules="[(val) => !!val || 'Обязательное поле']"
            style="max-width: 300px"
          />

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
            v-model="form.reason"
            label="Причина"
            dense
            outlined
            type="textarea"
            rows="3"
            :rules="[(val) => !!val?.trim() || 'Укажите причину операции']"
          />

          <div>
            <q-btn
              type="submit"
              :color="form.operationType === 'credit' ? 'positive' : 'negative'"
              :label="form.operationType === 'credit' ? 'Начислить AEX' : 'Списать AEX'"
              :icon="form.operationType === 'credit' ? 'add_circle' : 'remove_circle'"
              :loading="submitting"
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
              <span class="text-grey-7">Пользователь ID:</span>
              <span class="text-weight-medium q-ml-sm">{{ form.userId }}</span>
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
              <span class="text-grey-7">Причина:</span>
              <span class="text-weight-medium q-ml-sm">{{ form.reason }}</span>
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

const $q = useQuasar();

const form = ref({
  userId: null as number | null,
  operationType: 'credit' as 'credit' | 'debit',
  amount: 0,
  reason: '',
});

const submitting = ref(false);
const confirmDialog = ref(false);

function onSubmit() {
  if (!form.value.userId || form.value.amount <= 0 || !form.value.reason.trim()) return;
  confirmDialog.value = true;
}

async function executeOperation() {
  submitting.value = true;
  try {
    await api.post('/api/admin/aex/operations/manual', {
      userId: form.value.userId,
      type: form.value.operationType === 'credit' ? 'manual_credit' : 'manual_debit',
      amount: form.value.amount,
      reason: form.value.reason.trim(),
    });
    confirmDialog.value = false;
    form.value = { userId: null, operationType: 'credit', amount: 0, reason: '' };
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
