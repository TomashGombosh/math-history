import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../lib/seo";
import { ROUTES } from "../router/paths";
import { apiGet } from "../services/api";
import type { GraduateYearSummary, TeacherDto, TeachersListResponse } from "../lib/apiTypes";
import "./HomePage.css";

type Teacher = { id: number; slug: string; name: string; imageUrl?: string | null };
type YearItem = { year: number; totalStudents: number; totalWithHonours: number };

function pickTeachers(dtos: TeacherDto[]): Teacher[] {
  return dtos.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    imageUrl: t.imageUrl,
  }));
}

function pickYears(rows: GraduateYearSummary[]): YearItem[] {
  return rows.map((r) => ({
    year: r.year,
    totalStudents: r.totalStudents,
    totalWithHonours: r.totalWithHonours,
  }));
}

export default function HomePage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [years, setYears] = useState<YearItem[]>([]);

  useEffect(() => {
    void Promise.all([
      apiGet<TeachersListResponse>("/api/teachers", { page: 1, limit: 12 }).then((r) =>
        setTeachers(pickTeachers(r.teachers))
      ),
      apiGet<GraduateYearSummary[]>("/api/graduates/years").then((rows) =>
        setYears(pickYears(rows).sort((a, b) => b.year - a.year).slice(0, 12))
      ),
    ]).catch(() => {
      setTeachers([]);
      setYears([]);
    });
  }, []);

  return (
    <div className="home">
      <Seo
        title="Головна"
        description="Математики УжНУ — історія викладачів та випускників математичного факультету Ужгородського національного університету."
        path={ROUTES.home}
      />
      <section className="home-block intro-section">
        <h1>Математики УжНУ — історія викладачів та випускників</h1>
        <p>
          Цей сайт створений для збереження та представлення історії математичного факультету Ужгородського національного
          університету. Тут зібрано інформацію про викладачів, які формували факультет у різні роки, займалися науковою
          діяльністю, навчали студентів та зробили вагомий внесок у розвиток математичної освіти на Закарпатті.
        </p>
        <p>
          Окрім викладачів, на сайті можна переглядати списки випускників факультету за роками. Для кожного року вказано
          кількість студентів, а також кількість тих, хто закінчив навчання з відзнакою. Це допомагає простежити
          розвиток факультету, кількісні зміни та успішність студентів у різні періоди.
        </p>
      </section>
      <section className="home-block">
        <div className="home-header">
          <h2>Викладачі</h2>
          <Link to={ROUTES.teachers} className="home-link">
            Усі викладачі →
          </Link>
        </div>
        <div className="teachers-grid">
          {teachers.map((t) => (
            <Link key={t.id} to={ROUTES.teacherSlug(t.slug)} className="teacher-card">
              <div className="image-wrapper">{t.imageUrl ? <img src={t.imageUrl} alt={t.name} /> : null}</div>
              <div className="t-name">{t.name}</div>
            </Link>
          ))}
        </div>
        <div className="home-footer-link">
          <Link to={ROUTES.teachers} className="home-link">
            Переглянути всіх викладачів →
          </Link>
        </div>
      </section>
      <section className="home-block">
        <div className="home-header">
          <h2>Роки випуску</h2>
          <Link to={ROUTES.graduates} className="home-link">
            Усі випуски →
          </Link>
        </div>
        <div className="years-grid">
          {years.map((item) => (
            <Link key={item.year} to={ROUTES.graduatesYear(item.year)} className="year-card">
              <div className="year-card__year">{item.year}</div>
              <div className="year-card__stats">
                <div>К-ть випускників: {item.totalStudents}</div>
                <div>З відзнакою: {item.totalWithHonours}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="home-footer-link">
          <Link to={ROUTES.graduates} className="home-link">
            Переглянути всі роки випуску →
          </Link>
        </div>
      </section>
    </div>
  );
}
