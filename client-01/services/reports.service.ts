import operationsApi, { ReportsSummaryResponse } from "@/actions/operations";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const response = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return response.response?.data?.message || response.message || fallback;
  }
  return fallback;
};

const ReportsService = () => {
  async function getSummary(params?: { range?: string; startDate?: string; endDate?: string }): Promise<ReportsSummaryResponse> {
    try {
      const response = await operationsApi.getReportsSummary(params);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch reports summary:", getErrorMessage(error, "Failed to fetch reports summary"));
      throw error;
    }
  }

  return {
    getSummary,
  };
};

export default ReportsService;
