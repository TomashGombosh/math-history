import { useCallback, useEffect, useState } from "react";
import type {
  BulkImportCounts,
  BulkImportItem,
  BulkImportStatus,
  BulkImportStatusResponse,
} from "../../../lib/apiTypes";
import { apiGetAuthed } from "../../../services/api";

const POLL_INTERVAL_MS = 3000;

const TERMINAL_STATUSES: ReadonlySet<BulkImportStatus> = new Set([
  "success",
  "failed",
  "cancelled",
]);

function isTerminal(status: BulkImportStatus | null): boolean {
  return status !== null && TERMINAL_STATUSES.has(status);
}

export function useBulkImportStatus(jobId: string) {
  const [status, setStatus] = useState<BulkImportStatus | null>(null);
  const [counts, setCounts] = useState<BulkImportCounts | null>(null);
  const [candidates, setCandidates] = useState<BulkImportItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollGeneration, setPollGeneration] = useState(0);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setPollGeneration((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const loadStatus = async (): Promise<BulkImportStatus | null> => {
      try {
        const res = await apiGetAuthed<BulkImportStatusResponse>(`api/admin/bulk-imports/${jobId}`);
        if (cancelled) {
          return null;
        }
        setStatus(res.status);
        setCounts(res.counts);
        setCandidates(res.candidates);
        setError(res.error ?? null);
        setLoading(false);
        return res.status;
      } catch {
        if (cancelled) {
          return null;
        }
        setError("Помилка завантаження статусу імпорту");
        setLoading(false);
        return null;
      }
    };

    const poll = async () => {
      const nextStatus = await loadStatus();
      if (cancelled || nextStatus === null || isTerminal(nextStatus)) {
        return;
      }
      timerId = setTimeout(() => {
        void poll();
      }, POLL_INTERVAL_MS);
    };

    void poll();

    return () => {
      cancelled = true;
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    };
  }, [jobId, pollGeneration]);

  return { status, counts, candidates, error, loading, refetch };
}
