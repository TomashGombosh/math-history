<template>
  <footer class="main-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-logo-block">
          <picture>
            <source
              srcset="/assets/images/UzNU_logo_header_webp.webp"
              type="image/webp"
            />
            <img
              src="/assets/images/UzNU_logo_header.png"
              alt="Ужгородський національний університет"
              class="footer-logo"
            />
          </picture>

          <div class="footer-uni-name">
            Ужгородський
            <br />
            національний університет
          </div>
        </div>
        <nav class="footer-nav">
          <NuxtLink
            to="/"
            class="footer-nav-link"
            :class="{ active: route.path === '/' }"
          >
            Головна
          </NuxtLink>
          <span class="footer-nav-separator">|</span>
          <NuxtLink
            to="/teachers"
            class="footer-nav-link"
            :class="{ active: route.path.startsWith('/teachers') }"
          >
            Викладачі
          </NuxtLink>
          <span class="footer-nav-separator">|</span>
          <NuxtLink
            to="/graduates"
            class="footer-nav-link"
            :class="{ active: route.path.startsWith('/graduates') }"
          >
            Випускники
          </NuxtLink>
        </nav>
      </div>
      <div class="footer-description">
        <p>
          Ужгородський національний університет є одним із класичних
          університетів України, акредитованих за IV (вищим) рівнем акредитації
          (сертифікат серії РД - IV №0753932).
        </p>
        <p>
          Ректор – доктор медичних наук, професор Володимир Іванович Смоланка
        </p>
      </div>
      <!-- Контакти -->
      <div class="footer-contacts">
        <h3>Контактна інформація:</h3>

        <div class="footer-block">
          <h4>Ректорат:</h4>
          <p>
            Адреса: 88000, Україна, Закарпатська обл., м. Ужгород, пл. Народна,
            3
          </p>
          <p>Телефон: +380312613321</p>
          <p>Факс: +380312613396</p>
          <p>
            E-mail:
            <a href="mailto:official@uzhnu.edu.ua">official@uzhnu.edu.ua</a>
          </p>
        </div>

        <div class="footer-block">
          <h4>Приймальна комісія:</h4>
          <p>
            Адреса: 88000, Україна, Закарпатська обл., м. Ужгород, вул.
            Університетська, 14, кімн. 228
          </p>
          <p>
            Телефон: +380961238967, +380668293538 E-mail:
            <a href="mailto:admission@uzhnu.edu.ua">admission@uzhnu.edu.ua</a>
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const route = useRoute();
</script>

<style scoped>
.main-footer {
  margin-top: auto;
  background: #003b4f;
  color: #ffffff;
  padding: 24px 16px 16px;
}

.footer-inner {
  max-width: 1300px;
  margin: 0 auto;
  font-size: 13px;
  line-height: 1.4;
}

.footer-top {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.footer-logo-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 150px;
}

.footer-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 8px;
}

.footer-uni-name {
  text-align: center;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
}

.footer-description {
  flex: 1;
}

.footer-contacts {
  margin-top: 12px;
}

.footer-contacts h3 {
  margin: 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.footer-block {
  margin-bottom: 8px;
}

.footer-block h4 {
  margin: 4px 0;
  font-size: 13px;
  font-weight: 600;
}

.footer-block p {
  margin: 2px 0;
}

.footer-block a {
  color: #cdeeff;
  text-decoration: underline;
}

.footer-nav {
  margin-top: 12px;
  text-align: center;
  font-size: 13px;
}

.footer-nav-link {
  color: #ffffff;
  text-decoration: none;
}

.footer-nav-link:hover {
  text-decoration: underline;
}

.footer-nav-link.active {
  font-weight: 600;
  text-decoration: underline;
}

.footer-nav-separator {
  margin: 0 6px;
  color: #cdeeff;
}

@media (max-width: 1024px) {
  .footer-inner {
    font-size: 12px;
  }

  .footer-contacts {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .footer-block {
    flex: 1 1 220px;
  }
}

@media (max-width: 768px) {
  .main-footer {
    padding: 20px 14px 14px;
  }

  .footer-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .footer-logo-block {
    align-items: center;
    text-align: center;
    width: 100%;
  }

  .footer-description {
    width: 100%;
  }

  .footer-contacts {
    display: block;
  }

  .footer-nav {
    margin-top: 10px;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .footer-inner {
    font-size: 11px;
  }

  .footer-description p,
  .footer-block p {
    text-align: left;
  }

  .footer-nav {
    font-size: 12px;
  }

  .footer-logo {
    width: 70px;
    height: 70px;
  }
}
</style>
