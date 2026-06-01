import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../router/paths";
import "./MainFooter.css";

export function MainFooter() {
  const route = useLocation();

  return (
    <footer className="main-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-logo-block">
            <picture>
              <img src="/favicon.ico" alt="Ужгородський національний університет" className="footer-logo" />
            </picture>
            <div className="footer-uni-name">
              Ужгородський
              <br />
              національний університет
            </div>
          </div>
          <nav className="footer-nav">
            <Link to={ROUTES.home} className={`footer-nav-link ${route.pathname === ROUTES.home ? "active" : ""}`}>
              Головна
            </Link>
            <span className="footer-nav-separator">|</span>
            <Link
              to={ROUTES.teachers}
              className={`footer-nav-link ${route.pathname.startsWith(ROUTES.teachers) ? "active" : ""}`}
            >
              Викладачі
            </Link>
            <span className="footer-nav-separator">|</span>
            <Link
              to={ROUTES.graduates}
              className={`footer-nav-link ${route.pathname.startsWith(ROUTES.graduates) ? "active" : ""}`}
            >
              Випускники
            </Link>
          </nav>
        </div>
        <div className="footer-description">
          <p>
            Ужгородський національний університет є одним із класичних
            університетів України, акредитованих за IV (вищим) рівнем акредитації
            (сертифікат серії РД - IV №0753932).
          </p>
          <p>
            Ректор – доктор медичних наук, професор Володимир Іванович Смоланка
          </p>
        </div>
        <div className="footer-contacts">
          <h3>Контактна інформація:</h3>
          <div className="footer-block">
            <h4>Ректорат:</h4>
            <p>Адреса: 88000, Україна, Закарпатська обл., м. Ужгород, пл. Народна, 3</p>
            <p>Телефон: +380312613321</p>
            <p>Факс: +380312613396</p>
            <p>
              E-mail: <a href="mailto:official@uzhnu.edu.ua">official@uzhnu.edu.ua</a>
            </p>
          </div>
          <div className="footer-block">
            <h4>Приймальна комісія:</h4>
            <p>
              Адреса: 88000, Україна, Закарпатська обл., м. Ужгород, вул.
              Університетська, 14, кімн. 228
            </p>
            <p>
              Телефон: +380961238967, +380668293538 E-mail:{" "}
              <a href="mailto:admission@uzhnu.edu.ua">admission@uzhnu.edu.ua</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
