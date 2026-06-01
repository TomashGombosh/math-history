import { describe, expect, it } from "vitest";
import { mergeCohortsForYear } from "../../admin/graduateMerge";

describe("mergeCohortsForYear", () => {
  it("should return null for empty rows", () => {
    expect(mergeCohortsForYear([])).toBeNull();
  });

  it("should merge students and images from multiple cohorts", () => {
    const merged = mergeCohortsForYear([
      {
        id: 1,
        year: 2020,
        title: "A",
        students: [{ name: "One", specialty: "Math", section: "Денна" }],
        images: [{ url: "/a.jpg", specialty: "Math" }],
      },
      {
        id: 2,
        year: 2020,
        title: "B",
        students: [{ name: "Two", specialty: "Math", section: "Денна" }],
        images: [],
      },
    ]);
    expect(merged).not.toBeNull();
    expect(merged?.year).toBe(2020);
    expect(merged?.students).toHaveLength(2);
    expect(merged?.images).toHaveLength(1);
  });
});
