import { Helmet } from "react-helmet-async";

export type BreadcrumbSeoItem = {
  name: string;
  /** App path starting with `/` (e.g. `/graduates`). */
  path: string;
};

type SeoProps = {
  title: string;
  description: string;
  path: string;
  /** Optional BreadcrumbList JSON-LD (matches legacy Nuxt `useHead` on graduate year). */
  breadcrumbItems?: BreadcrumbSeoItem[];
};

function getSiteUrl() {
  if (typeof window !== "undefined") {
    return import.meta.env.VITE_SITE_URL || window.location.origin;
  }
  return import.meta.env.VITE_SITE_URL || "http://localhost:5173";
}

export function Seo({ title, description, path, breadcrumbItems }: SeoProps) {
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const canonical = `${siteUrl}${path}`;

  const breadcrumbJsonLd =
    breadcrumbItems && breadcrumbItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbItems.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: `${siteUrl}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
          })),
        }
      : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      {breadcrumbJsonLd ? (
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      ) : null}
    </Helmet>
  );
}
