import { HelmetProvider } from "react-helmet-async";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PATTERNS } from "../../router/paths";
import { RequireAdmin } from "../../state/RequireAdmin";
import AdminImportJobPage from "../../views/admin/imports/AdminImportJobPage";
import AdminImportStartPage from "../../views/admin/imports/AdminImportStartPage";

const mockAuth = vi.hoisted(() => ({
  isAuthed: false,
  authReady: true,
  loginWithEmailPassword: vi.fn(),
  confirmNewPassword: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../../state/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

function renderImportsRoute(initialEntry: string) {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/admin" element={<RequireAdmin />}>
            <Route path="imports" element={<AdminImportStartPage />} />
            <Route path={ROUTE_PATTERNS.adminImportJob} element={<AdminImportJobPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("admin import routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isAuthed = false;
    mockAuth.authReady = true;
  });

  it("should show 404 when an unauthenticated user opens /admin/imports", () => {
    renderImportsRoute("/admin/imports");
    expect(screen.getByRole("heading", { name: "Сторінку не знайдено" })).toBeInTheDocument();
  });

  it("should render the start page when an authenticated admin opens /admin/imports", () => {
    mockAuth.isAuthed = true;
    renderImportsRoute("/admin/imports");
    expect(screen.getByRole("heading", { name: "Імпорт з DOCX" })).toBeInTheDocument();
  });

  it("should render the job page with jobId when authenticated", () => {
    mockAuth.isAuthed = true;
    renderImportsRoute("/admin/imports/job-123");
    expect(screen.getByRole("heading", { name: "Імпорт з DOCX" })).toBeInTheDocument();
    expect(screen.getByText("Завдання: job-123")).toBeInTheDocument();
  });
});
