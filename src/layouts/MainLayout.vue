<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title>AntEx Admin</q-toolbar-title>
        <q-btn flat round icon="logout" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above bordered class="sidebar">
      <q-list>
        <q-item-label header>Навигация</q-item-label>
        <q-item clickable to="/dashboard" active-class="text-primary">
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Дашборд</q-item-section>
        </q-item>

        <q-expansion-item
          :model-value="isManagementExpanded"
          data-testid="management-menu"
          icon="ads_click"
          label="Реклама"
          :header-class="isManagementRoute ? 'text-primary' : 'text-weight-medium'"
          @update:model-value="updateManagementExpanded"
        >
          <q-item
            v-for="item in managementMenu"
            :key="item.to"
            clickable
            :to="item.to"
            active-class="text-primary"
            :inset-level="1"
          >
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-expansion-item>

        <template v-for="item in menu" :key="item.to ?? item.label">
          <q-item v-if="!item.children" clickable :to="item.to" active-class="text-primary">
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>

          <q-expansion-item
            v-else
            :icon="item.icon"
            :label="item.label"
            :model-value="isMenuGroupExpanded(item)"
            header-class="text-weight-medium"
            @update:model-value="updateMenuGroupExpanded(item, $event)"
          >
            <q-item
              v-for="child in item.children"
              :key="child.to"
              clickable
              :to="child.to"
              active-class="text-primary"
              :inset-level="1"
            >
              <q-item-section avatar><q-icon :name="child.icon" /></q-item-section>
              <q-item-section>{{ child.label }}</q-item-section>
            </q-item>
          </q-expansion-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@stores/auth';

interface MenuItem {
  to?: string;
  icon: string;
  label: string;
  children?: MenuChild[];
}

interface MenuChild {
  to: string;
  icon: string;
  label: string;
}

const drawer = ref(false);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const managementMenu: MenuChild[] = [
  { to: '/management/dashboard', icon: 'dashboard', label: 'Дашборд' },
  { to: '/management/campaigns', icon: 'domain', label: 'Компании' },
  { to: '/management/applications', icon: 'assignment', label: 'Заявки по компаниям' },
  { to: '/management/generator', icon: 'link', label: 'Генератор ссылок' },
];
const isManagementRoute = computed(() => route.path.startsWith('/management/'));
const managementExpanded = ref(false);
const manualMenuExpansion = ref<Record<string, boolean>>({});

/** Определяет, открыт ли сейчас один из дочерних маршрутов группы меню. */
function hasActiveChildRoute(children: MenuChild[]): boolean {
  return children.some((child) => route.path === child.to || route.path.startsWith(`${child.to}/`));
}

const isManagementExpanded = computed(
  () => hasActiveChildRoute(managementMenu) || managementExpanded.value,
);

/** Сохраняет ручное раскрытие рекламы только вне её активных маршрутов. */
function updateManagementExpanded(expanded: boolean): void {
  if (!hasActiveChildRoute(managementMenu)) {
    managementExpanded.value = expanded;
  }
}

/** Возвращает раскрытое состояние группы, включая обязательное раскрытие активного route. */
function isMenuGroupExpanded(item: MenuItem): boolean {
  if (!item.children) {
    return false;
  }

  return hasActiveChildRoute(item.children) || manualMenuExpansion.value[item.label] === true;
}

/** Сохраняет ручное состояние только для группы без активного дочернего route. */
function updateMenuGroupExpanded(item: MenuItem, expanded: boolean): void {
  if (item.children && !hasActiveChildRoute(item.children)) {
    manualMenuExpansion.value[item.label] = expanded;
  }
}

const menu: MenuItem[] = [
  { to: '/orders', icon: 'list_alt', label: 'Заявки' },
  { to: '/site-leads', icon: 'mark_email_unread', label: 'Заявки сайта' },
  { to: '/users', icon: 'people', label: 'Пользователи' },
  { to: '/admins', icon: 'admin_panel_settings', label: 'Админы' },
  { to: '/rates', icon: 'trending_up', label: 'Курсы' },
  {
    icon: 'token',
    label: 'ATXG',
    children: [
      { to: '/aex/rates', icon: 'tune', label: 'Настройки ставок' },
      { to: '/aex/wallets', icon: 'account_balance_wallet', label: 'Кошельки' },
      { to: '/aex/journal', icon: 'receipt_long', label: 'Журнал операций' },
      { to: '/aex/manual-ops', icon: 'edit_note', label: 'Ручные операции' },
    ],
  },
  { to: '/broadcasts', icon: 'campaign', label: 'Рассылка' },
  { to: '/settings', icon: 'settings', label: 'Настройки' },
];

async function handleLogout() {
  await authStore.logout();
  await router.push('/login');
}
</script>
