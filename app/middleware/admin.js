import { createError } from "#app";

export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthed } = useAuth();

  if (!isAuthed.value) {
    throw createError({
      statusCode: 404,
      statusMessage: "Page not found",
    });
  }
});
