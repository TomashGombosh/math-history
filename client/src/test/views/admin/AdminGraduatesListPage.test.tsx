import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminGraduatesListPage from "../../../views/admin/AdminGraduatesListPage";

const mockApiGet = vi.fn();
const mockApiDeleteAuthed = vi.fn();

vi.mock("../../../services/api", () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
  apiDeleteAuthed: (...args: unknown[]) => mockApiDeleteAuthed(...args),
}));

describe("AdminGraduatesListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue([
      { year: 2020, totalStudents: 5, totalWithHonours: 1, cohortsCount: 1 },
    ]);
  });

  it("should show year rows", async () => {
    render(
      <MemoryRouter>
        <AdminGraduatesListPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("2020")).toBeInTheDocument();
    });
  });
});
