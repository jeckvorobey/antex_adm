<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Заявки</div>
    <q-table
      :rows="orders"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from 'src/boot/axios';

const orders = ref([]);
const loading = ref(false);

const columns = [
  { name: 'id', label: '#', field: 'id', sortable: true },
  { name: 'UserId', label: 'Пользователь', field: 'UserId' },
  { name: 'currencySell', label: 'Отдаёт', field: (r: any) => `${r.amountSell} ${r.currencySell}` },
  { name: 'currencyBuy', label: 'Получает', field: (r: any) => `${r.amountBuy} ${r.currencyBuy}` },
  { name: 'status', label: 'Статус', field: 'status' },
  { name: 'createdAt', label: 'Создана', field: 'createdAt' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/admin/orders');
    orders.value = res.data;
  } catch {
    orders.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
