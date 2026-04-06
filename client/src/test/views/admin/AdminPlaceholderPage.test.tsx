import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminPlaceholderPage from "../../../views/admin/AdminPlaceholderPage";

describe("AdminPlaceholderPage", () => {
  it("should render the migration notice for a given title", () => {
    render(<AdminPlaceholderPage title="Тестова сторінка" />);
    expect(screen.getByRole("heading", { name: "Тестова сторінка" })).toBeInTheDocument();
    expect(screen.getByText(/міграції на React Router/)).toBeInTheDocument();
  });
});
