<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Настройки</div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">Статус бота</div>
        <q-toggle
          v-model="botEnabled"
          :label="botEnabled ? 'Бот включён' : 'Бот выключен'"
          color="green"
          @update:model-value="updateBotEnabled"
        />
      </q-card-section>
    </q-card>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">Окно атрибуции рекламы</div>
        <q-form class="row items-center q-col-gutter-sm" @submit="saveAttributionWindow">
          <q-input
            v-model.number="marketingAttributionWindowDays"
            type="number"
            min="1"
            max="90"
            step="1"
            label="Дней"
            outlined
            dense
            class="col-12 col-sm-3"
            :rules="[
              (value) =>
                (Number.isInteger(value) && value >= 1 && value <= 90) ||
                'Введите целое число от 1 до 90 дней',
            ]"
          />
          <div class="col-12 col-sm-auto">
            <q-btn type="submit" color="primary" label="Сохранить" :loading="savingWindow" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1 q-mb-md">Рекламные платформы</div>
            <q-list bordered separator class="q-mb-md">
              <q-item v-for="item in references.platforms" :key="item.slug">
                <q-item-section>{{ item.name }}</q-item-section>
                <q-item-section side>{{ item.slug }}</q-item-section>
                <q-item-section side
                  ><q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    @click="deletePlatform(item.slug)"
                /></q-item-section>
              </q-item>
            </q-list>
            <q-form class="row q-col-gutter-sm" @submit="createPlatform">
              <q-input
                v-model.trim="platform.slug"
                label="Slug"
                outlined
                class="col-12 col-sm-5"
                :rules="[required]"
              />
              <q-input
                v-model.trim="platform.name"
                label="Название"
                outlined
                class="col-12 col-sm-7"
                :rules="[required]"
              />
              <div class="col-12">
                <q-btn type="submit" color="primary" label="Добавить платформу" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1 q-mb-md">Валюты маркетинга</div>
            <q-list bordered separator class="q-mb-md">
              <q-item v-for="item in references.currencies" :key="item.code">
                <q-item-section>{{ item.code }}</q-item-section>
                <q-item-section side>{{ item.name }}</q-item-section>
                <q-item-section side
                  ><q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    @click="deleteCurrency(item.code)"
                /></q-item-section>
              </q-item>
            </q-list>
            <q-form class="row q-col-gutter-sm" @submit="createCurrency">
              <q-input
                v-model.trim="currency.code"
                label="Код"
                outlined
                class="col-12 col-sm-4"
                :rules="[required]"
              />
              <q-input
                v-model.trim="currency.name"
                label="Название"
                outlined
                class="col-12 col-sm-8"
                :rules="[required]"
              />
              <div class="col-12">
                <q-btn type="submit" color="primary" label="Добавить валюту" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { api } from '@boot/axios';
import { marketingApi } from '@/services/marketing';
import { useMarketingReferencesStore } from '@/stores/marketing-references';

const $q = useQuasar();
const botEnabled = ref(true);
const marketingAttributionWindowDays = ref(7);
const savingWindow = ref(false);
const references = useMarketingReferencesStore();
const platform = reactive({ slug: '', name: '' });
const currency = reactive({ code: '', name: '' });
const required = (value: string) => Boolean(value) || 'Заполните поле';

onMounted(async () => {
  try {
    const res = await api.get('/api/admin/config');
    botEnabled.value = res.data.enabled;
    marketingAttributionWindowDays.value = res.data.marketingAttributionWindowDays ?? 7;
  } catch {
    botEnabled.value = false;
  }
  await Promise.all([
    references.loadPlatforms().catch(() => undefined),
    references.loadCurrencies().catch(() => undefined),
  ]);
});

async function createPlatform() {
  try {
    await marketingApi.createPlatform({ ...platform });
    await references.loadPlatforms(true);
    Object.assign(platform, { slug: '', name: '' });
    $q.notify({ type: 'positive', message: 'Платформа добавлена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось добавить платформу' });
  }
}

async function createCurrency() {
  try {
    await marketingApi.createCurrency({ ...currency });
    await references.loadCurrencies(true);
    Object.assign(currency, { code: '', name: '' });
    $q.notify({ type: 'positive', message: 'Валюта добавлена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось добавить валюту' });
  }
}

async function deletePlatform(slug: string) {
  try {
    await marketingApi.deletePlatform(slug);
    await references.loadPlatforms(true);
    $q.notify({ type: 'positive', message: 'Платформа удалена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось удалить платформу' });
  }
}

async function deleteCurrency(code: string) {
  try {
    await marketingApi.deleteCurrency(code);
    await references.loadCurrencies(true);
    $q.notify({ type: 'positive', message: 'Валюта удалена' });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Валюта связана с компаниями или не может быть удалена',
    });
  }
}

/**
 * Сохраняет статус бота через единый endpoint конфигурации.
 */
async function updateBotEnabled(enabled: boolean) {
  const previousValue = !enabled;
  try {
    const res = await api.patch('/api/admin/config', { enabled });
    botEnabled.value = res.data.enabled;
    $q.notify({ type: 'positive', message: botEnabled.value ? 'Бот включён' : 'Бот выключен' });
  } catch {
    botEnabled.value = previousValue;
    $q.notify({ type: 'negative', message: 'Ошибка' });
  }
}

async function saveAttributionWindow() {
  if (
    !Number.isInteger(marketingAttributionWindowDays.value) ||
    marketingAttributionWindowDays.value < 1 ||
    marketingAttributionWindowDays.value > 90
  ) {
    $q.notify({ type: 'negative', message: 'Введите целое число от 1 до 90 дней' });
    return;
  }
  savingWindow.value = true;
  try {
    const res = await api.patch('/api/admin/config', {
      marketingAttributionWindowDays: marketingAttributionWindowDays.value,
    });
    marketingAttributionWindowDays.value = res.data.marketingAttributionWindowDays;
    $q.notify({ type: 'positive', message: 'Окно атрибуции сохранено' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось сохранить окно атрибуции' });
  } finally {
    savingWindow.value = false;
  }
}
</script>
