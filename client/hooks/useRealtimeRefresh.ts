"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps page data fresh by silently re-fetching on an interval and whenever
 * the tab regains focus. Fetches never show a loader — pass your page's
 * "silent" refetch so content isn't replaced by skeletons.
 */
export function useRealtimeRefresh(
  refetch: () => void | Promise<void>,
  intervalMs = 20000,
) {
  const refetchRef = useRef(refetch);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    let active = true;
    let busy = false;

    const run = async () => {
      if (!active || busy) return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      busy = true;
      try {
        await refetchRef.current();
      } catch {
        // background refresh failures are non-fatal
      } finally {
        busy = false;
      }
    };

    const intervalId = setInterval(run, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}