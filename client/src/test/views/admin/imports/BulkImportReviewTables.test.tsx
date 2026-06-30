import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BulkImportItem } from "../../../../lib/apiTypes";
import { BulkImportReviewTables } from "../../../../views/admin/imports/BulkImportReviewTables";

const sampleCandidates: BulkImportItem[] = [
  { id: "t1", entity: "teacher", name: "Teacher One" },
  { id: "g1", entity: "graduate", name: "Grad One", year: 2010 },
  { id: "y1", entity: "year", year: 2015 },
];

describe("BulkImportReviewTables", () => {
  it("renders grouped candidate rows from success status", () => {
    render(<BulkImportReviewTables candidates={sampleCandidates} />);

    expect(screen.getByRole("heading", { name: "Викладачі" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Випускники" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Роки" })).toBeInTheDocument();
    expect(screen.getByText("Teacher One")).toBeInTheDocument();
    expect(screen.getByText("Grad One")).toBeInTheDocument();
    expect(screen.getByText("2015")).toBeInTheDocument();
  });
});
