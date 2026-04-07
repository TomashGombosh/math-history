import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LightboxGallery } from "../components/LightboxGallery";
import { GraduatesYearContentSkeleton, GraduatesYearNavSkeleton } from "../components/skeletons/PageSkeletons";
import { ROUTES } from "../router/paths";
import { apiGet } from "../services/api";
import type { GraduateCohortImage, GraduateYearDetail, GraduateYearSummary } from "../lib/apiTypes";
import { graduateImageOriginalUrl, graduateImageWebpUrl } from "../lib/graduateImages";
import { Seo } from "../lib/seo";
import { breadcrumbJsonLd, getSiteUrl, graduateYearEventJsonLd } from "../lib/seoHelpers";
import "./GraduatesYearPage.css";

type YearItem = { year: number };

type StudentRow = GraduateYearDetail["students"][number] & { isHonors: boolean };

type StudentGroup = {
  key: string;
  specialty: string;
  section: string;
  students: StudentRow[];
  images: GraduateCohortImage[];
};

function buildImagesBySpecialty(images: GraduateCohortImage[]): Map<string, GraduateCohortImage[]> {
  const map = new Map<string, GraduateCohortImage[]>();
  for (const img of images) {
    const specName = (img.specialty ?? "").trim();
    if (!specName) continue;
    if (!map.has(specName)) map.set(specName, []);
    map.get(specName)!.push(img);
  }
  return map;
}

