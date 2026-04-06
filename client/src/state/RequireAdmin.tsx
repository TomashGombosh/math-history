import { Outlet } from "react-router-dom";
import { RouteFallbackSkeleton } from "../components/skeletons/PageSkeletons";
import NotFoundPage from "../views/NotFoundPage";
import { useAuth } from "./AuthContext";

/** Admin-only routes: non-admin / anonymous users see 404 (no redirect to login). */
export function RequireAdmin() {
  const { isAuthed, authReady } = useAuth();

  if (!authReady) {
    return <RouteFallbackSkeleton aria-label="Завантаження сесії" />;
  }

  if (!isAuthed) {
    return <NotFoundPage suppressSeo />;
  }

  return <Outlet />;
}
