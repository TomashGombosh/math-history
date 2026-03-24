<template>
  <div class="admin-wrapper">
    <div v-if="loading">Завантаження…</div>

    <div v-else-if="graduate">
      <AdminGraduateEditForm :graduate="graduate" @saved="goToList" />
    </div>

    <div v-else>Випуск не знайдено.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from "vue";

definePageMeta({
  middleware: "admin",
});

const router = useRouter();
const route = useRoute();

const { token } = useAuth();
const authHeaders = computed(() =>
  token?.value ? { Authorization: `Bearer ${token.value}` } : {}
);

const yearParam = computed(() => Number(route.params.year));

const graduate = ref(null);
const loading = ref(true);

async function loadGraduate() {
  loading.value = true;
  graduate.value = null;

  try {
    const res = await $fetch("/api/graduates", {
      query: { year: yearParam.value },
      headers: authHeaders.value,
    });

    if (Array.isArray(res) && res.length > 0) {
      graduate.value = res[0];
    } else {
      graduate.value = null;
    }
  } catch (e) {
    console.error(e);
    graduate.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(loadGraduate);
onActivated(loadGraduate);

function goToList() {
  router.push("/admin/graduates");
}
</script>

<style scoped>
.admin-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  background: #fff;
}
</style>
