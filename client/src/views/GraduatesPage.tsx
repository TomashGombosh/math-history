import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mockYears } from "../mocks/years";
import { Seo } from "../lib/seo";
import "./GraduatesPage.css";

type YearItem = { year: number; totalStudents: number; totalWithHonours: number };

export default function GraduatesPage() {
  const [years, setYears] = useState<YearItem[]>([]);

  useEffect(() => {
    setYears(mockYears);
  }, []);

  return (
    <div className="graduates-page">
      <Seo title="Роки випуску" description="Роки випуску студентів-математиків УжНУ." path="/graduates" />
      <h1>Роки випуску студентів-математиків УжНУ</h1>
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
    </div>
  );
}
