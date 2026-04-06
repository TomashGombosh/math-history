import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROUTES, isAdminPath } from "../../router/paths";
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
        <Link to={ROUTES.admin} className={`admin-link ${route.pathname === ROUTES.admin ? "active" : ""}`}>
          Адмін-головна
        </Link>
        <button
          type="button"
          className={`admin-link admin-toggle ${isAdminPath(route.pathname) && route.pathname !== ROUTES.admin ? "active" : ""}`}
          onClick={() => setIsPanelOpen((prev) => !prev)}
        >
          Адміністрування
        </button>
        <button
          className="admin-link logout"
          onClick={() => {
            void (async () => {
              await logout();
              navigate(ROUTES.home);
            })();
          }}
        >
          Вийти
        </button>
      </div>
      {isPanelOpen ? (
        <div className="admin-panel">
          <div className="admin-column">
            <Link to={ROUTES.adminTeachers} className="admin-sub-link">Таблиця викладачів</Link>
            <Link to={ROUTES.adminTeachersCreate} className="admin-sub-link">Додати викладача</Link>
            <Link to={ROUTES.adminTeachersLayout} className="admin-sub-link">Структура сторінки викладача</Link>
          </div>
          <div className="admin-column">
            <Link to={ROUTES.adminGraduates} className="admin-sub-link">Таблиця випусків</Link>
            <Link to={ROUTES.adminGraduatesCreate} className="admin-sub-link">Додати випуск</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
