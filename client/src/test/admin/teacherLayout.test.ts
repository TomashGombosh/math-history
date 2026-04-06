import { describe, expect, it } from "vitest";
import { normalizeLayout } from "../../admin/teacherLayout";

describe("normalizeLayout", () => {
  it("should default header fields and sections when empty", () => {
    const cfg = normalizeLayout({});
    expect(cfg.headerFields.length).toBeGreaterThan(0);
    expect(cfg.sections.length).toBeGreaterThan(0);
    expect(cfg.headerFields[0].id).toBeTruthy();
  });
});
