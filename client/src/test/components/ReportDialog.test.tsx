import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ReportDialog from "../../components/ReportDialog";
import type { ReportComponent } from "../../state/ReportContenxt";
import { apiPost } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  apiPost: vi.fn().mockResolvedValue({}),
}));

const component: ReportComponent = {
  type: "teacher",
  id: "test-id",
  label: "TestComponent",
  url: "https://example.com/teacher/test-id",
};

describe("ReportDialog", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render component name", () => {
    render(<ReportDialog open component={component} onClose={onClose} />);

    expect(screen.getByText("TestComponent")).toBeInTheDocument();
  });

  it("should call onClose when cancel button is clicked", () => {
    render(<ReportDialog open component={component} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Скасувати" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should update form fields", () => {
    render(<ReportDialog open component={component} onClose={onClose} />);

    const emailInput = screen.getByLabelText("Email");
    const commentInput = screen.getByLabelText("Коментар");

    fireEvent.change(emailInput, {
      target: { value: "test@example.com" },
    });

    fireEvent.change(commentInput, {
      target: { value: "Test comment" },
    });

    expect(emailInput).toHaveValue("test@example.com");
    expect(commentInput).toHaveValue("Test comment");
  });

  it("should submit form, clear fields and close dialog", async () => {
    render(<ReportDialog open component={component} onClose={onClose} />);

    const emailInput = screen.getByLabelText("Email");
    const commentInput = screen.getByLabelText("Коментар");

    fireEvent.change(emailInput, {
      target: { value: "test@example.com" },
    });

    fireEvent.change(commentInput, {
      target: { value: "Test comment" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Надіслати" }));

    expect(apiPost).toHaveBeenCalledWith("api/reviews", {
      email: "test@example.com",
      comment: "Test comment",
      component: {
        type: component.type,
        id: component.id,
        label: component.label,
        url: component.url,
      },
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });

    expect(emailInput).toHaveValue("");
    expect(commentInput).toHaveValue("");
  });

  it("should not render dialog when closed", () => {
    render(
      <ReportDialog open={false} component={component} onClose={onClose} />
    );

    expect(
      screen.queryByText("Повідомити про проблему")
    ).not.toBeInTheDocument();
  });
});
