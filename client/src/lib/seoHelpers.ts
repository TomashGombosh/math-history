/** Public site name used in titles and structured data. */
export const SEO_SITE_NAME = "Математики УжНУ";

const ORG_JSONLD = {
  "@type": "EducationalOrganization" as const,
  name: "Ужгородський національний університет (УжНУ)",
};

export function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
  return "http://localhost:5173";
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

type BreadcrumbItem = { name: string; path: string };

export function breadcrumbJsonLd(siteUrl: string, items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteUrl}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
    })),
  };
}

export function organizationJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SEO_SITE_NAME,
    url: siteUrl,
    inLanguage: "uk",
    publisher: { ...ORG_JSONLD, url: siteUrl },
  };
}

export function teacherPersonJsonLd(
  pageUrl: string,
  teacher: { name: string; imageUrl?: string | null; position?: string | null; academicDegree?: string | null },
  imageAbsolute?: string,
) {
  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: teacher.name,
    url: pageUrl,
    worksFor: { ...ORG_JSONLD },
  };
  if (imageAbsolute) person.image = imageAbsolute;
  const job = teacher.position?.trim();
  if (job) person.jobTitle = job;
  const degree = teacher.academicDegree?.trim();
  if (degree) person.description = degree;
  return person;
}

export function graduateYearEventJsonLd(pageUrl: string, year: string, description: string) {
  const y = String(year).trim();
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `Випуск ${y} року — математичний факультет УжНУ`,
    description,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: pageUrl,
    organizer: { ...ORG_JSONLD },
  };
}
