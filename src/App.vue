<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>
<template>
  <header>
    <h1 class="text-3xl font-medium uppercase text-center my-5">
      One Time Secret
    </h1>
  </header>

  <RouterView />

  <footer class="fixed left-0 bottom-0 text-center text-sm w-full px-2 py-1 bg-slate-300 text-slate-900">
    <p>
      This application is created for practice and learning purposes. It is
      not intended for production use.
    </p>
  </footer>
</template>
