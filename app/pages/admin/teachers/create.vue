<template>
  <AdminTeacherCreateForm @saved="goToList" />
</template>

<script setup>
definePageMeta({
  middleware: "admin",
});

const router = useRouter();

function goToList() {
  router.push("/admin/teachers");
}
</script>
