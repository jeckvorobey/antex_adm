<template>
  <q-select
    v-model="selectedId"
    :options="options"
    :label="label"
    :placeholder="placeholder"
    :loading="loading"
    :rules="rules"
    emit-value
    map-options
    option-value="value"
    option-label="label"
    use-input
    clearable
    hide-selected
    fill-input
    dense
    outlined
    input-debounce="300"
    @filter="filterUsers"
    @update:model-value="handleSelected"
    @clear="handleClear"
  >
    <template #prepend>
      <q-icon name="person_search" />
    </template>

    <template #option="{ opt }">
      <q-item>
        <q-item-section>
          <div class="text-body2 text-weight-medium">
            {{ formatUserLabel(opt.raw ?? opt) }}
          </div>
          <div class="text-caption text-grey-7">
            {{ formatUserDetails(opt.raw ?? opt) }}
          </div>
        </q-item-section>
      </q-item>
    </template>

    <template #no-option>
      <q-item>
        <q-item-section class="text-grey-7">
          Пользователи не найдены
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

import { api } from '@boot/axios';
import type { AdminUserOption } from '@/types/admin-user';

type SelectOption = { value: number; label: string; raw: AdminUserOption };

type UsersResponse =
  | AdminUserOption[]
  | {
      items?: AdminUserOption[];
      data?: AdminUserOption[];
      total?: number;
      limit?: number;
      offset?: number;
    };

const props = withDefaults(
  defineProps<{
    modelValue: number | null;
    label?: string;
    placeholder?: string;
    rules?: Array<(value: number | null) => true | string>;
  }>(),
  {
    label: 'Пользователь',
    placeholder: 'ID, username, имя, телефон...',
    rules: () => [],
  },
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: number | null): void;
  (event: 'update:selectedUser', value: AdminUserOption | null): void;
}>();

const options = ref<SelectOption[]>([]);
const selectedId = ref<number | null>(null);
const selectedUser = ref<AdminUserOption | null>(null);
const loading = ref(false);

let searchAbortController: AbortController | null = null;
let hydrateAbortController: AbortController | null = null;

watch(
  () => props.modelValue,
  async (value) => {
    if (selectedId.value === value) return;
    selectedId.value = value;

    if (!value) {
      selectedUser.value = null;
      emit('update:selectedUser', null);
      return;
    }

    await hydrateUser(value);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  searchAbortController?.abort();
  hydrateAbortController?.abort();
});

function toOption(user: AdminUserOption): SelectOption {
  return { value: user.id, label: formatUserLabel(user), raw: user };
}

async function filterUsers(
  search: string,
  update: (callback: () => void) => void,
  abort?: () => void,
) {
  const query = search.trim();
  if (!query) {
    update(() => {
      options.value = selectedUser.value ? [toOption(selectedUser.value)] : [];
    });
    return;
  }

  searchAbortController?.abort();
  searchAbortController = new AbortController();
  loading.value = true;

  try {
    const response = await api.get<UsersResponse>('/api/admin/users', {
      params: { search: query, limit: 20, offset: 0 },
      signal: searchAbortController.signal,
    });
    const users = normalizeUsersResponse(response.data);
    update(() => {
      options.value = users.map(toOption);
    });
  } catch (error: unknown) {
    if (isAbortError(error)) {
      abort?.();
      return;
    }
    update(() => {
      options.value = [];
    });
  } finally {
    loading.value = false;
  }
}

function handleSelected(value: number | null) {
  selectedId.value = value;
  const option = options.value.find((o) => o.value === value);
  selectedUser.value = option?.raw ?? null;
  emit('update:modelValue', value);
  emit('update:selectedUser', selectedUser.value);
}

function handleClear() {
  selectedId.value = null;
  selectedUser.value = null;
  options.value = [];
  emit('update:modelValue', null);
  emit('update:selectedUser', null);
}

async function hydrateUser(userId: number) {
  hydrateAbortController?.abort();
  hydrateAbortController = new AbortController();
  loading.value = true;

  try {
    const response = await api.get<AdminUserOption>(`/api/admin/users/${userId}`, {
      signal: hydrateAbortController.signal,
    });
    const opt = toOption(response.data);
    selectedUser.value = response.data;
    options.value = [opt];
    emit('update:selectedUser', response.data);
  } catch (error: unknown) {
    if (!isAbortError(error)) {
      selectedUser.value = null;
      emit('update:selectedUser', null);
    }
  } finally {
    loading.value = false;
  }
}

function normalizeUsersResponse(payload: UsersResponse): AdminUserOption[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function formatUserLabel(user: AdminUserOption): string {
  const username = user.username ? `@${user.username}` : '';
  const fullName = getUserFullName(user);
  const title = [username, fullName].filter(Boolean).join(' · ');
  return title ? `${title} · ID ${user.id}` : `ID ${user.id}`;
}

function formatUserDetails(user: AdminUserOption): string {
  const telegramId = user.telegram_id ?? user.telegramId;
  const details = [
    telegramId ? `TG ${telegramId}` : '',
    user.phone ? `Телефон ${user.phone}` : '',
    user.email ? `Email ${user.email}` : '',
    getAexBalance(user) ? `AEX ${getAexBalance(user)}` : '',
  ].filter(Boolean);
  return details.length > 0 ? details.join(' · ') : 'Нет дополнительных данных';
}

function getUserFullName(user: AdminUserOption): string {
  const firstName = user.first_name ?? user.firstName ?? '';
  const lastName = user.last_name ?? user.lastName ?? '';
  return user.fullName ?? user.name ?? [firstName, lastName].filter(Boolean).join(' ');
}

function getAexBalance(user: AdminUserOption): string {
  return user.aex_balance ?? user.aexBalance ?? '';
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError');
}
</script>