function groupStudentsBySpecialty(detail: GraduateYearDetail | null | undefined): StudentGroup[] {
  if (!detail || !Array.isArray(detail.students)) return [];

  const imagesBySpecialty = buildImagesBySpecialty(detail.images ?? []);

  const map = new Map<string, StudentGroup>();

  for (const st of detail.students) {
    const specialty = st.specialty?.trim() || "Математика";
    const section = st.section?.trim() || "";
    const key = `${specialty}__${section}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        specialty,
        section,
        students: [],
        images: imagesBySpecialty.get(specialty) ?? [],
      });
    }

    const raw = st as { honorsDegree?: unknown; isBold?: unknown };
    const honors =
      raw.honorsDegree === true ||
      raw.honorsDegree === "true" ||
      raw.isBold === true ||
      raw.isBold === "true";

    map.get(key)!.students.push({
      ...st,
      isHonors: Boolean(honors),
    });
  }

  for (const group of map.values()) {
    group.students.sort((a, b) => a.index - b.index);
  }

  return Array.from(map.values());
}

type CohortProps = {
  year: string;
  openLightbox: (images: GraduateCohortImage[], startIndex?: number) => void;
};

const STUDENT_PAGE = 80;

function appendHonorsStudents(
  chunk: GraduateYearDetail["students"]
): (GraduateYearDetail["students"][number] & { isHonors: boolean })[] {
  return chunk.map((st) => {
    const raw = st as { honorsDegree?: unknown; isBold?: unknown };
    const honors =
      raw.honorsDegree === true ||
      raw.honorsDegree === "true" ||
      raw.isBold === true ||
      raw.isBold === "true";
    return { ...st, isHonors: Boolean(honors) };
  });
}

/**
 * Mounted with `key={year}` so a route year change remounts and `detail` starts as `undefined`
 * without synchronous setState in an effect (react-hooks/set-state-in-effect).
 */
function GraduatesYearCohortContent({ year, openLightbox }: CohortProps) {
  const [detail, setDetail] = useState<GraduateYearDetail | null | undefined>(undefined);
  const [mergedStudents, setMergedStudents] = useState<StudentRow[]>([]);
  const [studentCursor, setStudentCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void apiGet<GraduateYearDetail>(`/api/graduates/${encodeURIComponent(year)}`, {
      cursor: 1,
      limit: STUDENT_PAGE,
    })
      .then((d) => {
        if (!cancelled) {
          setDetail(d);
          setMergedStudents(appendHonorsStudents(d.students ?? []));
          setStudentCursor(d.studentLastEvaluatedKey ?? null);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null);
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const loadMoreStudents = useCallback(() => {
    if (!studentCursor || loadingMore) return;
    setLoadingMore(true);
    void apiGet<GraduateYearDetail>(`/api/graduates/${encodeURIComponent(year)}`, {
      cursor: 1,
      limit: STUDENT_PAGE,
      exclusiveStartKey: studentCursor,
    })
      .then((d) => {
        setMergedStudents((prev) => [...prev, ...appendHonorsStudents(d.students ?? [])]);
        setStudentCursor(d.studentLastEvaluatedKey ?? null);
      })
      .catch(() => {
        setStudentCursor(null);
      })
      .finally(() => setLoadingMore(false));
  }, [year, studentCursor, loadingMore]);

  const groupedStudents = useMemo(() => {
    if (!detail) return [];
    const synthetic: GraduateYearDetail = {
      ...detail,
      students: mergedStudents,
    };
    return groupStudentsBySpecialty(synthetic);
  }, [detail, mergedStudents]);

  if (detail === undefined) {
    return <GraduatesYearContentSkeleton />;
  }

  if (loadError) {
    return (
      <div className="graduates-year-error" role="alert">
        Помилка завантаження даних для {year} року
      </div>
    );
  }

  if (detail === null) {
    return <div className="graduates-year-empty">Дані для цього року не знайдені</div>;
  }

  return (
    <div className="year-content">
      <h2 className="year-title">{detail.title}</h2>

      {groupedStudents.map((group) => (
        <section key={group.key} className="students-group">
          <h3 className="group-title">
            {group.specialty}
            {group.section && group.section !== "Немає" ? ` (${group.section})` : null}
          </h3>
          <ol className="students-list">
            {group.students.map((student) => (
              <li key={student.id} className={student.isHonors ? "is-honors" : undefined}>
                {student.index}. {student.name}
              </li>
            ))}
          </ol>

          {group.images.length > 0 ? (
            <div className="group-photos">
              {group.images.map((img, imgIndex) => {
                if (!img.url) return null;
                const original = graduateImageOriginalUrl(img.url);
                const webp = graduateImageWebpUrl(img.url);
                const alt =
                  (img.caption != null && String(img.caption).trim()) || `Фото випуску ${year} – ${group.specialty}`;
                return (
                  <button
                    key={`${group.key}-photo-${imgIndex}`}
                    type="button"
                    className="group-photo"
                    onClick={() => openLightbox(group.images, imgIndex)}
                  >
                    <picture>
                      <source srcSet={webp} type="image/webp" />
                      <img src={original} alt={alt} loading="lazy" width={320} height={200} />
                    </picture>
                    {img.caption != null && String(img.caption).trim() ? (
                      <div className="photo-caption">{img.caption}</div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>
      ))}
      {studentCursor ? (
        <div className="graduates-students-load-more">
          <button type="button" onClick={loadMoreStudents} disabled={loadingMore}>
            {loadingMore ? "Завантаження…" : "Завантажити ще випускників"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function GraduatesYearPage() {
  const { year = "" } = useParams();
  const [years, setYears] = useState<YearItem[]>([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<GraduateCohortImage[]>([]);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [lightboxMountKey, setLightboxMountKey] = useState(0);

  const openLightbox = useCallback((images: GraduateCohortImage[], startIndex = 0) => {
    if (!images.length) return;
    setLightboxImages(images);
    setLightboxStartIndex(startIndex);
    setLightboxMountKey((k) => k + 1);
    setLightboxOpen(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void apiGet<GraduateYearSummary[]>("/api/graduates/years")
      .then((rows) => {
        if (!cancelled) setYears(rows.map((r) => ({ year: r.year })));
      })
      .catch(() => {
        if (!cancelled) setYears([]);
      })
      .finally(() => {
        if (!cancelled) setYearsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const siteUrl = getSiteUrl();
  const yearPath = ROUTES.graduatesYear(year);
  const pageUrl = `${siteUrl}${yearPath}`;
  const yearDescription = `Випуск ${year} року студентів-математиків УжНУ: список випускників за спеціальностями, відмінники та фото груп.`;

  return (
    <div className="graduates-year-page">
      <Seo
        title={`Випуск ${year} року`}
        description={yearDescription}
        path={yearPath}
        jsonLd={[
          breadcrumbJsonLd(siteUrl, [
            { name: "Головна", path: ROUTES.home },
            { name: "Роки випуску", path: ROUTES.graduates },
            { name: `Випуск ${year} року`, path: yearPath },
          ]),
          graduateYearEventJsonLd(pageUrl, year, yearDescription),
        ]}
      />
      <h1>Випуск {year} року</h1>
      <p className="page-intro">
        На цій сторінці подано список випускників математичного факультету УжНУ {year} року за спеціальностями та формами
        навчання. Відмінники виділені жирним шрифтом.
      </p>

      {yearsLoading ? (
        <GraduatesYearNavSkeleton />
      ) : (
        <div className="years-table">
          {years.map((y) => (
            <Link
              key={y.year}
              to={ROUTES.graduatesYear(y.year)}
              className={`year-cell ${String(y.year) === String(year) ? "active" : ""}`}
            >
              {y.year}
            </Link>
          ))}
        </div>
      )}

      <GraduatesYearCohortContent key={year} year={year} openLightbox={openLightbox} />

      <LightboxGallery
        key={lightboxMountKey}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={lightboxImages}
        startIndex={lightboxStartIndex}
      />
    </div>
  );
}
