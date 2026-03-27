import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('src/pages/LoginPage.vue'),
  },
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('src/pages/DashboardPage.vue') },
      { path: 'orders', name: 'orders', component: () => import('src/pages/OrdersPage.vue') },
      { path: 'users', name: 'users', component: () => import('src/pages/UsersPage.vue') },
      { path: 'cards', name: 'cards', component: () => import('src/pages/CardsPage.vue') },
      { path: 'banks', name: 'banks', component: () => import('src/pages/BanksPage.vue') },
      { path: 'rates', name: 'rates', component: () => import('src/pages/RatesPage.vue') },
      { path: 'settings', name: 'settings', component: () => import('src/pages/SettingsPage.vue') },
    ],
  },
  { path: '/:catchAll(.*)*', redirect: '/' },
];

export default routes;
