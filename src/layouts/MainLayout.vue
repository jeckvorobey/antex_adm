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
        <q-item v-for="item in menu" :key="item.to" clickable :to="item.to" active-class="text-primary">
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@stores/auth';

const drawer = ref(false);
const router = useRouter();
const authStore = useAuthStore();

const menu = [
  { to: '/dashboard', icon: 'dashboard', label: 'Дашборд' },
  { to: '/orders', icon: 'list_alt', label: 'Заявки' },
  { to: '/users', icon: 'people', label: 'Пользователи' },
  { to: '/cards', icon: 'credit_card', label: 'Карты' },
  { to: '/banks', icon: 'account_balance', label: 'Банки' },
  { to: '/rates', icon: 'trending_up', label: 'Курсы' },
  { to: '/settings', icon: 'settings', label: 'Настройки' },
];

async function handleLogout() {
  await authStore.logout();
  await router.push('/login');
}
</script>
