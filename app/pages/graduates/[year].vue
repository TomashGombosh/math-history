<template>
  <div class="graduates-year-page">
    <h1>Випуск {{ year }} року</h1>

    <p class="page-intro">
      На цій сторінці подано список випускників математичного факультету УжНУ
      {{ year }} року за спеціальностями та формами навчання. Відмінники
      виділені жирним шрифтом.
    </p>

    <div class="years-table">
      <NuxtLink
        v-for="y in years"
        :key="y.year"
        :to="`/graduates/${y.year}`"
        class="year-cell"
        :class="{ active: y.year === year }"
      >
        {{ y.year }}
      </NuxtLink>
    </div>

    <div v-if="pending" class="loading">Завантаження…</div>
    <div v-else-if="error" class="error">
      Помилка завантаження даних для {{ year }} року
    </div>

    <div v-else-if="!yearInfo">Дані для цього року не знайдені</div>

    <div v-else class="year-content">
      <h2 class="year-title">{{ yearInfo.title }}</h2>

      <div
        v-for="group in groupedStudents"
        :key="group.key"
        class="students-group"
      >
        <h3 class="group-title">
          {{ group.specialty }}
          <span v-if="group.section && group.section !== 'Немає'">
            ({{ group.section }})
          </span>
        </h3>

        <ol class="students-list">
          <li
            v-for="student in group.students"
            :key="student.id"
            :class="{ 'is-honors': student.isHonors }"
          >
            {{ student.index }}. {{ student.name }}
          </li>
        </ol>

        <div v-if="group.images && group.images.length" class="group-photos">
          <div
            v-for="(img, imgIndex) in group.images"
            :key="img.id || img.url"
            class="group-photo"
            @click="openLightbox(group.images, imgIndex)"
          >
            <picture v-if="img.url">
              <source :srcset="getWebpUrl(img.url)" type="image/webp" />
              <img
                :src="getOriginalUrl(img.url)"
                :alt="
                  img.caption || `Фото випуску ${year} – ${group.specialty}`
                "
                loading="lazy"
                width="320"
                height="200"
              />
            </picture>

            <div v-if="img.caption" class="photo-caption">
              {{ img.caption }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <LightboxGallery
      v-model="isLightboxOpen"
      :images="lightboxImages"
      :start-index="lightboxStartIndex"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { usePageSeo } from "~/composables/usePageSeo";
import LightboxGallery from "~/components/LightboxGallery.vue";

const siteUrl = "http://localhost:3000";

const route = useRoute();
const year = computed(() => Number(route.params.year));

usePageSeo({
  title: `Випуск ${year.value} року`,
  description: `Випуск ${year.value} року студентів-математиків УжНУ: список випускників за спеціальностями, відмінники та фото груп.`,
  path: `/graduates/${year.value}`,
  type: "website",
  image: "/favicon.ico",
});

useHead(() => ({
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
            name: "Роки випуску",
            item: `${siteUrl}/graduates`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `Випуск ${year.value} року`,
            item: `${siteUrl}/graduates/${year.value}`,
          },
        ],
      }),
    },
  ],
}));

function getOriginalUrl(url) {
  return url || "";
}

function getWebpUrl(url) {
  if (!url) return "";
  return url
    .replace("/images/", "/images-webp/")
    .replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

const {
  data: yearData,
  pending,
  error,
} = await useFetch(() => `/api/graduates/${year.value}`, {
  key: () => `graduates-year-${year.value}`,
  watch: [year],
});

const { data: yearsData } = await useFetch("/api/graduates/years", {
  key: "graduates-years-table",
});

const years = computed(() => yearsData.value || []);

const yearInfo = computed(() => yearData.value || null);

const groupedStudents = computed(() => {
  if (!yearInfo.value || !Array.isArray(yearInfo.value.students)) return [];

  const imagesBySpecialty = new Map();
  if (Array.isArray(yearInfo.value.images)) {
    for (const img of yearInfo.value.images) {
      const specName = img.specialty || "";
      if (!specName) continue;
      if (!imagesBySpecialty.has(specName)) {
        imagesBySpecialty.set(specName, []);
      }
      imagesBySpecialty.get(specName).push(img);
    }
  }

  const map = new Map();

  for (const st of yearInfo.value.students) {
    const specialty = st.specialty || "Математика";
    const section = st.section || "";
    const key = `${specialty}__${section}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        specialty,
        section,
        students: [],
        images: imagesBySpecialty.get(specialty) || [],
      });
    }

    const hasHonors =
      st.honorsDegree === true ||
      st.honorsDegree === "true" ||
      st.isBold === true ||
      st.isBold === "true";

    map.get(key).students.push({
      ...st,
      isHonors: hasHonors,
    });
  }

  for (const group of map.values()) {
    group.students.sort((a, b) => a.index - b.index);
  }

  return Array.from(map.values());
});

const isLightboxOpen = ref(false);
const lightboxImages = ref([]);
const lightboxStartIndex = ref(0);

function openLightbox(images, startIndex = 0) {
  if (!images || !images.length) return;
  lightboxImages.value = images;
  lightboxStartIndex.value = startIndex;
  isLightboxOpen.value = true;
}
</script>

<style scoped>
.graduates-year-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
  background: #ffffff;
}

h1 {
  margin-bottom: 10px;
}

.page-intro {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.years-table {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 8px 0 24px;
}

.year-cell {
  padding: 4px 10px;
  border: 1px solid #ccc;
  font-size: 12px;
  text-decoration: none;
  color: #000;
  background: #f9f9f9;
}

.year-cell:hover {
  background: #e6f2f2;
}

.year-cell.active {
  background: #19a0a0;
  color: #fff;
  font-weight: bold;
}

.year-title {
  margin-bottom: 16px;
}

.students-group {
  margin-top: 24px;
}

.group-title {
  margin-bottom: 8px;
}

.students-list {
  margin: 0 0 0 20px;
  padding: 0;
  column-count: 2;
  column-gap: 40px;
  display: inline-block;
}

.students-list li {
  break-inside: avoid;
  padding: 0 0 2px;
  font-size: 14px;
}

.is-honors {
  font-weight: bold;
}

.group-photos {
  margin: 12px 0 4px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.group-photo img {
  max-width: 320px;
  max-height: 100px;
  width: 100%;
  height: auto;
  display: block;
}

.photo-caption {
  font-size: 12px;
  color: #555;
  margin-top: 4px;
}

.loading,
.error {
  margin-top: 16px;
}

@media (max-width: 1024px) {
  .graduates-year-page {
    max-width: 100%;
    padding: 20px 12px;
  }

  .years-table {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .graduates-year-page {
    padding: 16px 10px;
  }

  h1 {
    font-size: 22px;
    text-align: center;
  }

  .page-intro {
    font-size: 13px;
    text-align: center;
  }

  .years-table {
    gap: 3px;
    margin-bottom: 16px;
    justify-content: center;
  }

  .year-cell {
    padding: 3px 8px;
    font-size: 11px;
  }

  .students-list {
    margin-left: 16px;
    column-count: 1;
    column-gap: 0;
  }

  .students-list li {
    font-size: 14px;
  }

  .group-photos {
    margin-left: 0;
    justify-content: center;
    flex-direction: column;
  }

  .group-photo img {
    max-height: 100%;
    max-width: 100%;
    width: 100%;
    max-width: 320px;
  }
}

@media (max-width: 480px) {
  .students-list {
    margin-left: 12px;
  }

  .year-cell {
    padding: 2px 6px;
  }
}
</style>
