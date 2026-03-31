import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAdmin() {
  const { isAuthed } = useAuth();

  if (!isAuthed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
