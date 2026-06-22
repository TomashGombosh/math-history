import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../../router/paths";
import AdminImportJobPage from "../../../../views/admin/imports/AdminImportJobPage";

const mockUseBulkImportStatus = vi.fn();

vi.mock("../../../../views/admin/imports/useBulkImportStatus", () => ({
  useBulkImportStatus: (...args: unknown[]) => mockUseBulkImportStatus(...args),
}));

function renderPage(jobId = "job-abc") {
  render(
    <MemoryRouter initialEntries={[ROUTES.adminImportJob(jobId)]}>
      <Routes>
        <Route path="/admin/imports/:jobId" element={<AdminImportJobPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminImportJobPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBulkImportStatus.mockReturnValue({
      status: null,
      counts: null,
      candidates: [],
      error: null,
      loading: true,
      refetch: vi.fn(),
    });
  });

  it("should show progress text while in_progress", () => {
    mockUseBulkImportStatus.mockReturnValue({
      status: "in_progress",
      counts: { teachers: 2, graduates: 1, years: 0 },
      candidates: [],
      error: null,
      loading: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Обробка файлу…");
    expect(screen.getByText("Викладачі: 2, Випускники: 1, Роки: 0")).toBeInTheDocument();
    expect(mockUseBulkImportStatus).toHaveBeenCalledWith("job-abc");
  });

  it("should show an error when the job failed", () => {
    mockUseBulkImportStatus.mockReturnValue({
      status: "failed",
      counts: null,
      candidates: [],
      error: "Не вдалося розібрати файл",
      loading: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("Не вдалося розібрати файл");
  });
});
