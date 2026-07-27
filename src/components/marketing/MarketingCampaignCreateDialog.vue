<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card data-testid="campaign-create-dialog" class="campaign-create-dialog">
      <q-card-section class="q-pb-none">
        <q-toolbar data-testid="campaign-dialog-toolbar" class="q-pa-none no-wrap">
          <q-toolbar-title class="text-h6">Новая компания</q-toolbar-title>
          <q-btn
            flat
            round
            dense
            icon="close"
            aria-label="Закрыть"
            @click="emit('update:modelValue', false)"
          >
            <q-tooltip>Закрыть</q-tooltip>
          </q-btn>
        </q-toolbar>
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit="submit">
          <div class="text-subtitle1">Данные компании</div>

          <div data-testid="campaign-data-fields" class="row q-col-gutter-md q-mx-none">
            <MarketingCampaignCodeField
              :model-value="displayCode"
              :loading="generatingCode"
              :disabled="loading"
              :error-message="codeError"
              class="col-12"
              @regenerate="regenerateCode"
            />
            <q-input
              v-model.trim="form.name"
              name="name"
              label="Название компании *"
              outlined
              dense
              lazy-rules
              hide-bottom-space
              maxlength="255"
              class="col-12 col-sm-6"
              :rules="nameRules"
            />
            <MarketingPlatformSelect
              v-model="form.provider"
              label="Рекламная платформа *"
              outlined
              dense
              lazy-rules
              hide-bottom-space
              class="col-12 col-sm-6"
              :rules="requiredPlatformRules"
            />
            <q-input
              v-model.trim="form.externalId"
              label="ID компании на платформе"
              outlined
              dense
              maxlength="255"
              lazy-rules
              hide-bottom-space
              class="col-12 col-sm-6"
              :rules="externalIdRules"
            />
            <q-input
              v-model.trim="form.objective"
              label="Цель компании"
              outlined
              dense
              maxlength="255"
              lazy-rules
              hide-bottom-space
              class="col-12 col-sm-6"
              :rules="objectiveRules"
            />
          </div>

          <q-separator />
          <div class="text-subtitle1">Бюджет и период</div>

          <div data-testid="campaign-budget-fields" class="row q-col-gutter-md q-mx-none">
            <q-select
              v-model="form.status"
              label="Статус"
              outlined
              dense
              emit-value
              map-options
              :options="statusOptions"
              class="col-12 col-sm-6 col-md-4"
            />
            <q-input
              v-model.number="form.budget"
              type="number"
              min="0"
              step="0.01"
              label="Бюджет"
              outlined
              dense
              lazy-rules
              hide-bottom-space
              class="col-12 col-sm-6 col-md-4"
              :rules="budgetRules"
            />
            <MarketingCurrencySelect
              v-model="form.currency"
              label="Валюта *"
              outlined
              dense
              lazy-rules
              hide-bottom-space
              class="col-12 col-sm-6 col-md-4"
              :rules="requiredCurrencyRules"
            />
            <AdminDateInput
              v-model="form.startsAt"
              label="Дата начала"
              lazy-rules
              hide-bottom-space
              class="col-12 col-sm-6"
              :rules="startDateRules"
            />
            <AdminDateInput
              v-model="form.endsAt"
              label="Дата окончания"
              lazy-rules
              hide-bottom-space
              reactive-rules
              class="col-12 col-sm-6"
              :rules="endDateRules"
            />
          </div>

          <q-separator />
          <q-input
            v-model.trim="form.notes"
            type="textarea"
            rows="3"
            label="Заметки"
            outlined
            dense
            hint="Внутренняя информация для команды"
          />

          <div class="row justify-end q-gutter-sm">
            <q-btn
              flat
              label="Отмена"
              :disable="loading"
              @click="emit('update:modelValue', false)"
            />
            <q-btn
              data-testid="submit-campaign"
              type="submit"
              color="primary"
              icon="add_link"
              label="Создать компанию и ссылку"
              unelevated
              no-caps
              :loading="loading"
              :disable="!previewCode || !previewToken || generatingCode"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { isAxiosError } from 'axios';
