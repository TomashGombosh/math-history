<template>
  <div class="admin-content">
    <div class="admin-table">
      <h1>Адміністрування випусків</h1>

      <div class="top-row">
        <NuxtLink to="/admin/graduates/create" class="btn-add">
          + Додати випуск
        </NuxtLink>
      </div>

      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Рік випуску</th>
            <th>К-ть випускників</th>
            <th>З відзнакою</th>
            <th>Дії</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(item, index) in pagedYears" :key="item.year">
            <td>{{ (page - 1) * limit + index + 1 }}</td>
            <td>{{ item.year }}</td>
            <td>{{ item.totalStudents }}</td>
            <td>{{ item.totalWithHonours }}</td>
            <td class="actions">
              <NuxtLink :to="`/admin/graduates/${item.year}/edit`">
                Редагувати
              </NuxtLink>

              <NuxtLink :to="`/graduates/${item.year}`"> Переглянути </NuxtLink>

              <button
                type="button"
                class="delete-btn"
                @click="onDelete(item.year)"
              >
                Видалити
              </button>
            </td>
          </tr>

          <tr v-if="!loading && pagedYears.length === 0">
            <td colspan="5" style="text-align: center; padding: 12px">
              Немає жодного випуску
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="loading" class="loading">Завантаження…</div>
      <div v-if="error" class="error">{{ error }}</div>

      <AppPagination
        :current-page="page"
        :total-pages="totalPages"
        @change="changePage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

definePageMeta({
  middleware: "admin",
});

const { token } = useAuth();
const authHeaders = computed(() =>
  token?.value ? { Authorization: `Bearer ${token.value}` } : {}
);

const yearsAll = ref([]);
const loading = ref(false);
const error = ref("");

const page = ref(1);
const limit = 20;

const totalPages = computed(() =>
  yearsAll.value.length ? Math.ceil(yearsAll.value.length / limit) : 1
);

const pagedYears = computed(() => {
  const start = (page.value - 1) * limit;
  return yearsAll.value.slice(start, start + limit);
});

async function loadYears() {
  loading.value = true;
  error.value = "";

  try {
    const data = await $fetch("/api/graduates/years");
    yearsAll.value = Array.isArray(data)
      ? data
          .map((row) => ({
            year: Number(row.year),
            totalStudents: Number(row.totalStudents) || 0,
            totalWithHonours: Number(row.totalWithHonours) || 0,
          }))
          .sort((a, b) => a.year - b.year)
      : [];
  } catch (e) {
    console.error(e);
    error.value = "Помилка завантаження списку випусків";
  } finally {
    loading.value = false;
  }
}

function changePage(n) {
  if (n < 1 || n > totalPages.value) return;
  page.value = n;
}

async function onDelete(year) {
  if (!confirm(`Точно видалити випуск за ${year} рік?`)) return;

  try {
    await $fetch(`/api/graduates/${year}`, {
      method: "DELETE",
      headers: authHeaders.value,
    });

    await loadYears();

    if (page.value > totalPages.value) {
      page.value = totalPages.value;
    }
  } catch (e) {
    console.error(e);
    alert("Помилка при видаленні випуску");
  }
}

onMounted(loadYears);
</script>

<style scoped>
.admin-content {
  background: #ffffff;
  padding: 0 20px;
}

.admin-table {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 0 30px;
}

.top-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 10px;
}

.btn-add {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #1976d2;
  background: #1976d2;
  color: #fff;
  text-decoration: none;
  font-size: 13px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #ccc;
  padding: 6px 8px;
  text-align: left;
  font-size: 13px;
}

th {
  background: #f5f5f5;
}

.actions {
  white-space: nowrap;
}

.actions a,
.actions button {
  margin-right: 6px;
  font-size: 13px;
}

.actions button {
  border: none;
  background: none;
  color: #c62828;
  cursor: pointer;
}

.loading {
  margin-top: 10px;
}

.error {
  margin-top: 10px;
  color: #d32f2f;
}

.delete-btn {
  border: none;
  background: none;
  color: #c62828;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.delete-btn:hover {
  color: #ff0000;
}

@media (max-width: 1024px) {
  .admin-content {
    padding: 0 12px;
  }

  .admin-table {
    padding: 16px 0;
  }

  th,
  td {
    padding: 5px 6px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .admin-content {
    padding: 0 8px;
  }

  .top-row {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-add {
    width: 100%;
    text-align: center;
  }

  .actions {
    white-space: normal;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .actions a,
  .actions button {
    margin-right: 0;
    text-align: left;
  }

  table {
    max-width: 320px;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .btn-add {
    font-size: 12px;
    padding: 5px 8px;
  }
}
</style>
