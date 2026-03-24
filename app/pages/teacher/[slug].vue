<template>
  <div class="page-wrapper">
    <div class="teacher-page">
      <div v-if="pending">Завантаження...</div>

      <div v-else-if="error || !teacher">Викладача не знайдено</div>

      <div v-else class="content">
        <div class="header">
          <div class="photo">
            <picture v-if="teacher.imageUrl">
              <source
                :srcset="getWebpUrl(teacher.imageUrl)"
                type="image/webp"
              />

              <img
                :src="teacher.imageUrl"
                :alt="teacher.name"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </picture>

            <div v-else class="photo-skeleton">Фото</div>
          </div>

          <div class="info">
            <h1>{{ teacher.name }}</h1>

            <template
              v-for="(field, idx) in sortedHeaderFields"
              :key="field.id || idx"
            >
              <p v-if="hasHeaderValue(field.id)">
                {{ getHeaderValue(field.id) }}
              </p>
            </template>
          </div>
        </div>

        <template v-for="(sec, idx) in sortedSections" :key="sec.id || idx">
          <section
            v-if="sec.visible && hasSectionContent(sec.id)"
            class="section"
          >
            <h2>{{ sec.title }}</h2>

            <p v-if="sec.id === 'shortInformation'" class="multiline">
              {{ teacher.shortInformation }}
            </p>

            <p v-else-if="sec.id === 'bio'" class="multiline">
              {{ teacher.bio }}
            </p>

            <ol v-else-if="sec.id === 'publications'" class="pub-list">
              <li v-for="pub in teacher.publications" :key="pub.index">
                <span v-if="pub.year">({{ pub.year }}) </span>{{ pub.text }}
              </li>
            </ol>
          </section>
        </template>

        <div class="back-link">
          <NuxtLink to="/teachers">← Повернутися до списку</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { usePageSeo } from "~/composables/usePageSeo";

const siteUrl = "http://localhost:3000";

const route = useRoute();
const slug = computed(() => route.params.slug);

const { data, pending, error } = await useFetch(
  () => `/api/teachers/by-slug/${slug.value}`
);

const teacher = computed(() => data.value);

const pagePath = computed(() => `/teacher/${slug.value}`);

if (teacher.value) {
  const t = teacher.value;
  const degreePart = t.academicDegree ? `${t.academicDegree}, ` : "";
  const positionPart = t.position ? `${t.position}, ` : "";
  const facultyPart = t.faculty || "УжНУ";

  usePageSeo({
    title: `${t.name} — викладач математичного факультету УжНУ`,
    description: `${degreePart}${positionPart}${facultyPart}`,
    path: pagePath.value,
    type: "profile",
    image: t.imageUrl || "/favicon.ico",
  });
} else {
  usePageSeo({
    title: "Викладач",
    description: "Сторінка викладача математичного факультету УжНУ.",
    path: pagePath.value,
    type: "profile",
    image: "/favicon.ico",
  });
}

useHead(() => {
  if (!teacher.value) {
    return {};
  }

  const t = teacher.value;

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t.name,
    jobTitle: t.position || undefined,
    affiliation: "Ужгородський національний університет",
    image: t.imageUrl ? siteUrl + t.imageUrl : undefined,
    url: siteUrl + pagePath.value,
  };

  const breadcrumbJsonLd = {
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
      {
        "@type": "ListItem",
        position: 3,
        name: t.name,
        item: `${siteUrl}${pagePath.value}`,
      },
    ],
  };

  return {
    script: [
      {
        type: "application/ld+json",
        children: JSON.stringify(personJsonLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbJsonLd),
      },
    ],
  };
});