import { useQuasar } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import MarketingCampaignCodeField from '@/components/marketing/MarketingCampaignCodeField.vue';
import MarketingCurrencySelect from '@/components/marketing/MarketingCurrencySelect.vue';
import MarketingPlatformSelect from '@/components/marketing/MarketingPlatformSelect.vue';
import AdminDateInput from '@/components/ui/AdminDateInput.vue';
import { MARKETING_CAMPAIGN_STATUS_OPTIONS } from '@/constants/marketing';
import { marketingApi } from '@/services/marketing';
import type { CampaignCreatePayload, MarketingCampaign } from '@/types/marketing';
import {
  dateOnOrAfter,
  maxTextLength,
  optionalDate,
  optionalNonNegative,
  requiredValue,
} from '@/utils/validation';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [campaign: MarketingCampaign];
}>();
const $q = useQuasar();
const loading = ref(false);
const generatingCode = ref(false);
const codeError = ref('');
const previewCode = ref('');
const previewToken = ref('');
const form = reactive({
  name: '',
  provider: 'telegram_ads' as string | null,
  externalId: '',
  objective: '',
  status: 'active' as const,
  budget: undefined as number | undefined,
  currency: 'USDT' as string | null,
  startsAt: '',
  endsAt: '',
  notes: '',
});
const statusOptions = MARKETING_CAMPAIGN_STATUS_OPTIONS.filter(
  (option) => option.value !== 'archived',
);
const displayCode = computed(() => previewCode.value);
const nameRules = [
  requiredValue('Укажите название компании'),
  maxTextLength(255, 'Не более 255 символов'),
];
const requiredPlatformRules = [requiredValue('Выберите платформу')];
const requiredCurrencyRules = [requiredValue('Выберите валюту')];
const externalIdRules = [maxTextLength(255, 'Не более 255 символов')];
const objectiveRules = [maxTextLength(255, 'Не более 255 символов')];
const budgetRules = [optionalNonNegative('Бюджет не может быть отрицательным')];
const startDateRules = [optionalDate('Введите корректную дату')];
const endDateRules = computed(() => [
  optionalDate('Введите корректную дату'),
  dateOnOrAfter(form.startsAt, 'Дата окончания раньше даты начала'),
]);

/** Запрашивает новый серверный preview-код для текущей формы. */
async function regenerateCode(): Promise<void> {
  if (generatingCode.value) return;
  generatingCode.value = true;
  codeError.value = '';
  try {
    const preview = await marketingApi.generateCampaignCode();
    previewCode.value = preview.code;
    previewToken.value = preview.token;
  } catch {
    codeError.value = 'Не удалось получить уникальный код';
    $q.notify({ type: 'negative', message: codeError.value });
  } finally {
    generatingCode.value = false;
  }
}

/** Преобразует machine-readable ошибку backend в понятное администратору сообщение. */
function campaignCreateErrorMessage(error: unknown): string {
  if (isAxiosError<{ code?: string }>(error)) {
    const messages: Record<string, string> = {
      MARKETING_CODE_ALREADY_EXISTS: 'Код уже используется. Сгенерируйте новый.',
      INVALID_MARKETING_CODE_PREVIEW: 'Срок действия кода истёк. Сгенерируйте новый.',
      UNKNOWN_MARKETING_REFERENCE: 'Проверьте рекламную платформу и валюту.',
      TELEGRAM_BOT_USERNAME_REQUIRED: 'На сервере не настроено имя Telegram-бота.',
    };
    const code = error.response?.data?.code;
    if (code && messages[code]) return messages[code];
  }
  return 'Не удалось создать компанию. Проверьте заполненные данные.';
}

/** Создаёт компанию с актуальным preview-token и уведомляет страницу списка о результате. */
async function submit(): Promise<void> {
  if (!previewCode.value || !previewToken.value || !form.provider || !form.currency) {
    $q.notify({ type: 'negative', message: 'Дождитесь кода и заполните обязательные поля.' });
    return;
  }

  loading.value = true;
  const payload = Object.fromEntries(
    Object.entries({ ...form, codeToken: previewToken.value }).filter(
      ([, value]) => value !== '' && value !== undefined,
    ),
  ) as unknown as CampaignCreatePayload;
  try {
    const campaign = await marketingApi.createCampaign(payload);
    emit('created', campaign);
    emit('update:modelValue', false);
    $q.notify({ type: 'positive', message: 'Рекламная компания создана' });
  } catch (error) {
    $q.notify({ type: 'negative', message: campaignCreateErrorMessage(error) });
  } finally {
    loading.value = false;
  }
}

/** Сбрасывает одноразовый preview и поля, чтобы повторное открытие создавало новую компанию. */
function resetCreateState(): void {
  Object.assign(form, {
    name: '',
    provider: 'telegram_ads',
    externalId: '',
    objective: '',
    status: 'active',
    budget: undefined,
    currency: 'USDT',
    startsAt: '',
    endsAt: '',
    notes: '',
  });
  codeError.value = '';
  previewCode.value = '';
  previewToken.value = '';
}

/** Сбрасывает форму и получает новый preview-код при каждом открытии диалога. */
watch(
  () => props.modelValue,
  (opened) => {
    if (!opened) return;
    resetCreateState();
    void regenerateCode();
  },
  { immediate: true },
);
</script>

<style scoped>
.campaign-create-dialog {
  width: 90vw;
  max-width: 90vw;
}

@media (min-width: 1024px) {
  .campaign-create-dialog {
    width: 60vw;
  }
}
</style>
