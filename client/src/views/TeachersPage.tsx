import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../lib/seo";
import { ROUTES } from "../router/paths";
import { apiGet } from "../services/api";
import type { TeacherDto, TeachersListResponse } from "../lib/apiTypes";
import "./TeachersPage.css";

type Teacher = { id: number; slug: string; name: string; imageUrl?: string | null };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    void apiGet<TeachersListResponse>("/api/teachers", { page: 1, limit: 24 })
      .then((r) =>
        setTeachers(
          r.teachers.map((t: TeacherDto) => ({
            id: t.id,
            slug: t.slug,
            name: t.name,
            imageUrl: t.imageUrl,
          }))
        )
      )
      .catch(() => setTeachers([]));
  }, []);

  return (
    <div className="page-wrapper">
      <Seo
        title="Викладачі"
        description="Список викладачів-математиків Ужгородського національного університету."
        path={ROUTES.teachers}
      />
      <div className="teachers-page">
        <h1>Викладачі математичного факультету УжНУ</h1>
        <div className="grid">
          {teachers.map((t) => (
            <Link key={t.id} to={ROUTES.teacherSlug(t.slug)} className="card">
              <div className="image-wrapper">{t.imageUrl ? <img src={t.imageUrl} alt={t.name} /> : null}</div>
              <div className="name">{t.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
