import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "../lib/seo";
import { apiGet } from "../lib/api";
import type { TeacherDto } from "../lib/apiTypes";
import "./TeacherPage.css";

type Teacher = {
  name: string;
  imageUrl?: string | null;
  title?: string | null;
  academicDegree?: string | null;
  position?: string | null;
  faculty?: string | null;
  shortInformation?: string | null;
  bio?: string | null;
};

export default function TeacherPage() {
  const { slug = "" } = useParams();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setTeacher(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void apiGet<TeacherDto>(`/api/teachers/by-slug/${encodeURIComponent(slug)}`)
      .then((t) => {
        setTeacher({
          name: t.name,
          imageUrl: t.imageUrl,
          title: t.title,
          academicDegree: t.academicDegree,
          position: t.position,
          faculty: t.faculty,
          shortInformation: t.shortInformation,
          bio: t.bio,
        });
      })
      .catch(() => {
        setTeacher(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

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
      <section className="section">
        <h2>Коротка інформація</h2>
        <p className="multiline">{teacher.shortInformation ?? ""}</p>
      </section>
      <section className="section">
        <h2>Біографія</h2>
        <p className="multiline">{teacher.bio ?? ""}</p>
      </section>
      <div className="back-link">
        <Link to="/teachers">← Повернутися до списку</Link>
      </div>
    </div>
  );
}
