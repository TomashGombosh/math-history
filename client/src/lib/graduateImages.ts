/** Derive WebP URL from graduate image originals (matches legacy Nuxt `getWebpUrl`). */

export function graduateImageOriginalUrl(url: string): string {
  return url || "";
}

export function graduateImageWebpUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/graduates_img/images/")) {
    return url
      .replace("/graduates_img/images/", "/graduates_img/images-webp/")
      .replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }
  if (url.includes("/images/")) {
    return url.replace("/images/", "/images-webp/").replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }
  return url;
}
