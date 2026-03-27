import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@pages/LoginPage.vue'),
  },
  {
    path: '/',
    component: () => import('@layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('@pages/DashboardPage.vue') },
      { path: 'orders', name: 'orders', component: () => import('@pages/OrdersPage.vue') },
      { path: 'users', name: 'users', component: () => import('@pages/UsersPage.vue') },
      { path: 'cards', name: 'cards', component: () => import('@pages/CardsPage.vue') },
      { path: 'banks', name: 'banks', component: () => import('@pages/BanksPage.vue') },
      { path: 'rates', name: 'rates', component: () => import('@pages/RatesPage.vue') },
      { path: 'settings', name: 'settings', component: () => import('@pages/SettingsPage.vue') },
    ],
  },
  { path: '/:catchAll(.*)*', redirect: '/' },
];

export default routes;
