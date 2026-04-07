import { describe, expect, it } from "vitest";
import { graduateImageWebpUrl } from "../../lib/graduateImages";

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
