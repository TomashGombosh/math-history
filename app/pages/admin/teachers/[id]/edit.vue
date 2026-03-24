<template>
  <div class="admin-wrapper">
    <div v-if="loading">Завантаження…</div>

    <div v-else-if="teacher">
      <AdminTeacherEditForm :teacher="teacher" @saved="goToList" />
    </div>

    <div v-else>Викладача не знайдено.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from "vue";

definePageMeta({
  middleware: "admin",
});

const router = useRouter();
const route = useRoute();

const id = computed(() => route.params.id);

const { token } = useAuth();
const authHeaders = computed(() =>
  token?.value ? { Authorization: `Bearer ${token.value}` } : {}
);

const teacher = ref(null);
const loading = ref(true);

async function loadTeacher() {
  loading.value = true;
  try {
    teacher.value = await $fetch(`/api/teachers/${id.value}`, {
      headers: authHeaders.value,
    });
  } catch (e) {
    console.error(e);
    teacher.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(loadTeacher);
onActivated(loadTeacher);

function goToList() {
  router.push("/admin/teachers");
}
</script>

<style scoped>
.admin-wrapper {
  margin: 0 auto;
  padding: 24px 16px;
  background: #fff;
}
</style>
