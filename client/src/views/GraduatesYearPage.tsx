import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "../lib/api";
import { Seo } from "../lib/seo";
import type { GraduateYearDetail, GraduateYearSummary } from "../lib/apiTypes";
import "./GraduatesYearPage.css";

type YearItem = { year: number };

type StudentRow = GraduateYearDetail["students"][number] & { isHonors: boolean };

type StudentGroup = {
  key: string;
  specialty: string;
  section: string;
  students: StudentRow[];
};

function groupStudentsBySpecialty(detail: GraduateYearDetail | null): StudentGroup[] {
  if (!detail || !Array.isArray(detail.students)) return [];

  const map = new Map<string, StudentGroup>();

  for (const st of detail.students) {
    const specialty = st.specialty?.trim() || "Математика";
    const section = st.section?.trim() || "";
    const key = `${specialty}__${section}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        specialty,
        section,
        students: [],
      });
    }

    const raw = st as { honorsDegree?: unknown; isBold?: unknown };
    const honors =
      raw.honorsDegree === true ||
      raw.honorsDegree === "true" ||
      raw.isBold === true ||
      raw.isBold === "true";

    map.get(key)!.students.push({
      ...st,
      isHonors: Boolean(honors),
    });
  }

  for (const group of map.values()) {
    group.students.sort((a, b) => a.index - b.index);
  }

  return Array.from(map.values());
}

export default function GraduatesYearPage() {
  const { year = "" } = useParams();
  const [detail, setDetail] = useState<GraduateYearDetail | null>(null);
  const [years, setYears] = useState<YearItem[]>([]);

  const groupedStudents = useMemo(() => groupStudentsBySpecialty(detail), [detail]);

  useEffect(() => {
    void apiGet<GraduateYearSummary[]>("/api/graduates/years")
      .then((rows) => setYears(rows.map((r) => ({ year: r.year }))))
      .catch(() => setYears([]));
  }, []);

  useEffect(() => {
    void apiGet<GraduateYearDetail>(`/api/graduates/${encodeURIComponent(year)}`)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [year]);

  return (
    <div className="graduates-year-page">
      <Seo
        title={`Випуск ${year} року`}
        description={`Випуск ${year} року студентів-математиків УжНУ.`}
        path={`/graduates/${year}`}
      />
      <h1>Випуск {year} року</h1>
      <p className="page-intro">
        На цій сторінці подано список випускників математичного факультету УжНУ {year} року за спеціальностями та формами
        навчання. Відмінники виділені жирним шрифтом.
      </p>

      <div className="years-table">
        {years.map((y) => (
          <Link
            key={y.year}
            to={`/graduates/${y.year}`}
            className={`year-cell ${String(y.year) === String(year) ? "active" : ""}`}
          >
            {y.year}
          </Link>
        ))}
      </div>

      {!detail ? (
        <div className="graduates-year-empty">Дані для цього року не знайдені</div>
      ) : (
        <div className="year-content">
          <h2 className="year-title">{detail.title}</h2>

          {groupedStudents.map((group) => (
            <section key={group.key} className="students-group">
              <h3 className="group-title">
                {group.specialty}
                {group.section && group.section !== "Немає" ? ` (${group.section})` : null}
              </h3>
              <ol className="students-list">
                {group.students.map((student) => (
                  <li key={student.id} className={student.isHonors ? "is-honors" : undefined}>
                    {student.index}. {student.name}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