function getWebpUrl(imageUrl) {
  if (!imageUrl) return null;
  return imageUrl
    .replace("/images/", "/images-webp/")
    .replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

const headerFieldDefs = [
  { id: "title", label: "Title" },
  { id: "academicDegree", label: "Науковий ступінь" },
  { id: "position", label: "Посада" },
  { id: "faculty", label: "Факультет" },
];

const sectionDefs = [
  { id: "shortInformation", title: "Коротка інформація" },
  { id: "bio", title: "Біографія" },
  { id: "publications", title: "Публікації" },
];

function normalizeLayout(raw = {}) {
  const result = { headerFields: [], sections: [] };

  if (Array.isArray(raw.headerFields)) {
    result.headerFields = raw.headerFields
      .filter((h) => h && h.id)
      .map((h, idx) => ({
        id: h.id,
        label:
          h.label || headerFieldDefs.find((d) => d.id === h.id)?.label || h.id,
        visible: h.visible !== undefined ? !!h.visible : true,
        order:
          typeof h.order === "number" && !Number.isNaN(h.order)
            ? h.order
            : idx + 1,
      }));
  } else if (raw.headerFields && typeof raw.headerFields === "object") {
    result.headerFields = headerFieldDefs.map((def, idx) => ({
      id: def.id,
      label: def.label,
      visible:
        raw.headerFields[def.id] !== undefined
          ? !!raw.headerFields[def.id]
          : true,
      order: idx + 1,
    }));
  } else {
    result.headerFields = headerFieldDefs.map((def, idx) => ({
      id: def.id,
      label: def.label,
      visible: true,
      order: idx + 1,
    }));
  }

  if (Array.isArray(raw.sections)) {
    result.sections = raw.sections
      .filter((s) => s && s.id)
      .map((s, idx) => ({
        id: s.id,
        title: s.title || sectionDefs.find((d) => d.id === s.id)?.title || s.id,
        visible: s.visible !== undefined ? !!s.visible : true,
        order:
          typeof s.order === "number" && !Number.isNaN(s.order)
            ? s.order
            : idx + 1,
      }));
  } else {
    result.sections = sectionDefs.map((def, idx) => ({
      id: def.id,
      title: def.title,
      visible: true,
      order: idx + 1,
    }));
  }

  result.headerFields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  result.sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return result;
}

const { data: layoutData } = await useFetch("/api/layout");
const layout = ref(normalizeLayout(layoutData.value || {}));

const sortedHeaderFields = computed(() =>
  (layout.value.headerFields || []).filter((f) => f && f.visible)
);

const sortedSections = computed(() =>
  (layout.value.sections || []).filter((s) => !!s)
);

function hasHeaderValue(id) {
  if (!teacher.value) return false;
  if (id === "title") return !!teacher.value.title;
  if (id === "academicDegree") return !!teacher.value.academicDegree;
  if (id === "position") return !!teacher.value.position;
  if (id === "faculty") return !!teacher.value.faculty;
  return false;
}

function getHeaderValue(id) {
  if (!teacher.value) return "";
  if (id === "title") return teacher.value.title;
  if (id === "academicDegree") return teacher.value.academicDegree;
  if (id === "position") return teacher.value.position;
  if (id === "faculty") return teacher.value.faculty;
  return "";
}

function hasSectionContent(id) {
  if (!teacher.value) return false;
  if (id === "shortInformation") return !!teacher.value.shortInformation;
  if (id === "bio") return !!teacher.value.bio;
  if (id === "publications")
    return teacher.value.publications && teacher.value.publications.length > 0;
  return false;
}
</script>

<style scoped>
.page-wrapper {
  background: #a3c8f2;
  min-height: 100vh;
  padding: 30px 0;
}

.teacher-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 24px 24px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.content {
  width: 100%;
}

.header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.photo {
  flex-shrink: 0;
  width: 220px;
  aspect-ratio: 4 / 5;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-skeleton {
  font-size: 13px;
  color: #777;
}

.info {
  flex: 1;
}

.info h1 {
  margin: 0 0 8px;
  font-size: 24px;
}

.info p {
  margin: 2px 0;
}

.section {
  margin-bottom: 20px;
}

.section h2 {
  margin-bottom: 8px;
  font-size: 18px;
}

.multiline {
  white-space: pre-line;
}

.pub-list {
  padding-left: 20px;
}

.back-link {
  margin-top: 16px;
  text-align: right;
}

.back-link a {
  color: #1d5ac6;
  text-decoration: none;
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 16px 0;
  }

  .teacher-page {
    margin: 0 8px;
    padding: 14px 12px 20px;
    border-radius: 6px;
  }

  .header {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .photo {
    width: 100%;
    max-width: 280px;
    aspect-ratio: 4 / 5;
  }

  .info {
    width: 100%;
  }

  .info h1 {
    font-size: 22px;
    line-height: 1.2;
    text-align: center;
  }

  .info p {
    font-size: 13px;
  }

  .section h2 {
    font-size: 17px;
  }

  .back-link {
    text-align: left;
    margin-top: 20px;
  }
}
</style>
