import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "../../../../router/paths";
import { BulkImportJobActions } from "../../../../views/admin/imports/BulkImportJobActions";

const mockPost = vi.fn();
const mockDelete = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../../../services/api", () => ({
  apiPostAuthed: (...args: unknown[]) => mockPost(...args),
  apiDeleteAuthed: (...args: unknown[]) => mockDelete(...args),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("BulkImportJobActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ ok: true });
    mockDelete.mockResolvedValue({ ok: true });
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("navigates to admin home after commit", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <BulkImportJobActions jobId="job-1" />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Застосувати імпорт" }));

    expect(mockPost).toHaveBeenCalledWith("api/admin/bulk-imports/job-1/commit", {});
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.admin);
  });

  it("navigates away after cancel", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <BulkImportJobActions jobId="job-1" />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Скасувати імпорт" }));

    expect(mockDelete).toHaveBeenCalledWith("api/admin/bulk-imports/job-1");
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.adminImports);
  });

  it("disables buttons while commit is pending", async () => {
    let resolvePost: (value: unknown) => void = () => undefined;
    mockPost.mockReturnValue(new Promise((resolve) => {
      resolvePost = resolve;
    }));

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <BulkImportJobActions jobId="job-1" />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Застосувати імпорт" }));

    expect(screen.getByRole("button", { name: "Застосовуємо…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Скасувати імпорт" })).toBeDisabled();

    resolvePost({ ok: true });
  });
});
