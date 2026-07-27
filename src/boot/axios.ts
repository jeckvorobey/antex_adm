import axios from 'axios';
import { boot } from 'quasar/wrappers';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;

function doRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = localStorage.getItem('admin_refresh_token');
      if (!refresh) throw new Error('No refresh token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refresh}` } },
      );
      localStorage.setItem('admin_access_token', res.data.access_token);
      localStorage.setItem('admin_refresh_token', res.data.refresh_token);
      return res.data.access_token as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const newToken = await doRefresh();
        err.config.headers.Authorization = `Bearer ${newToken}`;
        return api(err.config);
      } catch {
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        window.location.href = '/login';
        return new Promise(() => {});
      }
    }
    return Promise.reject(err);
  },
);

export default boot(({ app }) => {
  app.config.globalProperties.$api = api;
});

export { api };
