import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "../lib/api";
import { Seo } from "../lib/seo";
import { mockYears } from "../mocks/years";
import "./GraduatesYearPage.css";

type YearData = {
  title: string;
  students?: Array<{ id: number; index: number; name: string }>;
};
type YearItem = { year: number };

export default function GraduatesYearPage() {
  const { year = "" } = useParams();
  const [yearInfo, setYearInfo] = useState<YearData | null>(null);
  const [years, setYears] = useState<YearItem[]>([]);

  useEffect(() => {
    void apiGet<YearData>(`/api/graduates/${year}`).then(setYearInfo);
    setYears(mockYears);
  }, [year]);

  return (
    <div className="graduates-year-page">
      <Seo title={`Випуск ${year} року`} description={`Випуск ${year} року студентів-математиків УжНУ.`} path={`/graduates/${year}`} />
      <h1>Випуск {year} року</h1>
      <div className="years-table">
        {years.map((y) => (
          <Link key={y.year} to={`/graduates/${y.year}`} className={`year-cell ${String(y.year) === String(year) ? "active" : ""}`}>
            {y.year}
          </Link>
        ))}
      </div>
      <h2 className="year-title">{yearInfo?.title}</h2>
      <ol className="students-list">
        {(yearInfo?.students || []).map((student) => (
          <li key={student.id}>{student.index}. {student.name}</li>
        ))}
      </ol>
    </div>
  );
}
