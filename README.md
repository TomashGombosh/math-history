# Math History Migration Setup

## Run Vue (Nuxt) and React Router together with Docker

```bash
docker compose up --build
```

- Vue/Nuxt app: `http://localhost:3000`
- React Router app (migration client): `http://localhost:5173`
- Postgres: `localhost:5432`

## Run React Router client locally without Docker

```bash
cd client
npm install
npm run dev
```

The React app uses the same API paths (`/api/*`) and is configured to proxy requests to the Nuxt container (`nuxt:3000`) in Docker.

## Current migration scope

- React Router app lives in `client/`
- Route paths are mirrored from Vue:
  - `/`
  - `/teachers`
  - `/teacher/:slug`
  - `/graduates`
  - `/graduates/:year`
  - `/login`
  - `/admin` and existing admin child paths
