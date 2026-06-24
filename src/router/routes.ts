import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@pages/LoginPage.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('@layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('@pages/DashboardPage.vue') },
      { path: 'orders', name: 'orders', component: () => import('@pages/OrdersPage.vue') },
      { path: 'site-leads', name: 'site-leads', component: () => import('@pages/SiteLeadsPage.vue') },
      { path: 'users', name: 'users', component: () => import('@pages/UsersPage.vue') },
      { path: 'admins', name: 'admins', component: () => import('@pages/AdminsPage.vue') },
      { path: 'rates', name: 'rates', component: () => import('@pages/RatesPage.vue') },
      { path: 'broadcasts', name: 'broadcasts', component: () => import('@pages/BroadcastsPage.vue') },
      { path: 'settings', name: 'settings', component: () => import('@pages/SettingsPage.vue') },
      { path: 'aex/rates', name: 'aex-rates', component: () => import('@pages/aex/AexRatesSettingsPage.vue') },
      { path: 'aex/wallets', name: 'aex-wallets', component: () => import('@pages/aex/AexWalletsPage.vue') },
      { path: 'aex/journal', name: 'aex-journal', component: () => import('@pages/aex/AexJournalPage.vue') },
      { path: 'aex/manual-ops', name: 'aex-manual-ops', component: () => import('@pages/aex/AexManualOpsPage.vue') },
    ],
  },
  { path: '/:catchAll(.*)*', redirect: '/' },
];

export default routes;
