<template>
  <q-page class="flex flex-center">
    <q-card style="min-width: 350px">
      <q-card-section class="text-center">
        <div class="text-h5">AntEx Admin</div>
        <div class="text-subtitle2 text-grey">Вход в панель управления</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleLogin">
          <q-input
            v-model="username"
            label="Логин"
            outlined
            class="q-mb-md"
            :rules="[(v) => !!v || 'Обязательное поле']"
          />
          <q-input
            v-model="password"
            label="Пароль"
            type="password"
            outlined
            class="q-mb-md"
            :rules="[(v) => !!v || 'Обязательное поле']"
          />
          <q-btn
            type="submit"
            label="Войти"
            color="primary"
            class="full-width"
            :loading="loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';

const username = ref('');
const password = ref('');
const loading = ref(false);

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

async function handleLogin() {
  loading.value = true;
  try {
    await authStore.login(username.value, password.value);
    await router.push('/dashboard');
  } catch {
    $q.notify({ type: 'negative', message: 'Неверный логин или пароль' });
  } finally {
    loading.value = false;
  }
}
</script>
