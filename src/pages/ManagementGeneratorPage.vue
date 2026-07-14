<template>
  <q-page class="q-pa-md">
    <div data-testid="generator-title" class="text-h5 q-mb-md">Новая рекламная компания</div>

    <q-form @submit="submit">
      <div class="row q-col-gutter-md">
        <div data-testid="campaign-fields-column" class="col-12 col-lg-8">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle1 q-mb-md">Данные компании</div>

              <div class="row q-col-gutter-md">
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
                  class="col-12 col-sm-6"
                />
                <q-input
                  v-model.trim="form.objective"
                  label="Цель компании"
                  outlined
                  dense
                  maxlength="255"
                  class="col-12 col-sm-6"
                />
              </div>

              <q-separator class="q-my-md" />
              <div class="text-subtitle1 q-mb-md">Бюджет и период</div>

              <div class="row q-col-gutter-md">
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
                  class="col-12 col-sm-6"
                />
                <AdminDateInput
                  v-model="form.endsAt"
                  label="Дата окончания"
                  lazy-rules
                  hide-bottom-space
                  class="col-12 col-sm-6"
                  :rules="endDateRules"
                />
              </div>

              <q-separator class="q-my-md" />
              <q-input
                v-model.trim="form.notes"
                type="textarea"
                rows="3"
                label="Заметки"
                outlined
                dense
                hint="Внутренняя информация для команды"
              />
            </q-card-section>
          </q-card>
        </div>

        <div data-testid="campaign-code-column" class="col-12 col-lg-4">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <div class="text-subtitle1">Рекламный код</div>
                <q-badge
                  :color="isCurrentCodePersisted ? 'positive' : 'warning'"
                  :label="isCurrentCodePersisted ? 'Сохранён' : 'Временный'"
                />
              </div>

              <q-input
                name="code"
                :model-value="displayCode"
                label="Код компании"
                outlined
                dense
                readonly
                :loading="generatingCode"
                :error="Boolean(codeError)"
                :error-message="codeError"
                input-class="text-weight-bold generator-code-input"
              >
                <template #append>
                  <q-btn
                    data-testid="regenerate-code"
                    type="button"
                    round
                    flat
                    dense
                    color="primary"
                    icon="autorenew"
                    :loading="generatingCode"
                    :disable="loading"
                    aria-label="Сгенерировать новый рекламный код"
                    @click="regenerateCode"
                  >
                    <q-tooltip>Сгенерировать новый код</q-tooltip>
                  </q-btn>
                </template>
              </q-input>

              <div class="row items-start no-wrap q-mt-sm text-caption text-grey-7">
                <q-icon
                  :name="isCurrentCodePersisted ? 'cloud_done' : 'cloud_off'"
                  size="18px"
                  class="q-mr-xs"
                />
                <span v-if="!isCurrentCodePersisted">
                  Код ещё не сохранён в базе данных. Новый код заменит текущее значение.
                </span>
                <span v-else>Код сохранён вместе с созданной компанией.</span>
              </div>

              <q-separator class="q-my-md" />
              <q-btn
                data-testid="submit-campaign"
                type="submit"
                color="primary"
                icon="add_link"
                label="Создать компанию и ссылку"
                class="full-width"
                unelevated
                no-caps
                :loading="loading"
                :disable="!previewCode || !previewToken || generatingCode || isCurrentCodePersisted"
              />

              <template v-if="created">
                <q-separator class="q-my-md" />
                <div class="row items-center q-mb-sm text-positive">
                  <q-icon name="check_circle" size="20px" class="q-mr-xs" />
                  <span class="text-weight-medium">Компания создана</span>
                </div>
                <q-input :model-value="created.link" label="Готовая ссылка" outlined dense readonly>
                  <template #append>
                    <q-btn
                      data-testid="copy-link"
                      type="button"
                      round
                      flat
                      dense
                      color="primary"
                      icon="content_copy"
                      aria-label="Копировать готовую ссылку"
                      @click="copyLink"
                    >
                      <q-tooltip>Копировать ссылку</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
                <div class="text-caption text-grey-7 q-mt-sm">
                  Параметр: <span class="text-weight-medium">{{ created.marketParameter }}</span>
                </div>
              </template>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { isAxiosError } from 'axios';
