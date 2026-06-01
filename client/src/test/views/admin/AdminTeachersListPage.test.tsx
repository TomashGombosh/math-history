import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminTeachersListPage from "../../../views/admin/AdminTeachersListPage";

const mockApiGetAuthed = vi.fn();
const mockApiDeleteAuthed = vi.fn();

vi.mock("../../../services/api", () => ({
  apiGetAuthed: (...args: unknown[]) => mockApiGetAuthed(...args),
  apiDeleteAuthed: (...args: unknown[]) => mockApiDeleteAuthed(...args),
}));

describe("AdminTeachersListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGetAuthed.mockResolvedValue({
      teachers: [
        {
          id: 1,
          name: "Test Teacher",
          faculty: "F",
          position: "P",
          slug: "test",
          imageUrl: "/images/t.jpg",
          publications: [],
        },
      ],
      totalPages: 1,
    });
  });

  it("should load and show teachers", async () => {
    render(
      <MemoryRouter>
        <AdminTeachersListPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Test Teacher")).toBeInTheDocument();
    });
  });

  it("should confirm before delete", async () => {
    const user = userEvent.setup();
    const confirmMock = vi.fn(() => false);
    window.confirm = confirmMock;
    render(
      <MemoryRouter>
        <AdminTeachersListPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Видалити" })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Видалити" }));
    expect(confirmMock).toHaveBeenCalled();
    expect(mockApiDeleteAuthed).not.toHaveBeenCalled();
  });
});
