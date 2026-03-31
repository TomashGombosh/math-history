import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../lib/seo";
import { mockYears } from "../mocks/years";
import { getMockTeachersPage } from "../mocks/teachers";
import "./HomePage.css";

type Teacher = { id: number; slug: string; name: string; imageUrl?: string };
type YearItem = { year: number; totalStudents: number; totalWithHonours: number };

export default function HomePage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [years, setYears] = useState<YearItem[]>([]);

  useEffect(() => {
    void Promise.all([
      Promise.resolve().then(() => setTeachers(getMockTeachersPage(1, 12).teachers as Teacher[])),
      Promise.resolve().then(() =>
        setYears([...mockYears].sort((a, b) => b.year - a.year).slice(0, 12))
      ),
    ]);
  }, []);

  return (
    <div className="home">
      <Seo
        title="Головна"
        description="Математики УжНУ — історія викладачів та випускників математичного факультету Ужгородського національного університету."
        path="/"
      />
      <section className="home-block intro-section">
        <h1>Математики УжНУ — історія викладачів та випускників</h1>
        <p>
          Цей сайт створений для збереження та представлення історії математичного
          факультету Ужгородського національного університету. Тут зібрано
          інформацію про викладачів, які формували факультет у різні роки,
          займалися науковою діяльністю, навчали студентів та зробили вагомий
          внесок у розвиток математичної освіти на Закарпатті.
        </p>
        <p>
          Окрім викладачів, на сайті можна переглядати списки випускників
          факультету за роками. Для кожного року вказано кількість студентів, а
          також кількість тих, хто закінчив навчання з відзнакою. Це допомагає
          простежити розвиток факультету, кількісні зміни та успішність студентів
          у різні періоди.
        </p>
      </section>
      <section className="home-block">
        <div className="home-header">
          <h2>Викладачі</h2>
          <Link to="/teachers" className="home-link">Усі викладачі →</Link>
        </div>
        <div className="teachers-grid">
          {teachers.map((t) => (
            <Link key={t.id} to={`/teacher/${t.slug}`} className="teacher-card">
              <div className="image-wrapper">{t.imageUrl ? <img src={t.imageUrl} alt={t.name} /> : null}</div>
              <div className="t-name">{t.name}</div>
            </Link>
          ))}
        </div>
        <div className="home-footer-link">
          <Link to="/teachers" className="home-link">
            Переглянути всіх викладачів →
          </Link>
        </div>
      </section>
      <section className="home-block">
        <div className="home-header">
          <h2>Роки випуску</h2>
          <Link to="/graduates" className="home-link">Усі випуски →</Link>
        </div>
        <div className="years-grid">
          {years.map((item) => (
            <Link key={item.year} to={`/graduates/${item.year}`} className="year-card">
              <div className="year-card__year">{item.year}</div>
              <div className="year-card__stats">
                <div>К-ть випускників: {item.totalStudents}</div>
                <div>З відзнакою: {item.totalWithHonours}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="home-footer-link">
          <Link to="/graduates" className="home-link">
            Переглянути всі роки випуску →
          </Link>
        </div>
      </section>
    </div>
  );
}
