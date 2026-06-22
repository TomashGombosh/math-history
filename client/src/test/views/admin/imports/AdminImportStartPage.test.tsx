import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../../lib/apiError";
import { ROUTES } from "../../../../router/paths";
import AdminImportStartPage from "../../../../views/admin/imports/AdminImportStartPage";

const mockNavigate = vi.fn();
const mockApiPostAuthed = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../../../services/api", () => ({
  apiPostAuthed: (...args: unknown[]) => mockApiPostAuthed(...args),
}));

function renderPage() {
  render(
    <MemoryRouter initialEntries={[ROUTES.adminImports]}>
      <Routes>
        <Route path={ROUTES.adminImports} element={<AdminImportStartPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function docxFile() {
  return new File(["docx"], "import.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

async function submitDocx(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText("Файл DOCX"), docxFile());
  await user.click(screen.getByRole("button", { name: "Почати імпорт" }));
}

describe("AdminImportStartPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiPostAuthed.mockResolvedValue({
      jobId: "job-abc",
      uploadUrl: "https://s3.example/put",
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200 }) as Response)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should navigate to the job page after a successful upload", async () => {
    const user = userEvent.setup();
    renderPage();
    await submitDocx(user);

    await waitFor(() => {
      expect(mockApiPostAuthed).toHaveBeenCalledWith("api/admin/bulk-imports", {});
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://s3.example/put",
      expect.objectContaining({ method: "PUT", body: expect.any(File) })
    );
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.adminImportJob("job-abc"));
  });

  it("should show the active job message when create returns 409", async () => {
    mockApiPostAuthed.mockRejectedValue(new ApiError(409, "Conflict", {}));
    const user = userEvent.setup();
    renderPage();
    await submitDocx(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Завершіть або скасуйте попередній імпорт"
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should show an error when the presigned upload fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 }) as Response)
    );
    const user = userEvent.setup();
    renderPage();
    await submitDocx(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не вдалося завантажити файл у сховище (500)"
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
