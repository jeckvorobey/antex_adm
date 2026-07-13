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
          :header-class="isManagementRoute ? 'text-primary' : ''"
          @click="openManagement"
        >
          <q-item
            v-for="item in managementMenu"
            :key="item.to"
            clickable
            :to="item.to"
            active-class="text-primary"
            class="q-pl-xl"
          >
            <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-expansion-item>
        <q-item
          v-for="item in menu"
          :key="item.to"
          clickable
          :to="item.to"
          active-class="text-primary"
        >
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
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

const drawer = ref(false);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const menu = [
  { to: '/orders', icon: 'list_alt', label: 'Заявки' },
  { to: '/site-leads', icon: 'mark_email_unread', label: 'Заявки сайта' },
  { to: '/users', icon: 'people', label: 'Пользователи' },
  { to: '/admins', icon: 'admin_panel_settings', label: 'Админы' },
  { to: '/rates', icon: 'trending_up', label: 'Курсы' },
  { to: '/broadcasts', icon: 'campaign', label: 'Рассылка' },
  { to: '/settings', icon: 'settings', label: 'Настройки' },
];

const managementMenu = [
  { to: '/management/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/management/campaigns', icon: 'campaign', label: 'Кампании' },
  { to: '/management/applications', icon: 'assignment', label: 'Заявки по кампаниям' },
  { to: '/management/generator', icon: 'link', label: 'Генератор ссылок' },
];
const isManagementRoute = computed(() => route.path.startsWith('/management/'));
const managementExpanded = ref(isManagementRoute.value);

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
