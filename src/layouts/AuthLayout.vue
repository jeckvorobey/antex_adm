<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// Layout для публичных auth-страниц, чтобы route-level QPage всегда был дочерним для QLayout.
</script>
