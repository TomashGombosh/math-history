import { computed } from "vue";

export function useAuth() {
  const token = useCookie("authToken", {
    sameSite: "lax",
    secure: false,
  });

  const isAuthed = computed(() => !!token.value);

  function setToken(newToken) {
    token.value = newToken || null;
  }

  function logout() {
    token.value = null;
  }

  return {
    token,
    isAuthed,
    setToken,
    logout,
  };
}
