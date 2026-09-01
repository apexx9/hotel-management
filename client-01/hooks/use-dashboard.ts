"use client";

import { useEffect, useState } from "react";
import DashboardService from "@/services/dashboard.service";
import type { DashboardSummaryResponse } from "../../client/actions/operations";

const dashboardService = DashboardService();

export function useDashboard() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function loadDashboard() {
    try {
      setIsLoading(true);
      setError(null);

      const result = await dashboardService.getSummary();

      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh: loadDashboard,
  };
}
