<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Пользователи</div>
    <q-input
      v-model="search"
      debounce="300"
      dense
      outlined
      placeholder="Поиск по ID, username, имени..."
      class="q-mb-md"
      style="max-width: 400px"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>
    <q-btn
      label="Сгенерировать коды"
      color="primary"
      icon="vpn_key"
      class="q-mb-md"
      :loading="generatingCodes"
      @click="generateReferralCodes"
    />
    <AppResponsiveTable
      :rows="users"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :mobile="mobileConfig"
      table-style="table-layout: fixed; width: 100%"
      flat
      bordered
    >
      <template #body-cell-role="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-xs">
            <span>{{ getRoleTitle(props.row) }}</span>
            <q-icon name="edit" size="16px" color="grey-6" />
          </div>
          <q-popup-edit
            v-slot="scope"
            :model-value="props.row.role"
            buttons
            label-set="Сохранить"
            label-cancel="Отмена"
            :disable="isRoleSaving(props.row.id)"
            @save="(value) => updateRole(props.row, Number(value))"
          >
            <q-select
              v-model="scope.value"
              :options="getRoleOptions(props.row)"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              dense
              outlined
              autofocus
              :loading="isRoleSaving(props.row.id)"
              :disable="isRoleSaving(props.row.id)"
            />
          </q-popup-edit>
        </q-td>
      </template>

      <template #body-cell-createdAt="props">
        <q-td :props="props">
          {{ formatAdminDateTime(props.row.createdAt) }}
        </q-td>
      </template>

      <template #body-cell-referralCode="props">
        <q-td :props="props" class="referral-code-cell">
          <span
            v-if="props.row.referral_code"
            class="referral-code-pill"
          >
            {{ props.row.referral_code }}
          </span>
          <span v-else class="referral-empty">—</span>
        </q-td>
      </template>

      <template #body-cell-referralRatePercent="props">
        <q-td :props="props" class="referral-number-cell">
          <span v-if="props.row.referral_rate_percent != null">
            {{ formatRate(props.row.referral_rate_percent) }}
          </span>
          <span v-else class="referral-empty">—</span>
        </q-td>
      </template>

      <template #body-cell-referredBy="props">
        <q-td :props="props" class="referral-number-cell">
          <span v-if="props.row.referred_by != null">ID {{ props.row.referred_by }}</span>
          <span v-else class="referral-empty">—</span>
        </q-td>
      </template>

      <template #body-cell-referralBalance="props">
        <q-td :props="props" class="referral-number-cell">
          <span v-if="props.row.balance != null">
            {{ formatBalance(props.row.balance) }}
          </span>
          <span v-else class="referral-empty">—</span>
        </q-td>
      </template>

      <template #body-cell-referralAction="props">
        <q-td :props="props" class="referral-action-cell">
          <q-btn
            v-if="!props.row.referral_code && !generatingForUser(props.row.id)"
            icon="vpn_key"
            size="sm"
            color="primary"
            flat
            dense
            @click="generateReferralCodeForUser(props.row)"
          >
            <q-tooltip>
              Создать реферальный код для этого пользователя
            </q-tooltip>
          </q-btn>
          <q-btn
            v-else-if="generatingForUser(props.row.id)"
            size="sm"
            color="primary"
            flat
            round
            dense
            disable
          >
            <q-spinner size="sm" color="white" />
          </q-btn>
        </q-td>
      </template>

      <!-- Mobile field slots -->
      <template #mobile-field-role="{ row }">
        <div class="row items-center justify-end q-gutter-xs">
          <span>{{ getRoleTitle(row) }}</span>
          <q-icon name="edit" size="16px" color="grey-6" />
        </div>
        <q-popup-edit
          v-slot="scope"
          :model-value="row.role"
          buttons
          label-set="Сохранить"
          label-cancel="Отмена"
          :disable="isRoleSaving(row.id)"
          @save="(value) => updateRole(row, Number(value))"
        >
          <q-select
            v-model="scope.value"
            :options="getRoleOptions(row)"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            dense
            outlined
            autofocus
            :loading="isRoleSaving(row.id)"
            :disable="isRoleSaving(row.id)"
          />
        </q-popup-edit>
      </template>

      <template #mobile-field-referralCode="{ row }">
        <span
          v-if="row.referral_code"
          class="referral-code-pill"
        >
          {{ row.referral_code }}
        </span>
        <span v-else class="referral-empty">—</span>
      </template>

      <template #mobile-field-referralRatePercent="{ row }">
        <span v-if="row.referral_rate_percent != null">
          {{ formatRate(row.referral_rate_percent) }}
        </span>
        <span v-else class="referral-empty">—</span>
      </template>

      <template #mobile-field-referredBy="{ row }">
        <span v-if="row.referred_by != null">ID {{ row.referred_by }}</span>
        <span v-else class="referral-empty">—</span>
      </template>

      <template #mobile-field-referralBalance="{ row }">
        <span v-if="row.balance != null">
          {{ formatBalance(row.balance) }}
        </span>
        <span v-else class="referral-empty">—</span>
      </template>

      <template #mobile-field-referralAction="{ row }">
        <q-btn
          v-if="!row.referral_code && !generatingForUser(row.id)"
          icon="vpn_key"
          size="sm"
          color="primary"
          flat
          dense
          @click="generateReferralCodeForUser(row)"
        >
          <q-tooltip>
            Создать реферальный код для этого пользователя
          </q-tooltip>
        </q-btn>
        <q-btn
          v-else-if="row.referral_code && !generatingForUser(row.id)"
          icon="refresh"
          size="sm"
          color="primary"
          flat
          dense
          @click="confirmRegenerateReferralCode(row)"
        >
          <q-tooltip>
            Пересоздать реферальный код этого пользователя
          </q-tooltip>
        </q-btn>
        <q-btn
          v-else-if="generatingForUser(row.id)"
          size="sm"
          color="primary"
          flat
          round
          dense
          disable
        >
          <q-spinner size="sm" color="white" />
        </q-btn>
      </template>
    </AppResponsiveTable>
  </q-page>
