import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../router/paths";
import { useAuth } from "../../state/AuthContext";
import "./AdminPages.css";

export default function AdminHomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin-home">
      <h1>Адмін-панель</h1>
      <ul className="admin-menu">
        <li><Link to={ROUTES.adminTeachers}>Список викладачів</Link></li>
        <li><Link to={ROUTES.adminTeachersCreate}>Додати викладача</Link></li>
        <li><Link to={ROUTES.adminTeachersLayout}>Структура сторінки викладача</Link></li>
        <li><Link to={ROUTES.adminGraduates}>Список випусків</Link></li>
        <li><Link to={ROUTES.adminGraduatesCreate}>Додати випуск</Link></li>
      </ul>
      <button
        className="logout-btn"
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
  );
}
