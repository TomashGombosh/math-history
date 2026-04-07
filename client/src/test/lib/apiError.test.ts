import { describe, expect, it } from "vitest";
import { messageFromApiBody } from "../../lib/apiError";

describe("messageFromApiBody", () => {
  it("should return message string from API body", () => {
    expect(messageFromApiBody({ message: "Server says no" }, "fallback")).toBe("Server says no");
  });

  it("should use fallback when message missing", () => {
    expect(messageFromApiBody({}, "fallback")).toBe("fallback");
  });
});
