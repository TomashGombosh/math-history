<!-- pages/admin/layout.vue -->
<template>
  <div class="admin-wrapper">
    <AdminLayoutSettings />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: "admin",
});
</script>

<style scoped>
.admin-wrapper {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
  background: #ffffff;
}
</style>
