<template>
  <div class="admin-content">
    <div class="admin-table">
      <h1>Адміністрування викладачів</h1>

      <div class="top-row">
        <NuxtLink to="/admin/teachers/create" class="btn-add">
          + Додати викладача
        </NuxtLink>

        <input
          v-model="search"
          @input="onSearchInput"
          class="search-input"
          type="text"
          placeholder="Пошук викладача за ім'ям…"
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Фото</th>
            <th class="col-name">Ім'я</th>
            <th class="col-faculty">Факультет</th>
            <th class="col-position">Посада</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, index) in teachers" :key="t.id">
            <td>{{ (page - 1) * limit + index + 1 }}</td>

            <td class="photo-cell">
              <picture v-if="t.imageUrl">
                <source :srcset="getWebpUrl(t.imageUrl)" type="image/webp" />
                <img
                  :src="getOriginalUrl(t.imageUrl)"
                  :alt="t.name"
                  loading="lazy"
                />
              </picture>
            </td>

            <td class="col-name">{{ t.name }}</td>
            <td class="col-faculty">{{ t.faculty }}</td>
            <td class="col-position">{{ t.position }}</td>

            <td class="actions">
              <NuxtLink :to="`/admin/teachers/${t.id}/edit`"
                >Редагувати</NuxtLink
              >
              <NuxtLink :to="`/teacher/${t.slug}`">Переглянути</NuxtLink>
              <button type="button" class="delete-btn" @click="onDelete(t.id)">
                Видалити
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="loading" class="loading">Завантаження…</div>
      <div v-if="error" class="error">{{ error }}</div>

      <AppPagination
        v-if="totalPages > 1"
        :current-page="page"
        :total-pages="totalPages"
        @change="changePage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from "vue";

definePageMeta({
  middleware: "admin",
});

const { token } = useAuth();
const authHeaders = computed(() =>
  token?.value ? { Authorization: `Bearer ${token.value}` } : {}
);

const teachers = ref([]);

const page = ref(1);
const totalPages = ref(1);
const limit = 20;
const search = ref("");

const loading = ref(false);
const error = ref("");

function getOriginalUrl(imageUrl) {
  return imageUrl || "";
}

function getWebpUrl(imageUrl) {
  if (!imageUrl) return null;

  return imageUrl
    .replace("/images/", "/images-webp/")
    .replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

async function loadTeachers(p = 1) {
  loading.value = true;
  error.value = "";
  page.value = p;

  try {
    const res = await $fetch("/api/teachers", {
      query: {
        page: page.value,
        limit,
        search: search.value,
      },
      headers: authHeaders.value,
    });

    const list = Array.isArray(res) ? res : res.teachers ?? [];
    teachers.value = list.sort((a, b) => a.id - b.id);
    totalPages.value = res.totalPages ?? 1;
  } catch (e) {
    console.error(e);
    error.value = "Помилка завантаження викладачів";
  } finally {
    loading.value = false;
  }
}

let searchTimeout = null;
function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadTeachers(1);
  }, 300);
}

function changePage(n) {
  if (n < 1 || n > totalPages.value) return;
  loadTeachers(n);
}

onMounted(() => {
  loadTeachers(1);
});

onActivated(() => {
  loadTeachers(page.value);
});

async function onDelete(id) {
  if (!confirm("Точно видалити викладача?")) return;

  try {
    await $fetch(`/api/teachers/${id}`, {
      method: "DELETE",
      headers: authHeaders.value,
    });

    if (teachers.value.length === 1 && page.value > 1) {
      await loadTeachers(page.value - 1);
    } else {
      await loadTeachers(page.value);
    }
  } catch (err) {
    console.error(err);
    alert("Помилка при видаленні викладача");
  }
}
</script>

<style scoped>
.admin-content {
  background: white;
  padding: 0 20px;
}

.admin-table {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 0;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
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

.search-input {
  flex: 1;
  padding: 8px 10px;
  margin: 10px 0 14px;
  border-radius: 6px;
  border: 1px solid #ccc;
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

.photo-cell {
  width: 70px;
}

.photo-cell img {
  max-width: 60px;
  max-height: 80px;
  object-fit: cover;
}

.col-name {
  white-space: normal;
}

.actions {
  white-space: nowrap;
}

.actions a {
  margin-right: 6px;
}

.actions button {
  font-size: 12px;
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

  .search-input {
    width: 100%;
    margin: 6px 0 10px;
  }

  th.col-faculty,
  td.col-faculty,
  th.col-position,
  td.col-position {
    display: none;
  }

  .actions {
    white-space: normal;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .actions a,
  .actions button {
    margin-right: 0;
    text-align: left;
  }

  table {
    max-width: 300px;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .btn-add {
    font-size: 12px;
    padding: 5px 8px;
  }

  .search-input {
    font-size: 12px;
    padding: 7px 8px;
  }
}
</style>
