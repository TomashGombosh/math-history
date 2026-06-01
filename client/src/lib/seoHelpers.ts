/** Public site name used in titles and structured data. */
export const SEO_SITE_NAME = "Математики УжНУ";

const SITE_LOCALE = "uk";
const ORG_LEGAL_NAME = "Кафедра математики, Ужгородський національний університет";
const SITE_DEFAULT_DESCRIPTION =
  "Історія кафедри математики Ужгородського національного університету: викладачі, випускники, наукові досягнення та розвиток математичних дисциплін у Закарпатті.";

export function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
  return "http://localhost:5173";
}

/** Stable JSON-LD `@id` for the organization across all pages. */
export function orgId(siteUrl: string): string {
  return `${siteUrl}/#org`;
}

/** Stable JSON-LD `@id` for the website across all pages. */
export function websiteId(siteUrl: string): string {
  return `${siteUrl}/#website`;
}

/** Absolute URL for Open Graph / JSON-LD when `imageUrl` may be path- or host-relative. */
export function absoluteUrlForSeo(siteUrl: string, imageUrl: string | null | undefined): string | undefined {
  if (imageUrl == null || String(imageUrl).trim() === "") return undefined;
  const raw = String(imageUrl).trim();
  if (raw.startsWith("https://") || raw.startsWith("http://")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${siteUrl}${path}`;
}

export function truncateForMeta(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export function buildTeacherMetaDescription(teacher: {
  shortInformation?: string | null;
  bio?: string | null;
  position?: string | null;
  academicDegree?: string | null;
}): string {
  const fromShort = teacher.shortInformation?.trim();
  if (fromShort) return truncateForMeta(fromShort, 160);
  const fromBio = teacher.bio?.trim();
  if (fromBio) return truncateForMeta(fromBio, 160);
  const bits = [teacher.academicDegree?.trim(), teacher.position?.trim()].filter(Boolean).join(" · ");
  return bits ? truncateForMeta(bits, 160) : "Сторінка викладача математичного факультету УжНУ.";
}

type GraphNode = Record<string, unknown>;
type BreadcrumbItem = { name: string; path: string };

/** Rich `CollegeOrUniversity` node (no `@context` — composed via `pageGraphJsonLd`). */
export function educationalOrganizationNode(siteUrl: string): GraphNode {
  return {
    "@type": "CollegeOrUniversity",
    "@id": orgId(siteUrl),
    name: ORG_LEGAL_NAME,
    alternateName: ["Математики УжНУ", "UzhNU Mathematics Department"],
    url: siteUrl,
    logo: `${siteUrl}/og-image.png`,
    image: `${siteUrl}/og-image.png`,
    inLanguage: SITE_LOCALE,
    description: SITE_DEFAULT_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      addressCountry: "UA",
      addressRegion: "Закарпатська область",
      addressLocality: "Ужгород",
      streetAddress: "вул. Університетська, 14",
      postalCode: "88000",
    },
    geo: { "@type": "GeoCoordinates", latitude: 48.6208, longitude: 22.2879 },
    areaServed: { "@type": "Country", name: "Україна" },
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: "Ужгородський національний університет",
      alternateName: "Uzhhorod National University",
      url: "https://www.uzhnu.edu.ua",
    },
  };
}

export function websiteNode(siteUrl: string): GraphNode {
  return {
    "@type": "WebSite",
    "@id": websiteId(siteUrl),
    name: SEO_SITE_NAME,
    url: siteUrl,
    inLanguage: SITE_LOCALE,
    publisher: { "@id": orgId(siteUrl) },
  };
}

interface WebpageNodeArgs {
  siteUrl: string;
  pageUrl: string;
  pageType?: "WebPage" | "CollectionPage" | "ProfilePage" | "AboutPage";
  name: string;
  description: string;
  inLanguage?: string;
  /** `@id` of a Person/Event/Article that is the page's primary entity. */
  mainEntityRefId?: string;
  /** `@id` of a BreadcrumbList. */
  breadcrumbRefId?: string;
}

export function webpageNode(args: WebpageNodeArgs): GraphNode {
  const node: GraphNode = {
    "@type": args.pageType ?? "WebPage",
    "@id": `${args.pageUrl}#webpage`,
    url: args.pageUrl,
    name: args.name,
    description: args.description,
    inLanguage: args.inLanguage ?? SITE_LOCALE,
    isPartOf: { "@id": websiteId(args.siteUrl) },
    about: { "@id": orgId(args.siteUrl) },
  };
  if (args.mainEntityRefId) node.mainEntity = { "@id": args.mainEntityRefId };
  if (args.breadcrumbRefId) node.breadcrumb = { "@id": args.breadcrumbRefId };
  return node;
}

export function breadcrumbNode(siteUrl: string, pageUrl: string, items: BreadcrumbItem[]): GraphNode {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    inLanguage: SITE_LOCALE,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteUrl}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
    })),
  };
}

interface TeacherForPerson {
  name: string;
  imageUrl?: string | null;
  position?: string | null;
  academicDegree?: string | null;
  shortInformation?: string | null;
  bio?: string | null;
}

export function teacherPersonNode(
  siteUrl: string,
  pageUrl: string,
  teacher: TeacherForPerson,
  imageAbsolute?: string,
): GraphNode {
  const description = teacher.shortInformation?.trim() || teacher.bio?.trim() || undefined;
  const node: GraphNode = {
    "@type": "Person",
    "@id": `${pageUrl}#person`,
    name: teacher.name,
    url: pageUrl,
    inLanguage: SITE_LOCALE,
    worksFor: { "@id": orgId(siteUrl) },
    affiliation: { "@id": orgId(siteUrl) },
  };
  if (imageAbsolute) node.image = imageAbsolute;
  const job = teacher.position?.trim();
  if (job) node.jobTitle = job;
  const degree = teacher.academicDegree?.trim();
  if (degree) node.honorificSuffix = degree;
  if (description) node.description = truncateForMeta(description, 300);
  return node;
}

export function graduateYearEventNode(
  siteUrl: string,
  pageUrl: string,
  year: string,
  description: string,
): GraphNode {
  const y = String(year).trim();
  return {
    "@type": "Event",
    "@id": `${pageUrl}#event`,
    name: `Випуск ${y} року — математичний факультет УжНУ`,
    description,
    inLanguage: SITE_LOCALE,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    startDate: y,
    url: pageUrl,
    organizer: { "@id": orgId(siteUrl) },
    location: { "@id": orgId(siteUrl) },
  };
}

export interface FaqItem {
  question: string;
  answer: string;
  /** Defaults to `uk`. Use `en` for cross-language matching variants. */
  lang?: string;
}

export function faqNode(pageUrl: string, items: FaqItem[]): GraphNode {
  return {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    inLanguage: SITE_LOCALE,
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      inLanguage: it.lang ?? SITE_LOCALE,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.answer,
        inLanguage: it.lang ?? SITE_LOCALE,
      },
    })),
  };
}

/** Compose multiple nodes into a single `@graph` JSON-LD payload. Drops falsy entries. */
export function pageGraphJsonLd(nodes: Array<GraphNode | false | null | undefined>): GraphNode {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter((n): n is GraphNode => Boolean(n)),
  };
}
