import { describe, expect, it } from "vitest";
import { graduateImageWebpUrl, imageThumbWebpUrl, imageWebpUrl } from "../../lib/graduateImages";

describe("graduateImageWebpUrl", () => {
  it("should map CDN /images/ paths to /images-webp/ with .webp extension", () => {
    expect(graduateImageWebpUrl("https://cdn.example.com/images/graduates/x.png")).toBe(
      "https://cdn.example.com/images-webp/graduates/x.webp",
    );
  });

  it("should map local graduates_img/images/ to images-webp/", () => {
    expect(graduateImageWebpUrl("/graduates_img/images/foo.jpg")).toBe("/graduates_img/images-webp/foo.webp");
  });

  it("should return empty string for empty input", () => {
    expect(graduateImageWebpUrl("")).toBe("");
  });
});

describe("imageWebpUrl", () => {
  it("should map teachers_img/images/ to teachers_img/images-webp/", () => {
    expect(imageWebpUrl("/teachers_img/images/123.jpg")).toBe("/teachers_img/images-webp/123.webp");
  });

  it("should map flat CDN teachers/ originals to teachers-webp/", () => {
    expect(imageWebpUrl("https://cdn.example.com/teachers/550e8400-e29b-41d4-a716-446655440000.jpg")).toBe(
      "https://cdn.example.com/teachers-webp/550e8400-e29b-41d4-a716-446655440000.webp",
    );
  });
});

describe("imageThumbWebpUrl", () => {
  it("should map /images/ to /images-thumbs-webp/", () => {
    expect(imageThumbWebpUrl("https://x.com/images/a.jpeg")).toBe("https://x.com/images-thumbs-webp/a.webp");
  });

  it("should map teachers_img/images/ to images-thumbs-webp/", () => {
    expect(imageThumbWebpUrl("/teachers_img/images/1.png")).toBe("/teachers_img/images-thumbs-webp/1.webp");
  });
});
