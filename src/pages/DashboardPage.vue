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
          round
          flat
          color="primary"
          icon="refresh"
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
            <div>
              <h2 id="attention-title" class="surface-title">Требуют внимания</h2>
              <div class="surface-caption">Новые и задержавшиеся заявки</div>
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
                  <span class="attention-age">{{ ageLabel(order.ageMinutes) }}</span>
                </div>
                <div class="attention-direction">
                  {{ formatAmount(order.amountSell) }} {{ order.currencySell }}
                  <q-icon name="arrow_forward" size="16px" class="q-mx-xs" />
                  {{ order.amountBuy == null ? '—' : formatAmount(order.amountBuy) }}
                  {{ order.currencyBuy }}
                </div>
                <div
                  class="attention-reason"
                  :class="
                    order.overdue
                      ? 'text-negative'
                      : order.status === 1
                        ? 'text-warning'
                        : 'text-primary'
                  "
                >
                  {{ order.reason }}
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
        </section>

        <section class="dashboard-surface today-surface" aria-labelledby="today-title">
          <div class="surface-header">
            <div>
              <h2 id="today-title" class="surface-title">Сегодня</h2>
              <div class="surface-caption">{{ updatedLabel }}</div>
            </div>
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
              <div class="primary-metric">
                <span class="metric-label">Всего</span>
                <strong data-testid="users-total">{{ userMetrics.total }}</strong>
              </div>
              <div class="secondary-metric">
                <span>Новые сегодня</span>
                <strong>{{ userMetrics.newToday }}</strong>
              </div>
              <div class="secondary-metric">
                <span>Активны сегодня</span>
                <strong>{{ userMetrics.activeToday }}</strong>
              </div>
            </div>

            <div class="today-group today-group--orders">
              <div class="today-group__title">
                <q-icon name="receipt_long" color="primary" size="20px" />
                Заявки
              </div>
              <div class="primary-metric">
                <span class="metric-label">Всего</span>
                <strong data-testid="orders-total">{{ orderMetrics.total }}</strong>
              </div>
              <div class="secondary-metric">
                <span>Сегодня</span>
                <strong>{{ orderMetrics.today }}</strong>
              </div>
              <div class="secondary-metric">
                <span>Новые</span>
                <strong class="text-warning">{{ orderMetrics.new }}</strong>
              </div>
              <div class="secondary-metric">
                <span>В работе</span>
                <strong class="text-primary">{{ orderMetrics.inProgress }}</strong>
              </div>
              <div class="secondary-metric">
                <span>Завершены сегодня</span>
                <strong class="text-positive">{{ orderMetrics.completedToday }}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="dashboard-bottom-grid">
        <section class="dashboard-surface" aria-labelledby="turnover-title">
          <div class="surface-header">
            <div>
              <h2 id="turnover-title" class="surface-title">Оборот завершённых</h2>
              <div class="surface-caption">Без смешивания валют</div>
            </div>
          </div>

          <div v-if="turnover.length" class="turnover-table">
            <div class="turnover-table__head">
              <span>Валюта</span>
              <span>Сегодня</span>
              <span>За всё время</span>
            </div>
            <div
              v-for="row in turnover"
              :key="row.currency"
              class="turnover-row"
              :data-testid="`turnover-${row.currency}`"
            >
              <strong>{{ row.currency }}</strong>
              <span>{{ formatAmount(row.today) }}</span>
              <span>{{ formatAmount(row.total) }}</span>
            </div>
          </div>
          <div v-else class="empty-state empty-state--compact">Завершённых заявок пока нет</div>
        </section>

        <section class="dashboard-surface" aria-labelledby="rates-title">
          <div class="surface-header">
            <div>
              <h2 id="rates-title" class="surface-title">Курсы</h2>
              <div class="surface-caption">Клиентские значения</div>
            </div>
            <q-btn flat dense no-caps color="primary" label="Все курсы" href="/rates" />
          </div>

          <div v-if="rates.length" class="rates-grid">
            <div v-for="rate in rates" :key="rate.pairId" class="rate-row">
              <div class="rate-row__pair">{{ rate.label }}</div>
              <div class="rate-row__value">{{ rate.rateText }}</div>
              <div class="rate-row__time">{{ rateUpdatedLabel(rate.updatedAt) }}</div>
            </div>
          </div>
          <div v-else class="empty-state empty-state--compact">Курсы недоступны</div>
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

function rateUpdatedLabel(value: string) {
  return value ? `Обновлено ${formatTime(value)}` : 'Время обновления неизвестно';
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
</script>

<style scoped lang="scss">
.dashboard-page {
  background: #f5f7fa;
}

.dashboard-shell {
  width: min(100%, 1440px);
  margin: 0 auto;
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

.rates-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

.rate-row {
  min-width: 0;
  padding: 11px 0;
  border-top: 1px solid #edf0f3;
}

.rate-row__pair {
  color: #7b8794;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.rate-row__value {
  margin-top: 2px;
  overflow: hidden;
  color: #263238;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rate-row__time {
  margin-top: 2px;
  font-size: 11px;
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
    padding: 16px;
    border-radius: 14px;
  }

  .today-group {
    padding-right: 12px;
  }

  .today-group--orders {
    padding-right: 0;
    padding-left: 12px;
  }

  .today-group__title {
    align-items: flex-start;
    font-size: 12px;
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
    grid-template-columns: 1fr;
  }

  .turnover-table__head,
  .turnover-row {
    grid-template-columns: 60px repeat(2, minmax(82px, 1fr));
    gap: 8px;
  }
}
</style>
