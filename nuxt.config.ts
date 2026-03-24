export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["@/assets/styles/base/main.scss"],
  app: {
    head: {
      title: "Математики УжНУ",
      titleTemplate: "%s | Математики УжНУ",
      htmlAttrs: {
        lang: "uk",
      },
    },
  },
});
