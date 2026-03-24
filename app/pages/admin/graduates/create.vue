<template>
  <AdminGraduateCreateForm @saved="goToYear" />
</template>

<script setup>
definePageMeta({
  middleware: "admin",
});

const router = useRouter();

function goToYear(year) {
  router.push(`/graduates/${year}`);
}
</script>
