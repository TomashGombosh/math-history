import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BulkImportItem } from "../../../../lib/apiTypes";
import { BulkImportEditableTables } from "../../../../views/admin/imports/BulkImportEditableTables";

const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock("../../../../services/api", () => ({
  apiPutAuthed: (...args: unknown[]) => mockPut(...args),
  apiDeleteAuthed: (...args: unknown[]) => mockDelete(...args),
}));

const candidates: BulkImportItem[] = [{ id: "cand-1", entity: "teacher", name: "Old Name" }];

describe("BulkImportEditableTables", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPut.mockResolvedValue({ id: "cand-1", entity: "teacher", name: "New Name" });
    mockDelete.mockResolvedValue({ ok: true });
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("updates a row after edit save", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();

    render(<BulkImportEditableTables jobId="job-1" candidates={candidates} onChanged={onChanged} />);

    await user.click(screen.getByRole("button", { name: "Редагувати" }));
    const input = screen.getByLabelText("Нова назва");
    await user.clear(input);
    await user.type(input, "New Name");
    await user.click(screen.getByRole("button", { name: "Зберегти" }));

    expect(mockPut).toHaveBeenCalledWith("api/admin/bulk-imports/job-1/items/cand-1", { name: "New Name" });
    expect(onChanged).toHaveBeenCalled();
  });

  it("removes a row after confirmed delete", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();

    render(<BulkImportEditableTables jobId="job-1" candidates={candidates} onChanged={onChanged} />);

    await user.click(screen.getByRole("button", { name: "Видалити" }));

    expect(mockDelete).toHaveBeenCalledWith("api/admin/bulk-imports/job-1/items/cand-1");
    expect(onChanged).toHaveBeenCalled();
  });

  it("keeps row when delete confirm is cancelled", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const user = userEvent.setup();

    render(<BulkImportEditableTables jobId="job-1" candidates={candidates} onChanged={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Видалити" }));

    expect(mockDelete).not.toHaveBeenCalled();
  });
});