</template>

<script setup lang="ts">
import { api } from '@boot/axios'
import type { QTableColumn } from 'quasar'
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

import { getRoleOptionsForUser } from '@pages/users/role-options'
import AppResponsiveTable from '@components/ui/AppResponsiveTable.vue'
import { formatAdminDateTime } from '@utils/date'

type UserRow = {
  id: number
  username: string | null
  first_name: string | null
  role: number
  role_name?: string
  createdAt: string
  referral_code?: string | null
  referred_by?: number | null
  referral_rate_percent?: string | null
  balance?: string | null
}

const $q = useQuasar()

const roleTitles: Record<number, string> = {
  2: 'Менеджер',
  9: 'Пользователь',
}

const users = ref<UserRow[]>([])
const loading = ref(false)
const savingRoleIds = ref<number[]>([])
const generatingCodes = ref(false)
const generatingForUserIds = ref<Set<number>>(new Set())
const search = ref('')

const hasUsersWithoutReferralCode = computed(() =>
  users.value.some((u) => u.referral_code == null)
)

const columns: QTableColumn<UserRow>[] = [
  { name: 'id', label: 'ID', field: 'id', sortable: true, align: 'left', style: 'width: 6%' },
  { name: 'username', label: 'Username', field: 'username', align: 'left', style: 'width: 18%' },
  { name: 'first_name', label: 'Имя', field: 'first_name', align: 'left', style: 'width: 12%' },
  {
    name: 'role',
    label: 'Роль',
    field: (row: UserRow) => getRoleTitle(row),
    align: 'left',
    style: 'width: 12%',
  },
  {
    name: 'referralCode',
    label: 'Реф. код',
    field: 'referral_code',
    align: 'left',
    style: 'width: 132px; max-width: 160px',
  },
  {
    name: 'referralRatePercent',
    label: '% начисл.',
    field: 'referral_rate_percent',
    align: 'right',
    style: 'width: 84px; max-width: 104px',
  },
  {
    name: 'referredBy',
    label: 'Реферер',
    field: 'referred_by',
    align: 'center',
    style: 'width: 92px; max-width: 112px',
  },
  {
    name: 'referralBalance',
    label: 'Баланс',
    field: 'balance',
    align: 'center',
    style: 'width: 112px; max-width: 140px',
  },
  {
    name: 'referralAction',
    label: '',
    field: 'referral_code',
    align: 'center',
    style: 'width: 120px; max-width: 160px',
  },
  {
    name: 'createdAt',
    label: 'Регистрация',
    field: 'createdAt',
    align: 'left',
    style: 'width: 14%',
    format: (value) => formatAdminDateTime(String(value)),
  },
]

const mobileConfig = {
  title: (row: UserRow) => row.username ? `@${row.username}` : row.first_name ?? `ID ${row.id}`,
  subtitle: (row: UserRow) => formatAdminDateTime(row.createdAt),
  badge: (row: UserRow) => ({ label: getRoleTitle(row), color: row.role === 2 ? 'primary' : 'grey' }),
  fields: [
    { name: 'id', label: 'ID' },
    { name: 'first_name', label: 'Имя' },
    { name: 'role', label: 'Роль' },
    { name: 'referralCode', label: 'Реф. код' },
    { name: 'referralRatePercent', label: '% начисл.' },
    { name: 'referredBy', label: 'Реферер' },
    { name: 'referralBalance', label: 'Баланс' },
    { name: 'referralAction', label: '' },
    { name: 'createdAt', label: 'Регистрация' },
  ],
}

