import { HelmetProvider } from "react-helmet-async";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../router/paths";
import { AdminNav } from "../../../shared/admin/AdminNav";

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

function renderNavAt(path: string) {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<AdminNav />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("AdminNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.logout.mockResolvedValue(undefined);
  });

  it("should expose the main admin links", () => {
    renderNavAt(ROUTES.admin);
    expect(screen.getByRole("link", { name: "Адмін-головна" })).toHaveAttribute("href", ROUTES.admin);
  });

  it("should toggle the administration panel", async () => {
    const user = userEvent.setup();
    renderNavAt(`${ROUTES.admin}/teachers`);
    const toggle = screen.getByRole("button", { name: "Адміністрування" });
    expect(screen.queryByRole("link", { name: "Таблиця викладачів" })).not.toBeInTheDocument();
    await user.click(toggle);
    expect(screen.getByRole("link", { name: "Таблиця викладачів" })).toHaveAttribute(
      "href",
      ROUTES.adminTeachers
    );
    await user.click(toggle);
    expect(screen.queryByRole("link", { name: "Таблиця викладачів" })).not.toBeInTheDocument();
  });

  it("should log out and go home when Вийти is pressed", async () => {
    const user = userEvent.setup();
    renderNavAt(ROUTES.admin);
    await user.click(screen.getByRole("button", { name: "Вийти" }));
    await waitFor(() => {
      expect(mockAuth.logout).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.home);
    });
  });
});
