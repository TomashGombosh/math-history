import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { Outlet } from "react-router-dom";
import NotFoundPage from "../views/NotFoundPage";
import { useAuth } from "./AuthContext";

/** Admin-only routes: non-admin / anonymous users see 404 (no redirect to login). */
export function RequireAdmin() {
  const { isAuthed, authReady } = useAuth();

  if (!authReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress aria-label="Завантаження сесії" />
      </Box>
    );
  }

  if (!isAuthed) {
    return <NotFoundPage />;
  }

  return <Outlet />;
}
