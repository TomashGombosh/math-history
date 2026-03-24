import { Teacher } from "../models/teacher.js";
import { Graduate } from "../models/graduate.js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const base =
    (config.public && config.public.siteUrl) ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const teachers = await Teacher.findAll({
    attributes: ["slug", "updatedAt"],
  });

  const graduates = await Graduate.findAll({
    attributes: ["year", "updatedAt"],
  });

  const yearsSet = new Set(graduates.map((g) => g.year));
  const years = Array.from(yearsSet).sort();

  const urls = [];

  const addUrl = ({
    loc,
    lastmod,
    priority = "0.8",
    changefreq = "weekly",
  }) => {
    urls.push({ loc, lastmod, priority, changefreq });
  };

  addUrl({ loc: `${base}/`, priority: "1.0", changefreq: "weekly" });
  addUrl({ loc: `${base}/teachers`, priority: "0.9", changefreq: "weekly" });
  addUrl({ loc: `${base}/graduates`, priority: "0.7", changefreq: "weekly" });

  teachers.forEach((t) => {
    if (!t.slug) return;
    addUrl({
      loc: `${base}/teachers/${t.slug}`,
      lastmod: t.updatedAt
        ? t.updatedAt.toISOString().split("T")[0]
        : undefined,
      priority: "0.9",
      changefreq: "monthly",
    });
  });

  years.forEach((year) => {
    const grad = graduates.find((g) => g.year === year);
    addUrl({
      loc: `${base}/graduates/${year}`,
      lastmod: grad?.updatedAt
        ? grad.updatedAt.toISOString().split("T")[0]
        : undefined,
      priority: "0.7",
      changefreq: "yearly",
    });
  });

  const xml = `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    return `
  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
  })
  .join("")}
</urlset>`.trim();

  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  return xml;
});
