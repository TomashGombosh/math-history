import "./AdminPages.css";

export default function AdminPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="admin-home">
      <h1>{title}</h1>
      <p>Сторінка в процесі міграції на React Router.</p>
    </div>
  );
}
