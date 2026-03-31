import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "../lib/seo";
import { findMockTeacherBySlug } from "../mocks/teachers";
import "./TeacherPage.css";

type Teacher = {
  name: string;
  imageUrl?: string;
  title?: string;
  academicDegree?: string;
  position?: string;
  faculty?: string;
  shortInformation?: string;
  bio?: string;
};

export default function TeacherPage() {
  const { slug = "" } = useParams();
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    setTeacher(findMockTeacherBySlug(slug));
  }, [slug]);

  if (!teacher) return <div className="teacher-page">Викладача не знайдено</div>;

  return (
    <div className="teacher-page">
      <Seo title={`${teacher.name} — викладач`} description="Сторінка викладача." path={`/teacher/${slug}`} />
      <div className="header">
        <div className="photo">{teacher.imageUrl ? <img src={teacher.imageUrl} alt={teacher.name} /> : null}</div>
        <div className="info">
          <h1>{teacher.name}</h1>
          <p>{teacher.academicDegree}</p>
          <p>{teacher.position}</p>
        </div>
      </div>
      <section className="section">
        <h2>Коротка інформація</h2>
        <p className="multiline">{teacher.shortInformation}</p>
      </section>
      <section className="section">
        <h2>Біографія</h2>
        <p className="multiline">{teacher.bio}</p>
      </section>
      <div className="back-link">
        <Link to="/teachers">← Повернутися до списку</Link>
      </div>
    </div>
  );
}
