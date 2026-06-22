import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BulkImportStatusResponse } from "../../../../lib/apiTypes";
import { useBulkImportStatus } from "../../../../views/admin/imports/useBulkImportStatus";

const mockApiGetAuthed = vi.fn();

vi.mock("../../../../services/api", () => ({
  apiGetAuthed: (...args: unknown[]) => mockApiGetAuthed(...args),
}));

const inProgress: BulkImportStatusResponse = {
  status: "in_progress",
  counts: { teachers: 1, graduates: 0, years: 0 },
  candidates: [],
};

const success: BulkImportStatusResponse = {
  status: "success",
  counts: { teachers: 1, graduates: 0, years: 0 },
  candidates: [{ id: "t-1", entity: "teacher", name: "Ada" }],
};

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useBulkImportStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should poll while in_progress and stop after success", async () => {
    mockApiGetAuthed
      .mockResolvedValueOnce(inProgress)
      .mockResolvedValueOnce(inProgress)
      .mockResolvedValueOnce(success);

    const { result } = renderHook(() => useBulkImportStatus("job-1"));

    await flushPromises();
    expect(mockApiGetAuthed).toHaveBeenCalledTimes(1);
    expect(mockApiGetAuthed).toHaveBeenCalledWith("api/admin/bulk-imports/job-1");
    expect(result.current.status).toBe("in_progress");
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mockApiGetAuthed).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("in_progress");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mockApiGetAuthed).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe("success");
    expect(result.current.candidates).toEqual(success.candidates);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(mockApiGetAuthed).toHaveBeenCalledTimes(3);
  });

  it("should stop polling on failed", async () => {
    mockApiGetAuthed
      .mockResolvedValueOnce(inProgress)
      .mockResolvedValueOnce({ ...inProgress, status: "failed", error: "boom" });

    const { result } = renderHook(() => useBulkImportStatus("job-fail"));

    await flushPromises();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mockApiGetAuthed).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("failed");
    expect(result.current.error).toBe("boom");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(mockApiGetAuthed).toHaveBeenCalledTimes(2);
  });

  it("should stop polling on cancelled", async () => {
    mockApiGetAuthed
      .mockResolvedValueOnce(inProgress)
      .mockResolvedValueOnce({ ...inProgress, status: "cancelled" });

    const { result } = renderHook(() => useBulkImportStatus("job-cancel"));

    await flushPromises();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mockApiGetAuthed).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("cancelled");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(mockApiGetAuthed).toHaveBeenCalledTimes(2);
  });

  it("should not fetch after unmount", async () => {
    mockApiGetAuthed.mockResolvedValue(inProgress);

    const { unmount } = renderHook(() => useBulkImportStatus("job-2"));

    await flushPromises();
    expect(mockApiGetAuthed).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(mockApiGetAuthed).toHaveBeenCalledTimes(1);
  });
});
