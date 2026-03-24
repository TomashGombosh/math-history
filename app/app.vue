<template>
  <div class="app">
    <MainHeader />

    <main class="content">
      <NuxtPage keepalive />
    </main>

    <MainFooter />
  </div>
</template>

<script setup>
import MainHeader from "@/components/MainHeader.vue";
import MainFooter from "@/components/MainFooter.vue";
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #a3c8f2;
  display: flex;
  flex-direction: column;
}

.content {
  padding: 16px 24px 32px;
  margin: 0 auto;
  padding-top: 120px;
  width: 100%;
}
</style>
