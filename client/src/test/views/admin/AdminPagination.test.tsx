import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminPagination } from "../../../views/admin/AdminPagination";

describe("AdminPagination", () => {
  it("should not render when totalPages is 1", () => {
    const { container } = render(
      <AdminPagination currentPage={1} totalPages={1} onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should call onChange when Далі is pressed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AdminPagination currentPage={1} totalPages={3} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Далі" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
