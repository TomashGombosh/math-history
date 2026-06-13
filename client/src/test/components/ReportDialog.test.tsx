import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ReportDialog from "../../components/ReportDialog";

describe("ReportDialog", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render component name", () => {
    render(
      <ReportDialog
        open
        componentName="TestComponent"
        onClose={onClose}
      />
    );

    expect(screen.getByText("TestComponent")).toBeInTheDocument();
  });

  it("should call onClose when cancel button is clicked", () => {
    render(
      <ReportDialog
        open
        componentName="TestComponent"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Скасувати" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should update form fields", () => {
    render(
      <ReportDialog
        open
        componentName="TestComponent"
        onClose={onClose}
      />
    );

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
    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {});

    render(
      <ReportDialog
        open
        componentName="TestComponent"
        onClose={onClose}
      />
    );

    const emailInput = screen.getByLabelText("Email");
    const commentInput = screen.getByLabelText("Коментар");

    fireEvent.change(emailInput, {
      target: { value: "test@example.com" },
    });

    fireEvent.change(commentInput, {
      target: { value: "Test comment" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Надіслати" })
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify({
        email: "test@example.com",
        comment: "Test comment",
        component: "TestComponent",
      })
    );

    expect(emailInput).toHaveValue("");
    expect(commentInput).toHaveValue("");
    expect(onClose).toHaveBeenCalledOnce();

    consoleSpy.mockRestore();
  });

  it("should not render dialog when closed", () => {
    render(
      <ReportDialog
        open={false}
        componentName="TestComponent"
        onClose={onClose}
      />
    );

    expect(
      screen.queryByText("Повідомити про проблему")
    ).not.toBeInTheDocument();
  });
});