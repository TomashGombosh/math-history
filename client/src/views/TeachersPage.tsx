import { Link } from "react-router-dom";
import { Seo } from "../lib/seo";
import { getMockTeachersPage } from "../mocks/teachers";
import "./TeachersPage.css";

type Teacher = { id: number; slug: string; name: string; imageUrl?: string };

export default function TeachersPage() {
  const teachers = getMockTeachersPage(1, 24).teachers as Teacher[];

  return (
    <div className="page-wrapper">
      <Seo
        title="Викладачі"
        description="Список викладачів-математиків Ужгородського національного університету."
        path="/teachers"
      />
      <div className="teachers-page">
        <h1>Викладачі математичного факультету УжНУ</h1>
        <div className="grid">
          {teachers.map((t) => (
            <Link key={t.id} to={`/teacher/${t.slug}`} className="card">
              <div className="image-wrapper">{t.imageUrl ? <img src={t.imageUrl} alt={t.name} /> : null}</div>
              <div className="name">{t.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
