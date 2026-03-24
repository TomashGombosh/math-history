// composables/usePageSeo.js

export function usePageSeo(options = {}) {
  const route = useRoute();
  const runtimeConfig = useRuntimeConfig();

  const baseUrl =
    (runtimeConfig.public && runtimeConfig.public.siteUrl) ||
    "http://localhost:3000";

  const {
    title = "Math History УжНУ",
    description = "Викладачі та випускники математичного факультету УжНУ.",
    path,
    type = "website",
    image = "/favicon.ico",
    noindex = false,
  } = options;

  const finalPath = path || route.path || "/";
  const url = baseUrl.replace(/\/$/, "") + finalPath;

  const imageUrl = image.startsWith("http")
    ? image
    : baseUrl.replace(/\/$/, "") + image;

  useSeoMeta({
    title,
    description,

    ogTitle: title,
    ogDescription: description,
    ogType: type,
    ogUrl: url,
    ogImage: imageUrl,

    twitterCard: "summary_large_image",
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imageUrl,
  });

  const headConfig = {
    link: [
      {
        rel: "canonical",
        href: url,
      },
    ],
  };

  if (noindex) {
    headConfig.meta = [
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ];
  }

  useHead(headConfig);
}
