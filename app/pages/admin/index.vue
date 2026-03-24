<template>
  <div class="admin-home">
    <h1>Адмін-панель</h1>

    <p>
      Ласкаво просимо! Тут можна керувати викладачами, випускниками і макетом
      сторінок.
    </p>

    <ul class="admin-menu">
      <li>
        <NuxtLink to="/admin/teachers">Список викладачів</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/admin/teachers/create">Додати викладача</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/admin/teachers/layout"
          >Структура сторінки викладача</NuxtLink
        >
      </li>
      <li>
        <NuxtLink to="/admin/graduates">Список випусків</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/admin/graduates/create">Додати випуск</NuxtLink>
      </li>
    </ul>

    <button class="logout-btn" @click="logoutAndGo">Вийти</button>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: "admin",
});

const { logout } = useAuth();
const router = useRouter();

function logoutAndGo() {
  logout();
  router.push("/");
}
</script>

<style scoped>
.admin-home {
  max-width: 800px;
  margin: 20px auto;
}

.admin-menu {
  margin-top: 10px;
  padding-left: 18px;
}

.logout-btn {
  margin-top: 16px;
}
</style>
