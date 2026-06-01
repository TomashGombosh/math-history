import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TeachersGridSkeleton } from "../components/skeletons/PageSkeletons";
import { Seo } from "../lib/seo";
import {
  breadcrumbNode,
  educationalOrganizationNode,
  getSiteUrl,
  pageGraphJsonLd,
  webpageNode,
  websiteNode,
} from "../lib/seoHelpers";
import { ROUTES } from "../router/paths";
import { apiGet } from "../services/api";
import type { TeacherDto, TeachersCursorResponse } from "../lib/apiTypes";
import "./TeachersPage.css";

type Teacher = { id: number; slug: string; name: string; imageUrl?: string | null };

const PAGE_SIZE = 24;

function mapTeachers(dtos: TeacherDto[]): Teacher[] {
  return dtos.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    imageUrl: t.imageUrl,
  }));
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiGet<TeachersCursorResponse>("/api/teachers", { cursor: 1, limit: PAGE_SIZE })
      .then((r) => {
        if (cancelled) return;
        setTeachers(mapTeachers(r.teachers));
        setLastEvaluatedKey(r.lastEvaluatedKey ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setTeachers([]);
          setLastEvaluatedKey(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!lastEvaluatedKey || loadingMore) return;
    setLoadingMore(true);
    void apiGet<TeachersCursorResponse>("/api/teachers", {
      cursor: 1,
      limit: PAGE_SIZE,
      exclusiveStartKey: lastEvaluatedKey,
    })
      .then((r) => {
        setTeachers((prev) => [...prev, ...mapTeachers(r.teachers)]);
        setLastEvaluatedKey(r.lastEvaluatedKey ?? null);
      })
      .catch(() => {
        setLastEvaluatedKey(null);
      })
      .finally(() => setLoadingMore(false));
  }, [lastEvaluatedKey, loadingMore]);

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${ROUTES.teachers}`;
  const description = "Список викладачів-математиків Ужгородського національного університету.";

  return (
    <div className="page-wrapper">
      <Seo
        title="Викладачі"
        description={description}
        path={ROUTES.teachers}
        jsonLd={pageGraphJsonLd([
          educationalOrganizationNode(siteUrl),
          websiteNode(siteUrl),
          webpageNode({
            siteUrl,
            pageUrl,
            pageType: "CollectionPage",
            name: "Викладачі кафедри математики УжНУ",
            description,
            breadcrumbRefId: `${pageUrl}#breadcrumb`,
          }),
          breadcrumbNode(siteUrl, pageUrl, [
            { name: "Головна", path: ROUTES.home },
            { name: "Викладачі", path: ROUTES.teachers },
          ]),
        ])}
      />
      <div className="teachers-page">
        <h1>Викладачі математичного факультету УжНУ</h1>
        {loading ? (
          <TeachersGridSkeleton />
        ) : (
          <>
            <div className="grid">
              {teachers.map((t) => (
                <Link key={t.id} to={ROUTES.teacherSlug(t.slug)} className="card">
                  <div className="image-wrapper">{t.imageUrl ? <img src={t.imageUrl} alt={t.name} /> : null}</div>
                  <div className="name">{t.name}</div>
                </Link>
              ))}
            </div>
            {lastEvaluatedKey ? (
              <div className="teachers-load-more">
                <button type="button" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Завантаження…" : "Завантажити ще"}
                </button>
              </div>
            ) : null}
            {!teachers.length ? <p className="teachers-empty-hint">Інформацію про викладачів не знайдено.</p> : null}
          </>
        )}
      </div>
    </div>
  );
}
