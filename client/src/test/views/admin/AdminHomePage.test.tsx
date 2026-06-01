import { HelmetProvider } from "react-helmet-async";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../router/paths";
import AdminHomePage from "../../../views/admin/AdminHomePage";

const mockNavigate = vi.hoisted(() => vi.fn());

const mockAuth = vi.hoisted(() => ({
  isAuthed: true,
  authReady: true,
  loginWithEmailPassword: vi.fn(),
  confirmNewPassword: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../state/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

describe("AdminHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.logout.mockResolvedValue(undefined);
  });

  it("should list admin navigation links", () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <AdminHomePage />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(screen.getByRole("heading", { name: "Адмін-панель" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Список викладачів" })).toHaveAttribute(
      "href",
      ROUTES.adminTeachers
    );
    expect(screen.getByRole("link", { name: "Додати випуск" })).toHaveAttribute(
      "href",
      ROUTES.adminGraduatesCreate
    );
  });

  it("should log out and navigate home when Вийти is pressed", async () => {
    const user = userEvent.setup();
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={[ROUTES.admin]}>
          <Routes>
            <Route path={ROUTES.admin} element={<AdminHomePage />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );
    await user.click(screen.getByRole("button", { name: "Вийти" }));
    await waitFor(() => {
      expect(mockAuth.logout).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.home);
    });
  });
});
