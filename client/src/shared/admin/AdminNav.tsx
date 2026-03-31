import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/AuthContext";
import "./AdminNav.css";

export function AdminNav() {
  const route = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <header className="admin-wrapper">
      <div className="admin-nav">
        <Link to="/admin" className={`admin-link ${route.pathname === "/admin" ? "active" : ""}`}>
          Адмін-головна
        </Link>
        <button
          type="button"
          className={`admin-link admin-toggle ${route.pathname.startsWith("/admin/") ? "active" : ""}`}
          onClick={() => setIsPanelOpen((prev) => !prev)}
        >
          Адміністрування
        </button>
        <button
          className="admin-link logout"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Вийти
        </button>
      </div>
      {isPanelOpen ? (
        <div className="admin-panel">
          <div className="admin-column">
            <Link to="/admin/teachers" className="admin-sub-link">Таблиця викладачів</Link>
            <Link to="/admin/teachers/create" className="admin-sub-link">Додати викладача</Link>
            <Link to="/admin/teachers/layout" className="admin-sub-link">Структура сторінки викладача</Link>
          </div>
          <div className="admin-column">
            <Link to="/admin/graduates" className="admin-sub-link">Таблиця випусків</Link>
            <Link to="/admin/graduates/create" className="admin-sub-link">Додати випуск</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
