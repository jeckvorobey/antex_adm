<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-xs">Генератор ссылок</div>
    <div class="text-body2 text-grey-7 q-mb-md">
      Новая кампания создаётся только здесь. Код назначает сервер и изменить его нельзя.
    </div>

    <q-card flat bordered>
      <q-card-section>
        <q-form class="row q-col-gutter-md" @submit="submit">
          <q-input
            v-model.trim="form.name"
            name="name"
            label="Наименование *"
            outlined
            class="col-12 col-md-6"
            :rules="[(value) => Boolean(value) || 'Укажите наименование']"
          />
          <MarketingPlatformSelect
            v-model="form.provider"
            label="Рекламная платформа *"
            outlined
            class="col-12 col-md-6"
          />
          <q-input v-model.trim="form.medium" label="Medium" outlined class="col-12 col-md-6" />
          <q-input
            v-model.trim="form.externalId"
            label="External campaign ID"
            outlined
            class="col-12 col-md-6"
          />
          <q-input
            v-model.trim="form.objective"
            label="Цель кампании"
            outlined
            class="col-12 col-md-6"
          />
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
            label="Бюджет"
            outlined
            class="col-12 col-md-4"
          />
          <MarketingCurrencySelect
            v-model="form.currency"
            label="Валюта"
            outlined
            class="col-12 col-md-4"
          />
          <AdminDateInput v-model="form.startsAt" label="Дата начала" class="col-12 col-md-6" />
          <AdminDateInput v-model="form.endsAt" label="Дата окончания" class="col-12 col-md-6" />
          <q-input
            v-model.trim="form.notes"
            type="textarea"
            label="Заметки"
            outlined
            class="col-12"
          />
          <div class="col-12">
            <q-btn
              type="submit"
              color="primary"
              icon="add_link"
              label="Сгенерировать новую ссылку"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <q-card v-if="created" flat bordered class="q-mt-md bg-positive text-white">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">Кампания создана</div>
        <div class="text-body2 q-mt-sm">Код: {{ created.code }}</div>
        <div class="text-body2">{{ created.marketParameter }}</div>
        <div class="text-body2 ellipsis q-mt-xs">{{ created.link }}</div>
        <q-btn
          data-testid="copy-link"
          flat
          color="white"
          icon="content_copy"
          label="Копировать ссылку"
          class="q-mt-sm"
          @click="copyLink"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { copyToClipboard, useQuasar } from 'quasar';
import { reactive, ref } from 'vue';

import AdminDateInput from '@/components/ui/AdminDateInput.vue';
import MarketingCurrencySelect from '@/components/marketing/MarketingCurrencySelect.vue';
import MarketingPlatformSelect from '@/components/marketing/MarketingPlatformSelect.vue';
import { MARKETING_CAMPAIGN_STATUS_OPTIONS } from '@/constants/marketing';
import { marketingApi } from '@/services/marketing';
import type { CampaignCreatePayload, MarketingCampaign } from '@/types/marketing';

const $q = useQuasar();
const loading = ref(false);
const created = ref<MarketingCampaign | null>(null);
const form = reactive({
  name: '',
  provider: 'telegram_ads' as const,
  medium: 'paid',
  externalId: '',
  objective: '',
  status: 'active' as const,
  budget: undefined as number | undefined,
  currency: 'USDT',
  startsAt: '',
  endsAt: '',
  notes: '',
});
const statusOptions = MARKETING_CAMPAIGN_STATUS_OPTIONS.filter(
  (option) => option.value !== 'archived',
);

async function submit() {
  loading.value = true;
  created.value = null;
  const payload = Object.fromEntries(
    Object.entries(form).filter(([, value]) => value !== '' && value !== undefined),
  ) as unknown as CampaignCreatePayload;
  try {
    created.value = await marketingApi.createCampaign(payload);
    $q.notify({ type: 'positive', message: 'Маркетинговая кампания создана' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось создать кампанию' });
  } finally {
    loading.value = false;
  }
}

async function copyLink() {
  if (!created.value) return;
  await copyToClipboard(created.value.link);
  $q.notify({ type: 'positive', message: 'Ссылка скопирована' });
}
</script>
