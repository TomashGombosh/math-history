<template>
  <div class="login-page">
    <h1>Вхід в адмін-панель</h1>

    <form class="login-form" @submit.prevent="onSubmit">
      <label>
        Логін:
        <input v-model="username" type="text" required />
      </label>

      <label>
        Пароль:
        <input v-model="password" type="password" required />
      </label>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <button type="submit" :disabled="pending">
        {{ pending ? "Вхід..." : "Увійти" }}
      </button>
    </form>
  </div>
</template>

<script setup>
const username = ref("");
const password = ref("");
const pending = ref(false);
const errorMessage = ref("");

const router = useRouter();
const { setToken, isAuthed } = useAuth();

if (isAuthed.value) {
  router.push("/admin");
}

async function onSubmit() {
  pending.value = true;
  errorMessage.value = "";

  try {
    const data = await $fetch("/api/auth/login", {
      method: "POST",
      body: { username: username.value, password: password.value },
    });

    setToken(data.token);
    router.push("/admin");
  } catch (err) {
    console.error(err);
    errorMessage.value = err?.data?.statusMessage || "Помилка авторизації";
  } finally {
    pending.value = false;
  }
}
</script>

<style scoped>
.login-page {
  max-width: 400px;
  margin: 40px auto;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-form input {
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

button {
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #004b5f;
  background: #004b5f;
  color: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}

.error {
  color: darkred;
  font-size: 13px;
}
</style>
