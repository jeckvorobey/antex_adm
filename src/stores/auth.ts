import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@boot/axios';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);

  const isAuthenticated = computed(() => !!accessToken.value);

  function restoreSession() {
    accessToken.value = localStorage.getItem('admin_access_token');
    refreshToken.value = localStorage.getItem('admin_refresh_token');
  }

  async function login(username: string, password: string) {
    const res = await api.post('/api/admin/login', { username, password });
    accessToken.value = res.data.access_token;
    refreshToken.value = res.data.refresh_token;
    localStorage.setItem('admin_access_token', accessToken.value as string);
    localStorage.setItem('admin_refresh_token', refreshToken.value as string);
  }

  async function logout() {
    await api.post('/api/admin/logout').catch(() => null);
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
  }

  return { accessToken, isAuthenticated, restoreSession, login, logout };
});
