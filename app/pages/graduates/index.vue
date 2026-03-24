<template>
  <div class="graduates-page">
    <h1>Роки випуску студентів-математиків УжНУ</h1>

    <p class="page-intro">
      Тут зібрані всі роки випуску студентів математичного факультету
      Ужгородського національного університету. Для кожного року вказано
      загальну кількість випускників та число тих, хто закінчив навчання з
      відзнакою.
    </p>
    <div class="sort-bar">
      <select v-model="sortOrder" class="sort-select">
        <option value="asc">Від старіших до новіших</option>
        <option value="desc">Від новіших до старіших</option>
      </select>
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
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { usePageSeo } from "~/composables/usePageSeo";

const siteUrl = "http://localhost:3000";

usePageSeo({
  title: "Роки випуску",
  description:
    "Роки випуску студентів-математиків УжНУ з інформацією про кількість випускників та відмінників для кожного року.",
  path: "/graduates",
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
            name: "Роки випуску",
            item: `${siteUrl}/graduates`,
          },
        ],
      }),
    },
  ],
});

const { data } = await useFetch("/api/graduates/years");

const sortOrder = ref("asc");

const years = computed(() => {
  if (!data.value) return [];

  return [...data.value].sort((a, b) => {
    return sortOrder.value === "asc" ? a.year - b.year : b.year - a.year;
  });
});
</script>


<style scoped>
.graduates-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

h1 {
  margin-bottom: 10px;
  font-size: 26px;
}

.page-intro {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.years-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
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
.sort-bar {
  margin-bottom: 16px;
  display: flex;
}

@media (max-width: 1024px) {
  .graduates-page {
    max-width: 100%;
    padding: 20px 12px 32px;
  }

  .years-grid {
    justify-content: center;
  }

  .year-card {
    width: 130px;
  }
}

@media (max-width: 768px) {
  .graduates-page {
    padding: 16px 10px 28px;
  }

  h1 {
    font-size: 22px;
    text-align: center;
    margin-bottom: 12px;
  }

  .page-intro {
    font-size: 13px;
    text-align: center;
  }

  .years-grid {
    gap: 12px;
    justify-content: center;
  }

  .year-card {
    width: calc(50% - 12px);
    max-width: 180px;
    padding: 10px 6px;
  }

  .year-card__stats {
    font-size: 13px;
  }
  .sort-bar {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .year-card {
    width: 100%;
    max-width: 260px;
  }
}
</style>
