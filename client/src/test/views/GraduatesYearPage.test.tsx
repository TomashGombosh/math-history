import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PATTERNS, ROUTES } from "../../router/paths";
import GraduatesYearPage from "../../views/GraduatesYearPage";
import * as api from "../../services/api";

vi.mock("../../services/api", () => ({
  apiGet: vi.fn(),
}));

const mockApiGet = vi.mocked(api.apiGet);

function renderYearPage(year: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[ROUTES.graduatesYear(year)]}>
        <Routes>
          <Route path={ROUTE_PATTERNS.graduatesYear} element={<GraduatesYearPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("GraduatesYearPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show an error alert when year detail request fails", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/api/graduates/years") {
        return Promise.resolve([{ year: 2020, totalStudents: 1, totalWithHonours: 0, cohortsCount: 1 }]);
      }
      if (path.includes("/api/graduates/")) {
        return Promise.reject(new Error("network"));
      }
      return Promise.reject(new Error("unexpected"));
    });

    renderYearPage("2020");

    expect(await screen.findByRole("alert")).toHaveTextContent(/Помилка завантаження даних для 2020 року/);
  });

  it("should open lightbox from a photo and advance with keyboard", async () => {
    const user = userEvent.setup();
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/api/graduates/years") {
        return Promise.resolve([{ year: 2020, totalStudents: 1, totalWithHonours: 0, cohortsCount: 1 }]);
      }
      if (path === "/api/graduates/2020") {
        return Promise.resolve({
          year: 2020,
          title: "Test year",
          images: [
            { url: "/images/g1.png", specialty: "Математика", caption: "A" },
            { url: "/images/g2.png", specialty: "Математика", caption: "B" },
          ],
          students: [
            { id: 1, index: 1, name: "Student One", specialty: "Математика", section: "" },
          ],
        });
      }
      return Promise.reject(new Error("unexpected"));
    });

    renderYearPage("2020");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Test year" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "A A" }));

    const dialog = screen.getByRole("dialog", { name: "Галерея фото" });
    expect(within(dialog).getByRole("img", { name: "A" })).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(within(dialog).getByRole("img", { name: "B" })).toBeInTheDocument();
  });
});
