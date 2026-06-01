import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { useLocation } from "react-router-dom";
import { Seo } from "../lib/seo";
import { ROUTES } from "../router/paths";

type NotFoundPageProps = {
  /** When true (e.g. admin gate), omit indexable metadata — no canonical to arbitrary URLs. */
  suppressSeo?: boolean;
};

/** Generic client-side “not found” (SPA; HTTP status stays 200 unless SSR). */
export default function NotFoundPage({ suppressSeo }: NotFoundPageProps) {
  const { pathname } = useLocation();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      {suppressSeo ? (
        <Seo
          title="404 — Сторінку не знайдено"
          description="Запитуваної сторінки не існує."
          path={ROUTES.home}
          robots="noindex, nofollow"
          omitCanonical
          twitterCard="summary"
        />
      ) : (
        <Seo
          title="404 — Сторінку не знайдено"
          description="Запитуваної сторінки не існує."
          path={pathname}
          robots="noindex, nofollow"
        />
      )}
      <Box textAlign="center">
        <Typography variant="h1" component="p" sx={{ fontSize: "4rem", fontWeight: 700, lineHeight: 1 }}>
          404
        </Typography>
        <Typography variant="h6" component="h1" gutterBottom>
          Сторінку не знайдено
        </Typography>
        <Typography color="text.secondary">
          Можливо, посилання застаріло або сторінка була переміщена.
        </Typography>
      </Box>
    </Container>
  );
}
