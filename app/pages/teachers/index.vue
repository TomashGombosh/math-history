<template>
  <div class="page-wrapper">
    <div class="teachers-page">
      <h1>Викладачі математичного факультету УжНУ</h1>

      <p class="page-intro">
        На цій сторінці зібрані викладачі математичного факультету Ужгородського
        національного університету. Ви можете скористатися пошуком, фільтрами за
        посадою та науковим ступенем, а також сортуванням, щоб швидко знайти
        потрібного викладача.
      </p>

      <div class="search-wrapper">
        <label class="visually-hidden" for="teacher-search">
          Пошук викладача за ім'ям
        </label>
        <input
          id="teacher-search"
          v-model="search"
          @input="onSearchInput"
          class="search-input"
          type="text"
          placeholder="Пошук викладача за ім'ям…"
        />
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <h2>Посада</h2>
          <div class="filter-options">
            <label v-for="p in allPositions" :key="p">
              <input
                type="checkbox"
                :value="p"
                v-model="selectedPositions"
                @change="reloadFirstPage"
              />
              <span>{{ p }}</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <h2>Науковий ступінь</h2>
          <div class="filter-options">
            <label v-for="d in allDegrees" :key="d">
              <input
                type="checkbox"
                :value="d"
                v-model="selectedDegrees"
                @change="reloadFirstPage"
              />
              <span>{{ d }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="sort-bar">
        <div class="sort-controls">
          <div class="sort-control">
            <label class="visually-hidden" for="sort-by">
              Поле сортування
            </label>
            <select id="sort-by" v-model="sortBy" @change="reloadFirstPage">
              <option value="">Без сортування</option>
              <option value="name">За алфавітом (ім'я)</option>
              <option value="position">За посадою</option>
              <option value="degree">За науковим ступенем</option>
            </select>
          </div>

          <div class="sort-control">
            <label class="visually-hidden" for="sort-dir">
              Напрямок сортування
            </label>
            <select id="sort-dir" v-model="sortDir" @change="reloadFirstPage">
              <option value="asc">За зростанням</option>
              <option value="desc">За спаданням</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid">
        <NuxtLink
          v-for="(t, index) in teachers"
          :key="t.id"
          :to="`/teacher/${t.slug}`"
          class="card"
        >
          <div class="image-wrapper">
            <picture v-if="t.imageUrl">
              <source :srcset="getThumbWebpUrl(t.imageUrl)" type="image/webp" />

              <img
                :src="getOriginalUrl(t.imageUrl)"
                :alt="t.name"
                :loading="index === 0 ? 'eager' : 'lazy'"
                :fetchpriority="index === 0 ? 'high' : 'auto'"
              />
            </picture>
          </div>
          <div class="name">{{ t.name }}</div>
        </NuxtLink>
      </div>

      <AppPagination
        :current-page="page"
        :total-pages="totalPages"
        @change="changePage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { usePageSeo } from "~/composables/usePageSeo";

const siteUrl = "http://localhost:3000";

usePageSeo({
  title: "Викладачі",
  description:
    "Список викладачів-математиків Ужгородського національного університету з фільтрами за посадою, науковим ступенем та пошуком за ім’ям.",
  path: "/teachers",
  type: "website",
  image: "/favicon.ico",
});

useHead({
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Головна",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Викладачі",
            item: `${siteUrl}/teachers`,
          },
        ],
      }),
    },
  ],
});

function getOriginalUrl(imageUrl) {
  return imageUrl;
}

function getThumbWebpUrl(imageUrl) {
  if (!imageUrl) return null;

  return imageUrl
    .replace("/images/", "/images-thumbs-webp/")
    .replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

const teachers = ref([]);
const page = ref(1);
const totalPages = ref(1);

const limit = ref(24);
const search = ref("");

const allPositions = ref([]);
const allDegrees = ref([]);
const selectedPositions = ref([]);
const selectedDegrees = ref([]);

const sortBy = ref("");
const sortDir = ref("asc");

async function fetchFilters() {
  const data = await $fetch("/api/teachers/filters");
  allPositions.value = data.positions || [];
  allDegrees.value = data.degrees || [];
}

async function fetchTeachers(p = 1) {
  page.value = p;

  const params = {
    page: page.value,
    limit: limit.value,
    search: search.value,
    positions: selectedPositions.value,
    degrees: selectedDegrees.value,
  };

  if (sortBy.value) {
    params.sortBy = sortBy.value;
    params.sortDir = sortDir.value;
  }

  const data = await $fetch("/api/teachers", { params });

  teachers.value = data.teachers || [];
  totalPages.value = data.totalPages || 1;
}

function changePage(n) {
  if (n < 1 || n > totalPages.value) return;
  fetchTeachers(n);
}

let searchTimeout = null;
function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchTeachers(1);
  }, 300);
}

function reloadFirstPage() {
  fetchTeachers(1);
}

onMounted(async () => {
  if (window.innerWidth <= 768) {
    limit.value = 12;
  }

  await fetchFilters();
  await fetchTeachers(1);
});
</script>

<style scoped>
.page-wrapper {
  background: #a3c8f2;
  min-height: 100vh;
  padding: 30px 0;
}

.teachers-page {
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
  background: #ffffff;
  padding: 20px 25px 30px;
  border-radius: 10px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

h1 {
  margin-bottom: 10px;
}

.page-intro {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.search-input {
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
}

.filters-row {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.filter-group {
  min-width: 220px;
  font-size: 13px;
}

.filter-group h2 {
  margin-bottom: 6px;
  font-size: 14px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 140px;
  overflow-y: auto;
}

.filter-options label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.sort-controls {
  display: flex;
  gap: 8px;
}

.sort-control select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 20px;
}

.card {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  background: #f5f8ff;
  border: 1px solid #e1e7ff;
  transition: 0.2s;
}

.card:hover {
  transform: scale(1.03);
}

.image-wrapper {
  height: 200px;
  margin: 0 auto;
  overflow: hidden;
  background: #f3f3f3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  margin-top: 8px;
  font-size: 14px;
  text-align: center;
}

@media (max-width: 1024px) {
  .page-wrapper {
    padding: 20px 0;
  }

  .teachers-page {
    padding: 16px 16px 22px;
  }

  .filters-row {
    gap: 24px;
  }

  .filter-group {
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 16px 0;
  }

  .teachers-page {
    padding: 14px 12px 20px;
    border-radius: 6px;
  }

  h1 {
    font-size: 22px;
    margin-bottom: 6px;
  }

  .page-intro {
    font-size: 13px;
  }

  .search-input {
    font-size: 13px;
    padding: 6px 8px;
  }

  .filters-row {
    flex-direction: column;
    gap: 16px;
  }

  .filter-group {
    min-width: auto;
  }

  .filter-options {
    max-height: 120px;
  }

  .sort-bar {
    justify-content: flex-start;
  }

  .sort-controls {
    width: 100%;
  }

  .sort-control select {
    flex: 1;
    font-size: 12px;
    padding: 4px 6px;
  }

  .grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 14px;
  }

  .image-wrapper {
    height: 180px;
  }

  .name {
    font-size: 13px;
  }

  .pagination {
    margin-top: 16px;
  }

  .page-btn {
    padding: 3px 8px;
    font-size: 12px;
  }
}
</style>
