import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLayoutSettingsPage from "../../../views/admin/AdminLayoutSettingsPage";

const mockApiGetAuthed = vi.fn();
const mockApiPutAuthed = vi.fn();

vi.mock("../../../services/api", () => ({
  apiGetAuthed: (...args: unknown[]) => mockApiGetAuthed(...args),
  apiPutAuthed: (...args: unknown[]) => mockApiPutAuthed(...args),
}));

describe("AdminLayoutSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGetAuthed.mockResolvedValue({
      headerFields: [
        { id: "title", label: "Title", visible: true, order: 1 },
        { id: "faculty", label: "Факультет", visible: true, order: 2 },
      ],
      sections: [{ id: "bio", title: "Біографія", visible: true, order: 1 }],
    });
    mockApiPutAuthed.mockResolvedValue({});
  });

  it("should load layout and save on button click", async () => {
    const user = userEvent.setup();
    render(<AdminLayoutSettingsPage />);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Налаштування сторінки викладача/ })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Зберегти налаштування" }));
    await waitFor(() => {
      expect(mockApiPutAuthed).toHaveBeenCalled();
    });
  });
});
