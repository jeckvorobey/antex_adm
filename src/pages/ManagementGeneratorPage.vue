<template>
  <q-page class="q-pa-md">
    <div class="generator-shell">
      <div class="row items-start justify-between q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm">
          <div class="text-overline text-primary text-weight-bold">РЕКЛАМА</div>
          <h1 class="text-h4 text-weight-bold q-my-xs">Новая рекламная компания</h1>
          <p class="text-body1 text-grey-7 q-my-none">
            Заполните данные, проверьте уникальный код и создайте готовую ссылку для рекламы.
          </p>
        </div>
        <div class="col-auto gt-xs">
          <q-badge outline color="primary" class="q-px-md q-py-sm">
            <q-icon name="verified_user" size="16px" class="q-mr-xs" />
            Код назначает сервер
          </q-badge>
        </div>
      </div>

      <q-form @submit="submit">
        <q-card flat bordered class="generator-card">
          <q-card-section class="bg-primary text-white q-pa-lg">
            <div class="row items-center no-wrap">
              <q-icon name="add_link" size="32px" class="q-mr-md" />
              <div>
                <div class="text-h6 text-weight-medium">Параметры компании</div>
                <div class="text-body2 text-blue-1">
                  Поля со звёздочкой обязательны. Данные сохранятся одним действием.
                </div>
              </div>
            </div>
          </q-card-section>

          <q-card-section class="q-pa-lg">
            <div class="row items-center q-mb-md">
              <q-icon name="info" color="primary" size="22px" class="q-mr-sm" />
              <div>
                <div class="text-subtitle1 text-weight-medium">Основная информация</div>
                <div class="text-caption text-grey-7">Название, площадка и цель размещения</div>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <q-input
                v-model.trim="form.name"
                name="name"
                label="Название компании *"
                outlined
                lazy-rules
                maxlength="255"
                counter
                class="col-12 col-md-6"
                :rules="nameRules"
              >
                <template #prepend><q-icon name="campaign" /></template>
              </q-input>
              <MarketingPlatformSelect
                v-model="form.provider"
                label="Рекламная платформа *"
                outlined
                lazy-rules
                class="col-12 col-md-6"
                :rules="requiredPlatformRules"
              />
              <q-input
                v-model.trim="form.externalId"
                label="ID компании на платформе"
                outlined
                maxlength="255"
                hint="Необязательно. Например, ID из Telegram Ads"
                class="col-12 col-md-6"
              />
              <q-input
                v-model.trim="form.objective"
                label="Цель компании"
                outlined
                maxlength="255"
                hint="Например: привлечение новых пользователей"
                class="col-12 col-md-6"
              />
            </div>

            <q-separator class="q-my-lg" />

            <div class="row items-center q-mb-md">
              <q-icon name="tune" color="primary" size="22px" class="q-mr-sm" />
              <div>
                <div class="text-subtitle1 text-weight-medium">Бюджет и период</div>
                <div class="text-caption text-grey-7">Статус, сумма и даты действия</div>
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <q-select
                v-model="form.status"
                label="Статус"
                outlined
                emit-value
                map-options
                :options="statusOptions"
                class="col-12 col-md-4"
              />
              <q-input
                v-model.number="form.budget"
                type="number"
                min="0"
                step="0.01"
                label="Бюджет"
                outlined
                lazy-rules
                class="col-12 col-md-4"
                :rules="budgetRules"
              >
                <template #prepend><q-icon name="account_balance_wallet" /></template>
              </q-input>
              <MarketingCurrencySelect
                v-model="form.currency"
                label="Валюта *"
                outlined
                lazy-rules
                class="col-12 col-md-4"
                :rules="requiredCurrencyRules"
              />
              <AdminDateInput v-model="form.startsAt" label="Дата начала" class="col-12 col-md-6" />
              <AdminDateInput
                v-model="form.endsAt"
                label="Дата окончания"
                lazy-rules
                class="col-12 col-md-6"
                :rules="endDateRules"
              />
            </div>

            <q-separator class="q-my-lg" />

            <div class="row items-center justify-between q-mb-md">
              <div class="row items-center">
                <q-icon name="fingerprint" color="primary" size="22px" class="q-mr-sm" />
                <div>
                  <div class="text-subtitle1 text-weight-medium">Уникальный рекламный код</div>
                  <div class="text-caption text-grey-7">
                    Неизменяемая часть будущей рекламной ссылки
                  </div>
                </div>
              </div>
              <q-badge
                :color="isCurrentCodePersisted ? 'positive' : 'warning'"
                :label="isCurrentCodePersisted ? 'Сохранён' : 'Временный'"
              />
            </div>

            <q-card flat bordered class="q-mb-lg">
              <q-card-section class="q-pa-md">
                <q-input
                  name="code"
                  :model-value="displayCode"
                  label="Код компании"
                  outlined
                  readonly
                  :loading="generatingCode"
                  :error="Boolean(codeError)"
                  :error-message="codeError"
                  input-class="text-weight-bold generator-code-input"
                >
                  <template #prepend><q-icon name="lock" color="primary" /></template>
                  <template #append>
                    <q-btn
                      data-testid="regenerate-code"
                      type="button"
                      round
                      flat
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
                  <q-icon name="cloud_off" size="18px" class="q-mr-xs" />
                  <span v-if="!isCurrentCodePersisted">
                    Код ещё не сохранён в базе данных. При перегенерации прежнее временное значение
                    будет заменено.
                  </span>
                  <span v-else>Этот код сохранён вместе с созданной компанией.</span>
                </div>
              </q-card-section>
            </q-card>

            <q-input
              v-model.trim="form.notes"
              type="textarea"
              rows="4"
              label="Заметки"
              outlined
              hint="Внутренняя информация для команды"
            />
          </q-card-section>

          <q-separator />
          <q-card-actions align="right" class="q-pa-lg">
            <q-btn
              type="submit"
              color="primary"
              icon-right="arrow_forward"
              label="Создать компанию и ссылку"
              unelevated
              no-caps
              :loading="loading"
              :disable="!previewCode || !previewToken || generatingCode || isCurrentCodePersisted"
            />
          </q-card-actions>
        </q-card>
      </q-form>

      <q-card v-if="created" flat bordered class="generator-card q-mt-lg">
        <q-card-section class="q-pa-lg">
          <div class="row items-center q-mb-md text-positive">
            <q-icon name="check_circle" size="32px" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-weight-medium">Компания создана</div>
              <div class="text-body2 text-grey-7">Код и ссылка успешно сохранены</div>
            </div>
          </div>
          <q-input :model-value="created.link" label="Готовая ссылка" outlined readonly>
            <template #prepend><q-icon name="link" color="positive" /></template>
            <template #append>
              <q-btn
                data-testid="copy-link"
                type="button"
                round
                flat
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
        </q-card-section>
      </q-card>
    </div>
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
.generator-shell {
  max-width: 1120px;
  margin: 0 auto;
}

.generator-card {
  overflow: hidden;
  border-radius: 16px;
}

:deep(.generator-code-input) {
  font-family: monospace;
  letter-spacing: 0.08em;
}
</style>
