import { boot } from 'quasar/wrappers';
import { useAuthStore } from '@stores/auth';

export default boot(async ({ router }) => {
  const authStore = useAuthStore();
  authStore.restoreSession();

  router.beforeEach((to) => {
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return { name: 'login' };
    }
  });
});
