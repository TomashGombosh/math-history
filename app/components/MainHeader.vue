<template>
  <div class="top-bar">
    <header class="main-header">
      <div class="main-header-left">
        <picture>
          <source
            srcset="/assets/images/UzNU_logo_header_webp.webp"
            type="image/webp"
          />
          <img
            src="/assets/images/UzNU_logo_header.png"
            alt="Логотип"
            class="logo"
          />
        </picture>

        <div class="site-title">
          Викладачі-математики та випускники-математики Ужгородського
          університету
        </div>
      </div>

      <nav class="main-nav main-nav--desktop">
        <NuxtLink
          to="/"
          class="nav-link"
          :class="{ active: route.path === '/' }"
        >
          Головна
        </NuxtLink>

        <NuxtLink
          to="/teachers"
          class="nav-link"
          :class="{ active: route.path.startsWith('/teachers') }"
        >
          Викладачі
        </NuxtLink>

        <NuxtLink
          to="/graduates"
          class="nav-link"
          :class="{ active: route.path.startsWith('/graduates') }"
        >
          Випускники
        </NuxtLink>
      </nav>

      <!-- Бургер для мобільних -->
      <button
        class="burger"
        type="button"
        aria-label="Меню"
        @click="toggleMobileMenu"
      >
        <span :class="{ open: isMobileMenuOpen }"></span>
        <span :class="{ open: isMobileMenuOpen }"></span>
        <span :class="{ open: isMobileMenuOpen }"></span>
      </button>
    </header>

    <!-- Мобільне меню -->
    <nav v-if="isMobileMenuOpen" class="main-nav main-nav--mobile">
      <NuxtLink
        to="/"
        class="nav-link"
        :class="{ active: route.path === '/' }"
        @click="closeMobileMenu"
      >
        Головна
      </NuxtLink>

      <NuxtLink
        to="/teachers"
        class="nav-link"
        :class="{ active: route.path.startsWith('/teachers') }"
        @click="closeMobileMenu"
      >
        Викладачі
      </NuxtLink>

      <NuxtLink
        to="/graduates"
        class="nav-link"
        :class="{ active: route.path.startsWith('/graduates') }"
        @click="closeMobileMenu"
      >
        Випускники
      </NuxtLink>
    </nav>

    <!-- Адмін-меню окремим компонентом -->
    <AdminNav v-if="isAuthed" />
  </div>
</template>

<script setup>
import AdminNav from "@/components/AdminNav.vue";

const route = useRoute();
const { isAuthed } = useAuth();

const isMobileMenuOpen = ref(false);

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}

onMounted(() => {
  watch(
    isMobileMenuOpen,
    (value) => {
      if (!process.client) return;
      document.body.style.overflow = value ? "hidden" : "";
    },
    { immediate: false }
  );
});

onBeforeUnmount(() => {
  if (process.client) {
    document.body.style.overflow = "";
  }
});
</script>

<style scoped>
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #003b4f;
  color: #fff;
  width: 100%;
  padding: 8px 12px;
  box-sizing: border-box;
}

.main-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.site-title {
  font-size: 14px;
  max-width: 520px;
}

.main-nav {
  display: flex;
  gap: 16px;
}

.nav-link {
  color: #cdeeff;
  text-decoration: none;
  font-size: 14px;
}

.nav-link.active {
  font-weight: 600;
  border-bottom: 2px solid #fff;
}

.burger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  flex-direction: column;
  gap: 4px;
}

.burger span {
  display: block;
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: #ffffff;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.burger span.open:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.burger span.open:nth-child(2) {
  opacity: 0;
}

.burger span.open:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

.main-nav--mobile {
  flex-direction: column;
  background: #003b4f;
  padding: 8px 12px 10px;
}

.main-nav--mobile .nav-link {
  align-self: flex-start;
  display: inline-block;
  padding: 4px 0;
}

.main-nav--mobile .nav-link.active {
  border-bottom-width: 1px;
}

@media (max-width: 1023px) {
  .site-title {
    font-size: 12px;
    max-width: 260px;
  }

  .main-nav--desktop {
    display: none;
  }

  .burger {
    display: flex;
  }
}

@media (max-width: 400px) {
  .site-title {
    display: none;
  }

  .main-nav--mobile {
    padding: 6px 10px 8px;
  }

  .main-nav--mobile .nav-link {
    font-size: 13px;
  }
}
</style>
