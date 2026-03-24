<template>
  <div class="home">
    <section class="home-block intro-section">
      <h1>Математики УжНУ — історія викладачів та випускників</h1>

      <p>
        Цей сайт створений для збереження та представлення історії математичного
        факультету Ужгородського національного університету. Тут зібрано
        інформацію про викладачів, які формували факультет у різні роки,
        займалися науковою діяльністю, навчали студентів та зробили вагомий
        внесок у розвиток математичної освіти на Закарпатті.
      </p>

      <p>
        Окрім викладачів, на сайті можна переглядати списки випускників
        факультету за роками. Для кожного року вказано кількість студентів, а
        також кількість тих, хто закінчив навчання з відзнакою. Це допомагає
        простежити розвиток факультету, кількісні зміни та успішність студентів
        у різні періоди.
      </p>
    </section>

    <section class="home-block">
      <div class="home-header">
        <h2>Викладачі</h2>
        <NuxtLink to="/teachers" class="home-link"> Усі викладачі → </NuxtLink>
      </div>

      <div class="teachers-grid">
        <NuxtLink
          v-for="(t, index) in teachers"
          :key="t.id"
          :to="`/teacher/${t.slug}`"
          class="teacher-card"
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
          <div class="t-name">{{ t.name }}</div>
        </NuxtLink>
      </div>

      <div class="home-footer-link">
        <NuxtLink to="/teachers" class="home-link">
          Переглянути всіх викладачів →
        </NuxtLink>
      </div>
    </section>

    <section class="home-block">
      <div class="home-header">
        <h2>Роки випуску</h2>
        <NuxtLink to="/graduates" class="home-link"> Усі випуски → </NuxtLink>
      </div>

      <div class="years-grid">
        <NuxtLink
          v-for="item in years"
          :key="item.year"
          :to="`/graduates/${item.year}`"
          class="year-card"
        >
          <div class="year-card__year">{{ item.year }}</div>
          <div class="year-card__stats">
            <div>К-ть випускників: {{ item.totalStudents }}</div>
            <div>З відзнакою: {{ item.totalWithHonours }}</div>
          </div>
        </NuxtLink>
      </div>

      <div class="home-footer-link">
        <NuxtLink to="/graduates" class="home-link">
          Переглянути всі роки випуску →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { usePageSeo } from "~/composables/usePageSeo";

usePageSeo({
  title: "Головна",
  description:
    "Математики УжНУ — історія викладачів та випускників математичного факультету Ужгородського національного університету.",
  path: "/",
  type: "website",
  image: "/favicon.ico",
});

const siteUrl = "http://localhost:3000";

useHead({
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            url: siteUrl,
            name: "Math History — Ужгородський національний університет",
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteUrl}/teachers?search={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@type": "Organization",
            name: "Математичний факультет УжНУ",
            url: siteUrl,
            logo: `${siteUrl}/favicon.ico`,
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
const years = ref([]);

async function fetchTeachersPreview() {
  const data = await $fetch("/api/teachers", {
    params: {
      page: 1,
      limit: 12,
    },
  });

  teachers.value = data.teachers || [];
}

async function fetchYearsPreview() {
  const data = await $fetch("/api/graduates/years");

  years.value = (data || []).sort((a, b) => b.year - a.year).slice(0, 12);
}

onMounted(async () => {
  await Promise.all([fetchTeachersPreview(), fetchYearsPreview()]);
});
</script>

<style scoped>
.home {
  max-width: 1300px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  background: #ffffff;
  min-height: 50vh;
  box-sizing: border-box;
}

.home-block + .home-block {
  margin-top: 40px;
}

.intro-section h1 {
  margin-bottom: 14px;
}

.intro-section p {
  margin-bottom: 12px;
  line-height: 1.6;
  font-size: 15px;
}

.home-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.home-header h2 {
  font-size: 22px;
  margin: 0;
}

.home-link {
  font-size: 14px;
  text-decoration: underline;
}

.home-footer-link {
  margin-top: 16px;
  text-align: right;
}

.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 18px;
}

.teacher-card {
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

.teacher-card:hover {
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

.t-name {
  margin-top: 8px;
  font-size: 14px;
  text-align: center;
}

.years-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.year-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 140px;
  padding: 12px 8px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  text-decoration: none;
  color: inherit;
  box-sizing: border-box;
}

.year-card__year {
  font-weight: bold;
  margin-bottom: 8px;
  color: #006d7a;
}

.year-card__stats {
  font-size: 13px;
  text-align: center;
  line-height: 1.5;
}
</style>
