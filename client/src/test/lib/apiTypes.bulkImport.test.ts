import { describe, expect, it } from "vitest";
import type {
  BulkImportCreateResponse,
  BulkImportStatusResponse,
} from "../../lib/apiTypes";

describe("bulk import apiTypes", () => {
  it("should accept sample create and status response shapes", () => {
    const create: BulkImportCreateResponse = {
      jobId: "job-1",
      uploadUrl: "https://example.com/upload",
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    };

    const status: BulkImportStatusResponse = {
      status: "in_progress",
      counts: { teachers: 1, graduates: 2, years: 0 },
      candidates: [{ id: "c1", entity: "teacher", name: "Ada Lovelace" }],
      lastEvaluatedKey: null,
    };

    expect(create.jobId).toBe("job-1");
    expect(status.status).toBe("in_progress");
    expect(status.candidates).toHaveLength(1);
  });
});
