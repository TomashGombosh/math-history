import { Helmet } from "react-helmet-async";
import { getSiteUrl, SEO_SITE_NAME } from "./seoHelpers";

function escapeJsonForScript(json: string): string {
  return json.replace(/</g, "\\u003c");
}

type SeoProps = {
  title: string;
  description: string;
  path: string;
  /** Indexed by default; use noindex for login, errors, or non-public screens. */
  robots?: string;
  omitCanonical?: boolean;
  ogType?: "website" | "article";
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
  jsonLd?: object | object[];
};

function normalizePathForCanonical(path: string): string {
  if (!path || path === "/") return "";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/+$/, "") || "";
}

export function Seo({
  title,
  description,
  path,
  robots,
  omitCanonical,
  ogType = "website",
  ogImage,
  twitterCard = "summary_large_image",
  jsonLd,
}: SeoProps) {
  const siteUrl = getSiteUrl();
  const pathPart = normalizePathForCanonical(path);
  const canonical = `${siteUrl}${pathPart === "" ? "/" : pathPart}`;

  const fullTitle = title.includes(SEO_SITE_NAME) ? title : `${title} | ${SEO_SITE_NAME}`;

  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet htmlAttributes={{ lang: "uk" }}>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {robots ? <meta name="robots" content={robots} /> : null}
      {!omitCanonical ? <link rel="canonical" href={canonical} /> : null}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content="uk_UA" />
      <meta property="og:site_name" content={SEO_SITE_NAME} />
      {!omitCanonical ? <meta property="og:url" content={canonical} /> : null}
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {escapeJsonForScript(JSON.stringify(block))}
        </script>
      ))}
    </Helmet>
  );
}
