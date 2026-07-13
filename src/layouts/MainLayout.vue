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
          v-model="managementExpanded"
          data-testid="management-menu"
          icon="monitoring"
          label="Менеджмент"
          :header-class="isManagementRoute ? 'text-primary' : 'text-weight-medium'"
          @click="openManagement"
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
            :default-opened="isAexExpanded"
            header-class="text-weight-medium"
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
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@stores/auth';

interface MenuItem {
  to?: string;
  icon: string;
  label: string;
  children?: { to: string; icon: string; label: string }[];
}

const drawer = ref(false);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const managementMenu = [
  { to: '/management/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/management/campaigns', icon: 'campaign', label: 'Кампании' },
  { to: '/management/applications', icon: 'assignment', label: 'Заявки по кампаниям' },
  { to: '/management/generator', icon: 'link', label: 'Генератор ссылок' },
];
const isManagementRoute = computed(() => route.path.startsWith('/management/'));
const managementExpanded = ref(isManagementRoute.value);
const isAexExpanded = computed(() => route.path.startsWith('/aex/'));

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

watch(isManagementRoute, (active) => {
  if (active) managementExpanded.value = true;
});

async function openManagement() {
  managementExpanded.value = true;
  if (!isManagementRoute.value) await router.push('/management/dashboard');
}

async function handleLogout() {
  await authStore.logout();
  await router.push('/login');
}
</script>
