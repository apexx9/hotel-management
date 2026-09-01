// hooks/useDashboardData.ts
'use client';

import { useEffect, useState } from 'react';
import dashboardService from '@/services/dashboard.service';
import { DashboardSummaryResponse } from '@/services/operations.service';

export function useDashboardData() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService.getDashboard()
      .then((response) => setData(response.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
