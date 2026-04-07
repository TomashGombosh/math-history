/** Derive WebP URL from stored originals (matches legacy Nuxt `getWebpUrl` + teacher paths). */

export function graduateImageOriginalUrl(url: string): string {
  return url || "";
}

/** WebP full-size derivative (S3: `images-webp/` under the same prefix as the original). */
export function imageWebpUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/graduates_img/images/")) {
    return url
      .replace("/graduates_img/images/", "/graduates_img/images-webp/")
      .replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }
  if (url.includes("/teachers_img/images/")) {
    return url
      .replace("/teachers_img/images/", "/teachers_img/images-webp/")
      .replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }
  // Flat teacher keys: .../teachers/<uuid>.<ext> → .../teachers-webp/<uuid>.webp (presign + derivative pipeline)
  if (url.includes("/teachers/") && !url.includes("/teachers-webp/") && !url.includes("/teachers-thumbs-webp/")) {
    const replaced = url.replace(/\/teachers\/([^/]+)\.(jpg|jpeg|png)$/i, "/teachers-webp/$1.webp");
    if (replaced !== url) return replaced;
  }
  if (url.includes("/images/")) {
    return url.replace("/images/", "/images-webp/").replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }
  return url;
}

/** Square thumb WebP (S3: `images-thumbs-webp/`); produced async after upload like `imageWebpUrl`. */
export function imageThumbWebpUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/graduates_img/images/")) {
    return url
      .replace("/graduates_img/images/", "/graduates_img/images-thumbs-webp/")
      .replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }
  if (url.includes("/teachers_img/images/")) {
    return url
      .replace("/teachers_img/images/", "/teachers_img/images-thumbs-webp/")
      .replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }
  if (url.includes("/teachers/") && !url.includes("/teachers-thumbs-webp/")) {
    const replaced = url.replace(/\/teachers\/([^/]+)\.(jpg|jpeg|png)$/i, "/teachers-thumbs-webp/$1.webp");
    if (replaced !== url) return replaced;
  }
  if (url.includes("/images/")) {
    return url.replace("/images/", "/images-thumbs-webp/").replace(/\.(jpg|jpeg|png)$/i, ".webp");
  }
  return url;
}

export function graduateImageWebpUrl(url: string): string {
  return imageWebpUrl(url);
}