/** Format rate percent string like "0.200000" → "0.2%" */
function formatRate(value: string | null | undefined): string {
  if (value == null) return '—'
  const num = parseFloat(value)
  if (isNaN(num)) return '—'
  // Remove trailing zeros and potential trailing dot
  const formatted = num.toFixed(2).replace(/\.?0+$/, '')
  return `${formatted}%`
}

/** Format balance string like "1240.5" → "₽ 1 240.50" */
function formatBalance(value: string | null | undefined): string {
  if (value == null) return '—'
  const num = parseFloat(value)
  if (isNaN(num)) return '—'
  // Format with two decimal places and space as thousand separator
  const formatted = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  // Using ruble symbol as per common usage in the app
  return `${formatted}`
}

async function fetchUsers() {
  loading.value = true
  try {
    const params = search.value ? { search: search.value } : undefined
    const res = await api.get<UserRow[]>('/api/admin/users', { params })
    users.value = res.data
  } catch {
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)
watch(search, fetchUsers)

function getRoleTitle(row: UserRow) {
  return row.role_name ?? roleTitles[row.role] ?? `Роль ${row.role}`
}

function hasAssignedManager() {
  return users.value.some((row) => row.role === 2)
}

function getRoleOptions(row: UserRow) {
  return getRoleOptionsForUser({
    editedUserRole: row.role,
    hasAssignedManager: hasAssignedManager(),
  })
}

function isRoleSaving(userId: number) {
  return savingRoleIds.value.includes(userId)
}

function generatingForUser(userId: number): boolean {
  return generatingForUserIds.value.has(userId)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'detail' in error.response.data &&
    typeof error.response.data.detail === 'string'
  ) {
    return error.response.data.detail
  }
  return fallback
}

async function updateRole(row: UserRow, role: number) {
  if (isRoleSaving(row.id)) {
    return
  }

  savingRoleIds.value = [...savingRoleIds.value, row.id]
  try {
    const res = await api.patch<UserRow>(`/api/admin/users/${row.id}`, { role })
    const index = users.value.findIndex((item) => item.id === row.id)
    if (index >= 0) {
      users.value[index] = res.data
    }
    $q.notify({ type: 'positive', message: 'Роль пользователя сохранена' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(error, 'Не удалось сохранить роль пользователя'),
    })
  } finally {
    savingRoleIds.value = savingRoleIds.value.filter((id) => id !== row.id)
  }
}

function generateReferralCodes() {
  $q.dialog({
    title: 'Генерация реферальных кодов',
    message: 'Сгенерировать referral_code для всех пользователей без кода?',
    cancel: { label: 'Отмена', flat: true },
    ok: { label: 'Сгенерировать', color: 'primary' },
  }).onOk(async () => {
    generatingCodes.value = true
    try {
      const res = await api.post<{ generated: number }>('/api/admin/aex/generate-referral-codes')
      $q.notify({
        type: 'positive',
        message: `Сгенерировано кодов: ${res.data.generated}`,
      })
      await fetchUsers()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: getErrorMessage(error, 'Не удалось сгенерировать коды'),
      })
    } finally {
      generatingCodes.value = false
    }
  })
}

async function generateReferralCodeForUser(row: UserRow, regenerate = false) {
  const userId = row.id
  if (generatingForUser(userId)) {
    return
  }
  generatingForUserIds.value.add(userId)
  try {
    await api.post(`/api/admin/users/${userId}/generate-referral-code`, null, {
      params: regenerate ? { regenerate: true } : undefined,
    })
    $q.notify({
      type: 'positive',
      message: regenerate ? 'Реферальный код обновлён' : 'Реферальный код создан',
    })
    await fetchUsers()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: getErrorMessage(
        error,
        regenerate ? 'Не удалось обновить реферальный код' : 'Не удалось создать реферальный код',
      ),
    })
  } finally {
    generatingForUserIds.value.delete(userId)
  }
}

function confirmRegenerateReferralCode(row: UserRow) {
  $q.dialog({
    title: 'Пересоздание реферального кода',
    message: 'Пересоздать referral_code только для выбранного пользователя?',
    cancel: { label: 'Отмена', flat: true },
    ok: { label: 'Пересоздать', color: 'primary' },
  }).onOk(() => {
    void generateReferralCodeForUser(row, true)
  })
}
</script>

<style scoped>
.referral-code-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.referral-code-pill {
  display: inline-flex;
  align-items: center;
  max-width: 148px;
  padding: 2px 8px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.04);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 20px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.referral-empty {
  color: var(--q-grey-6);
}

.referral-number-cell {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.referral-action-cell {
  white-space: nowrap;
}
</style>
