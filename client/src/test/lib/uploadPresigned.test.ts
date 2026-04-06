import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadImageWithPresign } from "../../lib/uploadPresigned";

vi.mock("../../lib/api", () => ({
  apiPostAuthed: vi.fn(async () => ({
    uploadUrl: "https://s3.example/put",
    headers: { "Content-Type": "image/jpeg" },
    imageUrl: "/teachers_img/images/x.jpg",
  })),
}));

describe("uploadImageWithPresign", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200 }) as Response)
    );
  });

  it("should PUT file to presigned URL and return imageUrl", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "a.jpg", { type: "image/jpeg" });
    const url = await uploadImageWithPresign(file, "teacher");
    expect(url).toBe("/teachers_img/images/x.jpg");
    expect(fetch).toHaveBeenCalledWith(
      "https://s3.example/put",
      expect.objectContaining({ method: "PUT", body: file })
    );
  });
});
