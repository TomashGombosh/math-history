import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "../lib/seo";
import { apiGet } from "../lib/api";
import type { LayoutConfigResponse, TeacherDto } from "../lib/apiTypes";
import {
  normalizeTeacherPageLayout,
  parsePublicationEntry,
  teacherHasSectionContent,
  type TeacherPageState,
} from "../lib/teacherPageLayout";
import "./TeacherPage.css";

function TeacherProfile({ slug }: { slug: string }) {
  const [teacher, setTeacher] = useState<TeacherPageState | null>(null);
  const [layout, setLayout] = useState<LayoutConfigResponse>(() => normalizeTeacherPageLayout({}));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      apiGet<TeacherDto>(`/api/teachers/by-slug/${encodeURIComponent(slug)}`),
      apiGet<LayoutConfigResponse>("/api/layout").catch(() => ({})),
    ])
      .then(([t, rawLayout]) => {
        if (cancelled) return;
        setTeacher({
          name: t.name,
          imageUrl: t.imageUrl,
          title: t.title,
          academicDegree: t.academicDegree,
          position: t.position,
          faculty: t.faculty,
          shortInformation: t.shortInformation,
          bio: t.bio,
          publications: Array.isArray(t.publications) ? t.publications : [],
        });
        setLayout(normalizeTeacherPageLayout(rawLayout));
      })
      .catch(() => {
        if (!cancelled) setTeacher(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const sortedSections = useMemo(
    () => (layout.sections ?? []).filter((s) => !!s),
    [layout.sections],
  );

  if (loading) {
    return <div className="teacher-page">Завантаження…</div>;
  }

  if (!teacher) {
    return <div className="teacher-page">Викладача не знайдено</div>;
  }

  return (
    <div className="teacher-page">
      <Seo title={`${teacher.name} — викладач`} description="Сторінка викладача." path={`/teacher/${slug}`} />
      <div className="header">
        <div className="photo">{teacher.imageUrl ? <img src={teacher.imageUrl} alt={teacher.name} /> : null}</div>
        <div className="info">
          <h1>{teacher.name}</h1>
          <p>{teacher.academicDegree ?? ""}</p>
          <p>{teacher.position ?? ""}</p>
        </div>
      </div>
      {sortedSections.map((sec) => {
        if (!sec.visible || !teacherHasSectionContent(teacher, sec.id)) return null;
        if (sec.id === "shortInformation") {
          return (
            <section key={sec.id} className="section">
              <h2>{sec.title}</h2>
              <p className="multiline">{teacher.shortInformation ?? ""}</p>
            </section>
          );
        }
        if (sec.id === "bio") {
          return (
            <section key={sec.id} className="section">
              <h2>{sec.title}</h2>
              <p className="multiline">{teacher.bio ?? ""}</p>
            </section>
          );
        }
        if (sec.id === "publications") {
          const pubs = teacher.publications
            .map((raw, i) => parsePublicationEntry(raw, i))
            .filter((p): p is NonNullable<typeof p> => p != null);
          return (
            <section key={sec.id} className="section">
              <h2>{sec.title}</h2>
              <ol className="pub-list">
                {pubs.map((pub) => (
                  <li key={pub.key}>
                    {pub.year != null && pub.year !== "" ? <span>({pub.year}) </span> : null}
                    {pub.text}
                  </li>
                ))}
              </ol>
            </section>
          );
        }
        return null;
      })}
      <div className="back-link">
        <Link to="/teachers">← Повернутися до списку</Link>
      </div>
    </div>
  );
}

export default function TeacherPage() {
  const { slug = "" } = useParams();

  if (!slug) {
    return <div className="teacher-page">Викладача не знайдено</div>;
  }

  return <TeacherProfile key={slug} slug={slug} />;
}
