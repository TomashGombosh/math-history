import { HelmetProvider } from "react-helmet-async";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAdmin } from "../../state/RequireAdmin";

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

function renderProtectedAdmin() {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<RequireAdmin />}>
            <Route index element={<span>Захищений вміст</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("RequireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isAuthed = false;
    mockAuth.authReady = true;
  });

  it("should show session loading before auth is ready", () => {
    mockAuth.authReady = false;
    renderProtectedAdmin();
    expect(screen.getByLabelText("Завантаження сесії")).toBeInTheDocument();
  });

  it("should show 404 when the user is not authenticated", () => {
    mockAuth.isAuthed = false;
    mockAuth.authReady = true;
    renderProtectedAdmin();
    expect(screen.getByRole("heading", { name: "Сторінку не знайдено" })).toBeInTheDocument();
  });

  it("should render nested admin routes when authenticated", () => {
    mockAuth.isAuthed = true;
    renderProtectedAdmin();
    expect(screen.getByText("Захищений вміст")).toBeInTheDocument();
  });
});
