<template>
  <q-page class="dashboard-page q-pa-md">
    <div class="dashboard-shell">
      <header class="dashboard-header">
        <div>
          <h1 class="dashboard-title">Дашборд</h1>
          <div class="dashboard-subtitle">Операционная сводка</div>
        </div>
        <q-btn
          data-testid="dashboard-refresh"
          flat
          dense
          no-caps
          color="primary"
          icon="refresh"
          label="Обновить"
          aria-label="Обновить данные"
          :loading="loading"
          @click="loadSummary"
        />
      </header>

      <q-banner v-if="loadError" class="dashboard-error bg-red-1 text-negative" rounded>
        Не удалось загрузить сводку.
        <template #action>
          <q-btn flat dense color="negative" label="Повторить" @click="loadSummary" />
        </template>
      </q-banner>

      <div class="dashboard-top-grid">
        <section class="dashboard-surface attention-surface" aria-labelledby="attention-title">
          <div class="surface-header">
            <div class="surface-heading-with-icon">
              <q-icon name="error" color="negative" size="26px" />
              <h2 id="attention-title" class="surface-title">Требуют внимания</h2>
            </div>
            <q-badge
              rounded
              :color="attentionOrders.length ? 'negative' : 'grey-5'"
              :label="attentionOrders.length"
              class="attention-count"
            />
          </div>

          <div v-if="loading && !summary" class="q-py-sm">
            <q-skeleton v-for="index in 3" :key="index" type="rect" height="68px" class="q-mb-sm" />
          </div>

          <q-list v-else-if="attentionOrders.length" separator class="attention-list">
            <q-item
              v-for="order in attentionOrders"
              :key="order.id"
              clickable
              tag="a"
              href="/orders"
              class="attention-row"
              :data-testid="`attention-order-${order.id}`"
            >
              <q-item-section>
                <div class="attention-row__top">
                  <span class="attention-number">№ {{ order.publicNumber }}</span>
                  <span
                    class="attention-age"
                    :class="order.overdue ? 'text-negative' : 'text-warning'"
                  >
                    {{ ageLabel(order.ageMinutes) }}
                  </span>
                </div>
                <div class="attention-direction">
                  {{ formatAmount(order.amountSell) }} {{ order.currencySell }}
                  <q-icon name="arrow_forward" size="16px" class="q-mx-xs" />
                  {{ order.amountBuy == null ? '—' : formatAmount(order.amountBuy) }}
                  {{ order.currencyBuy }}
                </div>
                <div class="attention-reason">
                  <span
                    :class="
                      order.overdue
                        ? 'text-negative'
                        : order.status === 1
                          ? 'text-warning'
                          : 'text-primary'
                    "
                    >{{ order.reason }}</span
                  >
                  <span class="attention-reason__separator">•</span>
                  <span>Ожидает подтверждения</span>
                </div>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-6" />
              </q-item-section>
            </q-item>
          </q-list>

          <div v-else class="empty-state">
            <q-icon name="task_alt" color="positive" size="28px" />
            <span>Заявок, требующих внимания, нет</span>
          </div>

          <q-btn
            v-if="attentionOrders.length"
            flat
            no-caps
            color="primary"
            class="surface-footer-action"
            label="Все заявки"
            icon-right="chevron_right"
            href="/orders"
          />
        </section>

        <section class="dashboard-surface today-surface" aria-labelledby="today-title">
          <div class="surface-header">
            <h2 id="today-title" class="surface-title">Сегодня</h2>
          </div>

          <div v-if="loading && !summary" class="today-grid">
            <q-skeleton type="rect" height="205px" />
            <q-skeleton type="rect" height="205px" />
          </div>

          <div v-else class="today-grid">
            <div class="today-group">
              <div class="today-group__title">
                <q-icon name="group" color="primary" size="20px" />
                Пользователи
              </div>
              <div class="compact-metrics compact-metrics--users">
                <div>
                  <span>Новые</span><strong>{{ userMetrics.newToday }}</strong>
                </div>
                <div>
                  <span>Активные</span><strong>{{ userMetrics.activeToday }}</strong>
                </div>
              </div>
            </div>

            <div class="today-group today-group--orders">
              <div class="today-group__title">
                <q-icon name="receipt_long" color="primary" size="20px" />
                Заявки
              </div>
              <div class="compact-metrics compact-metrics--orders">
                <div>
                  <span>Создано</span><strong>{{ orderMetrics.today }}</strong>
                </div>
                <div>
                  <span>Завершено</span><strong>{{ orderMetrics.completedToday }}</strong>
                </div>
                <div>
                  <span>В работе</span><strong>{{ orderMetrics.inProgress }}</strong>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!loading || summary" class="today-total-row">
            <span>Всего</span>
            <span class="today-total-row__metric"
              ><q-icon name="group" color="primary" size="20px" /> Пользователи
              <strong data-testid="users-total">{{ userMetrics.total }}</strong></span
            >
            <span class="today-total-row__metric"
              ><q-icon name="receipt_long" color="positive" size="20px" /> Заявки
              <strong data-testid="orders-total">{{ orderMetrics.total }}</strong></span
            >
          </div>
        </section>
      </div>

      <div class="dashboard-bottom-grid">
        <section class="dashboard-surface" aria-labelledby="turnover-title">
          <div class="surface-header">
            <div class="surface-heading-with-icon">
              <q-icon name="monetization_on" color="primary" size="26px" />
              <h2 id="turnover-title" class="surface-title">Оборот завершённых</h2>
            </div>
          </div>

          <div v-if="turnover.length" class="turnover-table">
            <div class="turnover-table__head">
              <span></span>
              <span>Сегодня</span>
              <span>За всё время</span>
            </div>
            <div
              v-for="row in turnover"
              :key="row.currency"
              class="turnover-row"
              :data-testid="`turnover-${row.currency}`"
            >
              <strong class="turnover-currency">
                <q-avatar
                  :data-testid="`turnover-icon-${row.currency}`"
                  :aria-label="row.currency"
                  role="img"
                  :color="currencyColor(row.currency)"
                  text-color="white"
                  size="32px"
                  class="currency-avatar"
                >
                  <span v-if="currencyFlag(row.currency)" class="currency-flag" aria-hidden="true">
                    {{ currencyFlag(row.currency) }}
                  </span>
                  <q-icon v-else :name="currencyIcon(row.currency)" size="19px" />
                </q-avatar>
                {{ row.currency }}
              </strong>
              <span>{{ formatAmount(row.today) }}</span>
              <span>{{ formatAmount(row.total) }}</span>
            </div>
          </div>
          <div v-else class="empty-state empty-state--compact">Завершённых заявок пока нет</div>
        </section>

        <section class="dashboard-surface" aria-labelledby="rates-title">
          <div class="surface-header">
            <div class="surface-heading-with-icon">
              <q-icon name="swap_horiz" color="primary" size="28px" />
              <h2 id="rates-title" class="surface-title">Курсы</h2>
            </div>
            <div class="rates-updated">
              Обновлено {{ ratesUpdatedLabel }} <q-icon name="schedule" size="18px" />
            </div>
          </div>

          <div v-if="rates.length" class="rates-grid">
            <div
              v-for="rate in rates"
              :key="rate.pairId"
              class="rate-row"
              :data-testid="`rate-${rate.pairId}`"
            >
              <div
                v-for="(currency, index) in rateCurrencies(rate)"
                :key="currency"
                class="rate-row__side"
                :class="index === 0 ? 'rate-row__side--sell' : 'rate-row__side--buy'"
              >
                <q-avatar
                  :data-testid="`rate-currency-${rate.pairId}-${currency}`"
                  :aria-label="currency"
                  role="img"
                  :color="currencyFlag(currency) ? undefined : currencyColor(currency)"
                  text-color="white"
                  size="25px"
                  class="currency-avatar"
                  :class="{ 'currency-avatar--flag': currencyFlag(currency) }"
                >
                  <span v-if="currencyFlag(currency)" class="currency-flag" aria-hidden="true">
                    {{ currencyFlag(currency) }}
                  </span>
                  <q-icon v-else :name="currencyIcon(currency)" size="15px" />
                </q-avatar>
                <span class="rate-row__currency">{{ currency }}</span>
              </div>
              <div class="rate-row__quote">
                <div class="rate-row__value">
                  от {{ rate.finalRateDisplay }} <q-icon name="arrow_forward" size="16px" />
                </div>
                <div class="rate-row__base">{{ baseRateText(rate) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state empty-state--compact">Курсы недоступны</div>
          <q-btn
            v-if="rates.length"
            flat
            no-caps
            color="primary"
            class="surface-footer-action"
            label="Все курсы"
            icon-right="chevron_right"
            href="/rates"
          />
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { api } from '@boot/axios';

interface DashboardRate {
  pairId: string;
  label: string;
  baseRate?: number;
  baseRateDisplay?: string;
  finalRate: number;
  finalRateDisplay: string;
  rateText: string;
  updatedAt: string;
}

interface AttentionOrder {
  id: number;
  publicNumber: string;
  amountSell: number;
  currencySell: string;
  amountBuy: number | null;
  currencyBuy: string;
  status: number;
  createdAt: string;
  ageMinutes: number;
  reason: string;
  overdue: boolean;
}

interface DashboardSummary {
  ordersToday: number;
  usersTotal: number;
  featuredRates: DashboardRate[];
  users?: {
    total: number;
    newToday: number;
    activeToday: number;
  };
  orders?: {
    total: number;
    today: number;
    new: number;
    inProgress: number;
    completedToday: number;
  };
  attentionOrders?: AttentionOrder[];
  turnover?: Array<{
    currency: string;
    today: number;
    total: number;
  }>;
  rates?: DashboardRate[];
  generatedAt?: string;
}

const summary = ref<DashboardSummary | null>(null);
const loading = ref(false);
const loadError = ref(false);

const userMetrics = computed(
  () =>
    summary.value?.users ?? {
      total: summary.value?.usersTotal ?? 0,
      newToday: 0,
      activeToday: 0,
    },
);

const orderMetrics = computed(
  () =>
    summary.value?.orders ?? {
      total: summary.value?.ordersToday ?? 0,
      today: summary.value?.ordersToday ?? 0,
      new: 0,
      inProgress: 0,
      completedToday: 0,
    },
);

const attentionOrders = computed(() => summary.value?.attentionOrders ?? []);
const turnover = computed(() => summary.value?.turnover ?? []);
const rates = computed(() => summary.value?.rates ?? summary.value?.featuredRates ?? []);
const ratesUpdatedLabel = computed(() =>
  rates.value[0]?.updatedAt ? formatDateTime(rates.value[0].updatedAt) : '—',
);

const updatedLabel = computed(() => {
  if (!summary.value?.generatedAt) {
    return 'Данные на текущий момент';
  }
  return `Обновлено ${formatTime(summary.value.generatedAt)}`;
});

onMounted(loadSummary);

async function loadSummary() {
  loading.value = true;
  loadError.value = false;
  try {
    const response = await api.get<DashboardSummary>('/api/admin/summary');
    summary.value = response.data;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

function formatAmount(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function ageLabel(minutes: number) {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `${hours} ч ${remainingMinutes} мин` : `${hours} ч`;
  }
  return `${Math.floor(minutes / 1440)} дн`;
}

function currencyIcon(currency: string) {
  return (
    {
      USDT: 'paid',
    }[currency] ?? 'currency_exchange'
  );
}

function currencyFlag(currency: string) {
  return (
    {
      RUB: '🇷🇺',
      THB: '🇹🇭',
      GEL: '🇬🇪',
      VND: '🇻🇳',
    }[currency] ?? ''
  );
}

function currencyColor(currency: string) {
  return (
    { USDT: 'positive', RUB: 'primary', THB: 'amber-8', GEL: 'deep-purple', VND: 'red-7' }[
      currency
    ] ?? 'grey-7'
  );
}

function rateCurrencies(rate: DashboardRate) {
  return rate.label.split('/').filter(Boolean).slice(0, 2);
}

function baseRateText(rate: DashboardRate) {
  return `БЦ ${rate.baseRateDisplay ?? '—'}`;
}
</script>

<style scoped lang="scss">
.dashboard-page {
  background: #f5f7fa;
}

.dashboard-shell {
  width: 100%;
}

.dashboard-header,
.surface-header,
.attention-row__top,
.primary-metric,
.secondary-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard-header {
  min-height: 64px;
  margin-bottom: 16px;
}

.dashboard-title,
.surface-title {
  margin: 0;
  color: #1f2937;
}

.dashboard-title {
  font-size: clamp(24px, 3vw, 30px);
  font-weight: 600;
  line-height: 1.2;
}

.dashboard-subtitle,
.surface-caption,
.rate-row__time {
  color: #7b8794;
}

.dashboard-subtitle {
  margin-top: 4px;
  font-size: 14px;
}

.dashboard-error {
  margin-bottom: 16px;
}

.dashboard-top-grid,
.dashboard-bottom-grid {
  display: grid;
  gap: 16px;
}

.dashboard-top-grid {
  grid-template-columns: minmax(0, 1.25fr) minmax(420px, 0.75fr);
  margin-bottom: 16px;
}

.dashboard-bottom-grid {
  grid-template-columns: minmax(360px, 0.8fr) minmax(0, 1.2fr);
}

.dashboard-surface {
  min-width: 0;
  padding: 20px;
  border: 1px solid #e7ebf0;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 10px rgb(31 41 55 / 4%);
}

.surface-header {
  gap: 16px;
  min-height: 40px;
  margin-bottom: 14px;
}

.surface-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.surface-caption {
  margin-top: 3px;
  font-size: 12px;
}

.attention-count {
  min-width: 28px;
  justify-content: center;
  padding: 6px 9px;
  font-size: 13px;
}

.attention-list {
  margin: 0 -8px -8px;
}

.attention-row {
  min-height: 76px;
  padding: 10px 8px;
  color: inherit;
  text-decoration: none;
}

.attention-number {
  color: #263238;
  font-size: 14px;
  font-weight: 600;
}

.attention-age {
  color: #7b8794;
  font-size: 12px;
}

.attention-direction {
  display: flex;
  align-items: center;
  margin-top: 4px;
  color: #374151;
  font-size: 15px;
  font-weight: 500;
}

.attention-reason {
  margin-top: 3px;
  font-size: 12px;
  font-weight: 500;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 184px;
  color: #667085;
  text-align: center;
}

.empty-state--compact {
  min-height: 116px;
}

.today-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.today-group {
  min-width: 0;
  padding-right: 20px;
}

.today-group--orders {
  padding-right: 0;
  padding-left: 20px;
  border-left: 1px solid #e7ebf0;
}

.today-group__title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 12px;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
}

.primary-metric {
  margin-bottom: 8px;
}

.primary-metric strong {
  color: #1f2937;
  font-size: clamp(24px, 3vw, 32px);
  line-height: 1;
}

.metric-label {
  color: #667085;
  font-size: 13px;
}

.secondary-metric {
  gap: 8px;
  min-height: 30px;
  border-top: 1px solid #f0f2f5;
  color: #667085;
  font-size: 12px;
}

.secondary-metric strong {
  color: #344054;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.turnover-table__head,
.turnover-row {
  display: grid;
  grid-template-columns: minmax(70px, 0.6fr) repeat(2, minmax(100px, 1fr));
  gap: 12px;
  align-items: center;
}

/* Operational dashboard: compact density and grouping follow the approved mobile/desktop reference. */
.surface-heading-with-icon,
.today-total-row,
.today-total-row__metric,
.turnover-currency,
.rates-updated {
  display: flex;
  align-items: center;
}

.surface-heading-with-icon {
  gap: 10px;
}

.dashboard-header {
  min-height: 58px;
  margin-bottom: 14px;
}

.dashboard-top-grid {
  grid-template-columns: minmax(0, 1.08fr) minmax(440px, 0.92fr);
  margin-bottom: 14px;
}

.dashboard-bottom-grid {
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
}

.dashboard-surface {
  padding: 0;
  overflow: hidden;
  border-color: #e3e7ec;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgb(31 41 55 / 12%);
}

.surface-header {
  min-height: 68px;
  margin: 0;
  padding: 14px 20px;
  border-bottom: 1px solid #e7ebf0;
}

.surface-title {
  color: #20242a;
  font-size: 20px;
  font-weight: 500;
}

.surface-caption {
  display: none;
}

.attention-count {
  min-width: 34px;
  min-height: 34px;
  padding: 6px 10px;
  font-size: 15px;
}

.attention-list {
  margin: 0 20px;
}

.attention-row {
  min-height: 78px;
  padding: 10px 6px;
}

.attention-number,
.attention-direction {
  font-size: 16px;
}

.attention-age,
.attention-reason {
  font-size: 13px;
}

.attention-reason {
  color: #7b8794;
}

.attention-reason__separator {
  margin: 0 6px;
  color: #98a2b3;
}

.surface-footer-action {
  width: 100%;
  min-height: 52px;
  border-top: 1px solid #e7ebf0;
  border-radius: 0;
}

.today-grid {
  min-height: 128px;
  padding: 18px 20px 14px;
}

.today-group {
  padding-right: 18px;
}

.today-group--orders {
  padding-left: 18px;
}

.today-group__title {
  margin-bottom: 16px;
  color: #1976d2;
  font-size: 16px;
  font-weight: 500;
}

.today-group--orders .today-group__title {
  color: #16a56a;
}

.compact-metrics {
  display: grid;
  gap: 12px;
}

.compact-metrics--users {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.compact-metrics--orders {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.compact-metrics div {
  min-width: 0;
  text-align: center;
}

.compact-metrics span {
  display: block;
  overflow: hidden;
  color: #667085;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-metrics strong {
  display: block;
  margin-top: 8px;
  color: #20242a;
  font-size: 21px;
  font-weight: 500;
  text-align: center;
}

.today-total-row {
  min-height: 64px;
  gap: 18px;
  padding: 12px 20px;
  border-top: 1px solid #e7ebf0;
  color: #20242a;
  font-size: 16px;
}

.today-total-row__metric {
  gap: 7px;
  color: #667085;
  font-size: 13px;
  white-space: nowrap;
}

.today-total-row__metric + .today-total-row__metric {
  margin-left: auto;
  padding-left: 18px;
  border-left: 1px solid #e7ebf0;
}

.today-total-row__metric strong {
  margin-left: 8px;
  color: #20242a;
  font-size: 20px;
  font-weight: 500;
}

.turnover-table,
.rates-grid {
  padding: 8px 20px 0;
}

.turnover-table__head {
  min-height: 38px;
  text-transform: none;
  letter-spacing: 0;
}

.turnover-row {
  min-height: 58px;
  font-size: 16px;
}

.turnover-currency {
  gap: 10px;
}

.currency-avatar {
  flex: 0 0 auto;
}

.currency-flag {
  font-size: 0.9em;
  line-height: 1;
}

.currency-avatar--flag {
  background: transparent;
}

.rates-updated {
  gap: 7px;
  color: #7b8794;
  font-size: 13px;
  white-space: nowrap;
}

.rates-grid {
  gap: 0 22px;
}

.rate-row {
  min-height: 73px;
  padding: 15px 0;
}

.rate-row__value {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.turnover-table__head {
  min-height: 34px;
  color: #98a2b3;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.turnover-table__head span:not(:first-child),
.turnover-row span {
  text-align: right;
}

.turnover-row {
  min-height: 46px;
  border-top: 1px solid #edf0f3;
  color: #344054;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.turnover-row > span {
  color: #20242a;
  font-weight: 600;
}

.rates-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
}

.rate-row {
  display: grid;
  grid-template-columns: minmax(64px, 1fr) auto minmax(64px, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 78px;
  padding: 12px 14px;
  border-top: 1px solid #edf0f3;
}

.rate-row:nth-child(even) {
  border-left: 1px solid #edf0f3;
}

.rate-row__side {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.rate-row__side--buy {
  justify-content: flex-end;
  text-align: right;
}

.rate-row__currency {
  color: #344054;
  font-size: 13px;
  font-weight: 600;
}

.rate-row__quote {
  min-width: 0;
  align-items: center;
  text-align: center;
}

.rate-row__value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  margin: 0;
  padding: 5px 10px;
  border: 1px solid #d6b328;
  border-radius: 999px;
  overflow: hidden;
  color: #765b00;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rate-row__base {
  margin-top: 4px;
  overflow: hidden;
  color: #7b8794;
  font-size: 12px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1023px) {
  .dashboard-top-grid,
  .dashboard-bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .dashboard-page {
    padding: 12px;
  }

  .dashboard-header {
    min-height: 54px;
    margin-bottom: 12px;
  }

  .dashboard-surface {
    border-radius: 10px;
  }

  .surface-header {
    min-height: 62px;
    padding: 12px 16px;
  }

  .surface-title {
    font-size: 18px;
  }

  .attention-list {
    margin: 0 16px;
  }

  .attention-row {
    min-height: 74px;
    padding: 9px 2px;
  }

  .attention-number,
  .attention-direction {
    font-size: 15px;
  }

  .today-grid {
    min-height: 122px;
    padding: 16px 14px 12px;
  }

  .today-group {
    padding-right: 10px;
  }

  .today-group--orders {
    padding-right: 0;
    padding-left: 10px;
  }

  .today-group__title {
    align-items: center;
    margin-bottom: 14px;
    font-size: 14px;
  }

  .compact-metrics {
    gap: 7px;
  }
  .compact-metrics span {
    font-size: 11px;
  }
  .compact-metrics strong {
    margin-top: 6px;
    font-size: 18px;
  }

  .today-total-row {
    min-height: 58px;
    gap: 8px;
    padding: 10px 14px;
    font-size: 14px;
  }

  .today-total-row__metric {
    gap: 4px;
    font-size: 10px;
  }
  .today-total-row__metric + .today-total-row__metric {
    margin-left: 4px;
    padding-left: 8px;
  }
  .today-total-row__metric strong {
    margin-left: 2px;
    font-size: 17px;
  }

  .turnover-table,
  .rates-grid {
    padding-right: 16px;
    padding-left: 16px;
  }

  .turnover-table__head {
    font-size: 11px;
  }
  .turnover-row {
    min-height: 54px;
    font-size: 14px;
  }
  .rates-updated {
    font-size: 11px;
  }

  .secondary-metric {
    align-items: flex-start;
    min-height: 38px;
    padding: 7px 0;
  }

  .secondary-metric span {
    max-width: 80px;
    line-height: 1.2;
  }

  .rates-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
  }
  .rate-row {
    min-height: 76px;
    grid-template-columns: minmax(54px, 1fr) auto minmax(54px, 1fr);
    gap: 5px;
    padding: 11px 8px;
  }
  .rate-row__value {
    padding: 4px 8px;
    font-size: 12px;
  }
  .rate-row__base {
    margin-top: 4px;
    font-size: 10px;
  }
  .rate-row__currency {
    font-size: 11px;
  }

  .turnover-table__head,
  .turnover-row {
    grid-template-columns: 60px repeat(2, minmax(82px, 1fr));
    gap: 8px;
  }
}
</style>