import { copyToClipboard, useQuasar } from 'quasar';
import { computed, onMounted, reactive, ref } from 'vue';

import MarketingCurrencySelect from '@/components/marketing/MarketingCurrencySelect.vue';
import MarketingPlatformSelect from '@/components/marketing/MarketingPlatformSelect.vue';
import AdminDateInput from '@/components/ui/AdminDateInput.vue';
import { MARKETING_CAMPAIGN_STATUS_OPTIONS } from '@/constants/marketing';
import { marketingApi } from '@/services/marketing';
import type { CampaignCreatePayload, MarketingCampaign } from '@/types/marketing';

const $q = useQuasar();
const loading = ref(false);
const generatingCode = ref(false);
const codeError = ref('');
const previewCode = ref('');
const previewToken = ref('');
const created = ref<MarketingCampaign | null>(null);
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
const displayCode = computed(() => (previewCode.value ? `market_${previewCode.value}` : ''));
const isCurrentCodePersisted = computed(() =>
  Boolean(created.value && created.value.code === previewCode.value),
);
const nameRules = [
  (value: string) => Boolean(value?.trim()) || 'Укажите название компании',
  (value: string) => value.length <= 255 || 'Не более 255 символов',
];
const requiredPlatformRules = [(value: string | null) => Boolean(value) || 'Выберите платформу'];
const requiredCurrencyRules = [(value: string | null) => Boolean(value) || 'Выберите валюту'];
const budgetRules = [
  (value: number | undefined) =>
    value === undefined || value >= 0 || 'Бюджет не может быть отрицательным',
];
const endDateRules = [
  (value: string) =>
    !value || !form.startsAt || value >= form.startsAt || 'Дата окончания раньше даты начала',
];

/** Запрашивает новый код и атомарно заменяет прежнее значение во временном состоянии формы. */
async function regenerateCode(): Promise<void> {
  if (generatingCode.value) return;
  generatingCode.value = true;
  codeError.value = '';
  try {
    const preview = await marketingApi.generateCampaignCode();
    previewCode.value = preview.code;
    previewToken.value = preview.token;
    created.value = null;
  } catch {
    codeError.value = 'Не удалось получить уникальный код';
    $q.notify({ type: 'negative', message: codeError.value });
  } finally {
    generatingCode.value = false;
  }
}

/** Возвращает локализованное сообщение по machine-readable коду backend. */
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

/** Отправляет валидную форму и текущий preview-код одной операцией создания. */
async function submit(): Promise<void> {
  if (!previewCode.value || !previewToken.value || !form.provider || !form.currency) {
    $q.notify({ type: 'negative', message: 'Дождитесь кода и заполните обязательные поля.' });
    return;
  }

  loading.value = true;
  created.value = null;
  const payload = Object.fromEntries(
    Object.entries({ ...form, codeToken: previewToken.value }).filter(
      ([, value]) => value !== '' && value !== undefined,
    ),
  ) as unknown as CampaignCreatePayload;
  try {
    created.value = await marketingApi.createCampaign(payload);
    $q.notify({ type: 'positive', message: 'Рекламная компания создана' });
  } catch (error) {
    $q.notify({ type: 'negative', message: campaignCreateErrorMessage(error) });
  } finally {
    loading.value = false;
  }
}

/** Копирует готовую ссылку созданной компании. */
async function copyLink(): Promise<void> {
  if (!created.value) return;
  await copyToClipboard(created.value.link);
  $q.notify({ type: 'positive', message: 'Ссылка скопирована' });
}

onMounted(() => {
  void regenerateCode();
});
</script>

<style scoped>
:deep(.generator-code-input) {
  font-family: monospace;
  letter-spacing: 0.08em;
}
</style>
