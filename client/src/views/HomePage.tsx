import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HomePageSectionsSkeleton } from "../components/skeletons/PageSkeletons";
import { Seo } from "../lib/seo";
import {
  breadcrumbNode,
  educationalOrganizationNode,
  faqNode,
  getSiteUrl,
  pageGraphJsonLd,
  webpageNode,
  websiteNode,
  type FaqItem,
} from "../lib/seoHelpers";
import { ROUTES } from "../router/paths";
import { apiGet } from "../services/api";
import type { GraduateYearSummary, TeacherDto, TeachersCursorResponse } from "../lib/apiTypes";
import "./HomePage.css";

type Teacher = { id: number; slug: string; name: string; imageUrl?: string | null };
type YearItem = { year: number; totalStudents: number; totalWithHonours: number };

const HOME_FAQ: FaqItem[] = [
  {
    question: "Що таке «Математики УжНУ»?",
    answer:
      "«Математики УжНУ» — це історичний архів кафедри математики Ужгородського національного університету: біографії викладачів, списки випускників за роками та матеріали про розвиток математичної освіти на Закарпатті.",
  },
  {
    question: "Де знаходиться кафедра математики УжНУ?",
    answer:
      "Кафедра математики Ужгородського національного університету розташована у місті Ужгород, Закарпатська область, Україна (вул. Університетська, 14).",
  },
  {
    question: "Як знайти інформацію про конкретного викладача математичного факультету УжНУ?",
    answer:
      "Перейдіть на сторінку «Викладачі» — там подано перелік усіх викладачів кафедри. Натисніть на ім'я викладача, щоб переглянути його посаду, науковий ступінь, біографію та публікації.",
  },
  {
    question: "Як переглянути список випускників за конкретний рік?",
    answer:
      "На сторінці «Роки випуску» оберіть рік. Випускники згруповані за спеціальностями та формами навчання; випускники з відзнакою виділені.",
  },
  {
    question: "What is the UzhNU Mathematics Department history archive?",
    answer:
      "Математики УжНУ (UzhNU Mathematics Department history archive) is a public Ukrainian heritage site documenting the faculty members, alumni, and academic history of the Mathematics Department at Uzhhorod National University.",
    lang: "en",
  },
];

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      apiGet<TeachersCursorResponse>("/api/teachers", { cursor: 1, limit: 12 }).then((r) =>
        setTeachers(pickTeachers(r.teachers))
      ),
      apiGet<GraduateYearSummary[]>("/api/graduates/years").then((rows) =>
        setYears(pickYears(rows).sort((a, b) => b.year - a.year).slice(0, 12))
      ),
    ])
      .catch(() => {
        setTeachers([]);
        setYears([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/`;
  const homeDescription =
    "Математики УжНУ — історія викладачів та випускників математичного факультету Ужгородського національного університету.";

  return (
    <div className="home">
      <Seo
        title="Головна"
        description={homeDescription}
        path={ROUTES.home}
        jsonLd={pageGraphJsonLd([
          educationalOrganizationNode(siteUrl),
          websiteNode(siteUrl),
          webpageNode({
            siteUrl,
            pageUrl,
            name: "Математики УжНУ — Головна",
            description: homeDescription,
            breadcrumbRefId: `${pageUrl}#breadcrumb`,
          }),
          breadcrumbNode(siteUrl, pageUrl, [{ name: "Головна", path: ROUTES.home }]),
          faqNode(pageUrl, HOME_FAQ),
        ])}
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
        <address className="home-org-address">
          <span lang="uk">Кафедра математики, Ужгородський національний університет</span>
          {" — "}
          <span lang="uk">Ужгород, Закарпатська область, Україна</span>
        </address>
      </section>
      {loading ? (
        <HomePageSectionsSkeleton />
      ) : (
        <>
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
            {!teachers.length ? <p className="home-empty-hint">Немає даних про викладачів.</p> : null}
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
                  <div className="year-card__year">
                    <time dateTime={String(item.year)}>{item.year}</time>
                  </div>
                  <div className="year-card__stats">
                    <div>К-ть випускників: {item.totalStudents}</div>
                    <div>З відзнакою: {item.totalWithHonours}</div>
                  </div>
                </Link>
              ))}
            </div>
            {!years.length ? <p className="home-empty-hint">Немає даних про роки випуску.</p> : null}
            <div className="home-footer-link">
              <Link to={ROUTES.graduates} className="home-link">
                Переглянути всі роки випуску →
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
