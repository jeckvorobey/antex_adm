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

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">Режим работы менеджеров</div>
        <q-toggle
          v-model="managerScheduleEnabled"
          label="Использовать расписание"
          color="primary"
        />
        <q-form class="q-mt-md" @submit="saveManagerSchedule">
          <div class="row q-col-gutter-sm">
            <q-input
              v-model="managerStartMsk"
              label="Начало (МСК)"
              mask="time"
              :rules="['time', managerTimeRequired]"
              outlined
              dense
              readonly
              class="col-12 col-sm-3"
              :disable="!managerScheduleEnabled"
            >
              <template #append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="managerStartMsk" format24h>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Готово" color="primary" flat />
                      </div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-input
              v-model="managerEndMsk"
              label="Окончание (МСК)"
              mask="time"
              :rules="['time', managerTimeRequired]"
              outlined
              dense
              readonly
              class="col-12 col-sm-3"
              :disable="!managerScheduleEnabled"
            >
              <template #append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="managerEndMsk" format24h>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Готово" color="primary" flat />
                      </div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-option-group
              v-model="managerWorkingDays"
              :options="weekdays"
              type="checkbox"
              inline
              class="col-12"
              :disable="!managerScheduleEnabled"
            />
          </div>
          <div class="text-caption text-grey-7 q-mt-sm">
            Заявки принимаются круглосуточно. Время отображается в МСК.
          </div>
          <q-btn
            type="submit"
            color="primary"
            label="Сохранить"
            class="q-mt-md"
            :loading="savingManagerSchedule"
          />
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
const savingManagerSchedule = ref(false);
const managerScheduleEnabled = ref(true);
const managerStartMsk = ref('09:00');
const managerEndMsk = ref('21:00');
const managerWorkingDays = ref<number[]>([1, 2, 3, 4, 5, 6, 7]);
const weekdays = [
  { label: 'Пн', value: 1 },
  { label: 'Вт', value: 2 },
  { label: 'Ср', value: 3 },
  { label: 'Чт', value: 4 },
  { label: 'Пт', value: 5 },
  { label: 'Сб', value: 6 },
  { label: 'Вс', value: 7 },
];
const references = useMarketingReferencesStore();
const platform = reactive({ slug: '', name: '' });
const currency = reactive({ code: '', name: '' });
const required = (value: string) => Boolean(value) || 'Заполните поле';
const managerTimeRequired = (value: string) =>
  !managerScheduleEnabled.value || isValidTimeOnly(value) || 'Укажите время в формате ЧЧ:ММ';

onMounted(async () => {
  try {
    const res = await api.get('/api/admin/config');
    botEnabled.value = res.data.enabled;
    marketingAttributionWindowDays.value = res.data.marketingAttributionWindowDays ?? 7;
    managerScheduleEnabled.value = res.data.managerScheduleEnabled ?? true;
    const startMsk = utcToMsk(res.data.managerStartTimeUtc ?? '06:00');
    managerStartMsk.value = startMsk.value;
    managerEndMsk.value = utcToMsk(res.data.managerEndTimeUtc ?? '18:00').value;
    managerWorkingDays.value = shiftWeekdays(
      res.data.managerWorkingDaysUtc ?? [1, 2, 3, 4, 5, 6, 7],
      startMsk.dayOffset,
    );
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

interface ShiftedTime {
  value: string;
  dayOffset: number;
}

/** Конвертирует фиксированный UTC time-only контракт в МСК для административной формы. */
function utcToMsk(value: string) {
  return shiftTime(value, 3);
}
/** Конвертирует введённое в МСК time-only значение в UTC-контракт API. */
function mskToUtc(value: string) {
  return shiftTime(value, -3);
}
/** Сдвигает time-only значение на фиксированное число часов с переходом через полночь. */
function shiftTime(value: string, hours: number): ShiftedTime {
  if (!isValidTimeOnly(value)) {
    throw new Error('Invalid manager time');
  }
  const [hour, minute] = value.split(':').map(Number);
  const shiftedHour = hour + hours;
  const normalizedHour = ((shiftedHour % 24) + 24) % 24;
  return {
    value: `${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    dayOffset: Math.floor(shiftedHour / 24),
  };
}

function isValidTimeOnly(value: string | null | undefined) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function shiftWeekdays(days: number[], dayOffset: number) {
  return [...new Set(days.map((day) => ((((day - 1 + dayOffset) % 7) + 7) % 7) + 1))].sort(
    (left, right) => left - right,
  );
}

/** Сохраняет независимый от остальных настроек UTC-контракт расписания менеджеров. */
async function saveManagerSchedule() {
  if (managerScheduleEnabled.value && !managerWorkingDays.value.length) {
    $q.notify({ type: 'negative', message: 'Выберите рабочие дни' });
    return;
  }
  if (
    managerScheduleEnabled.value &&
    (!isValidTimeOnly(managerStartMsk.value) || !isValidTimeOnly(managerEndMsk.value))
  ) {
    $q.notify({ type: 'negative', message: 'Укажите время работы менеджеров' });
    return;
  }
  savingManagerSchedule.value = true;
  try {
    const payload: {
      managerScheduleEnabled: boolean;
      managerWorkingDaysUtc: number[];
      managerStartTimeUtc?: string;
      managerEndTimeUtc?: string;
    } = {
      managerScheduleEnabled: managerScheduleEnabled.value,
      managerWorkingDaysUtc: managerWorkingDays.value,
    };
    if (isValidTimeOnly(managerStartMsk.value) && isValidTimeOnly(managerEndMsk.value)) {
      const startUtc = mskToUtc(managerStartMsk.value);
      payload.managerWorkingDaysUtc = shiftWeekdays(managerWorkingDays.value, startUtc.dayOffset);
      payload.managerStartTimeUtc = startUtc.value;
      payload.managerEndTimeUtc = mskToUtc(managerEndMsk.value).value;
    }
    await api.patch('/api/admin/config', payload);
    $q.notify({ type: 'positive', message: 'Режим работы менеджеров сохранён' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось сохранить режим работы' });
  } finally {
    savingManagerSchedule.value = false;
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
