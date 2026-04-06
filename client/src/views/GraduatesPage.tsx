import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../lib/seo";
import { ROUTES } from "../router/paths";
import { apiGet } from "../services/api";
import type { GraduateYearSummary } from "../lib/apiTypes";
import "./GraduatesPage.css";

type YearItem = { year: number; totalStudents: number; totalWithHonours: number };

export default function GraduatesPage() {
  const [years, setYears] = useState<YearItem[]>([]);

  useEffect(() => {
    void apiGet<GraduateYearSummary[]>("/api/graduates/years")
      .then((rows) =>
        setYears(
          rows.map((r) => ({
            year: r.year,
            totalStudents: r.totalStudents,
            totalWithHonours: r.totalWithHonours,
          }))
        )
      )
      .catch(() => setYears([]));
  }, []);

  return (
    <div className="graduates-page">
      <Seo title="Роки випуску" description="Роки випуску студентів-математиків УжНУ." path={ROUTES.graduates} />
      <h1>Роки випуску студентів-математиків УжНУ</h1>
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
    </div>
  );
}
