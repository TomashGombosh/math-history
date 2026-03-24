<template>
  <header class="admin-wrapper">
    <div class="admin-nav">
      <NuxtLink
        to="/admin"
        class="admin-link"
        :class="{ active: route.path === '/admin' }"
      >
        Адмін-головна
      </NuxtLink>

      <button
        type="button"
        class="admin-link admin-toggle"
        :class="{ active: isAdminSection }"
        @click="togglePanel"
      >
        Адміністрування
      </button>

      <button class="admin-link logout" @click="handleLogout">Вийти</button>
    </div>

    <div v-if="isPanelOpen" class="admin-panel">
      <div class="admin-column">
        <div class="admin-column-title">Адміністрування викладачів</div>

        <NuxtLink
          to="/admin/teachers"
          class="admin-sub-link"
          :class="{ active: route.path.startsWith('/admin/teachers') }"
          @click="closePanel"
        >
          Таблиця викладачів
        </NuxtLink>

        <NuxtLink
          to="/admin/teachers/create"
          class="admin-sub-link"
          :class="{ active: route.path === '/admin/teachers/create' }"
          @click="closePanel"
        >
          Додати викладача
        </NuxtLink>

        <NuxtLink
          to="/admin/teachers/layout"
          class="admin-sub-link"
          :class="{ active: route.path === '/admin/teachers/layout' }"
          @click="closePanel"
        >
          Структура сторінки викладача
        </NuxtLink>
      </div>

      <div class="admin-column">
        <div class="admin-column-title">Адміністрування випусків</div>

        <NuxtLink
          to="/admin/graduates"
          class="admin-sub-link"
          :class="{
            active:
              route.path === '/admin/graduates' ||
              (route.path.startsWith('/admin/graduates/') &&
                !route.path.endsWith('/create')),
          }"
          @click="closePanel"
        >
          Таблиця випусків
        </NuxtLink>

        <NuxtLink
          to="/admin/graduates/create"
          class="admin-sub-link"
          :class="{ active: route.path === '/admin/graduates/create' }"
          @click="closePanel"
        >
          Додати випуск
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const { logout } = useAuth();

const isPanelOpen = ref(false);

const isAdminSection = computed(() => {
  return route.path.startsWith("/admin") && route.path !== "/admin";
});

function togglePanel() {
  isPanelOpen.value = !isPanelOpen.value;
}

function closePanel() {
  isPanelOpen.value = false;
}

function handleLogout() {
  logout();
  router.push("/");
}
</script>

<style scoped>
.admin-wrapper {
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  position: relative;
  z-index: 1001;
}

.admin-nav {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 6px 12px;
}

.admin-link {
  text-decoration: none;
  color: #333;
  background: none;
  border: none;
  padding: 2px 6px;
  font-size: 13px;
  cursor: pointer;
}

.admin-link.active {
  font-weight: 600;
  border-bottom: 2px solid #000;
}

.admin-toggle {
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
}

.logout {
  margin-left: auto;
}

.admin-panel {
  display: flex;
  gap: 40px;
  padding: 8px 12px 10px;
  background: #f9f9f9;
  border-top: 1px solid #e0e0e0;
}

.admin-column {
  min-width: 160px;
}

.admin-column-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}

.admin-sub-link {
  display: block;
  font-size: 13px;
  color: #333;
  text-decoration: none;
  padding: 2px 0;
}

.admin-sub-link:hover {
  text-decoration: underline;
}

.admin-sub-link.active {
  font-weight: 600;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .admin-nav {
    gap: 16px;
    padding: 6px 8px;
  }

  .admin-link {
    font-size: 12px;
  }

  .admin-panel {
    flex-direction: column;
    gap: 10px;
    padding: 8px 8px 10px;
  }

  .admin-column {
    min-width: auto;
  }
}
</style>
