import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../router/paths";
import { useAuth } from "../state/AuthContext";
import { AdminNav } from "./admin/AdminNav";
import "./MainHeader.css";

export function MainHeader() {
  const route = useLocation();
  const { isAuthed, authReady } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="top-bar">
      <header className="main-header">
        <div className="main-header-left">
          <picture>
            <img src="/favicon.ico" alt="Логотип" className="logo" />
          </picture>
          <div className="site-title">
            Викладачі-математики та випускники-математики Ужгородського
            університету
          </div>
        </div>
        <nav className="main-nav main-nav--desktop">
          <Link to={ROUTES.home} className={`nav-link ${route.pathname === ROUTES.home ? "active" : ""}`}>
            Головна
          </Link>
          <Link
            to={ROUTES.teachers}
            className={`nav-link ${route.pathname.startsWith(ROUTES.teachers) ? "active" : ""}`}
          >
            Викладачі
          </Link>
          <Link
            to={ROUTES.graduates}
            className={`nav-link ${route.pathname.startsWith(ROUTES.graduates) ? "active" : ""}`}
          >
            Випускники
          </Link>
        </nav>
        <button
          className="burger"
          type="button"
          aria-label="Меню"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <span className={isMobileMenuOpen ? "open" : ""}></span>
          <span className={isMobileMenuOpen ? "open" : ""}></span>
          <span className={isMobileMenuOpen ? "open" : ""}></span>
        </button>
      </header>

      {isMobileMenuOpen ? (
        <nav className="main-nav main-nav--mobile">
          <Link
            to={ROUTES.home}
            className={`nav-link ${route.pathname === ROUTES.home ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Головна
          </Link>
          <Link
            to={ROUTES.teachers}
            className={`nav-link ${route.pathname.startsWith(ROUTES.teachers) ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Викладачі
          </Link>
          <Link
            to={ROUTES.graduates}
            className={`nav-link ${route.pathname.startsWith(ROUTES.graduates) ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Випускники
          </Link>
        </nav>
      ) : null}

      {authReady && isAuthed ? <AdminNav /> : null}
    </div>
  );
}
