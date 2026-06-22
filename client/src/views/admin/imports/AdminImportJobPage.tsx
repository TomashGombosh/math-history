import { useParams } from "react-router-dom";
import "../AdminPages.css";

export default function AdminImportJobPage() {
  const { jobId } = useParams<{ jobId: string }>();

  return (
    <div className="admin-home">
      <h1>Імпорт з DOCX</h1>
      <p>Завдання: {jobId}</p>
    </div>
  );
}
