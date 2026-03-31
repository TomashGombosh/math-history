import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/AuthContext";
import "./AdminPages.css";

export default function AdminHomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin-home">
      <h1>Адмін-панель</h1>
      <ul className="admin-menu">
        <li><Link to="/admin/teachers">Список викладачів</Link></li>
        <li><Link to="/admin/teachers/create">Додати викладача</Link></li>
        <li><Link to="/admin/teachers/layout">Структура сторінки викладача</Link></li>
        <li><Link to="/admin/graduates">Список випусків</Link></li>
        <li><Link to="/admin/graduates/create">Додати випуск</Link></li>
      </ul>
      <button
        className="logout-btn"
        onClick={() => {
          logout();
          navigate("/");
        }}
      >
        Вийти
      </button>
    </div>
  );
}
